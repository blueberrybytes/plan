import {
  getConfiguredModel,
  getReasoningProviderOptions,
  DEFAULT_AI_MODEL,
} from "../utils/aiModelUtils";
import { streamText, convertToModelMessages, UIMessage, stepCountIs, tool } from "ai";
import { z } from "zod";
import fs from "fs";
import path from "path";
import prisma from "../prisma/prismaClient";
import { aiUsageService } from "./aiUsageService";
import {
  previewTaskSync,
  updateTaskStatus,
  assignTask,
  SYNC_PROVIDERS,
  type SyncProvider,
} from "./assistantActionsService";
import { searchWeb, fetchWebPage } from "./assistantWebService";
import { getPersonaInstructions } from "./personaService";
import { contextService } from "./contextService";
import { queryContexts } from "../vector/contextFileVectorService";
import { resolveAssistantDateRange } from "./assistantDateUtils";

export class AssistantChatService {
  public async handleAssistantStream(
    messages: UIMessage[],
    userId: string,
    workspaceId: string,
    modelKey?: string,
    /** When set, the assistant scopes its tools and RAG to this project. */
    selectedProjectId?: string,
  ) {
    try {
      let knowledgeBasePath = path.join(__dirname, "../knowledge/plan_ai_overview.md");
      if (!fs.existsSync(knowledgeBasePath)) {
        knowledgeBasePath = path.join(process.cwd(), "src/knowledge/plan_ai_overview.md");
      }
      let planAiKnowledge = "";
      try {
        planAiKnowledge = fs.readFileSync(knowledgeBasePath, "utf-8");
      } catch (e) {
        console.warn("[AssistantService] Could not read plan_ai_overview.md", e);
      }

      const personaInstructions = await getPersonaInstructions(userId, workspaceId);

      // Load the active project (and its 1:1 Context) when scoped. We use this
      // to (a) inject a focus instruction into the system prompt, (b) RAG-pull
      // relevant chunks from the project's files when a user message arrives,
      // and (c) auto-filter tool results to the project.
      let activeProject: {
        id: string;
        title: string;
        description: string | null;
        contextId: string | null;
      } | null = null;
      if (selectedProjectId) {
        const proj = await prisma.project.findFirst({
          where: { id: selectedProjectId, workspaceId },
          include: { context: { select: { id: true } } },
        });
        if (proj) {
          activeProject = {
            id: proj.id,
            title: proj.title,
            description: proj.description,
            contextId: proj.context?.id ?? null,
          };
        }
      }

      // RAG: when a project is selected, pull chunks from its files using the
      // last user message as the query. Injected into the system prompt.
      let projectKnowledge = "";
      if (activeProject?.contextId) {
        try {
          const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
          const queryText =
            typeof lastUserMsg?.parts?.[0] === "object" &&
            lastUserMsg.parts[0] !== null &&
            "text" in lastUserMsg.parts[0]
              ? String((lastUserMsg.parts[0] as { text?: string }).text ?? "")
              : "";
          if (queryText.trim().length > 0) {
            const chunks = await queryContexts([activeProject.contextId], queryText, 500);
            if (chunks && chunks.length > 0) {
              projectKnowledge = chunks.join("\n---\n");
            }
          }
        } catch (e) {
          console.warn("[AssistantService] Failed to RAG project context", e);
        }
      }

      const projectFocusBlock = activeProject
        ? `\n---\nACTIVE PROJECT FOCUS\nThe user has selected the project **${activeProject.title}** (id: ${activeProject.id}).
ALL your tool calls, lookups, and answers MUST be scoped to this project unless the user explicitly asks about something else.
- When calling listTasks, pass projectId="${activeProject.id}".
- When the user asks about tasks, transcripts, documents, or files, assume they mean this project.
- When suggesting links, prefer URLs under /projects/${activeProject.id}/...
${activeProject.description ? `\nProject description: ${activeProject.description}` : ""}
${projectKnowledge ? `\nRelevant file context from this project:\n<project_files>\n${projectKnowledge}\n</project_files>` : ""}
---\n`
        : "";

      const todayIso = new Date().toISOString().slice(0, 10);

      const systemPrompt = `You are Plan AI Assistant, a powerful AI integrated directly into the workspace.
You help the user navigate, find information, manage entities, and answer in-depth questions about their workspace content — especially meetings and recordings, which are the heart of the product.
You have many tools at your disposal. ALWAYS prefer calling a tool over guessing — the tools give you ground-truth data.
Do not invent IDs, URLs, or content; look them up first.

Today's date is ${todayIso}. When the user uses relative time phrases ("last week", "yesterday", "this month", "past 7 days"), compute the ISO date range yourself before calling tools — don't ask the user.

${personaInstructions}

## Tool usage playbook

When the user asks about:
- "my projects / show projects" → \`listProjects\`
- "tasks / what's open / my todos" → \`listTasks\` (auto-scoped to focused project)
- "documents / docs / reports" → \`listDocuments\`, then \`getDocument\` for the specific one. \`getDocument\` returns the full markdown content — quote it when answering.
- "slides / presentations / pitch deck" → \`listSlides\`, then \`getSlide\` for content.
- "diagrams / architecture / mermaid" → \`listDiagrams\`, then \`getDiagram\` for the mermaid code.
- "explain this project / what's project X about" → \`explainProject\`
- "create a project/doc/task/theme" → use the matching create tool
- "generate a report / write a doc from my meeting" → \`requestDocumentGeneration\` (yields a UI confirmation card)
- "create a task / new ticket" → \`requestTaskCreation\` (yields a UI confirmation card)

### Meetings & recordings — RICH playbook (this is the core of the product)

- "what's been happening / catch me up / digest" → \`getRecentMeetingsContext\` (returns last N with summaries + key points; then synthesize)
- "list / show me meetings" with a filter (date, sentiment, sort) → \`listRecordings\` with the filter args
- "meetings last week / this month / yesterday" → \`listRecordings\` with dateFrom/dateTo computed from today
- "tense / negative / positive / mixed meetings" → \`listRecordings\` with sentiment filter
- "find the meeting where we discussed X" → \`searchTranscripts\` with keyword
- "summarize / what was said / who said X / what decisions" → \`getRecording\` (full transcript + tasks)
- "themes / main points / common concerns this week" → \`getKeyPointsAcrossMeetings\` with date range
- "how many meetings / how much time in meetings / sentiment breakdown" → \`getMeetingStats\` with date range
- "open action items / what's pending from meetings / follow-ups" → \`listMeetingActionItems\` (optionally with status filter)
- "compare last two / has X changed between meetings" → \`compareMeetings\` with the IDs (chain after \`listRecordings\` or \`searchTranscripts\` to get IDs first)

## Chaining

You can call MULTIPLE tools per turn. Typical chains:
- "Catch me up on this week" → \`getRecentMeetingsContext(limit=10)\` → synthesize themes
- "Open action items from last week's meetings" → \`listMeetingActionItems({status: "BACKLOG", dateFrom: ...})\`
- "Compare last two standups" → \`searchTranscripts("standup", limit=2)\` → \`compareMeetings([id1, id2])\`
- "How positive have meetings been this month?" → \`getMeetingStats({dateFrom: ...})\` + comment on sentimentBreakdown
- "Themes from June" → \`getKeyPointsAcrossMeetings({dateFrom: "2026-06-01", dateTo: "2026-06-30"})\` → aggregate
- "Summary of the project + what's open" → \`explainProject\` + \`listTasks\` + \`getRecentMeetingsContext\`
- "What's in my last presentation?" → \`listSlides\` → \`getSlide\` → details
- "Tasks from yesterday's standup?" → \`searchTranscripts\` "standup" → \`getRecording\` → list its tasks

## Output formatting

- Lists → markdown hyperlinks \`[Title](/url)\`.
- Quoting from a doc/recording/slide → blockquotes.
- Mermaid diagrams → wrap in \`\`\`mermaid blocks.
- "How do I…" → use \`navigate\` rather than walking them through clicks.
- Aggregate questions (themes, sentiment, stats) → answer with a clear synthesis, then optionally show a bulleted list of source recordings as evidence.

## External actions — preview, then request confirmation

Some tools act OUTSIDE Plan AI, e.g. syncing tasks to a connected task tool (Linear, Jira, Asana, Trello, or Notion). Pick the provider from what the user asks ("send these to Jira" → provider JIRA). For these:
1. First call the read-only preview tool (\`previewTaskSync\` with the provider) and show the user which items would be affected, as a short list.
2. When the user wants to proceed, call \`requestTaskSync\` with the same provider. This does NOT perform the action — it shows a confirmation card with Confirm/Cancel buttons. The action only happens when the user clicks Confirm.
3. After calling the request tool, briefly tell the user to confirm in the card. Do not claim the action is done — it isn't until they click.
Never invent a confirmation. If the provider isn't connected (preview says so), tell the user to connect it in Integrations first.

## Available navigation paths

- Dashboard: /
- Create a Document: /docs/create
- Create a Slide Presentation: /slides/create
- Create a Diagram: /diagrams/create
- Projects Dashboard: /projects
- Integrations: /integrations
- Settings / Profile: /profile
- Plan AI Chat: /chat

${projectFocusBlock}
---
Plan AI Knowledge Base Context:
${planAiKnowledge}

`;

      const selectedModel = modelKey && modelKey.length > 0 ? modelKey : DEFAULT_AI_MODEL;
      const result = streamText({
        model: getConfiguredModel(selectedModel),
        // Reasoning tokens on: the model streams its thinking, surfaced in the
        // UI as a collapsible "Thinking" panel (via toUIMessageStream's reasoning
        // parts). Non-reasoning models no-op.
        providerOptions: getReasoningProviderOptions(selectedModel),
        maxRetries: 3,
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        // Allow the model multiple tool calls so it can chain (e.g. list → get
        // → search → answer) without bailing out early.
        stopWhen: stepCountIs(8),
        tools: {
          navigate: tool({
            description: "Navigate the user to a specific page in the application.",
            inputSchema: z.object({
              path: z.string().describe("The local path to navigate to (e.g. '/', '/contexts')."),
            }),
            execute: async ({ path }) => {
              return { success: true, navigatedTo: path };
            },
          }),
          listProjects: tool({
            description: "List the user's current projects.",
            inputSchema: z.object({}),
            execute: async () => {
              const projects = await prisma.project.findMany({
                where: { workspaceId },
                select: { id: true, title: true, status: true },
              });
              return {
                projects: projects.map((p) => ({
                  ...p,
                  url: `/projects/${p.id}`,
                })),
              };
            },
          }),
          listTasks: tool({
            description: "List tasks assigned to the user or globally for a project.",
            inputSchema: z.object({
              projectId: z.string().optional().describe("Optional project ID to filter tasks by."),
            }),
            execute: async ({ projectId }) => {
              // If the user has scoped the assistant to a project, override
              // any projectId the model may have invented.
              const effectiveProjectId = activeProject?.id ?? projectId;
              const tasks = await prisma.task.findMany({
                where: {
                  AND: [
                    { assigneeId: userId },
                    effectiveProjectId ? { projectId: effectiveProjectId } : {},
                  ],
                },
                select: { id: true, title: true, status: true, priority: true, projectId: true },
                take: 10,
                orderBy: { updatedAt: "desc" },
              });
              return {
                tasks: tasks.map((t) => ({
                  ...t,
                  url: `/projects/${t.projectId}?task=${t.id}`,
                })),
              };
            },
          }),
          listContexts: tool({
            description: "List the user's Context Library elements/folders.",
            inputSchema: z.object({}),
            execute: async () => {
              const contexts = await prisma.context.findMany({
                where: { userId },
                select: { id: true, name: true, description: true },
              });
              return {
                contexts: contexts.map((c) => ({
                  ...c,
                  url: `/contexts/${c.id}`,
                })),
              };
            },
          }),
          listDocuments: tool({
            description: "List the user's rich text documents.",
            inputSchema: z.object({}),
            execute: async () => {
              const documents = await prisma.docDocument.findMany({
                where: {
                  userId,
                  // When scoped to a project, only show docs that reference
                  // its 1:1 context.
                  ...(activeProject?.contextId
                    ? { contextIds: { has: activeProject.contextId } }
                    : {}),
                },
                select: { id: true, title: true, status: true },
              });
              return {
                documents: documents.map((d) => ({
                  ...d,
                  url: `/docs/${d.id}`,
                })),
              };
            },
          }),
          listFeatures: tool({
            description: "Explain the features and capabilities of this application.",
            inputSchema: z.object({}),
            execute: async () => {
              console.log("listFeatures");
              return {
                features: [
                  "Projects: Group work, track status, and manage timelines.",
                  "Tasks: Individual units of work assigned within Projects (Kanban style).",
                  "Context Library: File/knowledge management nodes where users upload files to anchor AI reasoning.",
                  "Documents: Rich-text MDX enabled writing pads.",
                  "Slide Templates & Presentations: Generative presentation engines.",
                  "Integrations: Connect Jira or Linear via OAuth.",
                ],
              };
            },
          }),
          explainProject: tool({
            description:
              "Provide a detailed explanation of a specific project, including its tasks and transcripts.",
            inputSchema: z.object({
              projectId: z.string().describe("The ID of the project to look up."),
            }),
            execute: async ({ projectId }) => {
              const project = await prisma.project.findUnique({
                where: { id: projectId, userId },
                include: {
                  tasks: { take: 10, select: { title: true, status: true, priority: true } },
                  transcripts: { take: 5, select: { title: true, source: true } },
                },
              });
              if (!project) return { error: "Project not found or unauthorized." };
              return { project };
            },
          }),
          createProject: tool({
            description: "Create a new project.",
            inputSchema: z.object({
              title: z.string().describe("The name of the new project."),
              description: z.string().optional().describe("Optional description of the project."),
            }),
            execute: async ({ title, description }) => {
              const project = await prisma.$transaction(async (tx) => {
                const created = await tx.project.create({
                  data: {
                    userId,
                    workspaceId,
                    title: title,
                    description: description,
                    status: "ACTIVE",
                  },
                });
                await contextService.createContextForProject(
                  userId,
                  workspaceId,
                  created.id,
                  created.title,
                  tx,
                );
                return created;
              });
              return { success: true, project: { ...project, url: `/projects/${project.id}` } };
            },
          }),
          createDocument: tool({
            description: "Create a new rich text document.",
            inputSchema: z.object({
              title: z.string().describe("The title of the document."),
              content: z.string().describe("The initial markdown or text content of the document."),
            }),
            execute: async ({ title, content }) => {
              const doc = await prisma.docDocument.create({
                data: {
                  userId,
                  workspaceId,
                  title: title,
                  content: content,
                  status: "DRAFT",
                },
              });
              return { success: true, document: { ...doc, url: `/docs/${doc.id}` } };
            },
          }),
          createContext: tool({
            description: "Create a new Context Library (knowledge base) folder.",
            inputSchema: z.object({
              name: z.string().describe("The name of the new context library."),
              description: z.string().optional().describe("Optional description."),
            }),
            execute: async ({ name, description }) => {
              const context = await prisma.context.create({
                data: {
                  userId,
                  workspaceId,
                  name: name,
                  description: description,
                },
              });
              return { success: true, context: { ...context, url: `/contexts/${context.id}` } };
            },
          }),
          listRecordings: tool({
            description:
              "List meeting recordings / transcripts with rich filters. Supports date range, sentiment, sort order, and pagination. Use this whenever the user asks about meetings by time ('last week', 'yesterday') or feeling ('tense', 'positive meetings'). The model should convert relative date phrases into ISO dates before calling.",
            inputSchema: z.object({
              dateFrom: z
                .string()
                .optional()
                .describe(
                  "ISO date — only recordings on or after this date. e.g. '2026-05-15' or '2026-05-15T00:00:00Z'.",
                ),
              dateTo: z.string().optional().describe("ISO date — only recordings up to this date."),
              sentiment: z
                .enum(["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"])
                .optional()
                .describe("Filter by AI-detected meeting sentiment."),
              orderBy: z
                .enum(["recordedAt_desc", "recordedAt_asc", "createdAt_desc"])
                .optional()
                .describe("Sort order. Default: recordedAt_desc (newest first)."),
              limit: z
                .number()
                .min(1)
                .max(50)
                .optional()
                .describe("Max results. Default 15, max 50."),
            }),
            execute: async ({ dateFrom, dateTo, sentiment, orderBy, limit }) => {
              const range = resolveAssistantDateRange(dateFrom, dateTo);

              const sort =
                orderBy === "recordedAt_asc"
                  ? { recordedAt: "asc" as const }
                  : orderBy === "createdAt_desc"
                    ? { createdAt: "desc" as const }
                    : { recordedAt: "desc" as const };

              const transcripts = await prisma.transcript.findMany({
                where: {
                  userId,
                  workspaceId,
                  ...(activeProject ? { projectId: activeProject.id } : {}),
                  ...(sentiment ? { sentiment } : {}),
                  ...(range.hasFilter ? { recordedAt: { gte: range.gte, lte: range.lte } } : {}),
                },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  sentiment: true,
                  durationSeconds: true,
                  recordedAt: true,
                  createdAt: true,
                  metadata: true,
                  projectId: true,
                },
                orderBy: sort,
                take: limit ?? 15,
              });

              return {
                count: transcripts.length,
                recordings: transcripts.map((t) => {
                  const meta = (t.metadata ?? null) as {
                    principalSpeaker?: string;
                  } | null;
                  return {
                    id: t.id,
                    title: t.title,
                    summarySnippet: (t.summary ?? "").slice(0, 220),
                    sentiment: t.sentiment,
                    durationSeconds: t.durationSeconds,
                    principalSpeaker: meta?.principalSpeaker ?? null,
                    recordedAt: t.recordedAt?.toISOString() ?? null,
                    createdAt: t.createdAt.toISOString(),
                    url: t.projectId
                      ? `/projects/${t.projectId}/info/transcripts/${t.id}`
                      : `/recordings/${t.id}`,
                  };
                }),
              };
            },
          }),
          requestDocumentGeneration: tool({
            description:
              "CRITICAL: When the user asks you to GENERATE A REPORT or CREATE A DOCUMENT, DO NOT use createDocument directly! You MUST use this tool instead. This tool requires 'purpose' and 'recordingId'. If 'recordingId' or 'contextId' are missing but the user provides a conversational hint (e.g. 'last recording', 'the latest one', or a context name), you MUST use the listRecordings and listContexts tools to look up those IDs automatically for the user FIRST before calling this. Only ask the user for clarification if you absolutely cannot guess the ID after looking at the listed tools. Calling this tool yields a UI Card to the user for them to confirm.",
            inputSchema: z.object({
              purpose: z
                .string()
                .describe("The explicit goal or purpose of the document (e.g. 'Weekly Update')."),
              recordingId: z.string().describe("The ID of the recording/transcript to use."),
              recordingName: z
                .string()
                .optional()
                .describe("The user-friendly title of the recording"),
              contextId: z
                .string()
                .optional()
                .describe("An optional Context Library ID to use as a knowledge base reference."),
              contextName: z.string().optional().describe("The user-friendly title of the context"),
            }),
            execute: async ({ purpose, recordingId, recordingName, contextId, contextName }) => {
              // Instead of executing code, we deliberately yield a parseable Markdown string back to the stream!
              return {
                yieldHtml: `[UI:CONFIRM_DOC purpose="${purpose}" recordingId="${recordingId}" recordingName="${recordingName || recordingId}" contextId="${contextId || ""}" contextName="${contextName || contextId || ""}"]`,
              };
            },
          }),
          requestTaskCreation: tool({
            description:
              "CRITICAL: When the user asks you to CREATE A TASK, TICKET, OR ISSUE, you MUST use this tool. This tool requires 'title', 'description', and 'projectId'. If 'projectId' is missing but the user provides a project name or conversational hint, use the listProjects tool to look it up FIRST before calling this. If the user has no projects, tell them they need a project or offer to create one using createProject. Calling this tool yields a UI Card to the user for them to confirm.",
            inputSchema: z.object({
              title: z.string().describe("The title of the task or ticket."),
              description: z.string().describe("A detailed description of what needs to be done."),
              projectId: z.string().describe("The ID of the project this task belongs to."),
              projectName: z.string().optional().describe("The user-friendly name of the project"),
            }),
            execute: async ({ title, description, projectId, projectName }) => {
              // Yield a parseable Markdown string back to the stream for the UI to render a confirmation card
              return {
                yieldHtml: `[UI:CONFIRM_TASK title="${title}" description="${description}" projectId="${projectId}" projectName="${projectName || projectId}"]`,
              };
            },
          }),
          createBrandTheme: tool({
            description: "Create a new Brand Theme.",
            inputSchema: z.object({
              name: z.string().describe("The name of the theme."),
              primaryColor: z
                .string()
                .optional()
                .describe("A hex color code for the primary color (e.g. #FF5733)."),
            }),
            execute: async ({ name, primaryColor }) => {
              const theme = await prisma.brandTheme.create({
                data: {
                  userId,
                  workspaceId,
                  name: name,
                  primaryColor: primaryColor || "#4361EE",
                },
              });
              return { success: true, themeId: theme.id, themeName: theme.name };
            },
          }),

          // ── Slides / Presentations ───────────────────────────────────────
          listSlides: tool({
            description:
              "List the user's slide presentations. When a project is focused, only that project's presentations are returned (matched by the project's files).",
            inputSchema: z.object({}),
            execute: async () => {
              const presentations = await prisma.presentation.findMany({
                where: {
                  workspaceId,
                  ...(activeProject?.contextId
                    ? { contextIds: { has: activeProject.contextId } }
                    : {}),
                },
                select: { id: true, title: true, status: true, updatedAt: true },
                orderBy: { updatedAt: "desc" },
                take: 15,
              });
              return {
                presentations: presentations.map((p) => ({
                  ...p,
                  updatedAt: p.updatedAt.toISOString(),
                  url: `/slides/view/${p.id}`,
                })),
              };
            },
          }),
          getSlide: tool({
            description:
              "Fetch the detailed contents of a specific slide presentation (title, prompt, every slide's headline and body text). Use this to answer questions like 'what does slide 3 say?' or 'summarize my pitch deck'.",
            inputSchema: z.object({
              presentationId: z.string().describe("The presentation ID."),
            }),
            execute: async ({ presentationId }) => {
              const pres = await prisma.presentation.findFirst({
                where: { id: presentationId, workspaceId },
                select: {
                  id: true,
                  title: true,
                  prompt: true,
                  slidesJson: true,
                  status: true,
                },
              });
              if (!pres) return { error: "Presentation not found or unauthorized." };
              return {
                presentation: { ...pres, url: `/slides/view/${pres.id}` },
              };
            },
          }),

          // ── Diagrams ─────────────────────────────────────────────────────
          listDiagrams: tool({
            description:
              "List the user's mermaid diagrams. When a project is focused, only that project's diagrams are returned.",
            inputSchema: z.object({}),
            execute: async () => {
              const diagrams = await prisma.diagram.findMany({
                where: {
                  workspaceId,
                  ...(activeProject?.contextId
                    ? { contextIds: { has: activeProject.contextId } }
                    : {}),
                },
                select: { id: true, title: true, type: true, status: true, updatedAt: true },
                orderBy: { updatedAt: "desc" },
                take: 15,
              });
              return {
                diagrams: diagrams.map((d) => ({
                  ...d,
                  updatedAt: d.updatedAt.toISOString(),
                  url: `/diagrams/${d.id}`,
                })),
              };
            },
          }),
          getDiagram: tool({
            description:
              "Fetch a specific diagram including its Mermaid code, type, title, and generation prompt. Use this when the user asks about a diagram's content or structure.",
            inputSchema: z.object({
              diagramId: z.string().describe("The diagram ID."),
            }),
            execute: async ({ diagramId }) => {
              const diag = await prisma.diagram.findFirst({
                where: { id: diagramId, workspaceId },
                select: {
                  id: true,
                  title: true,
                  type: true,
                  prompt: true,
                  mermaidCode: true,
                  status: true,
                },
              });
              if (!diag) return { error: "Diagram not found or unauthorized." };
              return { diagram: { ...diag, url: `/diagrams/${diag.id}` } };
            },
          }),

          // ── Documents ────────────────────────────────────────────────────
          getDocument: tool({
            description:
              "Fetch the full content of a specific document. Use this when the user asks 'what does the doc say' or 'summarize the report'.",
            inputSchema: z.object({
              documentId: z.string().describe("The document ID."),
            }),
            execute: async ({ documentId }) => {
              const doc = await prisma.docDocument.findFirst({
                where: { id: documentId, workspaceId },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  prompt: true,
                  status: true,
                  updatedAt: true,
                },
              });
              if (!doc) return { error: "Document not found or unauthorized." };
              // Cap content length so we don't blow the context window on huge docs.
              const MAX_CONTENT = 15000;
              const content =
                doc.content.length > MAX_CONTENT
                  ? `${doc.content.slice(0, MAX_CONTENT)}\n\n[... truncated ${
                      doc.content.length - MAX_CONTENT
                    } more chars ...]`
                  : doc.content;
              return {
                document: {
                  ...doc,
                  content,
                  updatedAt: doc.updatedAt.toISOString(),
                  url: `/docs/view/${doc.id}`,
                },
              };
            },
          }),

          // ── Recordings / Transcripts ─────────────────────────────────────
          getRecording: tool({
            description:
              "Fetch the full details of a specific recording / meeting transcript: title, summary, key points, principal speaker, full transcript text, recorded date, plus the linked tasks. Use this when the user asks 'what did we discuss in the meeting' or 'show me the tasks from that recording'.",
            inputSchema: z.object({
              recordingId: z.string().describe("The transcript / recording ID."),
            }),
            execute: async ({ recordingId }) => {
              const t = await prisma.transcript.findFirst({
                where: { id: recordingId, workspaceId },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  transcript: true,
                  sentiment: true,
                  durationSeconds: true,
                  recordedAt: true,
                  metadata: true,
                  projectId: true,
                },
              });
              if (!t) return { error: "Recording not found or unauthorized." };

              // Linked tasks
              const links = await prisma.taskTranscriptLink.findMany({
                where: { transcriptId: t.id },
                select: {
                  task: {
                    select: {
                      id: true,
                      title: true,
                      status: true,
                      priority: true,
                      projectId: true,
                    },
                  },
                },
              });

              const meta =
                (t.metadata as { keyPoints?: string[]; principalSpeaker?: string } | null) ?? null;

              const MAX_TRANSCRIPT = 12000;
              const transcript = t.transcript ?? "";
              const truncated =
                transcript.length > MAX_TRANSCRIPT
                  ? `${transcript.slice(0, MAX_TRANSCRIPT)}\n\n[... truncated ${
                      transcript.length - MAX_TRANSCRIPT
                    } more chars ...]`
                  : transcript;

              return {
                recording: {
                  id: t.id,
                  title: t.title,
                  summary: t.summary,
                  transcript: truncated,
                  sentiment: t.sentiment,
                  durationSeconds: t.durationSeconds,
                  recordedAt: t.recordedAt?.toISOString() ?? null,
                  keyPoints: meta?.keyPoints ?? [],
                  principalSpeaker: meta?.principalSpeaker ?? null,
                  url: t.projectId
                    ? `/projects/${t.projectId}/info/transcripts/${t.id}`
                    : `/recordings/${t.id}`,
                  tasks: links.map((l) => ({
                    ...l.task,
                    url: `/projects/${l.task.projectId}?task=${l.task.id}`,
                  })),
                },
              };
            },
          }),

          // ── Cross-cutting search ─────────────────────────────────────────
          searchTranscripts: tool({
            description:
              "Free-text search across the user's transcripts and summaries. Returns up to 10 matches with title and a snippet. When a project is focused, only that project's transcripts are searched. Use this when the user asks 'find the meeting where we discussed X' or 'when did Y come up?'.",
            inputSchema: z.object({
              query: z.string().describe("Keywords or phrase to search for."),
            }),
            execute: async ({ query }) => {
              const transcripts = await prisma.transcript.findMany({
                where: {
                  workspaceId,
                  userId,
                  ...(activeProject ? { projectId: activeProject.id } : {}),
                  OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { summary: { contains: query, mode: "insensitive" } },
                    { transcript: { contains: query, mode: "insensitive" } },
                  ],
                },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  recordedAt: true,
                  projectId: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
              });
              return {
                matches: transcripts.map((t) => ({
                  id: t.id,
                  title: t.title,
                  summarySnippet: (t.summary ?? "").slice(0, 280),
                  recordedAt: t.recordedAt?.toISOString() ?? null,
                  url: t.projectId
                    ? `/projects/${t.projectId}/info/transcripts/${t.id}`
                    : `/recordings/${t.id}`,
                })),
              };
            },
          }),

          // ── High-value meeting analytics ─────────────────────────────────
          getRecentMeetingsContext: tool({
            description:
              "Catch-me-up tool. Returns the last N recordings with TITLE + SUMMARY + KEY POINTS so you can synthesize themes, draft a digest, or answer 'what's been going on?'. Always prefer this over listRecordings when the user wants context, not a list. Auto-scoped to the focused project.",
            inputSchema: z.object({
              limit: z
                .number()
                .min(1)
                .max(20)
                .optional()
                .describe("How many recent recordings to include. Default 5."),
            }),
            execute: async ({ limit }) => {
              const transcripts = await prisma.transcript.findMany({
                where: {
                  userId,
                  workspaceId,
                  ...(activeProject ? { projectId: activeProject.id } : {}),
                },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  sentiment: true,
                  recordedAt: true,
                  durationSeconds: true,
                  metadata: true,
                  projectId: true,
                },
                orderBy: { recordedAt: "desc" },
                take: limit ?? 5,
              });
              return {
                recordings: transcripts.map((t) => {
                  const meta = (t.metadata ?? null) as {
                    keyPoints?: string[];
                    principalSpeaker?: string;
                  } | null;
                  return {
                    id: t.id,
                    title: t.title,
                    summary: t.summary,
                    keyPoints: meta?.keyPoints ?? [],
                    sentiment: t.sentiment,
                    principalSpeaker: meta?.principalSpeaker ?? null,
                    durationSeconds: t.durationSeconds,
                    recordedAt: t.recordedAt?.toISOString() ?? null,
                    url: t.projectId
                      ? `/projects/${t.projectId}/info/transcripts/${t.id}`
                      : `/recordings/${t.id}`,
                  };
                }),
              };
            },
          }),

