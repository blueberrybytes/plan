import { Worker, Job } from "bullmq";
import * as Sentry from "@sentry/node";

import { logger } from "../utils/logger";
import { TranscriptGenerationJobPayload } from "../queue/transcriptGenerationQueue";
import { projectTranscriptService } from "../services/projectTranscriptService";
import { PrismaClient, Prisma } from "@prisma/client";
import { checkSubscription } from "../services/subscriptionGuard";

const prisma = new PrismaClient();
import { createWorkerConnection } from "../queue/redisConnection";

const connection = createWorkerConnection();

export const transcriptGenerationWorker = new Worker<TranscriptGenerationJobPayload>(
  "TranscriptGenerationQueue",
  async (job: Job<TranscriptGenerationJobPayload>) => {
    // Attach workspace/user/transcript context so every logger.error inside
    // this job lands in Sentry tagged with the originating workspace.
    return Sentry.withScope(async (scope) => {
      scope.setUser({ id: job.data.userId });
      scope.setTag("workspaceId", job.data.workspaceId);
      scope.setTag("transcriptId", job.data.transcriptId);
      scope.setTag("jobId", String(job.id ?? "unknown"));
      scope.setTag("queue", "TranscriptGenerationQueue");

      logger.info(
        `Processing TranscriptGenerationJob ${job.id} for transcript ${job.data.transcriptId}`,
      );

      // Re-check subscription at job execution time. The endpoint that
      // enqueued this job already gated, but BullMQ retries (or backlogs)
      // could fire much later — by then the subscription may be canceled
      // and we don't want to burn OpenRouter/Deepgram credit. Mark the
      // transcript as FAILED so the UI surfaces a clear next step.
      const sub = await checkSubscription(job.data.workspaceId);
      if (!sub.active) {
        logger.warn(
          `[worker:transcript] Skipping job ${job.id} — workspace ${job.data.workspaceId} subscription ${sub.reason ?? "missing"}`,
        );
        try {
          await prisma.transcript.update({
            where: { id: job.data.transcriptId },
            data: {
              metadata: {
                processingStatus: "FAILED",
                processingError: "Subscription required. Re-subscribe to retry this transcript.",
                failureReason: "subscription_required",
              } as Prisma.InputJsonValue,
            },
          });
        } catch (markErr) {
          logger.error(
            `[worker:transcript] Failed to mark transcript ${job.data.transcriptId} as FAILED`,
            markErr,
          );
        }
        return;
      }

      try {
        // Forward the payload wholesale. This used to be a field-by-field copy,
        // which silently dropped every option added to the payload afterwards
        // (syncToTwenty and agenticInvestigation both went missing that way —
        // no error, just a setting the user chose that never took effect).
        // Spreading makes new options work by construction, and the compiler
        // now flags any payload field the pipeline can't accept.
        const { transcriptId, projectId, ...jobOptions } = job.data;
        await projectTranscriptService.processPendingTranscript(transcriptId, {
          ...jobOptions,
          projectId: projectId || "",
        });

        logger.info(`Successfully completed TranscriptGenerationJob ${job.id}`);
      } catch (error) {
        logger.error(`Error processing TranscriptGenerationJob ${job.id}`, error);
        await job.log(
          `[ERROR] Job failed: ${error instanceof Error ? error.message : String(error)}`,
        );

        // Update Prisma to FAILED
        const transcript = await prisma.transcript.findUnique({
          where: { id: job.data.transcriptId },
        });
        if (transcript) {
          const meta =
            typeof transcript.metadata === "object" && transcript.metadata
              ? { ...(transcript.metadata as Prisma.JsonObject) }
              : {};
          meta.processingStatus = "FAILED";
          meta.errorMessage = error instanceof Error ? error.message : String(error);

          const tasks: Record<string, unknown> =
            (meta.postMeetingTasks as Record<string, unknown>) || {};
          const failedStatus = {
            status: "FAILED",
            error: "Skipped due to AI processing failure.",
          };
          if (job.data.syncToJira) tasks.jira = failedStatus;
          if (job.data.syncToLinear) tasks.linear = failedStatus;
          if (job.data.syncToTrello) tasks.trello = failedStatus;
          if (job.data.syncToNotion) tasks.notion = failedStatus;
          if (job.data.syncToAsana) tasks.asana = failedStatus;
          if (job.data.syncToTwenty) tasks.twenty = failedStatus;
          if (job.data.createDoc) tasks.doc = failedStatus;
          if (job.data.createSlides) tasks.slides = failedStatus;
          if (job.data.exportToGoogleDrive) tasks.googleDrive = failedStatus;
          if (job.data.exportToOneDrive) tasks.oneDrive = failedStatus;

          meta.postMeetingTasks = tasks as unknown as Prisma.JsonObject;

          await prisma.transcript.update({
            where: { id: job.data.transcriptId },
            data: {
              metadata: meta as Prisma.InputJsonValue,
              title:
                transcript.title === "Generating Transcript..."
                  ? "Failed Transcript"
                  : transcript.title,
            },
          });
        }
        throw error;
      }
    });
  },
  {
    connection,
    concurrency: 2, // Limit concurrency to avoid hitting LLM API rate limits
    lockDuration: 600_000, // 10 minutes — transcript processing takes 40-300s
    stalledInterval: 300_000, // Check for stalled jobs every 5 minutes
  },
);

transcriptGenerationWorker.on("completed", (job) => {
  logger.info(`Job ${job.id} has completed!`);
});

transcriptGenerationWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} has failed with ${err.message}`);
});
