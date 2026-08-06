import {
  PrismaClient,
  IntegrationProvider,
  IntegrationStatus,
  Prisma,
  TaskStatus,
} from "@prisma/client";
import { linearIntegrationService } from "./linearIntegrationService";
import { jiraIntegrationService } from "./jiraIntegrationService";
import { asanaIntegrationService } from "./asanaIntegrationService";
import { trelloIntegrationService } from "./trelloIntegrationService";
import { notionIntegrationService } from "./notionIntegrationService";
import {
  LinearIntegrationMetadata,
  JiraIntegrationMetadata,
  AsanaIntegrationMetadata,
  TrelloIntegrationMetadata,
  NotionIntegrationMetadata,
} from "./integrationMetadataTypes";
import { TaskMetadata } from "./taskMetadataTypes";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/**
 * External, side-effectful actions the in-app assistant can take: syncing tasks
 * to the workspace's connected task tools (Linear, Jira, Asana, Trello, Notion).
 *
 * Every provider follows the SAME two-step contract the system prompt enforces:
 *   1. previewTaskSync — read-only. Shows what WOULD be created.
 *   2. requestTaskSync — a no-op that renders a confirmation card; the WRITE
 *      happens server-side ONLY when the user clicks Confirm (the /task-sync
 *      endpoint calls `createIssuesFromTasks`).
 *
 * Providers are declared as ADAPTERS in one registry, so adding a tool is a few
 * lines, not a copy of the whole flow. The safety guards live here, shared by
 * every provider: workspace re-check, dedup, batch cap, audit log. A wrong
 * ticket is cheap to delete — this is the low-risk external-action surface.
 */

export type SyncProvider = "LINEAR" | "JIRA" | "ASANA" | "TRELLO" | "NOTION";

/** Hard cap per call so a misfire can't flood a board. */
const MAX_ISSUES_PER_CALL = 10;

/** Dedup marker keys on Task.metadata, per provider. */
type MetaKey = "linear" | "jira" | "asana" | "trello" | "notion";

interface ResolvedTarget {
  /** Human name for the confirmation card (falls back to the id). */
  name: string;
  /** Provider-specific target ids passed to `create`. */
  ids: Record<string, string>;
}

interface CreateOutcome {
  url: string;
  identifier: string;
  /** The dedup marker written to Task.metadata[metaKey]. */
  marker: unknown;
}

interface ProviderAdapter {
  provider: IntegrationProvider;
  label: string;
  metaKey: MetaKey;
  /** Resolves the configured target, or null when not connected / unconfigured. */
  resolveTarget(workspaceId: string): Promise<ResolvedTarget | null>;
  create(workspaceId: string, taskId: string, ids: Record<string, string>): Promise<CreateOutcome>;
}

/** Reads the workspace integration; null unless present AND connected. */
const connectedMetadata = async <T>(
  workspaceId: string,
  provider: IntegrationProvider,
): Promise<T | null> => {
  const integration = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider } },
  });
  if (!integration || integration.status !== IntegrationStatus.CONNECTED) return null;
  return (integration.metadata as T | null) ?? ({} as T);
};

/** Best-effort friendly name; falls back to the id if the lookup fails. */
const safeName = async (id: string, lookup: () => Promise<string | undefined>): Promise<string> => {
  try {
    return (await lookup()) ?? id;
  } catch {
    return id;
  }
};