          getMeetingStats: tool({
            description:
              "Aggregate stats about meetings in a date range: count, total duration, average duration, and sentiment breakdown. Use for 'how many meetings did we have this week', 'how much time in meetings', 'how positive have meetings been'.",
            inputSchema: z.object({
              dateFrom: z.string().optional().describe("ISO date — inclusive lower bound."),
              dateTo: z.string().optional().describe("ISO date — inclusive upper bound."),
            }),
            execute: async ({ dateFrom, dateTo }) => {
              const range = resolveAssistantDateRange(dateFrom, dateTo);

              const transcripts = await prisma.transcript.findMany({
                where: {
                  userId,
                  workspaceId,
                  ...(activeProject ? { projectId: activeProject.id } : {}),
                  ...(range.hasFilter ? { recordedAt: { gte: range.gte, lte: range.lte } } : {}),
                },
                select: { durationSeconds: true, sentiment: true },
              });

              const totalDuration = transcripts.reduce(
                (acc, t) => acc + (t.durationSeconds ?? 0),
                0,
              );
              const sentimentBreakdown: Record<string, number> = {};
              for (const t of transcripts) {
                const key = t.sentiment ?? "UNKNOWN";
                sentimentBreakdown[key] = (sentimentBreakdown[key] ?? 0) + 1;
              }

              return {
                count: transcripts.length,
                totalDurationSeconds: totalDuration,
                totalDurationMinutes: Math.round(totalDuration / 60),
                averageDurationMinutes:
                  transcripts.length > 0 ? Math.round(totalDuration / transcripts.length / 60) : 0,
                sentimentBreakdown,
                dateRange: range.normalized,
                scope: activeProject ? `project: ${activeProject.title}` : "workspace",
              };
            },
          }),

