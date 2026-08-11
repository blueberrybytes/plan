import { Worker, Job } from "bullmq";
import { redisClient } from "../utils/redisClient";
import { logger } from "../utils/logger";
import { runWeeklyDigest } from "../services/weeklyDigestService";

/**
 * Sends the Monday-morning weekly digest to every opted-in user.
 *
 * Runs as a single repeatable job rather than one job per user: the whole run
 * is a handful of indexed queries plus N Resend calls, and keeping it as one
 * job means the summary line in the logs tells you the whole story
 * (considered / sent / skipped / failed).
 *
 * `lockDuration` is generous because a workspace with many members means many
 * sequential email calls; losing the lock mid-run would re-send digests to
 * people who already got one.
 */
export const weeklyDigestWorker = new Worker(
  "WeeklyDigestQueue",
  async (job: Job) => {
    logger.info(`[WeeklyDigest] Starting run (job ${job.id})`);
    const result = await runWeeklyDigest();
    await job.log(
      `considered=${result.considered} sent=${result.sent} skipped=${result.skipped} failed=${result.failed}`,
    );
    return result;
  },
  { connection: redisClient, lockDuration: 10 * 60_000 },
);

weeklyDigestWorker.on("failed", (_job, err) => {
  logger.error(`[WeeklyDigest] Run failed: ${err.message}`);
});
