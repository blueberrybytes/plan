import { DocDocument, BrandTheme } from "@prisma/client";
import {
  getWorkspaceModel,
  getFallbackProviderOptions,
  DOC_MODEL,
  DIAGRAM_MODEL,
  getMaxContextChunks,
} from "../utils/aiModelUtils";
import { streamText, generateText, stepCountIs } from "ai";
import prisma from "../prisma/prismaClient";
import { queryContexts } from "../vector/contextFileVectorService";
import { mergeProjectAndContextIds } from "./projectContextResolver";
import { logger } from "../utils/logger";
import { aiUsageService } from "./aiUsageService";
import { getPersonaInstructions } from "./personaService";
import { mcpClientService } from "./mcpClientService";
import { MERMAID_SYNTAX_RULES } from "../prompts/mermaidRules";
import type { TranscriptMetadata } from "./transcriptMetadataTypes";

export interface CreateDocInput {
  title: string;
  prompt?: string;
  /** Legacy: direct context IDs. Prefer `projectIds`. */
  contextIds?: string[];
  /** User-facing project IDs; backend resolves to contextIds at generation time. */
  projectIds?: string[];
  transcriptIds?: string[];
  themeId?: string;
  isBlank?: boolean;
  /** Link the doc to a specific project (for digest, auto-generated docs, etc.). */
  projectId?: string;
}

export interface UpdateDocInput {
  title?: string;
  content?: string;
  themeId?: string | null;
  isPublic?: boolean;
}

// Titles set by upstream code paths that don't know the final content yet —
// safe to overwrite with a content-derived title once generation completes.
const PLACEHOLDER_DOC_TITLES = new Set([
  "Generating Transcript...",
  "Untitled Document",
  "AI Generated Document",
  "Meeting Document",
]);