          getKeyPointsAcrossMeetings: tool({
            description:
              "Pull AI-extracted key points and pain points across multiple recordings. Perfect for 'what are the main themes from last week', 'common concerns this month', or building a weekly digest. Returns one entry per recording with its key points list.",
            inputSchema: z.object({
              dateFrom: z.string().optional(),
              dateTo: z.string().optional(),
              limit: z.number().min(1).max(30).optional().describe("Default 10."),
            }),
            execute: async ({ dateFrom, dateTo, limit }) => {
              const range = resolveAssistantDateRange(dateFrom, dateTo);

              const transcripts = await prisma.transcript.findMany({
                where: {
                  userId,
                  workspaceId,
                  ...(activeProject ? { projectId: activeProject.id } : {}),
                  ...(range.hasFilter ? { recordedAt: { gte: range.gte, lte: range.lte } } : {}),
                },
                select: {
                  id: true,
                  title: true,
                  recordedAt: true,
                  metadata: true,
                  projectId: true,
                },
                orderBy: { recordedAt: "desc" },
                take: limit ?? 10,
              });

              return {
                meetings: transcripts.map((t) => {
                  const meta = (t.metadata ?? null) as { keyPoints?: string[] } | null;
                  return {
                    id: t.id,
                    title: t.title,
                    recordedAt: t.recordedAt?.toISOString() ?? null,
                    keyPoints: meta?.keyPoints ?? [],
                    url: t.projectId
                      ? `/projects/${t.projectId}/info/transcripts/${t.id}`
                      : `/recordings/${t.id}`,
                  };
                }),
              };
            },
          }),

