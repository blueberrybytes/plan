import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export interface ModelLimits {
  modelName: string;
  maxTokens: number;
  description: string;
  tags: string[];
}

/**
 * Models a user can pick, and the context budget the router plans against.
 *
 * Two invariants, both load-bearing:
 *
 * 1. **Every model MUST support `structured_outputs` on OpenRouter.** The whole
 *    app extracts through `Output.object()`; a model that can't honour a JSON
 *    schema doesn't fail loudly, it returns prose that fails to parse.
 *
 * 2. **`maxTokens` MUST be at or below the model's real context.** This number
 *    is what decides "inject everything" vs "fall back to RAG" — declaring more
 *    than the model can take means the router confidently builds a prompt that
 *    the provider then rejects. MiniMax M2.7 was listed at 1,000,000 against a
 *    real 204,800 (~5x over) until this was checked against the live catalogue.
 *
 * Prices are USD per 1M tokens (input/output), verified against
 * `https://openrouter.ai/api/v1/models` on 2026-08-12. They move — re-check
 * with the snippet in MODELOS.md rather than trusting these numbers forever.
 */
export const AI_MODEL_LIMITS: Record<string, ModelLimits> = {
  // ── Budget: cheapest that still handle a full meeting + injected context ──
  "google/gemini-2.5-flash-lite": {
    modelName: "Gemini 2.5 Flash Lite",
    maxTokens: 1000000,
    description:
      "The cheapest option that still takes a whole codebase. ~$0.10/$0.40 per 1M tokens — around a quarter the cost of Flash. Best default when volume matters more than nuance.",
    tags: ["Cheapest", "High Context", "Google"],
  },
  "openai/gpt-5.6-luna": {
    modelName: "GPT-5.6 Luna",
    maxTokens: 1000000,
    description:
      "Newest OpenAI generation at budget pricing — ~$0.10/$0.60 per 1M tokens with a 1M context. Strong structured output for the money.",
    tags: ["Cheapest", "High Context", "OpenAI"],
  },
  "google/gemini-3.7-flash": {
    modelName: "Gemini 3.7 Flash",
    maxTokens: 1000000,
    description:
      "Fourteen months newer than 2.5 Flash and slightly cheaper for a transcript-shaped workload — ~$0.38/$1.88 per 1M tokens with a 1M context. The natural successor to the default.",
    tags: ["Balanced", "High Context", "Google"],
  },
  "google/gemini-2.5-flash": {
    modelName: "Gemini 2.5 Flash",
    maxTokens: 1000000,
    description:
      "Incredibly fast response times with a massive context window. ~$0.30/$2.50 per 1M tokens. Ideal for live chat and basic RAG.",
    tags: ["Fast", "Chat", "Google"],
  },
  // Declared at 380k, not the 1,048,576 it advertises: this model is served by
  // 17 providers and the smallest caps at 384,000. The headline is what the
  // best route offers, not what every route can take.
  "deepseek/deepseek-v4-flash": {
    modelName: "DeepSeek V4 Flash",
    maxTokens: 380000,
    description:
      "The cheapest option in the catalogue — ~$0.08/$0.17 per 1M tokens, roughly a third of Gemini Flash Lite, and it still swallows a long meeting. Replaces V3.2, which cost three times more for a sixth of the context.",
    tags: ["Cheapest", "Cheap Output", "DeepSeek"],
  },

  // ── Balanced: the sweet spot for most meeting work ────────────────────────
  "google/gemini-3.1-flash-lite": {
    modelName: "Gemini 3.1 Flash Lite",
    maxTokens: 1000000,
    description:
      "A generation newer than 2.5 Flash and still cheaper — ~$0.25/$1.50 per 1M tokens with a 1M context. The conservative upgrade.",
    tags: ["Balanced", "High Context", "Google"],
  },
  "z-ai/glm-5.2": {
    modelName: "GLM-5.2",
    maxTokens: 1000000,
    description:
      "1M context at ~$0.41/$1.27 per 1M tokens. Unusually cheap for its context size — worth a look for repo-scale analysis.",
    tags: ["Balanced", "High Context", "Z.ai"],
  },
  "openai/gpt-5-mini": {
    modelName: "GPT-5 Mini",
    maxTokens: 400000,
    description:
      "OpenAI's mid-tier at ~$0.25/$2.00 per 1M tokens. Very reliable on JSON schemas; 400k context covers any single meeting.",
    tags: ["Balanced", "Structured Output", "OpenAI"],
  },
  "minimax/minimax-m3": {
    modelName: "MiniMax M3",
    maxTokens: 1000000,
    description:
      "MiniMax's 1M-context model at ~$0.30/$1.20 per 1M tokens. Replaces M2.7, which advertised a context it did not have.",
    tags: ["Balanced", "High Context", "MiniMax"],
  },
  "anthropic/claude-haiku-4.5": {
    modelName: "Claude 4.5 Haiku",
    maxTokens: 200000,
    description:
      "Anthropic's fast tier at ~$1/$5 per 1M tokens. Anthropic's writing quality at a fraction of Sonnet's price, with a 200k window.",
    tags: ["Fast", "Writing", "Anthropic"],
  },

  // ── Strong: pick these when the output quality is what matters ────────────
  "anthropic/claude-sonnet-5": {
    modelName: "Claude 5 Sonnet",
    maxTokens: 1000000,
    description:
      "Newer and cheaper than 4.6 — ~$2/$10 per 1M tokens for the same 1M context. The default choice for diagrams, specs and anything a client reads.",
    tags: ["Balanced", "Coding", "Anthropic"],
  },
  "anthropic/claude-sonnet-4.6": {
    modelName: "Claude 4.6 Sonnet",
    maxTokens: 1000000,
    description:
      "The previous Sonnet generation at ~$3/$15 per 1M tokens. Kept for continuity; Sonnet 5 does the same job for less.",
    tags: ["Balanced", "Coding", "Anthropic"],
  },
  "google/gemini-3.1-pro-preview": {
    modelName: "Gemini 3.1 Pro",
    maxTokens: 1000000,
    description:
      "Google's flagship 2026 model at ~$2/$12 per 1M tokens. Best for massive datasets, huge codebases, and deep document analysis.",
    tags: ["High Context", "Reasoning", "Google"],
  },
  "x-ai/grok-4.6": {
    modelName: "Grok 4.6",
    maxTokens: 500000,
    description:
      "xAI's flagship at ~$2/$6 per 1M tokens — notably cheap output for its tier, with a 500k window. Same price as 4.5, one generation newer.",
    tags: ["Reasoning", "Cheap Output", "xAI"],
  },
  "qwen/qwen3-max": {
    modelName: "Qwen3 Max",
    maxTokens: 260000,
    description:
      "Alibaba's flagship at ~$0.78/$3.90 per 1M tokens. Strong multilingual performance — worth testing if your meetings aren't in English.",
    tags: ["Multilingual", "Reasoning", "Qwen"],
  },
  "openai/gpt-5.4": {
    modelName: "GPT-5.4",
    maxTokens: 1000000,
    description:
      "OpenAI's 1M-context workhorse at ~$2.50/$15 per 1M tokens. Reliable across the board when budget isn't the constraint.",
    tags: ["Frontier", "High Context", "OpenAI"],
  },

  // ── Frontier: expensive, for when nothing else is good enough ─────────────
  "anthropic/claude-opus-5": {
    modelName: "Claude 5 Opus",
    maxTokens: 1000000,
    description:
      "Anthropic's most capable model — ~$5/$25 per 1M tokens. For long multi-step reasoning where a mistake costs more than the tokens.",
    tags: ["High Reasoning", "Agentic", "Anthropic"],
  },
  "anthropic/claude-opus-4.7": {
    modelName: "Claude 4.7 Opus",
    maxTokens: 1000000,
    description:
      "The previous Opus generation, same ~$5/$25 pricing. Built for long-running multi-step tasks and end-to-end project orchestration.",
    tags: ["High Reasoning", "Agentic", "Anthropic"],
  },
  "openai/gpt-5.5": {
    modelName: "GPT-5.5",
    maxTokens: 1000000,
    description:
      "OpenAI's frontier model at ~$5/$30 per 1M tokens, with 1M context and a strong cache hit rate on repeated context.",
    tags: ["Frontier", "High Context", "OpenAI"],
  },
  "moonshotai/kimi-k3": {
    modelName: "Kimi K3",
    maxTokens: 1000000,
    description:
      "Moonshot's frontier model, ~$3/$15 per 1M tokens with a 1M context. Priced like Sonnet 4.6 — a quality choice, not a cost saving.",
    tags: ["Frontier", "High Context", "Moonshot"],
  },

  // ── Open weights ──────────────────────────────────────────────────────────
  // 60k, not the 160k this briefly claimed: R1 is down to a single provider
  // serving 64k, so the usable window collapsed when the others dropped off.
  // Provider mix moves — re-check with `yarn verify:models`, not from memory.
  "deepseek/deepseek-r1": {
    modelName: "DeepSeek R1",
    maxTokens: 60000,
    description:
      "DeepSeek's reasoning model, ~$0.70/$2.50 per 1M tokens. Specialised in chain-of-thought logic and system architecture.",
    tags: ["Reasoning", "Open Source", "DeepSeek"],
  },
  "meta-llama/llama-3.3-70b-instruct": {
    modelName: "Llama 3.3 70B",
    maxTokens: 130000,
    description:
      "Meta's open LLM at ~$0.10/$0.32 per 1M tokens, optimised for instruction following and general tasks.",
    tags: ["Open Source", "Meta", "Cheapest"],
  },

  // Neutrally-aligned option. Safety-tuned models sometimes decline to
  // summarise a legitimate meeting — a security incident, an HR case, a legal
  // dispute, or simply blunt language — and a refusal on a recording the user
  // already owns is a product failure, not a safeguard. Hermes follows the
  // system prompt instead of applying judgements of its own.
  //
  // Deliberately NOT one of the "uncensored" roleplay fine-tunes: those are
  // built for fiction, are weak at extraction, and the best known one (Dolphin
  // Venice) doesn't support structured_outputs at all, so picking it would
  // silently break every ticket the pipeline tries to extract.
  "nousresearch/hermes-3-llama-3.1-70b": {
    modelName: "Hermes 3 70B",
    maxTokens: 130000,
    description:
      "Neutrally aligned and highly steerable — it follows your instructions rather than refusing on its own judgement. Pick it when a meeting covers material other models decline to summarise. ~$0.70/$0.70 per 1M tokens. Being Llama-3.1-era, extraction quality sits below the frontier options.",
    tags: ["Unfiltered", "Open Source", "Nous"],
  },
};

