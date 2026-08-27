import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Two production failures, same root shape: a call had no way out when its one
 * route was unavailable.
 *
 * 1. Task extraction pinned the OpenRouter provider to keep Gemini's implicit
 *    cache warm. Pinning means "fail rather than use another provider", so when
 *    Google's shared capacity was rate-limited upstream the job died — and the
 *    retry loop kept hammering the same pinned route.
 *
 * 2. Document generation asked for a model with no API key, which silently
 *    falls back to the platform's OPENROUTER_API_KEY instead of the customer's.
 *    In a BYOK product that bills the wrong account and fails whenever the
 *    shared key is throttled.
 *
 * These are source-level assertions on purpose: the defect is in how the call
 * is wired, and a mock of the provider proves nothing about the wiring.
 */

vi.mock("@prisma/client", () => ({ PrismaClient: class {} }));

const read = (rel: string) => readFileSync(join(__dirname, "..", rel), "utf-8");

describe("task extraction survives a rate-limited provider", () => {
  const src = read("projectTranscriptService.ts");

  it("only pins the provider on the first attempt", () => {
    // Retrying a pinned route against a sustained upstream rate limit cannot
    // succeed; the retry has to be allowed somewhere else.
    expect(src).toMatch(
      /attempt === 0\s*\?\s*getCachedStructuredProviderOptions\(activeModel\)\s*:\s*getStructuredProviderOptions\(activeModel\)/,
    );
  });

  it("treats a rate limit as retryable even when it arrives as prose", () => {
    // The production error was "…is temporarily rate-limited upstream" with no
    // 429 in `data.code`, so a code-only check called it permanent.
    const match = src.match(/const isRateLimited =[\s\S]{0,320}?;/);
    expect(match, "isRateLimited not found").toBeTruthy();
    const check = match![0];
    expect(check).toMatch(/rate\.\?limit/i);
    expect(check).toContain("429");
  });
});

describe("generation uses the customer's key, not the platform's", () => {
  const doc = read("docGenerationService.ts");

  it("resolves the document model from the workspace", () => {
    expect(doc).toContain("await getWorkspaceModel(workspaceId, DOC_MODEL)");
    expect(doc).not.toContain("getConfiguredModel(DOC_MODEL)");
  });

  it("resolves the diagram-repair model from the workspace too", () => {
    expect(doc).toContain("await getWorkspaceModel(workspaceId, DIAGRAM_MODEL)");
    expect(doc).not.toContain("getConfiguredModel(DIAGRAM_MODEL)");
  });
});
