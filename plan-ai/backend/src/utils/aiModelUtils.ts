import { createOpenRouter, type OpenRouterUsageAccounting } from "@openrouter/ai-sdk-provider";
import EnvUtils from "./EnvUtils";
import { AI_MODEL_LIMITS } from "../services/aiContextRouter";
import prisma from "../prisma/prismaClient";
import { logger } from "./logger";

// Gemini 3.7 Flash. Handles structured extraction and prose for the whole app.
//
// Replaced 2.5 Flash, which was fourteen months older, at effectively the same
// price: input went up ($0.300 to $0.375 per 1M) and output came down ($2.500
// to $1.875). Break-even sits at an input:output ratio of 8.3 to 1, and our
// meetings land right about there, so the bill moves by well under 1% in either
// direction. It only loses on very input-heavy calls (roughly 10% more at 20 to
// 1). Before assuming a ratio, measure it: AiUsageLog stores inputTokens and
// outputTokens per call.
//
// Same 1M context and same lineage, so the tokenizer, the json_schema
// behaviour and Google's implicit prompt caching all carry over unchanged.
export const DEFAULT_AI_MODEL = "google/gemini-3.7-flash";

// FAST is deliberately a rung BELOW the default. It used to be the same model,
// which made the name a lie and the constant pointless. Flash Lite keeps the
// Gemini behaviour (same tokenizer, same json_schema handling, same implicit
// Google caching) at ~$0.10/$0.40 per 1M instead of $0.375/$1.875, and it's what
// powers chat, context-document processing and the Telegram agent: high volume,
// low stakes per call, and a bad answer is immediately visible and retryable.
//
// Staying on 2.5 Flash Lite on purpose. The 3.1 generation of Lite costs
// $0.25/$1.50, which is nearly a full Flash, so moving up would collapse the
// gap this constant exists to keep.
export const FAST_AI_MODEL = "google/gemini-2.5-flash-lite";

// ── Per-task model selection ───────────────────────────────────────────────
// These three all track the default. They're separate constants so a task can
// be moved on its own when there's a reason to, not because they differ today.
export const TICKET_MODEL = "google/gemini-3.7-flash"; // task/ticket extraction
export const DOC_MODEL = "google/gemini-3.7-flash"; // markdown document generation
export const SLIDE_MODEL = "google/gemini-3.7-flash"; // slide deck generation
// Haiku 4.5 rather than Sonnet: ~$1/$5 per 1M instead of Sonnet 4.6's $3/$15.
//
// The original reasoning (Mermaid's grammar is strict, a single error makes the
// diagram unrenderable) was sound when written, but the economics had drifted
// badly: at Sonnet prices ONE diagram cost roughly twice as much as processing
// the entire rest of the meeting. And the safety net has grown since. The
// frontend runs `repairMermaidSyntax` before every render, with targeted fixes
// for the failures actually seen in the wild (quotes inside labels, xychart
// corruption, zero-duration Gantt tasks). A syntax slip is no longer fatal.
//
// Haiku keeps the Anthropic lineage that handles strict syntax well, and 200k
// context is far more than a diagram prompt needs. If diagram quality regresses
// this is one constant to move back, and it should be measured with the Mermaid
// parser rather than by eye (see MODELOS.md).
export const DIAGRAM_MODEL = "anthropic/claude-haiku-4.5"; // Mermaid generation + repair