// 80% usage threshold to leave room for the actual prompt & transcript text
const SAFETY_THRESHOLD = 0.8;

// Rough heuristic: 1 token is approximately 4 bytes (characters) of English text.
// We use 3.5 to be slightly more conservative.
const BYTES_PER_TOKEN_HEURISTIC = 3.5;

export type ContextInjectionStrategy = "FULL_INJECTION" | "RAG";

export interface ContextRouterResult {
  strategy: ContextInjectionStrategy;
  estimatedTokens: number;
  maxTokensSelected: number;
  totalSizeBytes: number;
}

export class AIContextRouter {
  /**
   * Calculates the combined size of the requested contexts in bytes and compares it to the LLM's capacity.
   * If it fits safely inside the context window, it returns FULL_INJECTION. Otherwise, RAG.
   */
  public async decideStrategy(
    contextIds: string[],
    modelKey: string,
  ): Promise<ContextRouterResult> {
    if (!contextIds || contextIds.length === 0) {
      return {
        strategy: "FULL_INJECTION",
        estimatedTokens: 0,
        maxTokensSelected: 0,
        totalSizeBytes: 0,
      };
    }

    const limits = AI_MODEL_LIMITS[modelKey];
    if (!limits) {
      logger.warn(
        `Model key [${modelKey}] not found in AI_MODEL_LIMITS router. Defaulting to RAG.`,
      );
      return {
        strategy: "RAG",
        estimatedTokens: -1,
        maxTokensSelected: 0,
        totalSizeBytes: 0,
      };
    }

    // Aggregate total sizeBytes of all files across all selected context IDs
    const aggregations = await prisma.contextFile.aggregate({
      where: { contextId: { in: contextIds } },
      _sum: { sizeBytes: true },
    });

    const totalSizeBytes = aggregations._sum.sizeBytes ?? 0;
    const estimatedTokens = Math.ceil(totalSizeBytes / BYTES_PER_TOKEN_HEURISTIC);
    const maximumAllowedTokens = limits.maxTokens * SAFETY_THRESHOLD;

    const strategy: ContextInjectionStrategy =
      estimatedTokens < maximumAllowedTokens ? "FULL_INJECTION" : "RAG";

    logger.info(
      `AI Context Router [${modelKey}]: Estimated ${estimatedTokens} tokens (${totalSizeBytes} bytes). Context Window limit is ${limits.maxTokens}. Selected Strategy: ${strategy}`,
    );

    return {
      strategy,
      estimatedTokens,
      maxTokensSelected: maximumAllowedTokens,
      totalSizeBytes,
    };
  }
}

export const aiContextRouter = new AIContextRouter();
