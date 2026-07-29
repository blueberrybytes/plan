/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import {
  streamText,
  stepCountIs,
  Output,
  type ModelMessage,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
} from "ai";
import {
  createIssuesFromTasks,
  SYNC_PROVIDERS,
  type SyncProvider,
} from "../services/assistantActionsService";
import { z } from "zod";
import {
  getConfiguredModel,
  DEFAULT_AI_MODEL,
  getFallbackProviderOptions,
  getReasoningProviderOptions,
} from "../utils/aiModelUtils";
import prisma from "../prisma/prismaClient";
import { authenticateUser, AuthenticatedRequest } from "../middleware/authMiddleware";
import { queryContexts } from "../vector/contextFileVectorService";
import { logger } from "../utils/logger";
import { assistantChatService } from "../services/assistantService";
import { aiUsageService } from "../services/aiUsageService";
import { mcpClientService } from "../services/mcpClientService";
import { MERMAID_SYNTAX_RULES } from "../prompts/mermaidRules";
import {
  requireActiveSubscription,
  SubscriptionRequiredError,
} from "../services/subscriptionGuard";
import { checkUsageLimit, UsageLimitExceededError } from "../services/usageLimitGuard";
import { extractTextFromBuffer } from "../utils/documentTextExtractor";

const router = Router();

// Cap per-attachment extracted text injected into the prompt (~25k tokens).
const MAX_ATTACHMENT_CHARS = 100_000;
// Cache extracted attachment text by URL. Document content is immutable per
// URL (Firebase paths are uuid-stamped), so long threads — which replay every
// past attachment on every message — extract each file only ONCE instead of
// re-fetching + re-parsing it on every turn.
const attachmentTextCache = new Map<string, string>();

/**
 * Fetch a non-image/non-PDF chat attachment from its (public) URL and extract
 * its text so the model can actually read it. Returns "" on any failure — a
 * broken attachment must never break the chat. Images and PDFs are handled
 * natively by the multimodal message and never reach here.
 */
async function extractAttachmentText(url: string, type: string, name: string): Promise<string> {
  const cached = attachmentTextCache.get(url);
  if (cached !== undefined) return cached;
  let out = "";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    let text = await extractTextFromBuffer(buf, type);
    if (text.length > MAX_ATTACHMENT_CHARS) {
      text = `${text.slice(0, MAX_ATTACHMENT_CHARS)}\n…[truncated — attachment longer than ${MAX_ATTACHMENT_CHARS} chars]`;
    }
    out = text;
  } catch (err) {
    logger.warn(`Failed to read chat attachment "${name}" (${type})`, err);
    out = "";
  }
  if (attachmentTextCache.size > 500) attachmentTextCache.clear();
  attachmentTextCache.set(url, out);
  return out;
}

