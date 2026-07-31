import { streamText } from "ai";
import {
  getConfiguredModel,
  getFallbackProviderOptions,
  DIAGRAM_MODEL,
} from "../utils/aiModelUtils";
import prisma from "../prisma/prismaClient";
import { logger } from "../utils/logger";
import { queryContexts } from "../vector/contextFileVectorService";
import { aiUsageService } from "./aiUsageService";
import { getPersonaInstructions } from "./personaService";
import { MERMAID_SYNTAX_RULES } from "../prompts/mermaidRules";

export interface DiagramGenerationRequest {
  diagramId: string;
  userId: string;
  workspaceId: string;
  prompt: string;
  type: string;
  contextIds: string[];
  transcriptIds: string[];
  overrideSystemContext?: string;
}

export interface DiagramAssistantTriggerRequest {
  diagramId: string;
  userId: string;
  workspaceId: string;
  instruction: string;
  currentCode: string;
  contextIds: string[];
  transcriptIds: string[];
}

class DiagramGenerationService {
  async triggerGeneration(request: DiagramGenerationRequest): Promise<void> {
    const {
      diagramId,
      userId,
      workspaceId,
      prompt,
      type,
      contextIds,
      transcriptIds,
      overrideSystemContext,
    } = request;

    try {
      await prisma.diagram.update({
        where: { id: diagramId },
        data: { status: "GENERATING" },
      });

      let contextContent = "";

      if (overrideSystemContext) {
        // Truncate to ~1M characters maximum to avoid catastrophic OpenRouter payload rejection
        // 1M characters provides roughly 250K-300K tokens, huge enough for structural insights.
        const maxChars = 1000000;
        let safeContext = overrideSystemContext;
        if (safeContext.length > maxChars) {
          logger.warn(
            `Truncating overrideSystemContext for diagram ${diagramId} from ${safeContext.length} chars down to ${maxChars} chars.`,
          );
          safeContext =
            safeContext.substring(0, maxChars) + "\n...[TRUNCATED DUE TO SIZE LIMIT]...";
        }
        contextContent = `## Explicit System Context Chunk: \n${safeContext}`;
      } else {
        const rawContextData = await queryContexts(contextIds, prompt);
        if (rawContextData && rawContextData.length > 0) {
          contextContent = rawContextData
            .map((c) => `## Context Chunk: \n${c || "(No readable text)"}`)
            .join("\n\n---\n\n");
        }
      }

      const rawTranscripts = await prisma.transcript.findMany({
        where: {
          id: { in: transcriptIds },
          userId,
          workspaceId,
        },
      });

      let transcriptContent = "";
      if (rawTranscripts.length > 0) {
        transcriptContent = rawTranscripts
          .map((t) => `## Transcript: ${t.title || "Untitled"}\n${t.transcript || ""}`)
          .join("\n\n---\n\n");
      }

      const personaInstructions = await getPersonaInstructions(userId, workspaceId);
      const systemPrompt = this.buildPrompt(
        type,
        contextContent,
        transcriptContent,
        personaInstructions,
      );

      logger.info(`Starting diagram generation for ${diagramId}`);

      const { textStream, usage } = await streamText({
        model: getConfiguredModel(DIAGRAM_MODEL),
        providerOptions: getFallbackProviderOptions(),
        system: systemPrompt,
        prompt: `User Request: ${prompt}`,
        temperature: 0.2,
        maxRetries: 3,
        //maxOutputTokens: 4000,
      });

      let fullMermaidCode = "";

      for await (const textPart of textStream) {
        fullMermaidCode += textPart;
        await prisma.diagram.update({
          where: { id: diagramId },
          data: { mermaidCode: this.cleanMermaidSyntax(fullMermaidCode) },
        });
      }

      await prisma.diagram.update({
        where: { id: diagramId },
        data: {
          mermaidCode: this.cleanMermaidSyntax(fullMermaidCode),
          status: "DRAFT",
        },
      });

      try {
        const usageData = await usage;
        await aiUsageService.logUsage({
          userId,
          workspaceId,
          feature: "DIAGRAM",
          provider: "openrouter",
          model: getConfiguredModel(DIAGRAM_MODEL).modelId || "anthropic/claude-sonnet-4.6",
          inputTokens: usageData.inputTokens || 0,
          outputTokens: usageData.outputTokens || 0,
        });
      } catch (usageErr) {
        logger.error("Failed to log diagram generation usage", usageErr);
      }

      logger.info(`Diagram generation for ${diagramId} completed successfully.`);
    } catch (error) {
      logger.error(`Diagram generation failed for ${diagramId}`, error);
      await prisma.diagram
        .update({
          where: { id: diagramId },
          data: { status: "FAILED" },
        })
        .catch(() => {});
    }
  }

