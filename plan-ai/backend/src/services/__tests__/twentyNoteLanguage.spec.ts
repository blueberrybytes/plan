import { describe, it, expect, vi } from "vitest";

/**
 * The model already writes the title, summary and key points in the language
 * the meeting was held in. The labels wrapping them were hardcoded Spanish, so
 * an English meeting reached the client's CRM as English prose under Spanish
 * headings. These pin that the wrapper follows the content.
 */

vi.mock("../../prisma/prismaClient", () => ({ default: {} }));
vi.mock("@prisma/client", () => ({
  IntegrationProvider: { TWENTY: "TWENTY" },
  IntegrationStatus: { CONNECTED: "CONNECTED" },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));
vi.mock("../../utils/EnvUtils", () => ({ default: { get: () => "https://plan-ai.example.com" } }));

import { twentyIntegrationService } from "../twentyIntegrationService";

const transcript = (over: Record<string, unknown> = {}) =>
  ({
    id: "t-1",
    title: "Quarterly review",
    summary: "We agreed to extend the pilot.",
    transcript: "flat text",
    recordedAt: new Date("2026-08-11T09:00:00Z"),
    createdAt: new Date("2026-08-11T09:00:00Z"),
    durationSeconds: 2700,
    metadata: { keyPoints: ["Extend the pilot"], speakers: [{ label: "Speaker 0" }] },
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

describe("note labels follow the meeting language", () => {
  it("writes English headings for an English meeting", () => {
    const body = twentyIntegrationService.buildNoteMarkdown(transcript({ language: "english" }));
    expect(body).toContain("**Date:**");
    expect(body).toContain("## Summary");
    expect(body).toContain("## Key points");
    expect(body).not.toContain("Resumen");
  });

  it("writes Catalan headings for a Catalan meeting", () => {
    const body = twentyIntegrationService.buildNoteMarkdown(transcript({ language: "catalan" }));
    expect(body).toContain("**Data:**");
    expect(body).toContain("## Resum");
  });

  it("falls back to Spanish when the language was not detected", () => {
    // Every note said this before the label table existed; an undetected
    // language must keep behaving exactly as it always has.
    const body = twentyIntegrationService.buildNoteMarkdown(transcript({ language: null }));
    expect(body).toContain("**Fecha:**");
    expect(body).toContain("## Resumen");
  });

  it("localises the document link too", () => {
    const en = twentyIntegrationService.buildNoteMarkdown(
      transcript({ language: "english" }),
      "https://plan-ai.example.com/doc/public/d1",
    );
    expect(en).toContain("[Read the full write-up in Plan AI]");
  });

  it("localises the transcript file, headings and fallbacks alike", () => {
    const file = twentyIntegrationService.buildTranscriptFileMarkdown(
      transcript({ language: "english", title: null, transcript: null, utterances: null }),
    );
    expect(file).toContain("# Meeting");
    expect(file).toContain("**Duration:**");
    expect(file).toContain("## Transcript");
    expect(file).toContain("(no transcript)");
  });

  it("matches on the language prefix, not an exact string", () => {
    // `Transcript.language` is free-form text the model reports — "English",
    // "en-US" and "english" must all land on the same labels.
    for (const language of ["English", "en-US", "english"]) {
      expect(twentyIntegrationService.buildNoteMarkdown(transcript({ language }))).toContain(
        "**Date:**",
      );
    }
  });
});
