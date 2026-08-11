import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * The reported failure: the Twenty checkbox was ticked, no note was created,
 * and no badge appeared — total silence.
 *
 * The service was fine. The worker was copying the job payload into the
 * pipeline field by field, and `syncToTwenty` was never added to that list, so
 * the option evaporated between the queue and the service. `agenticInvestigation`
 * had been lost the same way.
 *
 * A unit test of the service can't catch that — the gap is the wiring itself.
 * So this asserts the wiring directly: every option the queue payload declares
 * must reach the pipeline.
 */

const read = (rel: string) => readFileSync(join(__dirname, "..", "..", rel), "utf-8");

/** Field names declared on an exported interface, in source order. */
const interfaceFields = (source: string, name: string): string[] => {
  const start = source.indexOf(`interface ${name} {`);
  if (start === -1) throw new Error(`interface ${name} not found`);
  const body = source.slice(start, source.indexOf("\n}", start));
  return [...body.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1]);
};

describe("transcript generation worker wiring", () => {
  const worker = read("workers/transcriptGenerationWorker.ts");
  const queue = read("queue/transcriptGenerationQueue.ts");
  const service = read("services/projectTranscriptService.ts");

  it("declares syncToTwenty and twentyCompanyId on the job payload", () => {
    const fields = interfaceFields(queue, "TranscriptGenerationJobPayload");
    expect(fields).toContain("syncToTwenty");
    expect(fields).toContain("twentyCompanyId");
  });

  it("forwards the whole payload instead of copying fields one by one", () => {
    // The spread is the invariant: a field-by-field copy is what lost the
    // options in the first place, and it fails silently every time.
    expect(worker).toMatch(/\.\.\.jobOptions/);
    expect(worker).toMatch(/const \{ transcriptId, projectId, \.\.\.jobOptions \} = job\.data/);
  });

  it("keeps every payload option accepted by the pipeline input", () => {
    // With the spread in place, a payload field the input doesn't declare is a
    // compile error — this pins the pairing so the two can't drift apart.
    const payload = interfaceFields(queue, "TranscriptGenerationJobPayload");
    const input = interfaceFields(service, "CreateTranscriptInput");
    const passedSeparately = new Set(["transcriptId"]);

    const orphaned = payload.filter((f) => !passedSeparately.has(f) && !input.includes(f));
    expect(orphaned).toEqual([]);
  });

  it("marks twenty as failed when the AI job dies, like every other sync", () => {
    // Otherwise a crashed job leaves the Twenty step with no badge at all,
    // which reads as "nothing was requested" rather than "this broke".
    expect(worker).toMatch(/if \(job\.data\.syncToTwenty\) tasks\.twenty = failedStatus;/);
  });
});
