import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The safety of the assistant's external sync action lives in the server-side
 * guards, not the model's obedience — and now spans every provider through one
 * registry. These tests lock the guards (dedup, workspace scope, cap) and prove
 * a second provider (Jira) flows through the same generalized path as Linear.
 */

const { db, linear, jira } = vi.hoisted(() => ({
  db: {
    workspaceIntegration: { findUnique: vi.fn() },
    task: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
  },
  linear: { listLinearTeams: vi.fn(), createLinearIssue: vi.fn() },
  jira: { listJiraProjects: vi.fn(), createJiraIssue: vi.fn() },
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      return db;
    }
  },
  IntegrationProvider: {
    LINEAR: "LINEAR",
    JIRA: "JIRA",
    ASANA: "ASANA",
    TRELLO: "TRELLO",
    NOTION: "NOTION",
  },
  IntegrationStatus: { CONNECTED: "CONNECTED" },
  TaskStatus: {
    BACKLOG: "BACKLOG",
    IN_PROGRESS: "IN_PROGRESS",
    BLOCKED: "BLOCKED",
    COMPLETED: "COMPLETED",
    ARCHIVED: "ARCHIVED",
  },
  Prisma: {},
}));

vi.mock("../linearIntegrationService", () => ({ linearIntegrationService: linear }));
vi.mock("../jiraIntegrationService", () => ({ jiraIntegrationService: jira }));
vi.mock("../asanaIntegrationService", () => ({ asanaIntegrationService: {} }));
vi.mock("../trelloIntegrationService", () => ({ trelloIntegrationService: {} }));
vi.mock("../notionIntegrationService", () => ({ notionIntegrationService: {} }));

import { previewTaskSync, createIssuesFromTasks } from "../assistantActionsService";

beforeEach(() => {
  vi.clearAllMocks();
  linear.listLinearTeams.mockResolvedValue([{ id: "team-1", name: "Engineering" }]);
  jira.listJiraProjects.mockResolvedValue([{ id: "proj-1", name: "Backend" }]);
  // By default, the Linear integration is connected with a default team.
  db.workspaceIntegration.findUnique.mockResolvedValue({
    status: "CONNECTED",
    metadata: { defaultTeamId: "team-1" },
  });
});

describe("previewTaskSync (Linear)", () => {
  it("reports not connected when there is no default team", async () => {
    db.workspaceIntegration.findUnique.mockResolvedValue({ status: "CONNECTED", metadata: {} });
    const preview = await previewTaskSync("ws-1", "LINEAR", { projectId: "p-1" });
    expect(preview.connected).toBe(false);
    expect(preview.providerLabel).toBe("Linear");
    expect(preview.tasks).toEqual([]);
  });

  it("flags already-synced tasks and never writes", async () => {
    db.task.findMany.mockResolvedValue([
      { id: "t1", title: "Nuevo", metadata: {} },
      { id: "t2", title: "Ya", metadata: { linear: { issueId: "L-9" } } },
    ]);
    const preview = await previewTaskSync("ws-1", "LINEAR", { projectId: "p-1" });
    expect(preview.connected).toBe(true);
    expect(preview.targetName).toBe("Engineering");
    expect(preview.tasks).toEqual([
      { id: "t1", title: "Nuevo", alreadySynced: false },
      { id: "t2", title: "Ya", alreadySynced: true },
    ]);
    expect(db.task.update).not.toHaveBeenCalled();
  });
});

describe("createIssuesFromTasks (Linear)", () => {
  it("creates an issue and writes the dedup marker back", async () => {
    db.task.findFirst.mockResolvedValue({ id: "t1", title: "Nuevo", metadata: {} });
    linear.createLinearIssue.mockResolvedValue({
      issueId: "L-1",
      identifier: "ENG-1",
      url: "https://linear.app/ENG-1",
    });

    const { results } = await createIssuesFromTasks("ws-1", "u-1", "LINEAR", ["t1"]);

    expect(results[0]).toMatchObject({ status: "created", identifier: "ENG-1" });
    expect(db.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            linear: expect.objectContaining({ issueId: "L-1" }),
          }),
        }),
      }),
    );
  });

  it("skips an already-synced task without calling the provider", async () => {
    db.task.findFirst.mockResolvedValue({
      id: "t2",
      title: "Ya",
      metadata: { linear: { issueId: "L-9" } },
    });
    const { results } = await createIssuesFromTasks("ws-1", "u-1", "LINEAR", ["t2"]);
    expect(results[0].status).toBe("skipped_already_synced");
    expect(linear.createLinearIssue).not.toHaveBeenCalled();
  });

  it("refuses a task that is not in the workspace", async () => {
    db.task.findFirst.mockResolvedValue(null);
    const { results } = await createIssuesFromTasks("ws-1", "u-1", "LINEAR", ["foreign"]);
    expect(results[0].status).toBe("not_found");
    expect(linear.createLinearIssue).not.toHaveBeenCalled();
  });

  it("caps the batch so a misfire cannot flood the board", async () => {
    db.task.findFirst.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ id: where.id, title: where.id, metadata: {} }),
    );
    linear.createLinearIssue.mockResolvedValue({ issueId: "L", identifier: "E", url: "u" });

    const fifty = Array.from({ length: 50 }, (_, i) => `t${i}`);
    const { results } = await createIssuesFromTasks("ws-1", "u-1", "LINEAR", fifty);

    expect(results.length).toBe(10);
    expect(linear.createLinearIssue).toHaveBeenCalledTimes(10);
  });

  it("returns not-connected without touching tasks when the provider is off", async () => {
    db.workspaceIntegration.findUnique.mockResolvedValue(null);
    const { connected, results } = await createIssuesFromTasks("ws-1", "u-1", "LINEAR", ["t1"]);
    expect(connected).toBe(false);
    expect(results).toEqual([]);
    expect(db.task.findFirst).not.toHaveBeenCalled();
  });
});