// Model used for the "big-context cached" route (e.g. injecting a whole repo).
// Gemini 3.7 Flash: 1M context (a stripped repo fits), cheap, reliable
// json_schema, and Google applies *implicit* prompt caching automatically, with
// no `cache_control` needed (that directive is Anthropic-only). We pin the
// provider (allow_fallbacks: false) so repeated calls in a meeting's burst hit
// the same endpoint and reuse the warm cache instead of bouncing across
// providers.
//
// Pinning is why this constant must stay on a model whose smallest route serves
// the full window: with fallbacks off there is no reroute to a bigger endpoint.
export const CACHED_CONTEXT_MODEL = "google/gemini-3.7-flash";
// Fallback models used when the primary model fails.
//
// Two rules, both learned the hard way:
//
// 1. Every model here MUST support json_schema structured output on
//    OpenRouter — we use Output.object() across the entire app, and a fallback
//    that can't honour a schema turns a recoverable failure into a parse error.
//
// 2. They must NOT share a provider with the primary model. The default is
//    Google; if Google is the reason the primary failed, a Google fallback
//    fails with it. That's why this list is OpenAI + Anthropic.
//
// Context matters more than price here: fallbacks fire rarely, but they fire on
// the hardest requests. `gpt-4o-mini` was picked as the cheap "gold standard"
// and capped at 128k — too small for a long meeting with injected context, so
// it failed exactly when it was needed. Prices verified 2026-08-12.
export const FALLBACK_MODELS = [
  "openai/gpt-5.6-luna", // 1.05M context, ~$0.20/$1.20 list (currently 50% off)
  "openai/gpt-5-mini", // 400k, very reliable on json_schema
  "anthropic/claude-sonnet-5", // different provider again; 1M context
];

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "MISSING_API_KEY: Please configure an OpenRouter API key in your Workspace Settings to use AI features.",
    );
    this.name = "MissingApiKeyError";
  }
}

/**
 * Returns a configured model instance dynamically with an optional API key.
 * Fallbacks are always enabled — every model in FALLBACK_MODELS supports
 * json_schema structured output so it is always safe to fall back.
 */
export function getConfiguredModel(modelKey?: string, apiKey?: string) {
  const primaryModel = modelKey && modelKey.length > 0 ? modelKey : DEFAULT_AI_MODEL;
  const fallbacks = FALLBACK_MODELS.filter((m) => m !== primaryModel);

  const openrouter = createOpenRouter({
    apiKey: apiKey || EnvUtils.get("OPENROUTER_API_KEY"),
  });

  return openrouter(primaryModel, fallbacks.length > 0 ? { models: fallbacks } : undefined);
}

/**
 * Helper to fetch a Workspace's OpenRouter API key and return a configured model.
 * Fallbacks are always enabled — see FALLBACK_MODELS for the curated safe list.
 */
async function resolveWorkspaceApiKey(workspaceId: string): Promise<string> {
  let apiKey: string | undefined = undefined;
  let isCourtesy = false;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { openRouterKey: true, isCourtesy: true },
    });

    if (workspace?.isCourtesy) {
      isCourtesy = true;
    }

    // Only accept valid-looking OpenRouter keys (sk-or-)
    if (workspace?.openRouterKey && workspace.openRouterKey.trim().startsWith("sk-or-")) {
      apiKey = workspace.openRouterKey.trim();
    }
  } catch (error) {
    logger.error(`[resolveWorkspaceApiKey] Failed to fetch workspace ${workspaceId}`, error);
  }

  // Fallback to the global key ONLY if the workspace has courtesy access
  if (!apiKey && isCourtesy) {
    apiKey = EnvUtils.get("OPENROUTER_API_KEY");
  }

  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  return apiKey;
}

export async function getWorkspaceModel(workspaceId: string, modelKey?: string) {
  const apiKey = await resolveWorkspaceApiKey(workspaceId);
  return getConfiguredModel(modelKey, apiKey);
}

/**
 * Resolve the OpenAI API key used for EMBEDDINGS (BYOK). Order:
 *   1. The workspace's own `openaiKey` (must look like `sk-`).
 *   2. The global `OPENAI_API_KEY` for courtesy workspaces.
 *   3. Safety-net fallback to the global key (with a warning) so RAG keeps
 *      working for workspaces that haven't configured their key yet.
 * Returns `{ apiKey, usedFallback }`; `usedFallback` flags that the cost lands
 * on the platform key rather than the customer's (useful for usage logging).
 */
