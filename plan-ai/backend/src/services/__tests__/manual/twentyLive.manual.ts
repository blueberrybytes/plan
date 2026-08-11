import { describe, it, expect, vi } from "vitest";

/**
 * LIVE smoke test against a real Twenty instance. Not part of the normal suite
 * (filename ends in .manual.ts so vitest's `*.spec.ts` glob skips it).
 *
 *   TW_URL=... TW_KEY=... TEST_COMPANY_ID=... \
 *     npx vitest run src/services/__tests__/twentyLive.manual.ts
 *
 * Only Prisma is stubbed; every HTTP call, field name and parser exercised here
 * is the production code path.
 */

const TW_URL = process.env.TW_URL ?? "";
const TW_KEY = process.env.TW_KEY ?? "";
const COMPANY_ID = process.env.TEST_COMPANY_ID ?? "";

vi.mock("../../../prisma/prismaClient", () => ({
  default: {
    workspaceIntegration: {
      findUnique: async () => ({
        status: "CONNECTED",
        accessToken: process.env.TW_KEY,
        metadata: { authType: "API_KEY", baseUrl: process.env.TW_URL },
      }),
    },
  },
}));

import { twentyIntegrationService } from "../../twentyIntegrationService";

describe.skipIf(!TW_URL || !TW_KEY)("Twenty — live API", () => {
  it("getSummary reports the connection", async () => {
    const summary = await twentyIntegrationService.getSummary("ws-live");
    console.log("summary:", summary);
    expect(summary.connected).toBe(true);
  });

  it("searchCompanies returns mapped rows (domainName flattened from object)", async () => {
    const rows = await twentyIntegrationService.searchCompanies("ws-live", "ZZ Plan");
    console.log("companies:", rows);
    expect(rows.length).toBeGreaterThan(0);
    expect(typeof rows[0].name).toBe("string");
    // domainName in Twenty is an object; ours must be a string or undefined.
    expect(["string", "undefined"]).toContain(typeof rows[0].domainName);
  });

  it("searchPeople finds a person by SURNAME (the or() filter)", async () => {
    const rows = await twentyIntegrationService.searchPeople("ws-live", "zhao");
    console.log("people by surname:", rows);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].name).toContain("Zhao");
  });

  it.skipIf(!COMPANY_ID)("creates a note and links it to the company", async () => {
    const markdown = twentyIntegrationService.buildNoteMarkdown(
      {
        id: "t-live",
        title: "Kickoff Uriach",
        summary: "Revisamos alcance y calendario.",
        transcript: "PALABRA_CRUDA ".repeat(300),
        recordedAt: new Date("2026-08-11T11:00:00Z"),
        durationSeconds: 1800,
        metadata: {
          speakers: [
            { label: "Speaker 0", identifiedName: "David", role: "Cliente" },
            { label: "Speaker 1", identifiedName: "Alex" },
          ],
          keyPoints: ["Aprobado el alcance de fase 1"],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      "https://plan-ai.blueberrybytes.com/recordings/t-live",
    );

    // The raw transcript must never reach the client's CRM.
    expect(markdown).not.toContain("PALABRA_CRUDA");

    const svc = twentyIntegrationService as unknown as {
      createNoteWithTargets: (
        baseUrl: string,
        apiKey: string,
        args: {
          title: string;
          markdown: string;
          companyId: string;
          personIds: string[];
          opportunityId?: string;
        },
      ) => Promise<{ noteId: string; url?: string }>;
    };

    const note = await svc.createNoteWithTargets(TW_URL, TW_KEY, {
      title: "[Plan AI live test] nota vía servicio real",
      markdown,
      companyId: COMPANY_ID,
      personIds: [],
    });
    console.log("created note:", note);
    expect(note.noteId).toMatch(/[0-9a-f-]{36}/);

    // Verify the link actually exists — a note with no target is invisible.
    const res = await fetch(
      `${TW_URL}/rest/noteTargets?filter=${encodeURIComponent(`targetCompanyId[eq]:${COMPANY_ID}`)}`,
      { headers: { Authorization: `Bearer ${TW_KEY}` } },
    );
    const body = (await res.json()) as { data?: { noteTargets?: { noteId: string }[] } };
    const linked = (body.data?.noteTargets ?? []).some((t) => t.noteId === note.noteId);
    console.log("link verified:", linked);
    expect(linked).toBe(true);
  });
});