// POST /api/chat/threads/:threadId/stream
router.post(
  "/threads/:threadId/stream",
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    const { threadId } = req.params;
    const { content, modelKey, attachments } = req.body as {
      content: string;
      modelKey?: string;
      attachments?: Array<{ url: string; type: string; name: string; size?: number }>;
    };

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { firebaseUid: req.user.uid },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const workspaceId = req.headers["x-workspace-id"] as string;
      if (!workspaceId) {
        return res.status(400).json({ message: "Missing x-workspace-id header" });
      }

      try {
        await requireActiveSubscription(workspaceId);
      } catch (err) {
        if (err instanceof SubscriptionRequiredError) {
          return res
            .status(err.status)
            .json({ code: err.code, message: err.message, reason: err.reason });
        }
        throw err;
      }

      try {
        await checkUsageLimit(workspaceId, "llm");
      } catch (err) {
        if (err instanceof UsageLimitExceededError) {
          return res.status(err.status).json({
            code: err.code,
            message: err.message,
            limitType: err.limitType,
            used: err.used,
            allowed: err.allowed,
          });
        }
        throw err;
      }

      const thread = await prisma.chatThread.findFirstOrThrow({
        where: { id: threadId, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 100,
          },
        },
      });

      // 1. Save User Message (with optional image/PDF attachments)
      await prisma.chatMessage.create({
        data: {
          threadId,
          role: "USER",
          content,
          attachments:
            attachments && attachments.length > 0
              ? (attachments as unknown as import("@prisma/client").Prisma.InputJsonValue)
              : undefined,
        },
      });

      // Removed ResponseSchema as we map strictly to streamText now

      // 2. Retrieve Context (RAG)
      let contextText = "";
      const toolsUsed: string[] = [];
      let gitnexusTools = undefined;

      if (thread.contextIds.length > 0 || thread.transcriptId) {
        if (thread.contextIds.length > 0) {
          const contexts = await queryContexts(thread.contextIds, content, 500);
          if (contexts && contexts.length > 0) {
            contextText = contexts.join("\n---\n");
            // Badge tells the user WHERE the answer drew from — here, their
            // uploaded files/knowledge. "Context Library" is the feature's real
            // name (replaces the stale "Plan AI Graph Power").
            toolsUsed.push("Context Library");
          }
        }

        // 2a. Also pull transcripts attached to any of the selected contexts so
        // the chat can reason over recorded meetings, not just uploaded files.
        // Also include the specific transcript if the chat is linked to one.
        try {
          const attachedTranscripts = await prisma.transcript.findMany({
            where: {
              workspaceId,
              OR: [
                ...(thread.contextIds.length > 0
                  ? [{ contextIds: { hasSome: thread.contextIds } }]
                  : []),
                ...(thread.transcriptId ? [{ id: thread.transcriptId }] : []),
              ],
            },
            select: {
              id: true,
              title: true,
              summary: true,
              transcript: true,
              recordedAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20, // cap to avoid blowing the context window
          });

          if (attachedTranscripts.length > 0) {
            const blocks = attachedTranscripts.map((t) => {
              const heading = `## Meeting: ${t.title || "Untitled"}${
                t.recordedAt ? ` (${new Date(t.recordedAt).toISOString().slice(0, 10)})` : ""
              }`;
              const body = t.summary?.trim() ? t.summary : (t.transcript ?? "").slice(0, 4000); // truncate raw transcript fallback
              return `${heading}\n${body}`;
            });
            const transcriptsSection = `\n\nRelevant Meeting Transcripts (attached to selected contexts):\n${blocks.join(
              "\n\n---\n\n",
            )}`;
            contextText = contextText
              ? `${contextText}\n\n---\n\n${transcriptsSection.trim()}`
              : transcriptsSection.trim();
            toolsUsed.push(`${attachedTranscripts.length} Meeting Transcripts`);
          }
        } catch (err) {
          logger.warn("Failed to enrich chat context with attached transcripts", err);
        }

        // 2b. Check for MCP tools availability (memory, search, codebase)
        if (mcpClientService.isAvailable) {
          // Check if we should pass repo context for codebase queries
          const contextsWithGithub = await prisma.context.findMany({
            where: {
              id: { in: thread.contextIds },
              metadata: { path: ["gitnexusReady"], equals: true },
            },
            select: { id: true },
          });

          if (contextsWithGithub.length > 0) {
            gitnexusTools = mcpClientService.getAiTools();
          } else {
            // Even if no GitHub repo is attached, we still want fetch_url and memory tools!
            const allTools = mcpClientService.getAiTools();
            if (allTools) {
              // Only pick the non-gitnexus tools if no repo is attached
              const { query_codebase: _qc, get_symbol_context: _gsc, ...generalTools } = allTools;
              gitnexusTools = generalTools;
            }
          }
        }
      }

      const startTime = Date.now();
      const codeIntelligenceSection =
        gitnexusTools && "query_codebase" in gitnexusTools
          ? `\n\nYou also have access to a live codebase knowledge graph via your tools. Use the \`query_codebase\` tool to trace execution flows and the \`get_symbol_context\` tool to inspect specific functions or classes. Only invoke these tools when the user's question is clearly about the code or the repository structure.`
          : "";

      const systemPrompt = `You are Plan AI, a helpful workspace and coding assistant.
You have access to the user's codebase context and meeting transcripts.
CRITICAL: If the Context below contains "Relevant Meeting Transcripts", treat those transcripts as the full recording/meeting. If the user asks if you have access to the "meeting", "meet", or "recording", answer YES confidently, because you have the complete text transcript.
Answer the user's question based on the provided context if applicable.
If the user asks for a diagram, architecture, or flow, or if explaining a complex process would benefit from a visual aid, you MUST output a \`\`\`mermaid markdown block. The frontend natively supports rendering Mermaid diagrams.
${MERMAID_SYNTAX_RULES}
CITATION RULES:
When referencing code from the Context below, mention the filename naturally in your response (e.g. "In \`authService.ts\`, the login flow..."). Do NOT output raw JSON citation objects inline.
${codeIntelligenceSection}

Context:
${contextText}
`;

      type AttachmentRef = { url: string; type: string; name: string; size?: number };

      // Build a multimodal user message for the LLM when an attachment is
      // present. Images/PDFs go to the model natively; every OTHER document
      // type (CSV, TXT, MD, JSON, XLSX, DOCX, …) is read back from storage and
      // inlined as text — without this, those attachments were silently
      // dropped and the model replied "I don't see the attachment".
      const buildUserMessage = async (
        text: string,
        atts?: AttachmentRef[] | null,
      ): Promise<ModelMessage> => {
        if (!atts || atts.length === 0) {
          return { role: "user", content: text };
        }
        const parts: Array<
          | { type: "text"; text: string }
          | { type: "image"; image: URL }
          | { type: "file"; data: URL; mediaType: string }
        > = [];
        if (text) parts.push({ type: "text", text });
        for (const a of atts) {
          if (a.type.startsWith("image/")) {
            parts.push({ type: "image", image: new URL(a.url) });
          } else if (a.type === "application/pdf") {
            parts.push({ type: "file", data: new URL(a.url), mediaType: a.type });
          } else {
            const extracted = await extractAttachmentText(a.url, a.type, a.name);
            parts.push({
              type: "text",
              text: extracted
                ? `\n\n[Attachment: ${a.name}]\n${extracted}`
                : `\n\n[Attachment: ${a.name} — could not be read]`,
            });
          }
        }
        return { role: "user", content: parts };
      };

      const historyMessages = await Promise.all(
        thread.messages.map<Promise<ModelMessage>>(async (m) => {
          let cleanContent = m.content;
          if (m.role === "ASSISTANT") {
            try {
              const parsed = JSON.parse(cleanContent);
              if (parsed.text) {
                cleanContent = parsed.text;
              }
            } catch {
              cleanContent = cleanContent.replace(/\[\s*\{\s*"filename"[\s\S]*?\]/g, "");
              cleanContent = cleanContent.split("---CITATIONS---")[0].trim();
            }
          }
          if (m.role === "USER") {
            const pastAttachments = (m.attachments ?? null) as AttachmentRef[] | null;
            return buildUserMessage(cleanContent, pastAttachments);
          }
          return { role: "assistant", content: cleanContent };
        }),
      );

      const messages: ModelMessage[] = [
        ...historyMessages,
        await buildUserMessage(content, attachments),
      ];

      const requestedModelKey = modelKey && modelKey.length > 0 ? modelKey : DEFAULT_AI_MODEL;

      const ResponseSchema = z.object({
        text: z.string().describe("The markdown-formatted conversational response."),
        citations: z
          .array(
            z.object({
              filename: z.string().describe("The name of the file being cited."),
              lines: z.string().describe("The line coverage of the citation (e.g. '45-50')."),
            }),
          )
          .describe(
            "An array of citations matching the precise sources used from the context blocks.",
          ),
      });

      // Tool-using models: pure streamText (text streaming)
      // Standard models: streamText + Output.object (structured output with citations)
      const useStructuredOutput = !gitnexusTools;

      const result = await streamText({
        model: getConfiguredModel(requestedModelKey),
        system: systemPrompt,
        // Turn on reasoning tokens so the model streams its thinking — surfaced
        // live in the chat UI as a collapsible "Thinking" panel (wrapped in
        // <think>…</think> in the stream below). Non-reasoning models no-op.
        providerOptions: getReasoningProviderOptions(requestedModelKey),
        messages,
        maxRetries: 3,
        ...(gitnexusTools
          ? { tools: gitnexusTools, stopWhen: stepCountIs(5) }
          : {
              output: Output.object({
                name: "StreamedChatResponse",
                description:
                  "Outputs a conversational response along with precise context citations.",
                schema: ResponseSchema,
              }),
            }),
        onFinish: async ({ text, reasoningText, usage }) => {
          // AI SDK v6: `reasoning` is an array of parts; `reasoningText` is the
          // joined string. Using `reasoning` here stringified to "[object Object]"
          // inside the <think> block. `reasoningText` is the human text.
          const reasoning = reasoningText;
          try {
            if (usage) {
              aiUsageService
                .logUsage({
                  userId: user.id,
                  workspaceId,
                  feature: "CHAT",
                  provider: "openrouter",
                  model: requestedModelKey,
                  inputTokens: usage.inputTokens || 0,
                  outputTokens: usage.outputTokens || 0,
                })
                .catch(() => {});
            }
            const latencyMs = Date.now() - startTime;

            if (gitnexusTools) {
              const resolvedSteps = await result.steps;
              if (resolvedSteps && resolvedSteps.length > 0) {
                const usedToolNames = new Set<string>();
                for (const step of resolvedSteps) {
                  if (step.toolCalls) {
                    for (const tc of step.toolCalls) {
                      if (tc.toolName === "fetch_url") usedToolNames.add("Web Search");
                      else if (
                        tc.toolName === "query_codebase" ||
                        tc.toolName === "get_symbol_context"
                      )
                        usedToolNames.add("Plan AI Code Graph");
                      else if (tc.toolName === "add_memory" || tc.toolName === "query_memory")
                        usedToolNames.add("Organization Memory");
                      else usedToolNames.add(tc.toolName);
                    }
                  }
                }
                toolsUsed.push(...Array.from(usedToolNames));
              }
            }

            // Extract text + citations from structured output, or use raw text for tool models
            let baseText = text;
            if (!baseText && reasoning) {
              // Model generated reasoning but no text. Leave baseText empty to avoid the error message.
              baseText = "";
            } else if (!baseText) {
              baseText = "Failed to generate text content.";
            }

            let finalText = reasoning ? `<think>\n${reasoning}\n</think>\n\n${baseText}` : baseText;
            let citations: { filename: string; lines: string }[] = [];
            if (useStructuredOutput) {
              try {
                const outputObj = await result.output;
                if (outputObj?.text) {
                  finalText = reasoning
                    ? `<think>\n${reasoning}\n</think>\n\n${outputObj.text}`
                    : outputObj.text;
                }
                if (outputObj && Array.isArray(outputObj.citations))
                  citations = outputObj.citations;
              } catch {
                // If output parsing fails, fall back to raw text
              }
            }

            // Build aiGraphTrace only when agentic tools were actually used (not just basic RAG)
            let aiGraphTrace:
              | {
                  nodes: { id: string; name: string; group: string; val: number }[];
                  links: { source: string; target: string }[];
                }
              | undefined;
            if (gitnexusTools && toolsUsed.length > 0) {
              const graphNodes: { id: string; name: string; group: string; val: number }[] = [
                { id: "ai", name: "Plan AI", group: "function", val: 30 },
              ];
              const graphLinks: { source: string; target: string }[] = [];
              for (const toolName of toolsUsed) {
                const toolId = `tool-${toolName}`;
                graphNodes.push({ id: toolId, name: toolName, group: "database", val: 20 });
                graphLinks.push({ source: "ai", target: toolId });
              }
              aiGraphTrace = { nodes: graphNodes, links: graphLinks };
            }

            await prisma.chatMessage.create({
              data: {
                threadId,
                role: "ASSISTANT",
                content: JSON.stringify({
                  text: finalText,
                  latencyMs,
                  tools: toolsUsed,
                  ...(citations.length > 0 ? { citations } : {}),
                  ...(aiGraphTrace ? { aiGraphTrace } : {}),
                }),
              },
            });
            await prisma.chatThread.update({
              where: { id: threadId },
              data: { updatedAt: new Date() },
            });
          } catch (err) {
            logger.error("Failed to persist streamed message", err);
          }
        },
      });

      // Stream to the client. We forward the model's reasoning (chain-of-thought)
      // wrapped in <think>…</think> first, then the answer text — the frontend
      // splits the <think> block into a collapsible "Thinking" panel. Iterating
      // fullStream (instead of textStream) gives us the reasoning-delta parts;
      // models without reasoning simply never emit them.
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      let inThink = false;
      for await (const part of result.fullStream) {
        if (part.type === "reasoning-delta") {
          if (!inThink) {
            res.write("<think>");
            inThink = true;
          }
          const p = part as { textDelta?: string; delta?: string; text?: string };
          const content = p.textDelta ?? p.delta ?? p.text ?? "";
          if (content) res.write(content);
        } else if (part.type === "text-delta") {
          if (inThink) {
            res.write("</think>");
            inThink = false;
          }
          const p = part as { textDelta?: string; delta?: string; text?: string };
          const content = p.textDelta ?? p.delta ?? p.text ?? "";
          if (content) res.write(content);
        }
      }
      if (inThink) res.write("</think>");
      res.end();
      return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error("Streaming error", error);
      let msg = error instanceof Error ? error.message : "Streaming failed";

      if (error?.responseBody) {
        try {
          const parsed = JSON.parse(error.responseBody);
          if (parsed?.error?.message) {
            msg = parsed.error.message;
          }
        } catch (e) {
          // ignore
        }
      }

      return res.status(500).json({ message: msg });
    }
  },
);

