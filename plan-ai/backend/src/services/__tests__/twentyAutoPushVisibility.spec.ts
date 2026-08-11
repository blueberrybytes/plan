import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The reported failure: the user ticked "Twenty", no note appeared, and NOTHING
 * was shown — no error, no skipped step, nothing. Silence is the worst outcome,
 * because the user can't tell a broken integration from a misconfigured one.
 *
 * These pin the rule: if the push is requested, the transcript ALWAYS ends up
 * with a `postMeetingTasks.twenty` entry explaining what happened.
 */

const { db, pushMeetingNote } = vi.hoisted(() => ({
  db: {
    project: { findFirst: vi.fn() },
    transcript: { findUnique: vi.fn(), update: vi.fn() },
  },
  pushMeetingNote: vi.fn(),
}));

vi.mock("../../prisma/prismaClient", () => ({ default: db }));
vi.mock("../twentyIntegrationService", () => ({
  twentyIntegrationService: { pushMeetingNote },
}));

import { projectTranscriptService } from "../projectTranscriptService";

/** The private fan-out method, reached the way the pipeline reaches it. */
const autoPush = (transcript: unknown, explicitCompanyId?: string) =>
  (
    projectTranscriptService as unknown as {
      autoPushToTwenty: (ws: string, t: unknown, c?: string) => Promise<void>;
    }
  ).autoPushToTwenty("ws-1", transcript, explicitCompanyId);

const transcript = (over: Record<string, unknown> = {}) => ({
  id: "t-1",
  projectId: null,
  ...over,
});

/** The `twenty` entry written to metadata, or undefined if none was written. */
const writtenTwentyEntry = () => {
  const call = db.transcript.update.mock.calls.at(-1);
  if (!call) return undefined;
  const meta = call[0].data.metadata as { postMeetingTasks?: Record<string, unknown> };
  return meta.postMeetingTasks?.twenty as { status: string; error?: string } | undefined;
};

beforeEach(() => {
  vi.clearAllMocks();
  db.transcript.findUnique.mockResolvedValue({ metadata: {} });
  db.transcript.update.mockResolvedValue({});
});

describe("autoPushToTwenty — never fails silently", () => {
  it("records SKIPPED with the reason when no company was chosen", async () => {
    await autoPush(transcript());

    const entry = writtenTwentyEntry();
    expect(entry?.status).toBe("SKIPPED");
    // The reason is what turns a mystery into an actionable message.
    expect(entry?.error).toMatch(/company/i);
    expect(pushMeetingNote).not.toHaveBeenCalled();
  });

  it("records SKIPPED when the project exists but isn't linked", async () => {
    db.project.findFirst.mockResolvedValue({ metadata: { digestDocId: "d1" } });
    await autoPush(transcript({ projectId: "p-1" }));

    expect(writtenTwentyEntry()?.status).toBe("SKIPPED");
    expect(pushMeetingNote).not.toHaveBeenCalled();
  });

  it("pushes and records OK with the note url when a company is chosen", async () => {
    pushMeetingNote.mockResolvedValue({
      outcome: "CREATED",
      noteId: "n-1",
      url: "https://crm.example.com/object/note/n-1",
    });

    await autoPush(transcript(), "co-uriach");

    expect(pushMeetingNote).toHaveBeenCalledWith(
      "ws-1",
      expect.anything(),
      expect.objectContaining({ companyId: "co-uriach" }),
    );
    const entry = writtenTwentyEntry() as { status: string; url?: string };
    expect(entry.status).toBe("OK");
    expect(entry.url).toContain("/object/note/n-1");
  });

  it("records FAILED with the message when the CRM call throws", async () => {
    pushMeetingNote.mockRejectedValue(new Error("Twenty API 500"));

    await expect(autoPush(transcript(), "co-uriach")).rejects.toThrow(/500/);

    const entry = writtenTwentyEntry();
    expect(entry?.status).toBe("FAILED");
    expect(entry?.error).toMatch(/500/);
  });

  it("uses the project's linked company when none was chosen for the meeting", async () => {
    db.project.findFirst.mockResolvedValue({ metadata: { twentyCompanyId: "co-linked" } });
    pushMeetingNote.mockResolvedValue({ outcome: "CREATED", noteId: "n-2" });

    await autoPush(transcript({ projectId: "p-1" }));

    expect(pushMeetingNote).toHaveBeenCalledWith(
      "ws-1",
      expect.anything(),
      expect.objectContaining({ companyId: "co-linked" }),
    );
  });
});