export class DocGenerationService {
  /**
   * Pull a human-readable title from the generated content. Prefers the
   * first H1, then any heading, then falls back to the first non-empty
   * sentence so we never leave the doc with the "Generating..." placeholder.
   */
  private deriveTitleFromContent(content: string): string | null {
    if (!content) return null;
    const stripFormatting = (s: string) =>
      s
        .replace(/[*_`]/g, "") // basic markdown emphasis
        .replace(/\s+/g, " ")
        .trim();

    // 1) Prefer H1 (single #) since the prompt now requires the doc to start with one.
    const h1 = content.match(/^\s*#\s+(.+?)\s*$/m);
    if (h1) {
      const cleaned = stripFormatting(h1[1]);
      if (cleaned) return cleaned.slice(0, 200);
    }

    // 2) Fall back to any heading level.
    const anyHeading = content.match(/^\s*#{1,6}\s+(.+?)\s*$/m);
    if (anyHeading) {
      const cleaned = stripFormatting(anyHeading[1]);
      if (cleaned) return cleaned.slice(0, 200);
    }

    // 3) Last-resort: first non-empty line that looks like prose.
    for (const rawLine of content.split(/\r?\n/)) {
      const line = stripFormatting(rawLine);
      if (!line) continue;
      if (line.startsWith("```")) continue;
      // Take up to the first sentence end (or 80 chars) so the title stays short.
      const sentenceEnd = line.search(/[.!?]\s/);
      const candidate = sentenceEnd > 0 ? line.slice(0, sentenceEnd) : line.slice(0, 80);
      if (candidate.length >= 3) return candidate.slice(0, 200);
    }

    return null;
  }

  public async startGeneration(
    userId: string,
    workspaceId: string,
    input: CreateDocInput,
  ): Promise<DocDocument & { theme: BrandTheme | null }> {
    // Resolve user-facing projectIds → internal contextIds and merge with any
    // direct contextIds the caller passed.
    const resolvedContextIds = await mergeProjectAndContextIds(input.projectIds, input.contextIds);

    const doc = await prisma.docDocument.create({
      data: {
        userId,
        workspaceId,
        title: input.title,
        content: input.isBlank ? `# ${input.title}\n\n## Subtitle\n\nAdd your content here...` : "",
        status: input.isBlank ? "DRAFT" : "GENERATING",
        contextIds: resolvedContextIds,
        transcriptIds: input.transcriptIds ?? [],
        themeId: input.themeId ?? null,
        projectId: input.projectId ?? null,
        prompt: input.prompt ?? "",
      },
      include: { theme: true, project: { select: { id: true, title: true } } },
    });

    // Fire-and-forget background generation
    if (!input.isBlank) {
      const resolvedInput = { ...input, contextIds: resolvedContextIds };
      this.generateBackground(userId, workspaceId, doc.id, resolvedInput).catch((err) => {
        logger.error(`Doc generation failed for ${doc.id}`, err);
        prisma.docDocument
          .update({ where: { id: doc.id }, data: { status: "FAILED" } })
          .catch(() => {});
      });
    }

    return doc;
  }

  private async generateBackground(
    userId: string,
    workspaceId: string,
    docId: string,
    input: CreateDocInput,
  ): Promise<void> {
    const contextChunks: string[] = [];

    // Gather context chunks from vector store
    if (input.contextIds && input.contextIds.length > 0) {
      try {
        const chunks = await queryContexts(
          input.contextIds,
          input.prompt ?? "",
          getMaxContextChunks(DOC_MODEL),
        );
        contextChunks.push(...chunks);
      } catch (err) {
        logger.warn("Failed to query contexts for doc generation", err);
      }
    }

    // Gather transcript content
    const transcriptTexts: string[] = [];
    if (input.transcriptIds && input.transcriptIds.length > 0) {
      const transcripts = await prisma.transcript.findMany({
        where: { id: { in: input.transcriptIds }, workspaceId },
        select: {
          title: true,
          transcript: true,
          summary: true,
          recordedAt: true,
          durationSeconds: true,
          metadata: true,
        },
      });
      for (const t of transcripts) {
        const parts = [`## Transcript: ${t.title ?? "Untitled"}`];

        // KNOWN meeting facts. Without these the model invents an agenda-style
        // template with "[Insert Date of Meeting]" placeholders — it was never
        // told the date even though the transcript row has it (reported bug).
        const facts: string[] = [];
        if (t.recordedAt) {
          facts.push(
            `Date: ${t.recordedAt.toISOString().slice(0, 10)} (${t.recordedAt.toUTCString().slice(0, 22)} UTC)`,
          );
        }
        if (t.durationSeconds && t.durationSeconds > 0) {
          facts.push(`Duration: ${Math.round(t.durationSeconds / 60)} minutes`);
        }
        const insights = (t.metadata as TranscriptMetadata | null)?.speakers;
        if (insights && insights.length > 0) {
          const attendees = insights
            .map((s) => {
              const name = s.identifiedName?.trim() || s.label;
              return s.role ? `${name} (${s.role})` : name;
            })
            .join(", ");
          facts.push(`Attendees: ${attendees}`);
        }
        if (facts.length > 0) parts.push(`**Known meeting facts:**\n${facts.join("\n")}`);

        if (t.summary) parts.push(`**Summary:** ${t.summary}`);
        if (t.transcript) parts.push(t.transcript);
        transcriptTexts.push(parts.join("\n"));
      }
    }

    const personaInstructions = await getPersonaInstructions(userId, workspaceId);
    let prompt = this.buildPrompt(
      input.prompt ?? "",
      contextChunks,
      transcriptTexts,
      personaInstructions,
    );
    // The workspace's own OpenRouter key, not the platform's. `getConfiguredModel`
    // with no key silently falls back to OPENROUTER_API_KEY, which in a BYOK
    // product means the platform pays for the customer's document AND the
    // document fails whenever that shared key is rate-limited — even though the
    // customer's own key was fine. `workspaceId` was already in scope.
    const model = await getWorkspaceModel(workspaceId, DOC_MODEL);

    // Step 1: Optional Agentic Investigation via MCP
    const tools = mcpClientService.getAiTools();

    if (tools) {
      try {
        logger.info(`Starting Two-Step Agentic Investigation for Doc: ${docId}`);
        const investigation = await generateText({
          model,
          providerOptions: getFallbackProviderOptions(),
          tools,
          stopWhen: stepCountIs(3),
          system:
            "You are an AI assistant. The user wants to generate a document or task list based on their prompt. IF the request is a simple, non-technical business or life task, DO NOT query the codebase. Simply return 'No codebase context needed.' OTHERWISE, use your tools to query the codebase knowledge graph and gather relevant structure, execution flows, or context needed to fulfill this request. Summarize your findings to be included in the final document generation prompt.",
          prompt: `Goal: ${input.prompt ?? "Generate document"}\n\nPlease investigate the codebase ONLY IF this is a technical software task to gather any missing context for this request.`,
        });

        if (investigation.text) {
          prompt += `\n\n### Codebase Investigation Context:\n${investigation.text}`;
        }

        aiUsageService
          .logUsage({
            userId,
            workspaceId,
            feature: "DOC",
            provider: "openrouter",
            model: DOC_MODEL,
            inputTokens: investigation.totalUsage?.inputTokens || 0,
            outputTokens: investigation.totalUsage?.outputTokens || 0,
          })
          .catch(() => {});
      } catch (err) {
        logger.error("Failed during MCP agentic investigation step for doc generation", err);
      }
    }

    let fullContent = "";

    const { textStream, totalUsage } = await streamText({
      model,
      providerOptions: getFallbackProviderOptions(),
      prompt,
      temperature: 0.4,
      maxRetries: 3,
    });

    for await (const chunk of textStream) {
      fullContent += chunk;
      // Update DB every ~500 chars to show streaming progress
      if (fullContent.length % 500 < chunk.length) {
        await prisma.docDocument.update({
          where: { id: docId },
          data: { content: fullContent },
        });
      }
    }

    // Replace placeholder titles ("Generating Transcript...", "AI Generated
    // Document", etc) with the actual title from the generated content. Users
    // who picked a real title themselves are preserved.
    const currentDoc = await prisma.docDocument.findUnique({
      where: { id: docId },
      select: { title: true },
    });
    const currentTitleIsPlaceholder = Boolean(
      currentDoc && (!currentDoc.title || PLACEHOLDER_DOC_TITLES.has(currentDoc.title)),
    );
    const derivedTitle = this.deriveTitleFromContent(fullContent);

    // Deterministic safety net: if the LLM ignored the H1 instruction AND we
    // couldn't extract anything from prose, fall back to a date-stamped name
    // so the UI never ships with the "Generating..." placeholder.
    const fallbackTitle = `Document — ${new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`;

    const nextTitle = currentTitleIsPlaceholder ? derivedTitle || fallbackTitle : null;

    await prisma.docDocument.update({
      where: { id: docId },
      data: {
        content: fullContent,
        status: "DRAFT",
        ...(nextTitle ? { title: nextTitle } : {}),
      },
    });

    if (currentTitleIsPlaceholder && !derivedTitle) {
      logger.warn(
        `Doc ${docId}: AI output had no heading or prose to derive a title; using fallback "${fallbackTitle}".`,
      );
    }

    try {
      const usageData = await totalUsage;
      await aiUsageService.logUsage({
        userId,
        workspaceId,
        feature: "DOC",
        provider: "openrouter",
        model: DOC_MODEL,
        inputTokens: usageData.inputTokens || 0,
        outputTokens: usageData.outputTokens || 0,
      });
    } catch (usageErr) {
      logger.error("Failed to log DOC generation usage", usageErr);
    }

    logger.info(`Doc generation complete for ${docId}`);
  }

  public async fixMermaidSyntax(
    userId: string,
    workspaceId: string,
    brokenSyntax: string,
  ): Promise<string> {
    // Mermaid repair uses the stronger diagram model — a cheap model is what
    // produced the broken syntax in the first place.
    const model = await getWorkspaceModel(workspaceId, DIAGRAM_MODEL);
    const prompt = `You are an expert at writing Mermaid.js diagrams. The following Mermaid syntax crashes the renderer due to syntax constraints, invalid characters, or formatting errors.
Please fix it so it is completely valid Mermaid code.

Broken code:
\`\`\`mermaid
${brokenSyntax}
\`\`\`

Return ONLY the corrected Mermaid code inside a triple backtick block. Do NOT include any explanations.

${MERMAID_SYNTAX_RULES}

A common cause of the crash is unquoted labels (especially compound node shapes like \`E((Endpoint))\`) and unescaped parentheses/ampersands. If you return the same broken code without quoting those labels, the system will crash again.`;

    const { text, totalUsage } = await generateText({
      model,
      prompt,
      temperature: 0.2,
      maxRetries: 3,
    });

    aiUsageService
      .logUsage({
        userId,
        workspaceId,
        feature: "DOC",
        provider: "openrouter",
        model: DIAGRAM_MODEL,
        inputTokens: totalUsage?.inputTokens || 0,
        outputTokens: totalUsage?.outputTokens || 0,
      })
      .catch(() => {});

    // Extract code from backticks if present
    const match = text.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }

  private buildPrompt(
    userPrompt: string,
    contextChunks: string[],
    transcripts: string[],
    personaInstructions: string,
  ): string {
    const contextSection =
      contextChunks.length > 0 ? `## Context Knowledge\n\n${contextChunks.join("\n\n")}\n` : "";

    const transcriptSection =
      transcripts.length > 0 ? `## Transcripts\n\n${transcripts.join("\n\n---\n\n")}\n` : "";

    return `You are an expert document writer. Generate a well-structured, highly corporate, formal, and professional document in **rich Markdown format**.
${personaInstructions}

CRITICAL OUTPUT FORMAT:
- The VERY FIRST non-empty line MUST be a single H1 heading naming the document, e.g. \`# Quarterly Roadmap Sync\`.
- This H1 is used as the document's title in the UI — never omit it, never use a placeholder like "Untitled" or "Generating...".
- After the H1, use H2/H3 (\`##\`, \`###\`) for sections.

Use bold, italic, bullet lists, numbered lists, tables, and blockquotes where suitable.
If explaining an architecture, workflow, data hierarchy, or multi-step process, you MUST include a \`\`\`mermaid block.
When writing a \`\`\`mermaid block, follow these rules exactly:
${MERMAID_SYNTAX_RULES}
If the user's prompt implies generating tasks, action items, or a checklist, you MUST format each task with a Markdown checkbox (e.g., \`- [ ] Task description\`).
Make the document comprehensive, well-organized, and ready to share.
Do NOT include any preamble like "Here is your document" — start directly with the H1 title.
NEVER emit fill-in placeholders like "[Insert Date of Meeting]", "[Attendees TBD]" or "[Insert X]". Use the facts provided (e.g. "Known meeting facts"); if a fact is not provided, OMIT that line entirely rather than inventing a placeholder for it.

${contextSection}
${transcriptSection}

## User Request

${userPrompt}`;
  }

  // --- CRUD ---

  public async findAll(
    userId: string,
    workspaceId: string,
    projectId?: string,
  ): Promise<
    (DocDocument & { theme: BrandTheme | null; project: { id: string; title: string } | null })[]
  > {
    return prisma.docDocument.findMany({
      where: { workspaceId, ...(projectId ? { projectId } : {}) },
      include: { theme: true, project: { select: { id: true, title: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  public async findById(
    userId: string,
    workspaceId: string,
    id: string,
  ): Promise<
    DocDocument & { theme: BrandTheme | null; project: { id: string; title: string } | null }
  > {
    const doc = await prisma.docDocument.findFirst({
      where: { id, workspaceId },
      include: { theme: true, project: { select: { id: true, title: true } } },
    });
    if (!doc) throw { status: 404, message: "Document not found" };
    return doc;
  }

  public async findPublicById(
    id: string,
  ): Promise<
    DocDocument & { theme: BrandTheme | null; project: { id: string; title: string } | null }
  > {
    const doc = await prisma.docDocument.findFirst({
      where: { id },
      include: { theme: true, project: { select: { id: true, title: true } } },
    });
    if (!doc) throw { status: 404, message: "Document not found" };
    return doc;
  }

  public async update(
    userId: string,
    workspaceId: string,
    id: string,
    input: UpdateDocInput,
  ): Promise<
    DocDocument & { theme: BrandTheme | null; project: { id: string; title: string } | null }
  > {
    await this.findById(userId, workspaceId, id);
    const updated = await prisma.docDocument.update({
      where: { id },
      data: { ...input, updatedAt: new Date() },
      include: { theme: true, project: { select: { id: true, title: true } } },
    });
    return updated;
  }

  public async delete(userId: string, workspaceId: string, id: string): Promise<void> {
    await this.findById(userId, workspaceId, id);
    await prisma.docDocument.delete({ where: { id } });
  }
}

export const docGenerationService = new DocGenerationService();