// POST /api/chat/assistant/stream
router.post("/assistant/stream", authenticateUser, async (req: AuthenticatedRequest, res) => {
  console.log("[ChatRouter] Assistant Stream requested");
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { messages, projectId } = req.body as { messages: unknown; projectId?: string };

    console.log("[ChatRouter] Assistant Stream requested with DB user:", user.id);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Invalid messages format" });
    }

    const workspaceId = req.headers["x-workspace-id"] as string;
    if (!workspaceId) {
      return res.status(400).json({ message: "Missing x-workspace-id header" });
    }

    try {
      await requireActiveSubscription(workspaceId);
    } catch (err) {
      if (err instanceof SubscriptionRequiredError) {
        return res
          .status(err.status)
          .json({ code: err.code, message: err.message, reason: err.reason });
      }
      throw err;
    }

    try {
      await checkUsageLimit(workspaceId, "llm");
    } catch (err) {
      if (err instanceof UsageLimitExceededError) {
        return res.status(err.status).json({
          code: err.code,
          message: err.message,
          limitType: err.limitType,
          used: err.used,
          allowed: err.allowed,
        });
      }
      throw err;
    }

    const { modelKey } = req.query;
    const result = await assistantChatService.handleAssistantStream(
      messages,
      user.id,
      workspaceId,
      modelKey as string,
      projectId,
    );

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    console.log("[ChatRouter] Starting stream iteration for assistant/stream");
    // Reasoning is OPT-IN via ?reasoning=1 so the legacy web renderer (which
    // doesn't parse <think>) is untouched; mobile passes the flag and shows the
    // thinking in a collapsible panel. Same <think> wrapping as the other chat.
    const emitReasoning = req.query.reasoning === "1";
    let inThink = false;
    for await (const part of result.fullStream) {
      if (emitReasoning && part.type === "reasoning-delta") {
        if (!inThink) {
          res.write("<think>");
          inThink = true;
        }
        const p = part as { textDelta?: string; delta?: string; text?: string };
        const content = p.textDelta ?? p.delta ?? p.text ?? "";
        if (content) res.write(content);
      } else if (part.type === "text-delta") {
        if (inThink) {
          res.write("</think>\n\n");
          inThink = false;
        }
        const p = part as { textDelta?: string; delta?: string; text?: string };
        const content = p.textDelta ?? p.delta ?? p.text ?? "";
        if (content) res.write(content);
      } else if (part.type === "tool-call" && part.toolName === "requestDocumentGeneration") {
        // TypeScript knows part.input is correctly typed here because of the toolName check
        const input = part.input as { purpose?: string; recordingId?: string; contextId?: string };
        res.write(
          `\n\n[UI:CONFIRM_DOC purpose="${input.purpose || ""}" recordingId="${input.recordingId || ""}" contextId="${input.contextId || ""}"]\n\n`,
        );
      } else if (part.type === "tool-call" && part.toolName === "navigate") {
        // The model just decided to take the user somewhere — emit a marker
        // the frontend parses and routes to. Without this, the model says
        // "I've navigated you to X" but nothing actually happens.
        const input = part.input as { path?: string };
        if (input.path) {
          res.write(`\n\n[UI:NAVIGATE path="${input.path}"]\n\n`);
        }
      }
    }
    console.log("[ChatRouter] Finished streaming text, ending response.");
    res.end();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error("Assistant Streaming error", error);
    let msg = error instanceof Error ? error.message : "Assistant Streaming failed";

    if (error?.responseBody) {
      try {
        const parsed = JSON.parse(error.responseBody);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      } catch (e) {
        // ignore
      }
    }

    return res.status(500).json({ message: msg });
  }
});

