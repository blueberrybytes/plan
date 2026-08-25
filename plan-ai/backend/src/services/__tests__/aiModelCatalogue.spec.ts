import { describe, it, expect, vi } from "vitest";

/**
 * The model list users pick from carries two claims that break things quietly
 * when wrong.
 *
 * `maxTokens` is what decides "inject the whole context" vs "fall back to RAG".
 * MiniMax M2.7 was listed at 1,000,000 against a real context of 204,800 — five
 * times over — so the router would happily build a prompt the provider then
 * rejected. Nothing in the app noticed until the catalogue was checked against
 * OpenRouter.
 *
 * These tests pin the invariants that are checkable offline. The live check
 * (against `https://openrouter.ai/api/v1/models`) belongs in a scheduled job,
 * not in the unit suite — network flakiness must not fail CI.
 */

vi.mock("@prisma/client", () => ({ PrismaClient: class {} }));
vi.mock("../../prisma/prismaClient", () => ({ default: {} }));
vi.mock("../../utils/EnvUtils", () => ({ default: { get: () => "sk-or-test" } }));

import { AI_MODEL_LIMITS } from "../aiContextRouter";
import {
  DEFAULT_AI_MODEL,
  FAST_AI_MODEL,
  FALLBACK_MODELS,
  DIAGRAM_MODEL,
  TICKET_MODEL,
  DOC_MODEL,
  SLIDE_MODEL,
  CACHED_CONTEXT_MODEL,
} from "../../utils/aiModelUtils";

/**
 * Real context windows from OpenRouter, verified 2026-08-12. Update alongside
 * the catalogue — a model here with a bigger declared window is a live bug.
 */
const REAL_CONTEXT: Record<string, number> = {
  "google/gemini-2.5-flash-lite": 1_048_576,
  "openai/gpt-5.6-luna": 1_050_000,
  "google/gemini-2.5-flash": 1_048_576,
  "deepseek/deepseek-v3.2": 163_840,
  "google/gemini-3.1-flash-lite": 1_048_576,
  "z-ai/glm-5.2": 1_048_576,
  "openai/gpt-5-mini": 400_000,
  "minimax/minimax-m3": 1_048_576,
  "anthropic/claude-haiku-4.5": 200_000,
  "anthropic/claude-sonnet-5": 1_000_000,
  "anthropic/claude-sonnet-4.6": 1_000_000,
  "google/gemini-3.1-pro-preview": 1_048_576,
  "x-ai/grok-4.5": 500_000,
  "qwen/qwen3-max": 262_144,
  "openai/gpt-5.4": 1_050_000,
  "anthropic/claude-opus-5": 1_000_000,
  "anthropic/claude-opus-4.7": 1_000_000,
  "openai/gpt-5.5": 1_050_000,
  "moonshotai/kimi-k3": 1_048_576,
  "deepseek/deepseek-r1": 64_000,
  "meta-llama/llama-3.3-70b-instruct": 131_072,
  "nousresearch/hermes-3-llama-3.1-70b": 131_072,
};