const ADAPTERS: Record<SyncProvider, ProviderAdapter> = {
  LINEAR: {
    provider: IntegrationProvider.LINEAR,
    label: "Linear",
    metaKey: "linear",
    async resolveTarget(workspaceId) {
      const meta = await connectedMetadata<LinearIntegrationMetadata>(
        workspaceId,
        IntegrationProvider.LINEAR,
      );
      const teamId = meta?.defaultTeamId;
      if (!teamId) return null;
      const name = await safeName(teamId, async () => {
        const teams = await linearIntegrationService.listLinearTeams(workspaceId);
        return teams.find((t) => t.id === teamId)?.name;
      });
      return { name, ids: { teamId } };
    },
    async create(workspaceId, taskId, ids) {
      const r = await linearIntegrationService.createLinearIssue(workspaceId, taskId, ids.teamId);
      return {
        url: r.url,
        identifier: r.identifier,
        marker: { issueId: r.issueId, identifier: r.identifier, url: r.url },
      };
    },
  },
  JIRA: {
    provider: IntegrationProvider.JIRA,
    label: "Jira",
    metaKey: "jira",
    async resolveTarget(workspaceId) {
      const meta = await connectedMetadata<JiraIntegrationMetadata>(
        workspaceId,
        IntegrationProvider.JIRA,
      );
      const projectId = meta?.defaultProjectId;
      if (!projectId) return null;
      const name = await safeName(projectId, async () => {
        const projects = await jiraIntegrationService.listJiraProjects(workspaceId);
        return projects.find((p) => p.id === projectId)?.name;
      });
      return { name, ids: { projectId } };
    },
    async create(workspaceId, taskId, ids) {
      const r = await jiraIntegrationService.createJiraIssue(workspaceId, taskId, ids.projectId);
      return {
        url: r.url,
        identifier: r.issueKey,
        marker: { issueId: r.issueId, issueKey: r.issueKey, url: r.url },
      };
    },
  },
  ASANA: {
    provider: IntegrationProvider.ASANA,
    label: "Asana",
    metaKey: "asana",
    async resolveTarget(workspaceId) {
      const meta = await connectedMetadata<AsanaIntegrationMetadata>(
        workspaceId,
        IntegrationProvider.ASANA,
      );
      const projectGid = meta?.defaultProjectGid;
      if (!projectGid) return null;
      const name = await safeName(projectGid, async () => {
        const projects = await asanaIntegrationService.listAsanaProjects(workspaceId);
        return projects.find((p) => p.gid === projectGid)?.name;
      });
      return { name, ids: { projectGid } };
    },
    async create(workspaceId, taskId, ids) {
      const r = await asanaIntegrationService.createAsanaTask(workspaceId, taskId, ids.projectGid);
      return { url: r.url, identifier: r.taskGid, marker: { taskGid: r.taskGid, url: r.url } };
    },
  },
  TRELLO: {
    provider: IntegrationProvider.TRELLO,
    label: "Trello",
    metaKey: "trello",
    async resolveTarget(workspaceId) {
      const meta = await connectedMetadata<TrelloIntegrationMetadata>(
        workspaceId,
        IntegrationProvider.TRELLO,
      );
      // Trello needs BOTH a board and a list.
      if (!meta?.defaultBoardId || !meta?.defaultListId) return null;
      const name = await safeName(meta.defaultBoardId, async () => {
        const boards = await trelloIntegrationService.listTrelloBoards(workspaceId);
        return boards.find((b) => b.id === meta.defaultBoardId)?.name;
      });
      return { name, ids: { boardId: meta.defaultBoardId, listId: meta.defaultListId } };
    },
    async create(workspaceId, taskId, ids) {
      const r = await trelloIntegrationService.createTrelloCard(
        workspaceId,
        taskId,
        ids.boardId,
        ids.listId,
      );
      return {
        url: r.url,
        identifier: r.shortLink,
        marker: { cardId: r.cardId, shortLink: r.shortLink, url: r.url },
      };
    },
  },
  NOTION: {
    provider: IntegrationProvider.NOTION,
    label: "Notion",
    metaKey: "notion",
    async resolveTarget(workspaceId) {
      const meta = await connectedMetadata<NotionIntegrationMetadata>(
        workspaceId,
        IntegrationProvider.NOTION,
      );
      // Notion can create without a default database, so connected is enough.
      if (meta === null) return null;
      const databaseId = meta.defaultDatabaseId ?? "";
      return { name: databaseId ? "Notion database" : "Notion", ids: { databaseId } };
    },
    async create(workspaceId, taskId, ids) {
      const r = await notionIntegrationService.createNotionPage(
        workspaceId,
        taskId,
        ids.databaseId || undefined,
      );
      return { url: r.url, identifier: r.pageId, marker: { pageId: r.pageId, url: r.url } };
    },
  },
};

/** All providers, for tool enums / UI. */
export const SYNC_PROVIDERS = Object.keys(ADAPTERS) as SyncProvider[];

const isSynced = (task: { metadata: Prisma.JsonValue }, metaKey: MetaKey): boolean => {
  const meta = task.metadata as unknown as TaskMetadata;
  const entry = meta?.[metaKey] as
    | { issueId?: string; taskGid?: string; cardId?: string; pageId?: string }
    | undefined;
  return Boolean(entry?.issueId || entry?.taskGid || entry?.cardId || entry?.pageId);
};

export interface SyncPreviewTask {
  id: string;
  title: string;
  alreadySynced: boolean;
}

export interface SyncPreview {
  provider: SyncProvider;
  providerLabel: string;
  connected: boolean;
  targetName?: string;
  tasks: SyncPreviewTask[];
}

/** Read-only: what a sync WOULD do for a given provider. Never writes. */
export const previewTaskSync = async (
  workspaceId: string,
  provider: SyncProvider,
  opts: { taskIds?: string[]; projectId?: string },
): Promise<SyncPreview> => {
  const adapter = ADAPTERS[provider];
  const target = await adapter.resolveTarget(workspaceId);
  if (!target) {
    return { provider, providerLabel: adapter.label, connected: false, tasks: [] };
  }

  const where: Prisma.TaskWhereInput = { project: { workspaceId } };
  if (opts.taskIds?.length) where.id = { in: opts.taskIds };
  else if (opts.projectId) where.projectId = opts.projectId;

  const tasks = await prisma.task.findMany({
    where,
    select: { id: true, title: true, metadata: true },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });

  return {
    provider,
    providerLabel: adapter.label,
    connected: true,
    targetName: target.name,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      alreadySynced: isSynced(t, adapter.metaKey),
    })),
  };
};

