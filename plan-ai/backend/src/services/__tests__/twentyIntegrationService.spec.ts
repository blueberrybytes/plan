import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The value of the Twenty integration is that it does NOT put two notes about
 * the same meeting into a client's CRM. These tests pin the meeting-identity
 * rules and the push flow's idempotency, since both fail silently in prod.
 */

const { db, MockKnownRequestError } = vi.hoisted(() => ({
  db: {
    workspaceIntegration: { findUnique: vi.fn(), upsert: vi.fn() },
    meetingCrmNote: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    transcript: { update: vi.fn() },
  },
  // Must live inside vi.hoisted: the vi.mock factory below is hoisted above any
  // top-level class declaration and would otherwise read it before init.
  MockKnownRequestError: class extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  },
}));

vi.mock("../../prisma/prismaClient", () => ({ default: db }));
vi.mock("@prisma/client", () => ({
  IntegrationProvider: { TWENTY: "TWENTY" },
  IntegrationStatus: { CONNECTED: "CONNECTED" },
  Prisma: { PrismaClientKnownRequestError: MockKnownRequestError },
}));

import {
  twentyIntegrationService,
  isSameMeeting,
  resolveMeetingInterval,
} from "../twentyIntegrationService";

const iso = (s: string) => new Date(s);

const transcript = (over: Record<string, unknown> = {}) =>
  ({
    id: "t-xavi",
    title: "Uriach kickoff",
    summary: "Hablamos del alcance",
    recordedAt: iso("2026-08-11T11:00:00Z"),
    durationSeconds: 1800,
    createdAt: iso("2026-08-11T11:00:00Z"),
    metadata: {},
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  db.workspaceIntegration.findUnique.mockResolvedValue({
    status: "CONNECTED",
    accessToken: "key-123",
    metadata: { authType: "API_KEY", baseUrl: "https://crm.housegroup.media" },
  });
  db.meetingCrmNote.update.mockResolvedValue({});
  db.transcript.update.mockResolvedValue({});
  global.fetch = vi.fn();
});

describe("isSameMeeting", () => {
  const base = { startedAt: iso("2026-08-11T10:00:00Z"), endedAt: iso("2026-08-11T11:00:00Z") };

  it("matches two recordings of the same call started minutes apart", () => {
    // Xavi hits record at 10:00, Alex at 10:04 — the classic case.
    expect(
      isSameMeeting(base, {
        startedAt: iso("2026-08-11T10:04:00Z"),
        endedAt: iso("2026-08-11T10:58:00Z"),
      }),
    ).toBe(true);
  });

  it("still matches when someone joins late and records only part", () => {
    expect(
      isSameMeeting(base, {
        startedAt: iso("2026-08-11T10:25:00Z"),
        endedAt: iso("2026-08-11T11:00:00Z"),
      }),
    ).toBe(true);
  });

  it("does NOT match back-to-back meetings with the same company", () => {
    // 10:00-11:00 then 11:00-12:00 must stay two separate notes.
    expect(
      isSameMeeting(base, {
        startedAt: iso("2026-08-11T11:00:00Z"),
        endedAt: iso("2026-08-11T12:00:00Z"),
      }),
    ).toBe(false);
  });

  it("does NOT match a meeting later the same day", () => {
    expect(
      isSameMeeting(base, {
        startedAt: iso("2026-08-11T16:00:00Z"),
        endedAt: iso("2026-08-11T17:00:00Z"),
      }),
    ).toBe(false);
  });

  it("does NOT match on a brief accidental overlap", () => {
    // A 3-minute tail overlap is under the 5-minute floor.
    expect(
      isSameMeeting(base, {
        startedAt: iso("2026-08-11T10:57:00Z"),
        endedAt: iso("2026-08-11T11:45:00Z"),
      }),
    ).toBe(false);
  });
});

describe("resolveMeetingInterval", () => {
  it("prefers the client-reported real start over upload time", () => {
    const i = resolveMeetingInterval(
      transcript({
        recordedAt: iso("2026-08-11T12:30:00Z"), // uploaded well after the call
        durationSeconds: 1800,
        metadata: { recording: { startedAt: "2026-08-11T10:00:00Z", wallClockSeconds: 1800 } },
      }),
    );
    expect(i?.startedAt.toISOString()).toBe("2026-08-11T10:00:00.000Z");
    expect(i?.endedAt.toISOString()).toBe("2026-08-11T10:30:00.000Z");
  });

  it("falls back to walking backwards from upload time", () => {
    const i = resolveMeetingInterval(
      transcript({ recordedAt: iso("2026-08-11T11:00:00Z"), durationSeconds: 1800 }),
    );
    expect(i?.startedAt.toISOString()).toBe("2026-08-11T10:30:00.000Z");
  });

  it("returns null when there is no usable timing", () => {
    expect(resolveMeetingInterval(transcript({ recordedAt: null, durationSeconds: null }))).toBeNull();
  });
});