export async function resolveWorkspaceOpenAIKey(
  workspaceId: string,
): Promise<{ apiKey: string; usedFallback: boolean }> {
  let apiKey: string | undefined = undefined;
  let isCourtesy = false;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { openaiKey: true, isCourtesy: true },
    });
    if (workspace?.isCourtesy) isCourtesy = true;
    // Only accept valid-looking OpenAI keys (sk-…), not an OpenRouter key.
    if (
      workspace?.openaiKey &&
      workspace.openaiKey.trim().startsWith("sk-") &&
      !workspace.openaiKey.trim().startsWith("sk-or-")
    ) {
      return { apiKey: workspace.openaiKey.trim(), usedFallback: false };
    }
  } catch (error) {
    logger.error(`[resolveWorkspaceOpenAIKey] Failed to fetch workspace ${workspaceId}`, error);
  }

  // Courtesy workspaces use the global key by design.
  if (isCourtesy) {
    apiKey = EnvUtils.get("OPENAI_API_KEY");
    if (apiKey) return { apiKey, usedFallback: false };
  }

  // Safety net: fall back to the global key so RAG doesn't break for workspaces
  // that haven't set their OpenAI key. Cost lands on the platform — flagged.
  apiKey = EnvUtils.get("OPENAI_API_KEY");
  if (apiKey) {
    logger.warn(
      `[resolveWorkspaceOpenAIKey] Workspace ${workspaceId} has no OpenAI key — falling back to the platform key for embeddings.`,
    );
    return { apiKey, usedFallback: true };
  }

  throw new MissingApiKeyError();
}

/** OpenAI-compatible base URL for OpenRouter (chat, embeddings, …). */
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface WorkspaceEmbeddingConfig {
  apiKey: string;
  /** Set when embeddings go through OpenRouter (OpenAI-compatible) vs OpenAI directly. */
  baseURL?: string;
  /** Embedding model id — namespaced for OpenRouter, plain for OpenAI. */
  model: string;
  /** True when the cost lands on a platform key rather than the workspace's own. */
  usedFallback: boolean;
}

/**
 * Resolve the embedding client config for a workspace. Embeddings now run
 * through the workspace's OpenRouter key (OpenRouter shipped an OpenAI-compatible
 * embeddings endpoint), so BYOK needs only 2 keys: OpenRouter + Deepgram.
 *
 * Resolution order:
 *   1. Workspace `openRouterKey` (sk-or-…) → OpenRouter, `openai/text-embedding-3-small`.
 *   2. Backward-compat: workspace `openaiKey` (sk-…) → OpenAI directly, `text-embedding-3-small`.
 *   3. Courtesy / safety net: global OPENROUTER_API_KEY, then OPENAI_API_KEY.
 *
 * Both routes use the SAME underlying model (1536-dim), so existing Qdrant
 * vectors stay compatible — no re-embedding needed.
 */
export async function resolveWorkspaceEmbeddingConfig(
  workspaceId: string,
): Promise<WorkspaceEmbeddingConfig> {
  const OR_MODEL = "openai/text-embedding-3-small";
  const OAI_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  let isCourtesy = false;
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { openRouterKey: true, openaiKey: true, isCourtesy: true },
    });
    if (workspace?.isCourtesy) isCourtesy = true;

    const orKey = workspace?.openRouterKey?.trim();
    if (orKey && orKey.startsWith("sk-or-")) {
      return { apiKey: orKey, baseURL: OPENROUTER_BASE_URL, model: OR_MODEL, usedFallback: false };
    }
    // Backward compatibility: workspaces that still carry a dedicated OpenAI key.
    const oaiKey = workspace?.openaiKey?.trim();
    if (oaiKey && oaiKey.startsWith("sk-") && !oaiKey.startsWith("sk-or-")) {
      return { apiKey: oaiKey, model: OAI_MODEL, usedFallback: false };
    }
  } catch (error) {
    logger.error(
      `[resolveWorkspaceEmbeddingConfig] Failed to fetch workspace ${workspaceId}`,
      error,
    );
  }

  // Courtesy workspaces + safety net for unconfigured workspaces: global keys,
  // preferring OpenRouter so we stay on a single provider.
  const globalOpenRouter = EnvUtils.get("OPENROUTER_API_KEY");
  if (globalOpenRouter) {
    if (!isCourtesy) {
      logger.warn(
        `[resolveWorkspaceEmbeddingConfig] Workspace ${workspaceId} has no usable key — using platform OpenRouter key for embeddings.`,
      );
    }
    return {
      apiKey: globalOpenRouter,
      baseURL: OPENROUTER_BASE_URL,
      model: OR_MODEL,
      usedFallback: !isCourtesy,
    };
  }
  const globalOpenAI = EnvUtils.get("OPENAI_API_KEY");
  if (globalOpenAI) {
    return { apiKey: globalOpenAI, model: OAI_MODEL, usedFallback: !isCourtesy };
  }
  throw new MissingApiKeyError();
}