export interface SyncCreateResult {
  taskId: string;
  title: string;
  status: "created" | "skipped_already_synced" | "not_found" | "error";
  url?: string;
  identifier?: string;
}

/**
 * The WRITE. Creates one issue/card/page per task for the given provider,
 * guarded server-side: every task is re-checked against the workspace,
 * already-synced tasks are skipped, the batch is capped, and each creation is
 * logged with who triggered it.
 */
export const createIssuesFromTasks = async (
  workspaceId: string,
  userId: string,
  provider: SyncProvider,
  taskIds: string[],
): Promise<{ provider: SyncProvider; connected: boolean; results: SyncCreateResult[] }> => {
  const adapter = ADAPTERS[provider];
  const target = await adapter.resolveTarget(workspaceId);
  if (!target) return { provider, connected: false, results: [] };

  const capped = taskIds.slice(0, MAX_ISSUES_PER_CALL);
  const results: SyncCreateResult[] = [];

  for (const taskId of capped) {
    // Re-fetch inside the workspace scope — never trust the id the model passed.
    const task = await prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId } },
      select: { id: true, title: true, metadata: true },
    });

    if (!task) {
      results.push({ taskId, title: "(unknown)", status: "not_found" });
      continue;
    }
    if (isSynced(task, adapter.metaKey)) {
      results.push({ taskId, title: task.title, status: "skipped_already_synced" });
      continue;
    }

    try {
      const outcome = await adapter.create(workspaceId, taskId, target.ids);

      const metadata = ((task.metadata as unknown as TaskMetadata) || {}) as TaskMetadata;
      (metadata as Record<string, unknown>)[adapter.metaKey] = outcome.marker;
      await prisma.task.update({
        where: { id: taskId },
        data: { metadata: metadata as unknown as Prisma.JsonObject },
      });

      logger.info(
        `[assistant-action] user ${userId} synced task ${taskId} to ${adapter.label} (${outcome.identifier})`,
      );
      results.push({
        taskId,
        title: task.title,
        status: "created",
        url: outcome.url,
        identifier: outcome.identifier,
      });
    } catch (err) {
      logger.error(`[assistant-action] ${adapter.label} create failed for task ${taskId}`, err);
      results.push({ taskId, title: task.title, status: "error" });
    }
  }

  return { provider, connected: true, results };
};

// ─── Internal, reversible task edits ────────────────────────────────────────
// These change Plan AI's own data (status, assignee), so they're low-risk and
// easily undone — no confirmation card needed. Both are workspace-scoped: the
// task is re-checked so the model can't touch another workspace's data.

const VALID_STATUS = Object.values(TaskStatus) as string[];

/** Updates a task's status (BACKLOG/IN_PROGRESS/BLOCKED/COMPLETED/ARCHIVED). */
export const updateTaskStatus = async (
  workspaceId: string,
  taskId: string,
  status: string,
): Promise<{ ok: boolean; reason?: string; title?: string; status?: string }> => {
  if (!VALID_STATUS.includes(status)) {
    return { ok: false, reason: `Unknown status. Use one of: ${VALID_STATUS.join(", ")}.` };
  }
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { workspaceId } },
    select: { id: true, title: true },
  });
  if (!task) return { ok: false, reason: "Task not found in this workspace." };

  await prisma.task.update({ where: { id: taskId }, data: { status: status as TaskStatus } });
  return { ok: true, title: task.title, status };
};

/**
 * Assigns a task to a workspace member, resolved by email. Reversible.
 * `email: null`/"" clears the assignee.
 */
export const assignTask = async (
  workspaceId: string,
  taskId: string,
  email: string | null,
): Promise<{ ok: boolean; reason?: string; title?: string; assignee?: string }> => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { workspaceId } },
    select: { id: true, title: true },
  });
  if (!task) return { ok: false, reason: "Task not found in this workspace." };

  if (!email) {
    await prisma.task.update({ where: { id: taskId }, data: { assigneeId: null } });
    return { ok: true, title: task.title, assignee: "unassigned" };
  }

  // Resolve to a MEMBER of this workspace only — never assign to an outside user.
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, user: { email: { equals: email, mode: "insensitive" } } },
    select: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!member) return { ok: false, reason: `No workspace member with email ${email}.` };

  await prisma.task.update({ where: { id: taskId }, data: { assigneeId: member.user.id } });
  return { ok: true, title: task.title, assignee: member.user.name || member.user.email };
};
