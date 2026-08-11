import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The weekly digest is the only thing that reaches a user who isn't looking,
 * so its two silent failure modes matter more than its happy path:
 *   - a wrong week range (sends last week's meetings twice, or none)
 *   - emailing someone who had no meetings (that's how a digest becomes spam
 *     and gets muted forever)
 */

const { db } = vi.hoisted(() => ({
  db: {
    transcript: { findMany: vi.fn() },
    task: { findMany: vi.fn() },
    workspaceMember: { findMany: vi.fn() },
  },
}));

const { sendWeeklyDigestEmail } = vi.hoisted(() => ({
  sendWeeklyDigestEmail: vi.fn(),
}));

vi.mock("../../prisma/prismaClient", () => ({ default: db }));
vi.mock("../emailService", () => ({ sendWeeklyDigestEmail }));

import { lastWeekRange, buildWeeklyDigest, runWeeklyDigest } from "../weeklyDigestService";

beforeEach(() => {
  vi.clearAllMocks();
  db.task.findMany.mockResolvedValue([]);
});

describe("lastWeekRange", () => {
  it("returns the Monday-to-Sunday week that just ended, from a Monday", () => {
    // Monday 11 Aug 2026, 08:00 — the hour the cron fires.
    const { weekStart, weekEnd } = lastWeekRange(new Date("2026-08-11T08:00:00"));
    expect(weekStart.getFullYear()).toBe(2026);
    expect(weekStart.getMonth()).toBe(7); // August
    expect(weekStart.getDate()).toBe(3); // Mon 3 Aug
    expect(weekStart.getDay()).toBe(1); // Monday
    expect(weekEnd.getDate()).toBe(9); // Sun 9 Aug
    expect(weekEnd.getDay()).toBe(0); // Sunday
  });

  it("still returns the previous full week when run mid-week", () => {
    // Thursday 13 Aug 2026 — a manual re-run must not shift the window.
    const { weekStart, weekEnd } = lastWeekRange(new Date("2026-08-13T10:00:00"));
    expect(weekStart.getDate()).toBe(3);
    expect(weekEnd.getDate()).toBe(9);
  });

  it("handles a Sunday without rolling into the wrong week", () => {
    // Sunday 9 Aug 2026 belongs to the 3-9 Aug week, so the PREVIOUS one is 27 Jul - 2 Aug.
    const { weekStart, weekEnd } = lastWeekRange(new Date("2026-08-09T12:00:00"));
    expect(weekStart.getMonth()).toBe(6); // July
    expect(weekStart.getDate()).toBe(27);
    expect(weekEnd.getDate()).toBe(2); // Sun 2 Aug
  });

  it("produces a window of exactly 7 days", () => {
    const { weekStart, weekEnd } = lastWeekRange(new Date("2026-08-11T08:00:00"));
    const days = (weekEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7);
  });
});

describe("buildWeeklyDigest", () => {
  it("returns null when the user had no meetings — no empty digests", async () => {
    db.transcript.findMany.mockResolvedValue([]);
    const digest = await buildWeeklyDigest("u1", "ws1", new Date("2026-08-11T08:00:00"));
    expect(digest).toBeNull();
    // Must not even bother querying tasks for a user with no meetings.
    expect(db.task.findMany).not.toHaveBeenCalled();
  });

  it("summarises meetings and totals the minutes", async () => {
    db.transcript.findMany.mockResolvedValue([
      {
        id: "t1",
        title: "Kickoff",
        recordedAt: new Date("2026-08-04T10:00:00"),
        durationSeconds: 1800,
        metadata: { keyPoints: ["a", "b", "c", "d"] },
        project: { title: "Uriach" },
      },
      {
        id: "t2",
        title: null,
        recordedAt: new Date("2026-08-06T10:00:00"),
        durationSeconds: 600,
        metadata: null,
        project: null,
      },
    ]);

    const digest = await buildWeeklyDigest("u1", "ws1", new Date("2026-08-11T08:00:00"));

    expect(digest).not.toBeNull();
    expect(digest!.meetings).toHaveLength(2);
    expect(digest!.totalMeetingMinutes).toBe(40); // (1800 + 600) / 60
    expect(digest!.meetings[0].projectTitle).toBe("Uriach");
    // Key points are capped at 3 so the email stays scannable.
    expect(digest!.meetings[0].keyPoints).toHaveLength(3);
    // A missing title must not render as "null".
    expect(digest!.meetings[1].title).toBe("Untitled meeting");
    expect(digest!.meetings[1].keyPoints).toEqual([]);
  });

  it("flags overdue tasks against the run date", async () => {
    db.transcript.findMany.mockResolvedValue([
      {
        id: "t1",
        title: "Kickoff",
        recordedAt: new Date("2026-08-04T10:00:00"),
        durationSeconds: 600,
        metadata: null,
        project: null,
      },
    ]);
    db.task.findMany.mockResolvedValue([
      { id: "k1", title: "Late one", dueDate: new Date("2026-08-05T00:00:00"), project: null },
      { id: "k2", title: "Future one", dueDate: new Date("2026-09-01T00:00:00"), project: null },
      { id: "k3", title: "No date", dueDate: null, project: null },
    ]);

    const digest = await buildWeeklyDigest("u1", "ws1", new Date("2026-08-11T08:00:00"));

    expect(digest!.overdueCount).toBe(1);
    expect(digest!.openTasks.find((t) => t.id === "k1")!.isOverdue).toBe(true);
    expect(digest!.openTasks.find((t) => t.id === "k2")!.isOverdue).toBe(false);
    expect(digest!.openTasks.find((t) => t.id === "k3")!.isOverdue).toBe(false);
  });
});

describe("runWeeklyDigest", () => {
  const member = (id: string, email: string) => ({
    workspaceId: "ws1",
    user: { id, email, name: "Test User" },
    workspace: { name: "BlueberryBytes" },
  });

  it("skips users with no meetings and emails the rest", async () => {
    db.workspaceMember.findMany.mockResolvedValue([
      member("u1", "a@x.com"),
      member("u2", "b@x.com"),
    ]);
    db.transcript.findMany
      .mockResolvedValueOnce([]) // u1 — nothing last week
      .mockResolvedValueOnce([
        {
          id: "t1",
          title: "Kickoff",
          recordedAt: new Date("2026-08-04T10:00:00"),
          durationSeconds: 600,
          metadata: null,
          project: null,
        },
      ]);

    const result = await runWeeklyDigest(new Date("2026-08-11T08:00:00"));

    expect(result).toMatchObject({ considered: 2, sent: 1, skipped: 1, failed: 0 });
    expect(sendWeeklyDigestEmail).toHaveBeenCalledTimes(1);
    expect(sendWeeklyDigestEmail).toHaveBeenCalledWith("b@x.com", expect.anything());
  });

  it("one broken mailbox does not stop the rest of the batch", async () => {
    db.workspaceMember.findMany.mockResolvedValue([
      member("u1", "boom@x.com"),
      member("u2", "ok@x.com"),
    ]);
    db.transcript.findMany.mockResolvedValue([
      {
        id: "t1",
        title: "Kickoff",
        recordedAt: new Date("2026-08-04T10:00:00"),
        durationSeconds: 600,
        metadata: null,
        project: null,
      },
    ]);
    sendWeeklyDigestEmail
      .mockRejectedValueOnce(new Error("resend 422"))
      .mockResolvedValueOnce(undefined);

    const result = await runWeeklyDigest(new Date("2026-08-11T08:00:00"));

    expect(result).toMatchObject({ considered: 2, sent: 1, failed: 1 });
  });

  it("only considers users who opted in and are not PENDING", async () => {
    db.workspaceMember.findMany.mockResolvedValue([]);
    await runWeeklyDigest(new Date("2026-08-11T08:00:00"));

    const where = db.workspaceMember.findMany.mock.calls[0][0].where;
    expect(where.user.weeklyDigestEmail).toBe(true);
    expect(where.user.role).toEqual({ not: "PENDING" });
  });
});