/**
 * Model for the "big-context cached" route — injecting a whole repo / large
 * stable context that should stay warm in the provider's prompt cache across a
 * burst of calls (ticket + doc + slides + chat for one meeting).
 *
 * Uses CACHED_CONTEXT_MODEL (Gemini 2.5 Flash) and pins the provider
 * (`allow_fallbacks: false`) so OpenRouter doesn't bounce repeated calls across
 * providers — which would cold-miss the cache every time. We deliberately do NOT
 * attach the wide model-fallback list here: falling back to a different model
 * also discards the cache, and the caller already handles failures (Fix A throw
 * → FAILED → retry). Gemini's prompt caching is implicit (Google-side), so no
 * `cache_control` directive is needed; keeping the prompt PREFIX byte-stable is
 * what earns the cache hit.
 */
export async function getCachedContextModel(workspaceId: string) {
  const apiKey = await resolveWorkspaceApiKey(workspaceId);
  const openrouter = createOpenRouter({ apiKey });
  return openrouter(CACHED_CONTEXT_MODEL, {
    provider: { allow_fallbacks: false },
  });
}

/**
 * providerOptions for the cached-context route. Mirror of getCachedContextModel
 * for call sites that pass providerOptions explicitly (generateText/generateObject).
 */
export function getCachedContextProviderOptions() {
  return {
    openrouter: {
      provider: { allow_fallbacks: false },
      usage: { include: true },
    },
  };
}

/**
 * Returns the Vercel AI providerOptions object with model fallbacks configured.
 */
export function getFallbackProviderOptions(modelKey?: string) {
  const primaryModel = modelKey && modelKey.length > 0 ? modelKey : DEFAULT_AI_MODEL;
  const fallbacks = FALLBACK_MODELS.filter((m) => m !== primaryModel);
  // `usage: { include: true }` turns on OpenRouter usage accounting so the
  // response carries the REAL cost + cached-token breakdown (see
  // extractOpenRouterUsage). Always enabled, even without model fallbacks.
  return {
    openrouter: {
      ...(fallbacks.length > 0 ? { models: fallbacks } : {}),
      usage: { include: true },
    },
  };
}

/**
 * Same as getFallbackProviderOptions, but additionally enables OpenRouter's
 * `response-healing` plugin, which auto-repairs malformed JSON returned by the
 * model (trailing commas, unterminated strings, wrong quoting…) instead of
 * letting the whole structured generation throw.
 *
 * IMPORTANT: use this ONLY for NON-STREAMING structured output — i.e.
 * `generateText`/`generateObject` with `Output.object` (which sends
 * `response_format: json_schema`). The plugin is a no-op on `streamText`
 * (per the provider's own typings), so do NOT use it on streaming call sites.
 */
export function getStructuredProviderOptions(modelKey?: string) {
  const base = getFallbackProviderOptions(modelKey);
  return {
    openrouter: {
      ...base.openrouter,
      plugins: [{ id: "response-healing" as const }],
    },
  };
}

