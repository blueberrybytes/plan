export type PostMeetingTaskKind =
  | "jira"
  | "linear"
  | "trello"
  | "notion"
  | "asana"
  | "googleDrive"
  | "oneDrive"
  | "doc"
  | "slides"
  | "twenty";

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
  /**
   * Share link for the same resource, readable without signing in.
   *
   * Kept apart from `url` because that one points at the in-app view and is
   * useless to anyone outside the workspace. This is what may be handed to a
   * client — e.g. the meeting document linked from a CRM note.
   */
  publicUrl?: string;
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
  /** Result of pushing this meeting to Twenty CRM. */
  twenty?: TwentyNoteRef;
  /** Real capture window reported by the client, when it sent one. */
  recording?: RecordingWindow;
}

/**
 * Where this transcript ended up in Twenty.
 *
 * `CANONICAL` — this recording's content became the CRM note.
 * `SECONDARY` — a teammate recorded the same meeting and their note won; we
 * deliberately did NOT create a second note in the client's CRM, and point at
 * theirs instead. The user can override this from the UI if the overlap test
 * got it wrong (two genuinely different meetings with the same company).
 */
export interface TwentyNoteRef {
  noteId: string;
  url?: string;
  role: "CANONICAL" | "SECONDARY";
  /** Set when role is SECONDARY: the transcript that actually produced the note. */
  canonicalTranscriptId?: string;
  /**
   * The full transcript uploaded as a file on the company record. Absent when
   * the upload failed — the note is still valid, so this is not an error state.
   */
  attachmentId?: string;
  /** Timeline entry on the company, stamped at the real meeting time. */
  timelineActivityId?: string;
  syncedAt?: string;
}

/**
 * Capture window as measured by the recording client.
 *
 * `Transcript.recordedAt` is the UPLOAD time and `durationSeconds` is derived
 * from the last utterance — neither is the true meeting start. Two teammates
 * recording the same call upload at different moments, so comparing those
 * fields alone is unreliable. When the client reports these, overlap detection
 * uses them instead.
 */
export interface RecordingWindow {
  /** ISO-8601 UTC instant capture actually started. */
  startedAt: string;
  /** Wall-clock seconds from start to stop (includes pauses, unlike durationSeconds). */
  wallClockSeconds?: number;
}
