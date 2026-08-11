import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The meeting note is a summary; the full transcript goes to the company as a
 * file. These pin the parts that only failed when hit against a live Twenty:
 * the upload is presigned (not GraphQL multipart), the attachment links through
 * `targetCompanyId` (`companyId` is rejected), and `fileCategory` is
 * UPPER_SNAKE.
 */

const { db } = vi.hoisted(() => ({
  db: {
    workspaceIntegration: { findUnique: vi.fn() },
    meetingCrmNote: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    transcript: { update: vi.fn() },
  },
}));

vi.mock("../../prisma/prismaClient", () => ({ default: db }));
vi.mock("@prisma/client", () => ({
  IntegrationProvider: { TWENTY: "TWENTY" },
  IntegrationStatus: { CONNECTED: "CONNECTED" },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import { twentyIntegrationService } from "../twentyIntegrationService";

const BASE = "https://crm.example.com";

const transcript = (over: Record<string, unknown> = {}) =>
  ({
    id: "t-1",
    title: "Revisión trimestral con Uriach",
    summary: "Ampliamos el piloto.",
    transcript: "texto plano de respaldo",
    recordedAt: new Date("2026-08-11T09:00:00Z"),
    createdAt: new Date("2026-08-11T09:00:00Z"),
    durationSeconds: 2700,
    metadata: {
      speakers: [
        { label: "Speaker 0", identifiedName: "Xavi", role: "Plan AI" },
        { label: "Speaker 1", identifiedName: "Alex", role: "Uriach" },
      ],
    },
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

/** Replays the four calls the upload makes, in order, and records the payloads. */
const mockTwenty = () => {
  const calls: { url: string; method: string; body: unknown; raw: unknown }[] = [];
  global.fetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    const body = init?.body ? String(init.body) : "";
    calls.push({
      url: href,
      method: init?.method ?? "GET",
      body: body.startsWith("{") ? JSON.parse(body) : body,
      raw: init?.body,
    });

    const json = (payload: unknown) =>
      ({ ok: true, status: 200, json: async () => payload, text: async () => "" }) as Response;

    if (href.endsWith("/metadata")) {
      const query = JSON.parse(body).query as string;
      if (query.includes("objects(")) {
        return json({
          data: { objects: { edges: [{ node: { id: "obj-att", nameSingular: "attachment" } }] } },
        });
      }
      if (query.includes("fields(")) {
        return json({
          data: { fields: { edges: [{ node: { id: "fld-file", name: "file", type: "FILES" } }] } },
        });
      }
      if (query.includes("createFileUpload")) {
        return json({
          data: {
            createFileUpload: {
              fileId: "file-1",
              uploadUrl: "https://storage.example.com/signed",
              contentType: "application/octet-stream",
            },
          },
        });
      }
      if (query.includes("completeFileUpload")) {
        return json({
          data: { completeFileUpload: { id: "file-1", path: "files-field/x/file-1.md" } },
        });
      }
    }
    if (href.startsWith("https://storage.example.com")) {
      return { ok: true, status: 204, text: async () => "" } as Response;
    }
    if (href.endsWith("/rest/attachments")) {
      return json({ data: { createAttachment: { id: "att-1" } } });
    }
    throw new Error(`unexpected fetch: ${href}`);
  }) as unknown as typeof fetch;
  return calls;
};

beforeEach(() => vi.clearAllMocks());

describe("buildTranscriptFileMarkdown", () => {
  it("carries the raw words, which the note deliberately does not", () => {
    const t = transcript({
      utterances: [
        { speaker: "Speaker 0", transcript: "¿Cómo veis el piloto?" },
        { speaker: "Speaker 1", transcript: "Bien, lo usamos a diario." },
      ],
    });

    const file = twentyIntegrationService.buildTranscriptFileMarkdown(t);
    const note = twentyIntegrationService.buildNoteMarkdown(t);

    expect(file).toContain("¿Cómo veis el piloto?");
    expect(note).not.toContain("¿Cómo veis el piloto?");
  });

  it("labels turns with the identified speaker, not 'Speaker 0'", () => {
    const file = twentyIntegrationService.buildTranscriptFileMarkdown(
      transcript({ utterances: [{ speaker: "Speaker 1", transcript: "Hola" }] }),
    );
    expect(file).toContain("**Alex:** Hola");
    expect(file).not.toContain("Speaker 1");
  });

  it("falls back to the flat text when the recording was not diarized", () => {
    const file = twentyIntegrationService.buildTranscriptFileMarkdown(
      transcript({ utterances: null }),
    );
    expect(file).toContain("texto plano de respaldo");
  });
});

describe("attachTranscriptToCompany", () => {
  it("uploads through the presigned URL and links via targetCompanyId", async () => {
    const calls = mockTwenty();
    const t = transcript({ utterances: [{ speaker: "Speaker 0", transcript: "Hola" }] });

    const result = await twentyIntegrationService.attachTranscriptToCompany(
      BASE,
      "key",
      t,
      "co-uriach",
    );

    expect(result).toEqual({
      attachmentId: "att-1",
      // Accents stripped, date first — sorts chronologically in the CRM.
      filename: "2026-08-11-revision-trimestral-con-uriach.md",
    });

    const put = calls.find((c) => c.method === "PUT");
    expect(put?.url).toBe("https://storage.example.com/signed");
    // What lands in the CRM must be exactly the file we built — a truncated or
    // re-encoded upload would still return 204 and look fine.
    expect(put?.raw).toBeInstanceOf(Buffer);
    expect((put?.raw as Buffer).toString("utf8")).toBe(
      twentyIntegrationService.buildTranscriptFileMarkdown(t),
    );

    const attach = calls.find((c) => c.url.endsWith("/rest/attachments"));
    expect(attach?.body).toMatchObject({
      targetCompanyId: "co-uriach",
      fileCategory: "TEXT_DOCUMENT",
      file: [{ fileId: "file-1", label: "2026-08-11-revision-trimestral-con-uriach.md" }],
      fullPath: "files-field/x/file-1.md",
    });
    // The field Twenty rejects — pinned so nobody "simplifies" it back.
    expect(attach?.body).not.toHaveProperty("companyId");
  });

  it("resolves the file field id once and caches it per host", async () => {
    const calls = mockTwenty();
    const t = transcript();

    await twentyIntegrationService.attachTranscriptToCompany(BASE, "key", t, "co-1");
    const firstLookups = calls.filter((c) => String(c.body ?? "").includes("objects(")).length;

    await twentyIntegrationService.attachTranscriptToCompany(BASE, "key", t, "co-2");
    const totalLookups = calls.filter((c) => {
      const q = (c.body as { query?: string })?.query ?? "";
      return q.includes("objects(");
    }).length;

    expect(firstLookups + totalLookups).toBeLessThanOrEqual(1);
  });

  it("surfaces a failed upload instead of reporting a phantom attachment", async () => {
    mockTwenty();
    global.fetch = vi.fn(async (url: string | URL) => {
      if (String(url).endsWith("/metadata")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ errors: [{ message: "Direct upload is not supported" }] }),
          text: async () => "",
        } as Response;
      }
      throw new Error("unexpected");
    }) as unknown as typeof fetch;

    await expect(
      twentyIntegrationService.attachTranscriptToCompany(BASE, "key", transcript(), "co-1"),
    ).rejects.toThrow(/Direct upload is not supported/);
  });
});