          listMeetingActionItems: tool({
            description:
              "List tasks/action items that were auto-extracted from meetings. Supports filtering by status, date range (of when the recording happened), and limits. Perfect for 'what's open from my meetings', 'pending action items', or 'follow-ups this week'.",
            inputSchema: z.object({
              status: z
                .enum(["BACKLOG", "IN_PROGRESS", "COMPLETED", "BLOCKED", "ARCHIVED"])
                .optional()
                .describe("Filter by task status."),
              dateFrom: z
                .string()
                .optional()
                .describe("Only tasks from recordings on or after this ISO date."),
              dateTo: z.string().optional(),
              limit: z.number().min(1).max(50).optional().describe("Default 20."),
            }),
            execute: async ({ status, dateFrom, dateTo, limit }) => {
              const range = resolveAssistantDateRange(dateFrom, dateTo);

              const links = await prisma.taskTranscriptLink.findMany({
                where: {
                  transcript: {
                    userId,
                    workspaceId,
                    ...(activeProject ? { projectId: activeProject.id } : {}),
                    ...(range.hasFilter ? { recordedAt: { gte: range.gte, lte: range.lte } } : {}),
                  },
                  ...(status ? { task: { status } } : {}),
                },
                include: {
                  task: {
                    select: {
                      id: true,
                      title: true,
                      status: true,
                      priority: true,
                      dueDate: true,
                      projectId: true,
                    },
                  },
                  transcript: { select: { id: true, title: true, recordedAt: true } },
                },
                take: limit ?? 20,
                orderBy: { transcript: { recordedAt: "desc" } },
              });

              return {
                count: links.length,
                actionItems: links.map((l) => ({
                  task: {
                    ...l.task,
                    dueDate: l.task.dueDate?.toISOString() ?? null,
                    url: `/projects/${l.task.projectId}?task=${l.task.id}`,
                  },
                  sourceRecording: {
                    id: l.transcript.id,
                    title: l.transcript.title,
                    recordedAt: l.transcript.recordedAt?.toISOString() ?? null,
                  },
                })),
              };
            },
          }),

