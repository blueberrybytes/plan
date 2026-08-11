import prisma from "../prisma/prismaClient";
import { logger } from "../utils/logger";
import { sendWeeklyDigestEmail } from "./emailService";
import type { TranscriptMetadata } from "./transcriptMetadataTypes";

/**
 * The Monday-morning weekly digest.
 *
 * Everything else in the product is PULL — someone has to remember to open it.
 * This is the only thing that works while the user isn't looking, which is also
 * why it's the piece that keeps a subscription alive: every Monday it proves
 * the product did something.
 *
 * Deliberately built on data we ALREADY computed during transcript processing
 * (summaries, key points, extracted tasks). No LLM call, so a weekly send to
 * every user costs nothing and can never fail on a provider outage.
 */

export interface WeeklyDigestMeeting {
  id: string;
  title: string;
  projectTitle: string | null;
  recordedAt: Date | null;
  durationSeconds: number | null;
  keyPoints: string[];
}

export interface WeeklyDigestTask {
  id: string;
  title: string;
  projectTitle: string | null;
  dueDate: Date | null;
  isOverdue: boolean;
}

export interface WeeklyDigestData {
  meetings: WeeklyDigestMeeting[];
  totalMeetingMinutes: number;
  openTasks: WeeklyDigestTask[];
  overdueCount: number;
  weekStart: Date;
  weekEnd: Date;
}

/** Monday 00:00 of the week that just ended, through Sunday 23:59:59. */
export const lastWeekRange = (now: Date): { weekStart: Date; weekEnd: Date } => {
  const end = new Date(now);
  // getDay(): 0=Sun..6=Sat. Rewind to the most recent Monday, then back 7 days.
  const daysSinceMonday = (end.getDay() + 6) % 7;
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - daysSinceMonday);
  const weekStart = new Date(end);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date(end.getTime() - 1);
  return { weekStart, weekEnd };
};

/**
 * Gathers one user's digest for a workspace. Returns null when there's nothing
 * worth an email — no meetings means no digest, because a "you had 0 meetings"
 * email is how a weekly send becomes spam and gets muted forever.
 */
export const buildWeeklyDigest = async (
  userId: string,
  workspaceId: string,
  now: Date = new Date(),
): Promise<WeeklyDigestData | null> => {
  const { weekStart, weekEnd } = lastWeekRange(now);

  const transcripts = await prisma.transcript.findMany({
    where: {
      workspaceId,
      userId,
      recordedAt: { gte: weekStart, lte: weekEnd },
    },
    select: {
      id: true,
      title: true,
      recordedAt: true,
      durationSeconds: true,
      metadata: true,
      project: { select: { title: true } },
    },
    orderBy: { recordedAt: "asc" },
    take: 50,
  });

  if (transcripts.length === 0) return null;

  const meetings: WeeklyDigestMeeting[] = transcripts.map((t) => {
    const meta = (t.metadata as TranscriptMetadata | null) ?? {};
    return {
      id: t.id,
      title: t.title ?? "Untitled meeting",
      projectTitle: t.project?.title ?? null,
      recordedAt: t.recordedAt,
      durationSeconds: t.durationSeconds,
      keyPoints: Array.isArray(meta.keyPoints) ? meta.keyPoints.slice(0, 3) : [],
    };
  });

  const totalMeetingMinutes = Math.round(
    transcripts.reduce((acc, t) => acc + (t.durationSeconds ?? 0), 0) / 60,
  );

  // Open tasks that came out of THIS user's meetings — not the whole workspace
  // backlog, which would drown the signal the digest exists to deliver.
  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["BACKLOG", "IN_PROGRESS", "BLOCKED"] },
      transcriptLinks: { some: { transcriptId: { in: transcripts.map((t) => t.id) } } },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      project: { select: { title: true } },
    },
    orderBy: [{ dueDate: "asc" }],
    take: 25,
  });

  const openTasks: WeeklyDigestTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    projectTitle: task.project?.title ?? null,
    dueDate: task.dueDate,
    isOverdue: Boolean(task.dueDate && task.dueDate.getTime() < now.getTime()),
  }));

  return {
    meetings,
    totalMeetingMinutes,
    openTasks,
    overdueCount: openTasks.filter((task) => task.isOverdue).length,
    weekStart,
    weekEnd,
  };
};

export interface WeeklyDigestRunResult {
  considered: number;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Runs the digest for every opted-in user across their workspaces.
 * One failure never stops the run — a single bad mailbox must not cost
 * everyone else their Monday email.
 */
export const runWeeklyDigest = async (now: Date = new Date()): Promise<WeeklyDigestRunResult> => {
  const members = await prisma.workspaceMember.findMany({
    where: { user: { weeklyDigestEmail: true, role: { not: "PENDING" } } },
    select: {
      workspaceId: true,
      user: { select: { id: true, email: true, name: true } },
      workspace: { select: { name: true } },
    },
  });

  const result: WeeklyDigestRunResult = {
    considered: members.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const member of members) {
    try {
      const digest = await buildWeeklyDigest(member.user.id, member.workspaceId, now);
      if (!digest) {
        result.skipped += 1;
        continue;
      }
      await sendWeeklyDigestEmail(member.user.email, {
        userName: member.user.name,
        workspaceName: member.workspace.name,
        digest,
      });
      result.sent += 1;
    } catch (err) {
      result.failed += 1;
      logger.error(
        `[WeeklyDigest] Failed for user ${member.user.id} / workspace ${member.workspaceId}`,
        err,
      );
    }
  }

  logger.info(
    `[WeeklyDigest] considered=${result.considered} sent=${result.sent} skipped=${result.skipped} failed=${result.failed}`,
  );
  return result;
};
