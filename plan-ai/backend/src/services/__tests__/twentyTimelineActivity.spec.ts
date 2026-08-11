import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * A note is stamped when we PUSH it, which can be hours after the meeting, so
 * on its own the CRM timeline tells the wrong story. The timeline activity
 * carries its own `happensAt` — that displacement is the entire reason this
 * exists, so it's what these tests guard.
 */

const { db } = vi.hoisted(() => ({
  db: { workspaceIntegration: { findUnique: vi.fn() }, transcript: { update: vi.fn() } },
}));

vi.mock("../../prisma/prismaClient", () => ({ default: db }));
vi.mock("@prisma/client", () => ({
  IntegrationProvider: { TWENTY: "TWENTY" },
  IntegrationStatus: { CONNECTED: "CONNECTED" },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import { twentyIntegrationService } from "../twentyIntegrationService";

const BASE = "https://crm.example.com";
const MEETING_START = new Date("2026-08-11T09:00:00.000Z");

const transcript = (over: Record<string, unknown> = {}) =>
  ({
    id: "t-1",
    title: "Revisión trimestral con Uriach",
    durationSeconds: 2700,
    // Uploaded hours after the meeting ended — the case that motivates this.
    recordedAt: new Date("2026-08-11T14:30:00Z"),
    createdAt: new Date("2026-08-11T14:30:00Z"),
    metadata: {
      speakers: [
        { label: "Speaker 0", identifiedName: "Xavi", role: "Plan AI" },
        { label: "Speaker 1", identifiedName: "Alex", role: "Uriach" },
      ],
    },
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

let sent: Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn(async (_url: string | URL, init?: RequestInit) => {
    sent = JSON.parse(String(init?.body ?? "{}"));
    return {
      ok: true,
      status: 201,
      json: async () => ({ data: { createTimelineActivity: { id: "tl-1" } } }),
      text: async () => "",
    } as Response;
  }) as unknown as typeof fetch;
});

describe("recordMeetingOnTimeline", () => {
  it("stamps the entry at the meeting, not at the moment we pushed it", async () => {
    await twentyIntegrationService.recordMeetingOnTimeline(BASE, "key", {
      transcript: transcript(),
      companyId: "co-uriach",
      happensAt: MEETING_START,
    });

    expect(sent.happensAt).toBe(MEETING_START.toISOString());
    // Guard the actual bug: falling back to upload time would put the meeting
    // in the wrong place on the timeline and nobody would notice.
    expect(sent.happensAt).not.toBe(new Date("2026-08-11T14:30:00Z").toISOString());
  });

  it("links through targetCompanyId — plain companyId is rejected by Twenty", async () => {
    await twentyIntegrationService.recordMeetingOnTimeline(BASE, "key", {
      transcript: transcript(),
      companyId: "co-uriach",
      happensAt: MEETING_START,
    });

    expect(sent.targetCompanyId).toBe("co-uriach");
    expect(sent).not.toHaveProperty("companyId");
  });

  it("follows Twenty's own <object>.<verb> event naming", async () => {
    await twentyIntegrationService.recordMeetingOnTimeline(BASE, "key", {
      transcript: transcript(),
      companyId: "co-1",
      happensAt: MEETING_START,
    });
    expect(sent.name).toMatch(/^[a-z]+\.[a-z]+$/);
  });

  it("carries a readable summary, since a custom event name renders generically", async () => {
    await twentyIntegrationService.recordMeetingOnTimeline(BASE, "key", {
      transcript: transcript(),
      companyId: "co-1",
      happensAt: MEETING_START,
      noteId: "note-9",
    });

    expect(sent.properties).toMatchObject({
      title: "Revisión trimestral con Uriach",
      duration: "45 min",
      attendees: "Xavi, Alex",
      noteId: "note-9",
      source: "Plan AI",
    });
  });

  it("omits duration and attendees rather than emitting empty values", async () => {
    await twentyIntegrationService.recordMeetingOnTimeline(BASE, "key", {
      transcript: transcript({ durationSeconds: null, metadata: {} }),
      companyId: "co-1",
      happensAt: MEETING_START,
    });

    expect(sent.properties).not.toHaveProperty("duration");
    expect(sent.properties).not.toHaveProperty("attendees");
  });

  it("fails loudly when Twenty returns no id", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ data: {} }),
      text: async () => "",
    })) as unknown as typeof fetch;

    await expect(
      twentyIntegrationService.recordMeetingOnTimeline(BASE, "key", {
        transcript: transcript(),
        companyId: "co-1",
        happensAt: MEETING_START,
      }),
    ).rejects.toThrow(/timeline activity id/i);
  });
});