          compareMeetings: tool({
            description:
              "Fetch summaries and key points of 2 to 5 recordings side-by-side, so you can compare or detect changes over time. Use for 'compare the last two product reviews', 'did we resolve X between meetings A and B', or 'show me how this has evolved'.",
            inputSchema: z.object({
              recordingIds: z
                .array(z.string())
                .min(2)
                .max(5)
                .describe("Between 2 and 5 transcript IDs to compare."),
            }),
            execute: async ({ recordingIds }) => {
              const transcripts = await prisma.transcript.findMany({
                where: {
                  id: { in: recordingIds },
                  workspaceId,
                  userId,
                },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  sentiment: true,
                  recordedAt: true,
                  durationSeconds: true,
                  metadata: true,
                  projectId: true,
                },
              });
              return {
                meetings: transcripts.map((t) => {
                  const meta = (t.metadata ?? null) as {
                    keyPoints?: string[];
                    principalSpeaker?: string;
                  } | null;
                  return {
                    id: t.id,
                    title: t.title,
                    summary: t.summary,
                    keyPoints: meta?.keyPoints ?? [],
                    sentiment: t.sentiment,
                    principalSpeaker: meta?.principalSpeaker ?? null,
                    durationSeconds: t.durationSeconds,
                    recordedAt: t.recordedAt?.toISOString() ?? null,
                    url: t.projectId
                      ? `/projects/${t.projectId}/info/transcripts/${t.id}`
                      : `/recordings/${t.id}`,
                  };
                }),
              };
            },
          }),
          // ─── Web: search + read a page (read-only, no confirmation) ─────────
          searchWeb: tool({
            description:
              "Search the open web for current information the user's meetings/documents don't " +
              "contain (competitors, news, facts). Returns a short ranked list of results. " +
              "Cite the sources you use.",
            inputSchema: z.object({
              query: z.string().describe("The search query."),
            }),
            execute: async ({ query }) => ({ results: await searchWeb(query) }),
          }),
          fetchWebPage: tool({
            description:
              "Fetch a web page (https URL) and return its readable text so you can answer about " +
              "it. Use when the user shares a link or asks about a specific page. Read-only.",
            inputSchema: z.object({
              url: z.string().describe("The https URL to read."),
            }),
            execute: async ({ url }) => {
              const page = await fetchWebPage(url);
              return page ?? { error: "Could not read that page (unreachable or not http/https)." };
            },
          }),

          // ─── Internal task edits (reversible, no confirmation) ──────────────
          updateTaskStatus: tool({
            description:
              "Change a task's status. Statuses: BACKLOG, IN_PROGRESS, BLOCKED, COMPLETED, " +
              "ARCHIVED. Reversible. Use listTasks first to get the task id if needed.",
            inputSchema: z.object({
              taskId: z.string(),
              status: z
                .enum(["BACKLOG", "IN_PROGRESS", "BLOCKED", "COMPLETED", "ARCHIVED"])
                .describe("The new status."),
            }),
            execute: async ({ taskId, status }) => updateTaskStatus(workspaceId, taskId, status),
          }),
          assignTask: tool({
            description:
              "Assign a task to a workspace member by their email, or clear the assignee with an " +
              "empty email. Reversible. Only members of this workspace can be assigned.",
            inputSchema: z.object({
              taskId: z.string(),
              email: z
                .string()
                .describe("Member email to assign to. Empty string clears the assignee."),
            }),
            execute: async ({ taskId, email }) => assignTask(workspaceId, taskId, email || null),
          }),

          // ─── External action: sync tasks to a task tool ─────────────────────
          // Provider-agnostic (Linear/Jira/Asana/Trello/Notion). Two tools by
          // design: `previewTaskSync` is read-only; `requestTaskSync` is a no-op
          // that renders a confirmation card. The write happens server-side only
          // when the user clicks Confirm, guarded regardless of the model.
          previewTaskSync: tool({
            description:
              "Read-only preview of syncing tasks to a connected task tool " +
              `(one of: ${SYNC_PROVIDERS.join(", ")}). Shows which tasks would be created, which ` +
              "are already synced, and the target. Does NOT create anything. Call this FIRST, " +
              "show the user the list, and ask them to confirm. If the provider isn't connected, " +
              "tell them to connect it in Integrations.",
            inputSchema: z.object({
              provider: z
                .enum(SYNC_PROVIDERS as [SyncProvider, ...SyncProvider[]])
                .describe("Which task tool to sync to."),
              projectId: z
                .string()
                .optional()
                .describe("Preview all tasks in this project. Omit if using taskIds."),
              taskIds: z
                .array(z.string())
                .optional()
                .describe("Specific task ids to preview. Omit to use projectId."),
            }),
            execute: async ({ provider, projectId, taskIds }) =>
              previewTaskSync(workspaceId, provider, {
                projectId: activeProject?.id ?? projectId,
                taskIds,
              }),
          }),
          requestTaskSync: tool({
            description:
              "Request confirmation to sync these tasks to a connected task tool. Call this after " +
              "previewTaskSync when the user wants to proceed. It does NOT create anything — it " +
              "renders a confirmation card with Confirm/Cancel; items are created only when the " +
              "user clicks Confirm. After calling this, tell the user to confirm in the card above.",
            inputSchema: z.object({
              provider: z
                .enum(SYNC_PROVIDERS as [SyncProvider, ...SyncProvider[]])
                .describe("Which task tool to sync to."),
              taskIds: z.array(z.string()).describe("Task ids to sync, from the preview."),
            }),
            // NO-OP that returns a confirmation request. The real, guarded write
            // happens server-side only on the Confirm click
            // (POST /api/chat/assistant/actions/task-sync).
            execute: async ({ provider, taskIds }) => {
              const preview = await previewTaskSync(workspaceId, provider, { taskIds });
              return {
                action: "task-sync",
                needsConfirmation: true,
                provider,
                providerLabel: preview.providerLabel,
                connected: preview.connected,
                targetName: preview.targetName,
                taskIds,
                tasks: preview.tasks.filter((t) => !t.alreadySynced),
              };
            },
          }),
        },
        onFinish: async ({ text, finishReason, usage }) => {
          console.log("[AssistantService] Stream finished!", { finishReason, usage });
          console.log("[AssistantService] Output text generated:", text);
          if (usage) {
            aiUsageService
              .logUsage({
                userId,
                workspaceId,
                feature: "CHAT",
                provider: "openrouter",
                model: selectedModel,
                inputTokens: usage.inputTokens || 0,
                outputTokens: usage.outputTokens || 0,
              })
              .catch(() => {});
          }
        },
        onError: (error) => {
          console.error("[AssistantService] Stream error occurred:", error);
        },
      });

      return result;
    } catch (error) {
      console.error("[AssistantService] Error in handleAssistantStream:", error);
      throw error;
    }
  }
}

export const assistantChatService = new AssistantChatService();