  async triggerImprovement(request: DiagramAssistantTriggerRequest): Promise<void> {
    const { diagramId, userId, workspaceId, instruction, currentCode, contextIds, transcriptIds } =
      request;

    try {
      logger.info(
        `[triggerImprovement] Started for diagram ${diagramId} with instruction: ${instruction}`,
      );

      const rawContextData = await queryContexts(contextIds, instruction);
      let contextContent = "";
      if (rawContextData && rawContextData.length > 0) {
        contextContent = rawContextData
          .map((c) => `## Context Chunk: \n${c || "(No readable text)"}`)
          .join("\n\n---\n\n");
      }

      const rawTranscripts = await prisma.transcript.findMany({
        where: { id: { in: transcriptIds }, userId },
      });
      let transcriptContent = "";
      if (rawTranscripts.length > 0) {
        transcriptContent = rawTranscripts
          .map((t) => `## Transcript: ${t.title || "Untitled"}\n${t.transcript || ""}`)
          .join("\n\n---\n\n");
      }

      const personaInstructions = await getPersonaInstructions(userId, workspaceId);
      const systemPrompt = `You are an expert Mermaid diagram architect.
You are helping the user improve or fix an EXISTING Mermaid diagram.
Your HIGH-LEVEL INSTRUCTION: ${instruction}

${personaInstructions}

**RULES:**
1. Your sole purpose is to output EXCLUSIVELY raw Mermaid syntax representing the updated diagram.
2. Do NOT output any markdown blocks, conversational text, explanations, or preamble.
3. The very first character of your response MUST be the start of the Mermaid syntax.
4. Try your best to adhere to standard Mermaid syntax to prevent rendering errors.

${MERMAID_SYNTAX_RULES}

**CURRENT MERMAID CODE:**
${currentCode}

${contextContent ? `## Source Contexts\n${contextContent}` : ""}
${transcriptContent ? `## Source Transcripts\n${transcriptContent}` : ""}`;

      logger.info(`Starting diagram improvement for ${diagramId}`);

      const { textStream, usage } = await streamText({
        model: getConfiguredModel(DIAGRAM_MODEL),
        providerOptions: getFallbackProviderOptions(),
        system: systemPrompt,
        prompt: `Please apply this instruction to the diagram: ${instruction}`,
        temperature: 0.2,
        maxRetries: 3,
        //maxOutputTokens: 4000,
      });

      let fullMermaidCode = "";

      for await (const textPart of textStream) {
        fullMermaidCode += textPart;
        await prisma.diagram.update({
          where: { id: diagramId },
          data: { mermaidCode: this.cleanMermaidSyntax(fullMermaidCode) },
        });
      }

      logger.info(`[triggerImprovement] Stream fully consumed. Updating diagram status to DRAFT.`);
      await prisma.diagram.update({
        where: { id: diagramId },
        data: {
          mermaidCode: this.cleanMermaidSyntax(fullMermaidCode),
          status: "DRAFT",
        },
      });

      try {
        const usageData = await usage;
        await aiUsageService.logUsage({
          userId,
          workspaceId,
          feature: "DIAGRAM",
          provider: "openrouter",
          model: getConfiguredModel(DIAGRAM_MODEL).modelId || "anthropic/claude-sonnet-4.6",
          inputTokens: usageData.inputTokens || 0,
          outputTokens: usageData.outputTokens || 0,
        });
      } catch (usageErr) {
        logger.error("Failed to log diagram improvement usage", usageErr);
      }

      logger.info(`Diagram improvement for ${diagramId} completed successfully.`);
    } catch (error) {
      logger.error(`[triggerImprovement] Diagram improvement failed for ${diagramId}`, error);
      await prisma.diagram
        .update({ where: { id: diagramId }, data: { status: "FAILED" } })
        .catch(() => {});
    }
  }

  private cleanMermaidSyntax(rawText: string): string {
    let cleaned = rawText.trim();

    // Attempt to extract the content explicitly out of any markdown backticks block
    // to bypass AI padding it with conversational sentences at the end
    const mermaidMatch = cleaned.match(/```(?:mermaid)?\s*\n([\s\S]*?)```/im);
    if (mermaidMatch && mermaidMatch[1]) {
      return mermaidMatch[1].trim();
    }

    // Fallback if no full blocks are perfectly matched (e.g. streaming or no blocks)
    if (cleaned.startsWith("```mermaid")) {
      cleaned = cleaned.replace(/^```mermaid\s*\n?/i, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*\n?/i, "");
    }

    if (cleaned.endsWith("```")) {
      cleaned = cleaned.replace(/\s*```$/i, "");
    }

    return cleaned.trim();
  }

  private buildPrompt(
    type: string,
    contextContent: string,
    transcriptContent: string,
    personaInstructions: string,
  ): string {
    let typeInstructions = `Your sole purpose is to output EXCLUSIVELY raw Mermaid syntax matching the requested diagram type: ${type}.`;
    if (type === "AUTO") {
      typeInstructions = `You must analyze the user's request and provided context to select the SINGLE MOST APPROPRIATE Mermaid.js diagram type. 
You can choose from: flowchart TD, sequenceDiagram, gantt, mindmap, classDiagram, erDiagram, xychart-beta, timeline, pie, quadrantChart, journey, kanban, sankey-beta, block-beta.
Your sole purpose is to output EXCLUSIVELY raw Mermaid syntax representing the optimal diagram format (fallback to Flowchart if unsure).`;
    }

    return `You are an expert Mermaid diagram architect.
${typeInstructions}
${personaInstructions}
Do NOT output any markdown blocks, conversational text, explanations, or preamble.
The very first character of your response MUST be the start of the Mermaid syntax.

## Guidelines per type:
- FLOWCHART: Use 'flowchart TD' or 'flowchart LR'.
- SEQUENCE: Use 'sequenceDiagram'.
- GANTT: Use 'gantt'. Begin with 'dateFormat YYYY-MM-DD' and a readable 'axisFormat' (e.g. '%b %Y'). Group tasks under 2–5 'section' headings, ~4–6 items each. Give every task a realistic BOUNDED duration (e.g. '2w', '5d') or use 'milestone' for point-in-time events — NEVER let a single task span the whole timeline (it dwarfs everything else). Prefer 'after <taskId>' to sequence work so bars and labels don't overlap. Mark finished work 'done', current work 'active', blockers 'crit'. Examples: 'Diseño, done, 2026-01-05, 2w' and 'Lanzamiento, milestone, 2026-03-01, 0d'.
- MINDMAP: Use 'mindmap'.
- CLASS: Use 'classDiagram'.
- ER: Use 'erDiagram'.
- ARCHITECTURE: Use 'architecture-beta' or 'flowchart TD' if standard architecture syntax is too strict.
- XYCHART: Use 'xychart-beta'. Include title, x-axis, y-axis, and bar/line elements.
- TIMELINE: Use 'timeline' followed by title and chronological events.
- PIE: Use 'pie title XYZ' and quotes for keys.
- QUADRANT: Use 'quadrantChart'. Define x-axis, y-axis, and 4 quadrants before listing points.
- JOURNEY: Use 'journey' to map user tasks over sections.
- KANBAN: Use 'kanban' and organize by 'Todo', 'In Progress', 'Done'.
- SANKEY: Use 'sankey-beta' to show flows (Source, Target, Value).
- BLOCK: Use 'block-beta' for topological abstract layouts.

Use the provided source material to accurately deduce relationships, dependencies, hierarchies, and timelines.

${MERMAID_SYNTAX_RULES}

${contextContent ? `## Source Contexts\n${contextContent}` : ""}
${transcriptContent ? `## Source Transcripts\n${transcriptContent}` : ""}`;
  }
}

export const diagramGenerationService = new DiagramGenerationService();