/**
 * Same as getStructuredProviderOptions, but PINS the upstream provider
 * (`provider.allow_fallbacks: false`) so OpenRouter doesn't bounce repeated
 * calls across different providers/endpoints of the same model — which
 * cold-misses Gemini's implicit prompt cache (TTL ~3–5 min). Measured: an
 * un-pinned route flip-flopped 0% → 95% → 0% cached prompt tokens on identical
 * back-to-back calls, while the pinned route held ~95% (cost −77% on a warm
 * call). Provider-pinning and the json_schema MODEL fallbacks (FALLBACK_MODELS)
 * are orthogonal in OpenRouter — `allow_fallbacks` only stops *provider*
 * bouncing — so the structured-output safety net stays intact.
 */
export function getCachedStructuredProviderOptions(modelKey?: string) {
  const base = getStructuredProviderOptions(modelKey);
  return {
    openrouter: {
      ...base.openrouter,
      provider: { allow_fallbacks: false },
    },
  };
}

/**
 * Provider options that also turn ON OpenRouter reasoning tokens, so the model
 * streams its chain-of-thought. Reasoning-capable models (Gemini 2.5, Claude,
 * DeepSeek, …) emit `reasoning-delta` stream parts; models that don't support it
 * simply ignore the flag (graceful no-op). Used to power the live "thinking"
 * panel in chat.
 */
export function getReasoningProviderOptions(
  modelKey?: string,
  effort: "high" | "medium" | "low" = "medium",
) {
  const base = getFallbackProviderOptions(modelKey);
  return {
    openrouter: {
      ...base.openrouter,
      reasoning: { effort },
    },
  };
}

export interface ExtractedUsage {
  inputTokens: number;
  outputTokens: number;
  /** Prompt tokens served from the provider's cache (Gemini/Anthropic). */
  cachedTokens: number;
  /** Real cost in USD reported by OpenRouter, when usage accounting is on. */
  cost?: number;
}

/**
 * Pull real usage out of a generateText/generateObject result. Prefers
 * OpenRouter's usage accounting (real cost + cached tokens, requires
 * `usage: { include: true }`) and falls back to the SDK's basic token counts.
 */
export function extractOpenRouterUsage(result: {
  usage?: { inputTokens?: number; outputTokens?: number };
  totalUsage?: { inputTokens?: number; outputTokens?: number };
  providerMetadata?: Record<string, unknown>;
}): ExtractedUsage {
  const openrouterMeta = result.providerMetadata?.openrouter as
    | { usage?: OpenRouterUsageAccounting }
    | undefined;
  const orUsage = openrouterMeta?.usage;
  const base = result.totalUsage ?? result.usage;
  return {
    inputTokens: orUsage?.promptTokens ?? base?.inputTokens ?? 0,
    outputTokens: orUsage?.completionTokens ?? base?.outputTokens ?? 0,
    cachedTokens: orUsage?.promptTokensDetails?.cachedTokens ?? 0,
    cost: orUsage?.cost,
  };
}

/**
 * Returns the maximum number of RAG context chunks safe for the given model's context window.
 * Dynamically calculated based on the precise maxTokens configured in AI_MODEL_LIMITS.
 * A single chunk is typically ~800 characters (~200 tokens).
 */
export function getMaxContextChunks(modelKey?: string): number {
  const primaryModel = modelKey && modelKey.length > 0 ? modelKey : DEFAULT_AI_MODEL;
  const limits = AI_MODEL_LIMITS[primaryModel];

  if (!limits) {
    return 300; // Default fallback for unknown models
  }

  // Massive context models (1M+ tokens)
  if (limits.maxTokens >= 1000000) {
    return 1500; // ~300k tokens MAX
  }

  // Standard context models (e.g., 128k, 200k)
  if (limits.maxTokens >= 100000) {
    return 500; // ~100k tokens MAX
  }

  // Small context models
  return 300;
}