describe("AI model catalogue", () => {
  it("never promises more context than the model actually has", () => {
    const overshooting = Object.entries(AI_MODEL_LIMITS)
      .filter(([id]) => REAL_CONTEXT[id] !== undefined)
      .filter(([id, limits]) => limits.maxTokens > REAL_CONTEXT[id])
      .map(([id, limits]) => `${id}: declares ${limits.maxTokens}, real ${REAL_CONTEXT[id]}`);

    expect(overshooting).toEqual([]);
  });

  it("has a verified real-context entry for every listed model", () => {
    // Forces whoever adds a model to look up its real window instead of
    // guessing — the exact step that was skipped for MiniMax.
    const unverified = Object.keys(AI_MODEL_LIMITS).filter((id) => REAL_CONTEXT[id] === undefined);
    expect(unverified).toEqual([]);
  });

  it("gives every model a name, a description and tags", () => {
    for (const [id, limits] of Object.entries(AI_MODEL_LIMITS)) {
      expect(limits.modelName, `${id} name`).toBeTruthy();
      expect(limits.description.length, `${id} description`).toBeGreaterThan(30);
      expect(limits.tags.length, `${id} tags`).toBeGreaterThan(0);
    }
  });

  it("keeps every model id in OpenRouter's author/slug form", () => {
    // A bare slug silently resolves to a different model — or to nothing.
    for (const id of Object.keys(AI_MODEL_LIMITS)) {
      expect(id, `${id} should be author/slug`).toMatch(/^[a-z0-9-]+\/[a-zA-Z0-9._-]+$/);
    }
  });

  it("spans the price range, so the picker is an actual choice", () => {
    // The point of a long list is covering budget → frontier. If every option
    // sits in one tier the list is just noise.
    const tags = new Set(Object.values(AI_MODEL_LIMITS).flatMap((m) => m.tags));
    expect(tags.has("Cheapest")).toBe(true);
    expect(tags.has("Balanced")).toBe(true);
    expect(tags.has("Frontier")).toBe(true);
  });

  it("offers more than one provider per tier, so an outage isn't a dead end", () => {
    const providers = new Set(Object.keys(AI_MODEL_LIMITS).map((id) => id.split("/")[0]));
    expect(providers.size).toBeGreaterThanOrEqual(6);
  });
});

describe("fallback chain", () => {
  const providerOf = (id: string) => id.split("/")[0];

  it("never falls back to the provider that just failed", () => {
    // The whole point of a fallback is surviving a provider outage. A Google
    // fallback behind a Google primary fails with it and buys nothing.
    const primary = providerOf(DEFAULT_AI_MODEL);
    const sameProvider = FALLBACK_MODELS.filter((m) => providerOf(m) === primary);
    expect(sameProvider).toEqual([]);
  });

  it("spreads the fallbacks across more than one provider", () => {
    expect(new Set(FALLBACK_MODELS.map(providerOf)).size).toBeGreaterThanOrEqual(2);
  });

  it("gives every fallback room for a long meeting plus injected context", () => {
    // `gpt-4o-mini` sat here at 128k and ran out of room on exactly the long
    // requests that made the primary fail in the first place.
    const MIN_CONTEXT = 200_000;
    const tooSmall = FALLBACK_MODELS.filter(
      (m) => REAL_CONTEXT[m] !== undefined && REAL_CONTEXT[m] < MIN_CONTEXT,
    );
    expect(tooSmall).toEqual([]);
  });

  it("keeps every per-task model on a verified id", () => {
    // A typo here doesn't throw — it silently routes to nothing.
    const perTask = [
      DEFAULT_AI_MODEL,
      FAST_AI_MODEL,
      DIAGRAM_MODEL,
      TICKET_MODEL,
      DOC_MODEL,
      SLIDE_MODEL,
      CACHED_CONTEXT_MODEL,
      ...FALLBACK_MODELS,
    ];
    const unverified = perTask.filter((m) => REAL_CONTEXT[m] === undefined);
    expect(unverified).toEqual([]);
  });

  it("keeps FAST genuinely cheaper than the default, or the name is a lie", () => {
    // These were the same model for a while, which made the constant pointless
    // and quietly billed chat at the default rate.
    expect(FAST_AI_MODEL).not.toBe(DEFAULT_AI_MODEL);
  });

  it("offers every user-pickable model as a real catalogue entry", () => {
    // A per-task model missing from AI_MODEL_LIMITS has no context budget, so
    // aiContextRouter falls back to RAG for it and logs a warning per call.
    const routed = [DEFAULT_AI_MODEL, FAST_AI_MODEL, DIAGRAM_MODEL, CACHED_CONTEXT_MODEL];
    const missing = routed.filter((m) => AI_MODEL_LIMITS[m] === undefined);
    expect(missing).toEqual([]);
  });
});
