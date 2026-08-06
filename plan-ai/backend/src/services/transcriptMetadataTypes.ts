export type PostMeetingTaskKind =
  | "jira"
  | "linear"
  | "trello"
  | "notion"
  | "asana"
  | "googleDrive"
  | "oneDrive"
  | "doc"
  | "slides";

export interface PostMeetingTaskStatus {
  status: "PENDING" | "OK" | "FAILED" | "SKIPPED";
  /** Short error message when status is FAILED */
  error?: string;
  /** ISO timestamp of when the task reached its terminal state */
  finishedAt?: string;
  /** Number of items processed (e.g. tickets created, tasks synced) */
  count?: number;
  /** Optional deep link to the produced resource (doc URL, page URL, etc.) */
  url?: string;
}

export type PostMeetingTasksRecord = Partial<Record<PostMeetingTaskKind, PostMeetingTaskStatus>>;

/**
 * AI-inferred information about one speaker in a recorded meeting.
 * Populated by `extractSpeakerInsights` during transcript processing.
 */
export interface SpeakerInsight {
  /** Raw Deepgram speaker label as it appears in utterances (e.g. "Speaker 0", "User 0"). Stable, used to join with the transcript. */
  label: string;
  /** Name the LLM inferred from conversational cues ("Hi Xavier", signatures, intros). Null when not confidently identifiable. */
  identifiedName: string | null;
  /** Optional role / title the LLM inferred ("Engineer", "Product Manager", "Client"). */
  role?: string | null;
  /** True when this label matches `metadata.principalSpeaker` (the recording user). */
  isPrincipalSpeaker: boolean;
  /** One-sentence summary of what they contributed in the meeting. */
  summary: string;
  /** Up to 3 verbatim quotes that best represent their voice. */
  keyQuotes?: string[];
  /** AI-detected emotional tone of THIS speaker (may differ from the overall meeting sentiment). */
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED";
  /** Total seconds this speaker spoke (computed from utterance start/end). */
  speakingTimeSeconds: number;
  /** Number of distinct utterances by this speaker. */
  utteranceCount: number;
}

export interface TranscriptMetadata {
  processingStatus?:
    | "PENDING"
    | "PROCESSING"
    | "EXTRACTING_TASKS"
    | "REFINING_TASKS"
    | "COMPLETED"
    | "FAILED"
    | "DONE";
  errorMessage?: string;
  sentimentExplanation?: string;
  keyPoints?: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
  rawTasks?: unknown[];
  principalSpeaker?: string;
  /** AI insights per speaker (name inference + summary + sentiment + speaking time). */
  speakers?: SpeakerInsight[];
  /**
   * User corrections of speaker names, keyed by the stable diarization label
   * ("Speaker 0"). Applied over `speakers[].identifiedName` on save AND
   * re-applied after any reprocess so human fixes survive fresh AI passes.
   */
  speakerNameOverrides?: Record<string, string>;
  /** Per-step status of fire-and-forget effects kicked off after a transcript is processed */
  postMeetingTasks?: PostMeetingTasksRecord;
}
