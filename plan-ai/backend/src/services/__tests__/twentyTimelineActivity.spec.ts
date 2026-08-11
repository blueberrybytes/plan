import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Two things are being guarded here, and both were learned the hard way against
 * a live instance:
 *
 * 1. A note is stamped when we PUSH it, which can be hours after the meeting,
 *    so on its own the CRM timeline tells the wrong story. The entry carries
 *    its own `happensAt` — that displacement is the whole reason it exists.
 *
 * 2. The event name is NOT free-form. A made-up name (`meeting.recorded`) is
 *    accepted by the API and then renders as a blank row with a generic icon.
 *    Twenty builds the label from a known name plus the `linkedRecord*` fields,
 *    so those are load-bearing, not decoration.
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
const UPLOADED_AT = new Date("2026-08-11T14:30:00.000Z");

let sent: Record<string, unknown>;

const mockTwenty = () => {
  global.fetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    const json = (payload: unknown) =>
      ({ ok: true, status: 200, json: async () => payload, text: async () => "" }) as Response;

    if (href.endsWith("/metadata")) {
      return json({
        data: { objects: { edges: [{ node: { id: "obj-note", nameSingular: "note" } }] } },
      });
    }
    sent = JSON.parse(String(init?.body ?? "{}"));
    return json({ data: { createTimelineActivity: { id: "tl-1" } } });
  }) as unknown as typeof fetch;
};

const record = (over: Record<string, unknown> = {}, base = BASE) =>
  twentyIntegrationService.recordMeetingOnTimeline(base, "key", {
    companyId: "co-uriach",
    happensAt: MEETING_START,
    noteId: "note-9",
    noteTitle: "Revisión trimestral · 2026-08-11",
    ...over,
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockTwenty();
});

describe("recordMeetingOnTimeline", () => {
  it("stamps the entry at the meeting, not at the moment we pushed it", async () => {
    await record();

    expect(sent.happensAt).toBe(MEETING_START.toISOString());
    expect(sent.happensAt).not.toBe(UPLOADED_AT.toISOString());
  });

  it("carries the linked-record fields the timeline label is built from", async () => {
    await record();

    // Without these three the row renders empty — the failure that sent us
    // back to the drawing board.
    expect(sent.linkedObjectMetadataId).toBe("obj-note");
    expect(sent.linkedRecordId).toBe("note-9");
    expect(sent.linkedRecordCachedName).toBe("Revisión trimestral · 2026-08-11");
  });

  it("uses an event name Twenty knows how to render", async () => {
    await record();

    // A custom name is accepted by the API and silently unrenderable, so this
    // pins the verified value rather than just the naming convention.
    expect(sent.name).toBe("linked-note.created");
  });

  it("links through targetCompanyId — plain companyId is rejected by Twenty", async () => {
    await record();

    expect(sent.targetCompanyId).toBe("co-uriach");
    expect(sent).not.toHaveProperty("companyId");
  });

  it("resolves the note object id once and caches it per host", async () => {
    // A host no earlier test has touched: the cache lives at module scope, so
    // reusing BASE here would measure the other tests' warm-up, not this.
    const freshHost = "https://cache-probe.example.com";

    await record({}, freshHost);
    await record({}, freshHost);

    const metadataCalls = (
      global.fetch as unknown as { mock: { calls: [string][] } }
    ).mock.calls.filter(([url]) => String(url).endsWith("/metadata"));
    expect(metadataCalls.length).toBe(1);
  });

  it("fails loudly when Twenty returns no id", async () => {
    global.fetch = vi.fn(async (url: string | URL) => {
      const json = (payload: unknown) =>
        ({ ok: true, status: 200, json: async () => payload, text: async () => "" }) as Response;
      if (String(url).endsWith("/metadata")) {
        return json({
          data: { objects: { edges: [{ node: { id: "obj-note", nameSingular: "note" } }] } },
        });
      }
      return json({ data: {} });
    }) as unknown as typeof fetch;

    await expect(record()).rejects.toThrow(/timeline activity id/i);
  });
});