describe("pushMeetingNote", () => {
  const okFetch = (noteId = "note-1") => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      const body = url.includes("/notes")
        ? { data: { createNote: { id: noteId } } }
        : { data: {} };
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
    });
  };

  it("creates the note and records the claim when the slot is free", async () => {
    okFetch();
    db.meetingCrmNote.create.mockResolvedValue({ id: "claim-1" });

    const res = await twentyIntegrationService.pushMeetingNote("ws-1", transcript(), {
      companyId: "co-uriach",
      personIds: ["p-david"],
    });

    expect(res.outcome).toBe("CREATED");
    expect(res.noteId).toBe("note-1");
    // Claim written before the note existed, then backfilled.
    expect(db.meetingCrmNote.create).toHaveBeenCalledOnce();
    expect(db.meetingCrmNote.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ noteId: "note-1" }) }),
    );
  });

  it("stands down when a teammate already pushed the same meeting", async () => {
    okFetch();
    db.meetingCrmNote.create.mockRejectedValue(new MockKnownRequestError("P2002"));
    db.meetingCrmNote.findUnique.mockResolvedValue({
      noteId: "note-alex",
      url: "https://crm.housegroup.media/object/note/note-alex",
      canonicalTranscriptId: "t-alex",
      startedAt: iso("2026-08-11T10:32:00Z"),
      endedAt: iso("2026-08-11T11:00:00Z"),
    });

    const res = await twentyIntegrationService.pushMeetingNote("ws-1", transcript(), {
      companyId: "co-uriach",
    });

    expect(res.outcome).toBe("DEDUPED");
    expect(res.noteId).toBe("note-alex");
    expect(res.canonicalTranscriptId).toBe("t-alex");
    // The whole point: nothing was created inside the client's CRM.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("creates a separate note for a genuinely different meeting that day", async () => {
    okFetch("note-2");
    db.meetingCrmNote.create
      .mockRejectedValueOnce(new MockKnownRequestError("P2002"))
      .mockResolvedValueOnce({ id: "claim-2" });
    // Incumbent was the morning meeting; ours is the afternoon one.
    db.meetingCrmNote.findUnique.mockResolvedValue({
      noteId: "note-morning",
      canonicalTranscriptId: "t-morning",
      startedAt: iso("2026-08-11T08:00:00Z"),
      endedAt: iso("2026-08-11T09:00:00Z"),
    });

    const res = await twentyIntegrationService.pushMeetingNote("ws-1", transcript(), {
      companyId: "co-uriach",
    });

    expect(res.outcome).toBe("CREATED");
    expect(res.noteId).toBe("note-2");
    // Second attempt used a suffixed bucket.
    expect(db.meetingCrmNote.create).toHaveBeenCalledTimes(2);
    expect(db.meetingCrmNote.create.mock.calls[1][0].data.dayBucket).toBe("2026-08-11#2");
  });

  it("honours the user overriding a wrong dedup match", async () => {
    okFetch("note-forced");
    db.meetingCrmNote.create
      .mockRejectedValueOnce(new MockKnownRequestError("P2002"))
      .mockResolvedValueOnce({ id: "claim-f" });
    db.meetingCrmNote.findUnique.mockResolvedValue({
      noteId: "note-alex",
      canonicalTranscriptId: "t-alex",
      startedAt: iso("2026-08-11T10:32:00Z"),
      endedAt: iso("2026-08-11T11:00:00Z"),
    });

    const res = await twentyIntegrationService.pushMeetingNote("ws-1", transcript(), {
      companyId: "co-uriach",
      forceSeparateNote: true,
    });

    expect(res.outcome).toBe("CREATED");
    expect(res.noteId).toBe("note-forced");
  });

  it("returns the existing note instead of pushing twice from one transcript", async () => {
    const res = await twentyIntegrationService.pushMeetingNote(
      "ws-1",
      transcript({ metadata: { twenty: { noteId: "note-old", role: "CANONICAL" } } }),
      { companyId: "co-uriach" },
    );

    expect(res.outcome).toBe("ALREADY_PUSHED");
    expect(db.meetingCrmNote.create).not.toHaveBeenCalled();
  });

  it("releases the claim if the CRM call fails, so a retry can work", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve("boom"),
    });
    db.meetingCrmNote.create.mockResolvedValue({ id: "claim-x" });
    db.meetingCrmNote.delete.mockResolvedValue({});

    await expect(
      twentyIntegrationService.pushMeetingNote("ws-1", transcript(), { companyId: "co-uriach" }),
    ).rejects.toThrow();

    expect(db.meetingCrmNote.delete).toHaveBeenCalledWith({ where: { id: "claim-x" } });
  });

  it("refuses to push a transcript with no reliable timing", async () => {
    await expect(
      twentyIntegrationService.pushMeetingNote(
        "ws-1",
        transcript({ recordedAt: null, durationSeconds: null }),
        { companyId: "co-uriach" },
      ),
    ).rejects.toThrow(/deduplicated/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fails clearly when Twenty is not connected", async () => {
    db.workspaceIntegration.findUnique.mockResolvedValue(null);
    await expect(
      twentyIntegrationService.pushMeetingNote("ws-1", transcript(), { companyId: "co-uriach" }),
    ).rejects.toThrow(/not connected/i);
  });
});

describe("buildNoteMarkdown", () => {
  it("includes attendees and summary but never the raw transcript", () => {
    const md = twentyIntegrationService.buildNoteMarkdown(
      transcript({
        transcript: "PALABRA_CRUDA ".repeat(500),
        metadata: {
          speakers: [
            { label: "Speaker 0", identifiedName: "David", role: "Cliente" },
            { label: "Speaker 1", identifiedName: "Alex" },
          ],
          keyPoints: ["Presupuesto aprobado"],
        },
      }),
    );

    expect(md).toContain("David (Cliente)");
    expect(md).toContain("Alex");
    expect(md).toContain("Presupuesto aprobado");
    expect(md).not.toContain("PALABRA_CRUDA");
  });
});