describe("provider registry — a second provider (Jira) flows through the same path", () => {
  beforeEach(() => {
    db.workspaceIntegration.findUnique.mockResolvedValue({
      status: "CONNECTED",
      metadata: { defaultProjectId: "proj-1" },
    });
  });

  it("previews against the Jira project", async () => {
    db.task.findMany.mockResolvedValue([{ id: "t1", title: "Bug", metadata: {} }]);
    const preview = await previewTaskSync("ws-1", "JIRA", { projectId: "p-1" });
    expect(preview.providerLabel).toBe("Jira");
    expect(preview.targetName).toBe("Backend");
    expect(preview.tasks[0].alreadySynced).toBe(false);
  });

  it("creates a Jira issue and writes the jira marker", async () => {
    db.task.findFirst.mockResolvedValue({ id: "t1", title: "Bug", metadata: {} });
    jira.createJiraIssue.mockResolvedValue({ issueId: "J-1", issueKey: "BK-1", url: "u" });

    const { results } = await createIssuesFromTasks("ws-1", "u-1", "JIRA", ["t1"]);

    expect(results[0]).toMatchObject({ status: "created", identifier: "BK-1" });
    expect(db.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            jira: expect.objectContaining({ issueKey: "BK-1" }),
          }),
        }),
      }),
    );
    // A Jira create must not have touched Linear.
    expect(linear.createLinearIssue).not.toHaveBeenCalled();
  });
});

describe("updateTaskStatus", () => {
  it("rejects an unknown status without writing", async () => {
    const { updateTaskStatus } = await import("../assistantActionsService");
    const r = await updateTaskStatus("ws-1", "t1", "DONE");
    expect(r.ok).toBe(false);
    expect(db.task.update).not.toHaveBeenCalled();
  });

  it("refuses a task outside the workspace", async () => {
    db.task.findFirst.mockResolvedValue(null);
    const { updateTaskStatus } = await import("../assistantActionsService");
    const r = await updateTaskStatus("ws-1", "foreign", "COMPLETED");
    expect(r.ok).toBe(false);
    expect(db.task.update).not.toHaveBeenCalled();
  });

  it("updates a valid status on an in-workspace task", async () => {
    db.task.findFirst.mockResolvedValue({ id: "t1", title: "Fix" });
    const { updateTaskStatus } = await import("../assistantActionsService");
    const r = await updateTaskStatus("ws-1", "t1", "COMPLETED");
    expect(r).toMatchObject({ ok: true, status: "COMPLETED", title: "Fix" });
    expect(db.task.update).toHaveBeenCalled();
  });
});

describe("assignTask", () => {
  it("assigns to a workspace member resolved by email", async () => {
    db.task.findFirst.mockResolvedValue({ id: "t1", title: "Fix" });
    db.workspaceMember.findFirst.mockResolvedValue({
      user: { id: "u-9", name: "Marta", email: "marta@x.com" },
    });
    const { assignTask } = await import("../assistantActionsService");
    const r = await assignTask("ws-1", "t1", "marta@x.com");
    expect(r).toMatchObject({ ok: true, assignee: "Marta" });
    expect(db.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { assigneeId: "u-9" } }),
    );
  });

  it("refuses an email that is not a member of the workspace", async () => {
    db.task.findFirst.mockResolvedValue({ id: "t1", title: "Fix" });
    db.workspaceMember.findFirst.mockResolvedValue(null);
    const { assignTask } = await import("../assistantActionsService");
    const r = await assignTask("ws-1", "t1", "stranger@x.com");
    expect(r.ok).toBe(false);
    expect(db.task.update).not.toHaveBeenCalled();
  });

  it("clears the assignee on empty email", async () => {
    db.task.findFirst.mockResolvedValue({ id: "t1", title: "Fix" });
    const { assignTask } = await import("../assistantActionsService");
    const r = await assignTask("ws-1", "t1", null);
    expect(r).toMatchObject({ ok: true, assignee: "unassigned" });
    expect(db.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { assigneeId: null } }),
    );
  });
});
