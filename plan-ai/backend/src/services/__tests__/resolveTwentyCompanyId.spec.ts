import { describe, it, expect, vi } from "vitest";

/**
 * Which company a meeting note lands on is the one decision that, if wrong,
 * writes into a CLIENT's CRM. These pin the precedence rule.
 */

vi.mock("../../prisma/prismaClient", () => ({ default: {} }));

import { resolveTwentyCompanyId } from "../projectTranscriptService";

describe("resolveTwentyCompanyId", () => {
  it("uses the company picked when saving the recording", () => {
    expect(resolveTwentyCompanyId("co-uriach", null)).toBe("co-uriach");
  });

  it("lets the per-recording choice override the project's linked company", () => {
    // The whole point of the redesign: the same person meets Uriach in the
    // morning and Acme in the afternoon, both filed under one project.
    expect(resolveTwentyCompanyId("co-acme", { twentyCompanyId: "co-uriach" })).toBe("co-acme");
  });

  it("falls back to the project's linked company for recurring client work", () => {
    expect(resolveTwentyCompanyId(undefined, { twentyCompanyId: "co-uriach" })).toBe("co-uriach");
  });

  it("returns undefined when neither is available (caller marks it SKIPPED)", () => {
    expect(resolveTwentyCompanyId(undefined, null)).toBeUndefined();
    expect(resolveTwentyCompanyId(undefined, {})).toBeUndefined();
  });

  it("treats blank/whitespace ids as absent rather than pushing to nowhere", () => {
    expect(resolveTwentyCompanyId("   ", null)).toBeUndefined();
    expect(resolveTwentyCompanyId("   ", { twentyCompanyId: "co-uriach" })).toBe("co-uriach");
    expect(resolveTwentyCompanyId(undefined, { twentyCompanyId: "  " })).toBeUndefined();
  });

  it("survives a project whose metadata is unrelated JSON", () => {
    expect(resolveTwentyCompanyId(undefined, { digestDocId: "d1" })).toBeUndefined();
    expect(resolveTwentyCompanyId(undefined, "not an object")).toBeUndefined();
  });
});