// POST /api/chat/assistant/stream-ui
//
// The assistant over the AI SDK UI Message Stream protocol (structured text,
// reasoning and tool parts) instead of the legacy plain-text + [UI:...] markers.
// The frontend consumes this with `useChat`, which renders tool confirmation
// cards and the "Thinking" panel natively. Added alongside the old
// /assistant/stream so the migration doesn't break the current chat.
router.post("/assistant/stream-ui", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const workspaceHeader = req.headers["x-workspace-id"];
    const workspaceId = Array.isArray(workspaceHeader) ? workspaceHeader[0] : workspaceHeader;
    if (!workspaceId) return res.status(400).json({ message: "Missing x-workspace-id header" });

    try {
      await requireActiveSubscription(workspaceId);
      await checkUsageLimit(workspaceId, "llm");
    } catch (err) {
      if (err instanceof SubscriptionRequiredError)
        return res.status(err.status).json({ code: err.code, message: err.message });
      if (err instanceof UsageLimitExceededError)
        return res.status(429).json({ message: err.message });
      throw err;
    }

    const projectId =
      (req.body.projectId as string) || (req.query.projectId as string) || undefined;
    const modelKey = req.query.modelKey as string;

    const result = await assistantChatService.handleAssistantStream(
      req.body.messages,
      user.id,
      workspaceId,
      modelKey,
      projectId,
    );

    pipeUIMessageStreamToResponse({
      response: res,
      stream: createUIMessageStream({
        execute: async ({ writer }) => {
          // sendReasoning surfaces the model's thinking as reasoning parts the
          // frontend renders in a collapsible panel.
          await writer.merge(result.toUIMessageStream({ sendReasoning: true }));
        },
      }),
    });
  } catch (error) {
    logger.error("Assistant UI stream error", error);
    if (!res.headersSent) res.status(500).json({ message: "Assistant stream failed" });
  }
});

