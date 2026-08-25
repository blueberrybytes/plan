/**
 * Checks every model in AI_MODEL_LIMITS against OpenRouter.
 *
 *   yarn verify:models
 *
 * Model ids are typed by hand into the catalogue, so a typo is one keystroke
 * away and produces a model that simply never resolves. Worse, `maxTokens`
 * feeds the RAG-vs-inject decision: declaring more context than the provider
 * accepts builds prompts that get rejected at call time, not at deploy time.
 * MiniMax M2.7 sat in the list at 1,000,000 against a real 204,800 until this
 * was run.
 *
 * Verifies four things per model:
 *   1. the id exists in the catalogue           (typo check)
 *   2. /models/{id}/endpoints resolves          (routable, not just listed)
 *   3. at least one provider is actually live   (listed ≠ serving)
 *   4. structured_outputs is supported          (the app extracts via schemas)
 *   5. declared maxTokens ≤ real context        (the RAG-vs-inject decision)
 *
 * Read-only and unauthenticated: it hits public endpoints and burns no credit.
 * Exits non-zero when something is wrong, so it can run in CI or on a cron.
 */
import { AI_MODEL_LIMITS } from "../services/aiContextRouter";

interface CatalogueModel {
  id: string;
  context_length?: number;
  supported_parameters?: string[];
  pricing?: { prompt?: string; completion?: string };
}

const OPENROUTER_MODELS = "https://openrouter.ai/api/v1/models";

const perMillion = (raw?: string): string => {
  const n = Number(raw);
  return Number.isFinite(n) ? `$${(n * 1_000_000).toFixed(3)}` : "?";
};

const main = async (): Promise<void> => {
  const listed = (await (await fetch(OPENROUTER_MODELS)).json()) as { data: CatalogueModel[] };
  const catalogue = new Map(listed.data.map((m) => [m.id, m]));

  const ids = Object.keys(AI_MODEL_LIMITS);
  console.log(`Checking ${ids.length} models against OpenRouter\n`);

  const problems: string[] = [];

  for (const id of ids) {
    const declared = AI_MODEL_LIMITS[id].maxTokens;
    const model = catalogue.get(id);

    // A bad id 404s here — the check a catalogue lookup alone can't make.
    const res = await fetch(`${OPENROUTER_MODELS}/${id}/endpoints`);
    let providers = 0;
    let smallestProviderContext = Infinity;
    if (res.ok) {
      const body = (await res.json()) as {
        data?: { endpoints?: { context_length?: number }[] };
      };
      const endpoints = body.data?.endpoints ?? [];
      providers = endpoints.length;
      for (const e of endpoints) {
        if (typeof e.context_length === "number" && e.context_length > 0) {
          smallestProviderContext = Math.min(smallestProviderContext, e.context_length);
        }
      }
    }

    // The headline is the best any provider offers; individual providers can
    // serve far less (DeepSeek V4 Flash advertises 1,048,576 while some of its
    // routes cap at 384,000). OpenRouter normally skips providers too small for
    // the request, so exceeding the headline is the hard error, and exceeding
    // the floor is a warning — it turns into a real failure on the route that
    // pins the provider (`allow_fallbacks: false`, used for the cached-context
    // model), where there is no reroute to a bigger endpoint.
    const real = model?.context_length ?? 0;
    const providerFloor = Number.isFinite(smallestProviderContext)
      ? smallestProviderContext
      : real;
    const hasSchema = (model?.supported_parameters ?? []).includes("structured_outputs");

    const issues: string[] = [];
    if (!model) issues.push("not in catalogue (typo?)");
    if (!res.ok) issues.push(`endpoints returned HTTP ${res.status}`);
    if (providers === 0) issues.push("no live provider");
    if (model && !hasSchema) issues.push("no structured_outputs — breaks Output.object()");
    if (model && declared > real) {
      issues.push(
        `declares ${declared.toLocaleString()} context, real is ${real.toLocaleString()}`,
      );
    }

    const price = model
      ? `${perMillion(model.pricing?.prompt)}/${perMillion(model.pricing?.completion)}`
      : "—";
    const status = issues.length ? `✖ ${issues.join(" · ")}` : "ok";
    console.log(
      `${id.padEnd(38)} ${price.padStart(18)} ${String(providers).padStart(3)} prov  ${status}`,
    );

    if (issues.length) problems.push(`${id}: ${issues.join("; ")}`);

    // A single provider means one outage takes the model away entirely. Not an
    // error — worth knowing before it's someone's default.
    if (!issues.length && providers === 1) {
      console.log(`${" ".repeat(38)} ⚠ single provider — no failover if it goes down`);
    }

    if (!issues.length && declared > providerFloor) {
      console.log(
        `${" ".repeat(38)} ⚠ smallest route serves only ${providerFloor.toLocaleString()} — ` +
          `fine while OpenRouter can reroute, a failure if the provider is pinned`,
      );
    }
  }

  if (problems.length) {
    console.error(`\n✖ ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`\n✔ all ${ids.length} models verified`);
};

main().catch((err) => {
  console.error("Verification failed to run:", err);
  process.exit(1);
});
