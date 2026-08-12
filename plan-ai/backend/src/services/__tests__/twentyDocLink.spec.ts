import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The meeting document is generated AFTER the CRM push in the post-meeting
 * pipeline, and neither step waits for the other — so the note is always
 * created before the document exists. `buildNoteMarkdown` had accepted a
 * `publicDocUrl` from the start and nobody ever passed one, which is why the
 * "Ver acta completa" link never appeared.
 *
 * Two paths now cover it: the link goes in up front when the document already
 * exists (manual push of an older meeting), and gets patched in afterwards when
 * it doesn't. These pin both, plus the cases where patching would be wrong.
 */

const { db } = vi.hoisted(() => ({
  db: {
    workspaceIntegration: { findUnique: vi.fn() },
    transcript: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("../../prisma/prismaClient", () => ({ default: db }));
vi.mock("@prisma/client", () => ({
  IntegrationProvider: { TWENTY: "TWENTY" },
  IntegrationStatus: { CONNECTED: "CONNECTED" },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));
vi.mock("../../utils/EnvUtils", () => ({
  default: { get: () => "https://plan-ai.example.com" },
}));

import { twentyIntegrationService } from "../twentyIntegrationService";

const PUBLIC_PATH = "/doc/public/doc-42";
const EXPECTED_URL = "https://plan-ai.example.com/doc/public/doc-42";

/** Records requests and answers the note GET with the given body. */
const mockTwenty = (existingBody: string) => {
  const calls: { url: string; method: string; body: Record<string, unknown> }[] = [];
  global.fetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const raw = init?.body ? String(init.body) : "";
    calls.push({
      url: String(url),
      method: init?.method ?? "GET",
      body: raw.startsWith("{") ? JSON.parse(raw) : {},
    });
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: { note: { bodyV2: { markdown: existingBody } } } }),
      text: async () => "",
    } as Response;
  }) as unknown as typeof fetch;
  return calls;
};

beforeEach(() => {
  vi.clearAllMocks();
  db.workspaceIntegration.findUnique.mockResolvedValue({
    status: "CONNECTED",
    accessToken: "key-123",
    metadata: { authType: "API_KEY", baseUrl: "https://crm.example.com" },
  });
});

describe("buildNoteMarkdown with a document link", () => {
  const transcript = (over: Record<string, unknown> = {}) =>
    ({
      id: "t-1",
      title: "Revisión trimestral",
      summary: "Ampliamos el piloto.",
      recordedAt: new Date("2026-08-11T09:00:00Z"),
      createdAt: new Date("2026-08-11T09:00:00Z"),
      metadata: {},
      ...over,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

  it("appends the link when a document url is supplied", () => {
    const body = twentyIntegrationService.buildNoteMarkdown(transcript(), EXPECTED_URL);
    expect(body).toContain(`[Ver acta completa en Plan AI](${EXPECTED_URL})`);
  });

  it("says nothing about a document when none was generated", () => {
    // "Create doc" is opt-in, so most notes legitimately have no link — an
    // empty or broken one would be worse than none.
    const body = twentyIntegrationService.buildNoteMarkdown(transcript());
    expect(body).not.toContain("Ver acta completa");
  });
});

describe("appendDocLinkToNote", () => {
  const noteMetadata = (over: Record<string, unknown> = {}) => ({
    metadata: { twenty: { noteId: "note-1", role: "CANONICAL", ...over } },
  });

  it("patches the note with an absolute url", async () => {
    db.transcript.findUnique.mockResolvedValue(noteMetadata());
    const calls = mockTwenty("**Fecha:** 2026-08-11");

    await twentyIntegrationService.appendDocLinkToNote("ws-1", "t-1", PUBLIC_PATH);

    const patch = calls.find((c) => c.method === "PATCH");
    const markdown = (patch?.body as { bodyV2: { markdown: string } }).bodyV2.markdown;
    // A relative path is meaningless to whoever opens the CRM.
    expect(markdown).toContain(`(${EXPECTED_URL})`);
    expect(markdown).toContain("**Fecha:** 2026-08-11");
  });

  it("does not append the same link twice", async () => {
    db.transcript.findUnique.mockResolvedValue(noteMetadata());
    // Document generation can be retried; a stacked duplicate link is visible
    // to the client and looks broken.
    const calls = mockTwenty(`Resumen\n\n[Ver acta completa en Plan AI](${EXPECTED_URL})`);

    await twentyIntegrationService.appendDocLinkToNote("ws-1", "t-1", PUBLIC_PATH);

    expect(calls.find((c) => c.method === "PATCH")).toBeUndefined();
  });

  it("leaves a teammate's note alone", async () => {
    // A SECONDARY recording points at somebody else's note; the canonical push
    // owns that body.
    db.transcript.findUnique.mockResolvedValue(noteMetadata({ role: "SECONDARY" }));
    const calls = mockTwenty("Resumen");

    await twentyIntegrationService.appendDocLinkToNote("ws-1", "t-1", PUBLIC_PATH);

    expect(calls).toEqual([]);
  });

  it("does nothing when the meeting was never pushed", async () => {
    db.transcript.findUnique.mockResolvedValue({ metadata: {} });
    const calls = mockTwenty("Resumen");

    await twentyIntegrationService.appendDocLinkToNote("ws-1", "t-1", PUBLIC_PATH);

    expect(calls).toEqual([]);
  });

  it("does nothing when Twenty isn't connected", async () => {
    db.workspaceIntegration.findUnique.mockResolvedValue(null);
    const calls = mockTwenty("Resumen");

    await twentyIntegrationService.appendDocLinkToNote("ws-1", "t-1", PUBLIC_PATH);

    expect(calls).toEqual([]);
  });
});
