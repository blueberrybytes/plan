import { Queue } from "bullmq";
import { queueConnection } from "./redisConnection";

export interface TranscriptGenerationJobPayload {
  transcriptId: string;
  projectId?: string;
  userId: string;
  workspaceId: string;
  content: string;
  source: string;
  contextIds?: string[];
  persona?: "SECRETARY" | "ARCHITECT" | "PRODUCT_MANAGER" | "DEVELOPER";
  objective?: string;
  complexityLevel?: string;
  modelKey?: string;
  taskStrategy?: "AUTO" | "SINGLE_TICKET" | "SPECIFIC_COUNT";
  taskCount?: number;
  syncToJira?: boolean;
  syncToLinear?: boolean;
  syncToTrello?: boolean;
  syncToNotion?: boolean;
  syncToAsana?: boolean;
  syncToTwenty?: boolean;
  /** Chosen per meeting — the same person meets different clients. */
  twentyCompanyId?: string;
  exportToGoogleDrive?: boolean;
  exportToOneDrive?: boolean;
  contextPrompt?: string;
  agenticInvestigation?: boolean;
  createDoc?: boolean;
  createSlides?: boolean;
}

export const transcriptGenerationQueue = new Queue<TranscriptGenerationJobPayload>(
  "TranscriptGenerationQueue",
  {
    connection: queueConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  },
);