// POST /api/chat/assistant/actions/task-sync
//
// The TRUSTED write behind the assistant's task-sync confirmation card, for ANY
// provider (Linear/Jira/Asana/Trello/Notion). The card's Confirm button calls
// this; the model can only ASK (requestTaskSync is a no-op). All the safety
// lives in createIssuesFromTasks — workspace re-check, dedup, cap, audit — so a
// write only happens here, authenticated and guarded, never from the model.
router.post(
  "/assistant/actions/task-sync",
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const workspaceHeader = req.headers["x-workspace-id"];
    const workspaceId = Array.isArray(workspaceHeader) ? workspaceHeader[0] : workspaceHeader;
    if (!workspaceId) return res.status(400).json({ message: "Missing x-workspace-id header" });

    const provider = req.body.provider as SyncProvider;
    if (!SYNC_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: "Unknown provider" });
    }
    const taskIds: string[] = Array.isArray(req.body.taskIds) ? req.body.taskIds : [];
    if (!taskIds.length) return res.status(400).json({ message: "No task ids provided" });

    try {
      const outcome = await createIssuesFromTasks(workspaceId, user.id, provider, taskIds);
      return res.json(outcome);
    } catch (err) {
      logger.error("Task sync action failed", err);
      return res.status(500).json({ message: "Failed to sync tasks" });
    }
  },
);

export default router;
