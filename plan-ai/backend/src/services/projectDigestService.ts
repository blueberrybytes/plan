import prisma from "../prisma/prismaClient";
import { Prisma } from "@prisma/client";
import { docGenerationService } from "./docGenerationService";
import { logger } from "../utils/logger";

/**
 * Generates (or regenerates) the Project Digest: a living synthesis of ALL the
 * project's meetings — decisions, open action items, recurring themes,
 * history and next steps. Reuses docGenerationService (the digest is a
 * DocDocument, themed with the project's theme, linked via projectId).
 * Confidential meetings are excluded.
 *
 * Returns `{ digestDocId, title }` on success, or `null` when there are no
 * non-confidential meetings to summarize.
 */
export async function generateProjectDigest(
  userId: string,
  workspaceId: string,
  projectId: string,
): Promise<{ digestDocId: string; title: string } | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { title: true, themeId: true, metadata: true },
  });
  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  const transcripts = await prisma.transcript.findMany({
    where: { projectId, workspaceId },
    select: { id: true, title: true, summary: true, recordedAt: true, metadata: true },
    orderBy: { recordedAt: "asc" },
  });

  // Exclude confidential meetings from the shared digest.
  const meetings = transcripts.filter(
    (t) => (t.metadata as Record<string, unknown> | null)?.confidential !== true,
  );
  if (meetings.length === 0) {
    return null;
  }

  const meetingBlocks = meetings
    .map((m, i) => {
      const meta = (m.metadata as Record<string, unknown> | null) ?? {};
      const keyPoints = Array.isArray(meta.keyPoints) ? (meta.keyPoints as string[]) : [];
      const date = m.recordedAt ? new Date(m.recordedAt).toISOString().slice(0, 10) : "—";
      return `### Meeting ${i + 1}: ${m.title ?? "Untitled"} (${date})\nSummary: ${
        m.summary ?? "(none)"
      }${keyPoints.length ? `\nKey points:\n- ${keyPoints.join("\n- ")}` : ""}`;
    })
    .join("\n\n");

  const prompt = `You are producing a living PROJECT DIGEST: a single document that synthesizes ALL the meetings of a project over time so a stakeholder (or a returning team member) can understand the whole picture in 2 minutes. The meetings are listed below in chronological order.

Produce a clean, professional markdown document, ready to share, with these sections:

1. **Executive summary** — where the project stands right now and its momentum (3-5 sentences).
2. **Key decisions** — the concrete decisions agreed across meetings. For each, note *when / which meeting* it came from.
3. **Open action items** — commitments and tasks that are still outstanding. Include the owner if it was mentioned, and flag anything that looks blocked or overdue.
4. **Recurring themes & risks** — topics, concerns or blockers that came up more than once or that could derail the project.
5. **Timeline / history** — a short chronological narrative of how the project evolved across the meetings.
6. **Next steps** — concrete, prioritized recommended actions for the immediate future.

Rules:
- Write entirely in the **predominant language of the meetings** (e.g. if they're in Catalan/Spanish, write in that language).
- Synthesize ACROSS meetings — don't just list each meeting separately. Connect the dots (what changed, what's still pending, what evolved).
- Be specific and useful, not generic. If something is unknown, say so rather than inventing it.
- If there is only one meeting, still produce the structure but keep it proportionate.

PROJECT MEETINGS (chronological):
${meetingBlocks}`;

  const doc = await docGenerationService.startGeneration(userId, workspaceId, {
    title: `${project.title} — Project Digest`,
    prompt,
    projectIds: [projectId],
    projectId,
    transcriptIds: meetings.map((m) => m.id),
    themeId: project.themeId ?? undefined,
  });

  // Persist the digest doc id so the UI can find/regenerate it, plus when it
  // last ran and over how many meetings — the UI surfaces this so a reader can
  // tell at a glance whether the digest is current (it regenerates after every
  // meeting, but nobody believes that without a timestamp).
  const meta = (project.metadata as Record<string, unknown> | null) ?? {};
  meta.digestDocId = doc.id;
  meta.digestGeneratedAt = new Date().toISOString();
  meta.digestMeetingCount = meetings.length;
  await prisma.project.update({
    where: { id: projectId },
    data: { metadata: meta as Prisma.InputJsonObject },
  });

  logger.info(
    `[ProjectDigest] Generated digest doc ${doc.id} for project ${projectId} (${meetings.length} meetings)`,
  );

  return { digestDocId: doc.id, title: doc.title };
}
