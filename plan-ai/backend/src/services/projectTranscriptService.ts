/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Prisma,
  TaskPriority,
  TaskStatus,
  TaskType,
  Transcript,
  TranscriptSource,
  Task,
  // Aliased: local lowercase analysis-level types of the same name live below.
  PainPointSeverity as PrismaPainPointSeverity,
  PainPointStatus as PrismaPainPointStatus,
} from "@prisma/client";
import {
  getWorkspaceModel,
  getFallbackProviderOptions,
  getStructuredProviderOptions,
  getCachedStructuredProviderOptions,
  getCachedContextModel,
  getCachedContextProviderOptions,
  CACHED_CONTEXT_MODEL,
  TICKET_MODEL,
  DEFAULT_AI_MODEL,
  getMaxContextChunks,
  extractOpenRouterUsage,
} from "../utils/aiModelUtils";
import { dropEchoUtterances, estimateMicSysOffsetMs } from "../utils/echoDedup";
import { cancelEcho } from "../utils/echoCancel";
import { decodeUrlToMonoPcm, encodeWavPcm16 } from "../utils/audioPcm";
import { generateText, stepCountIs, Output, type ToolSet } from "ai";
import { z, type ZodTypeAny } from "zod";
import { DeepgramClient } from "@deepgram/sdk";
import { logger } from "../utils/logger";
import prisma from "../prisma/prismaClient";
import {
  queryContexts,
  getFullContextPayloads,
  getRepomixContextPayloads,
  indexRawText,
} from "../vector/contextFileVectorService";

import { aiContextRouter } from "./aiContextRouter";
import { resolveProjectIdsToContextIds } from "./projectContextResolver";
import { IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { jiraIntegrationService } from "./jiraIntegrationService";
import { linearIntegrationService } from "./linearIntegrationService";
import { trelloIntegrationService } from "./trelloIntegrationService";
import { notionIntegrationService } from "./notionIntegrationService";
import { asanaIntegrationService } from "./asanaIntegrationService";
import { googleIntegrationService } from "./googleIntegrationService";
import { microsoftIntegrationService } from "./microsoftIntegrationService";
import { DocumentGenerator } from "../utils/documentGenerator";
import { docGenerationService } from "./docGenerationService";
import { slideGenerationService } from "./slideGenerationService";
import { aiUsageService } from "./aiUsageService";
import type { TaskMetadata } from "./taskMetadataTypes";
import type {
  PostMeetingTaskKind,
  PostMeetingTaskStatus,
  PostMeetingTasksRecord,
  SpeakerInsight,
} from "./transcriptMetadataTypes";
import type {
  JiraIntegrationMetadata,
  LinearIntegrationMetadata,
  TrelloIntegrationMetadata,
  AsanaIntegrationMetadata,
} from "./integrationMetadataTypes";
import { getPersonaInstructions } from "./personaService";
import { mcpClientService } from "./mcpClientService";
import { ladybugService } from "./ladybugService";
import { taskRefinementQueue } from "../queue/taskRefinementQueue";
import { generateProjectDigest } from "./projectDigestService";
import { twentyIntegrationService } from "./twentyIntegrationService";

/**
 * Which Twenty company a meeting note is filed under.
 *
 * The user's per-recording choice always wins: one person meets several
 * DIFFERENT clients in a day, and most recordings have no project yet (the
 * recorder defaults to "create one for me"). A project's linked company is only
 * a convenience default for recurring client work.
 *
 * Returns undefined when neither is available — the caller marks the step
 * SKIPPED, not FAILED: a missing choice is not an error.
 */
export const resolveTwentyCompanyId = (
  explicitCompanyId: string | undefined,
  projectMetadata: unknown,
): string | undefined => {
  const explicit = explicitCompanyId?.trim();
  if (explicit) return explicit;
  const linked = (projectMetadata as { twentyCompanyId?: string } | null)?.twentyCompanyId;
  return linked?.trim() || undefined;
};

const TASK_STATUS_VALUES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "COMPLETED", "ARCHIVED"] as const;
const TASK_PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const TASK_STATUS_LIST = TASK_STATUS_VALUES.join(", ");
const TASK_PRIORITY_LIST = TASK_PRIORITY_VALUES.join(", ");

const TASK_STATUS_SET = new Set<string>(TASK_STATUS_VALUES);
const TASK_PRIORITY_SET = new Set<string>(TASK_PRIORITY_VALUES);

// NOTE on `.nullable()` vs `.optional()`:
// These schemas are sent to the LLM as `response_format: json_schema`. OpenAI /
// Azure *strict* structured-output mode requires that `required` contains EVERY
// key in `properties` — Zod's `.optional()` omits the field from `required`,
// which those providers reject with a 400 ("Invalid schema ... 'required' is
// required to be supplied and to be an array including every key in properties.
// Missing 'priority'."). Some routed providers (minimax, gemini) are lenient and
// accept it, but our fallback chain includes OpenAI/Azure, so any fallback would
// hard-fail. The portable, OpenAI-documented pattern for an "optional" field is
// required-but-nullable (`.nullable()`): the key stays in `required` and the
// model may return `null`. We coerce those nulls back to `undefined` downstream.
const TranscriptTaskRawSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "A JSON array of discrete acceptance-criteria strings. Each element MUST be a single, atomic verifiable condition (e.g. 'The endpoint returns 200 when X'). NEVER use markdown bullets ('- foo') inside elements. NEVER return a single concatenated string.",
    ),
  priority: z.string().nullable(),
  status: z.string().nullable(),
  type: z
    .string()
    .nullable()
    .describe(
      'One of: "TASK", "BUG", "STORY", "EPIC". Use EPIC ONLY for macro/parent tasks that have a non-empty subtasks array. Standalone work uses TASK | BUG | STORY.',
    ),
  category: z
    .enum(["engineering", "design", "support", "ops", "research"])
    .nullable()
    .describe(
      "Work category. Use 'engineering' for code/dev work, 'design' for design/UX/mocks, 'support' for customer outreach + admin flags, 'ops' for infra/devops, 'research' for spike/investigation. Customers can filter their ticket board by this.",
    ),
  dueDate: z.string().nullable(),
  storyPoints: z
    .number()
    .nullable()
    .describe("Fibonacci agile story points (1, 2, 3, 5, 8) estimated by complexity."),
  dependencies: z
    .array(z.string())
    .nullable()
    .describe("A list of other task titles that this task depends on."),
});

// Since nested self-referencing Zod schemas crash Gemini API JSON_schema generation, we limit it to 1 level of static depth:
const TranscriptTaskRawSchemaWithSubtasks = TranscriptTaskRawSchema.extend({
  subtasks: z.array(TranscriptTaskRawSchema).nullable(),
});

// A pain point = a friction, blocker, or unmet need raised in the meeting.
// `.nullable()` (not `.optional()`) on optional fields — see the strict
// structured-output note above TranscriptTaskRawSchema. `severity` and `status`
// are required enums (always present): they're the core ranking + tracking
// signal. The array itself is required-and-possibly-empty (the prompt instructs
// the model to return [] when no genuine pain points exist — never invent any).
const PainPointRawSchema = z.object({
  problem: z
    .string()
    .min(1)
    .describe("The friction, blocker, or unmet need, stated in one clear sentence."),
  affected: z
    .string()
    .nullable()
    .describe("Who or what is affected (a person, team, or customer). Null if unclear."),
  severity: z
    .enum(["blocker", "high", "medium", "low"])
    .describe(
      "How much this is hurting. 'blocker' = work cannot proceed; 'high' = significant drag; 'medium' = notable friction; 'low' = minor annoyance.",
    ),
  status: z
    .enum(["raised", "being_addressed", "resolved_in_meeting"])
    .describe(
      "'raised' = mentioned, no owner/plan yet; 'being_addressed' = someone is already working on it; 'resolved_in_meeting' = settled during the meeting.",
    ),
  evidence: z
    .string()
    .nullable()
    .describe(
      "A short verbatim quote from the transcript that grounds this pain point. Null if no clean quote exists. Do NOT fabricate.",
    ),
  suggestedResolution: z
    .string()
    .nullable()
    .describe("A concise suggested next step to resolve it, if one is reasonable. Null otherwise."),
});

// `.nullable()` (not `.optional()`) — see the note above TranscriptTaskRawSchema.
const TranscriptAnalysisRawSchema = z.object({
  // Nullable on purpose: it's debug-only and the LAST field generated, so it's
  // the most likely to be truncated/omitted — it must never block the parse.
  chainOfThought: z
    .string()
    .nullable()
    .describe(
      "Your reasoning for the extraction, written for the user: which discussion points led to which tasks, and why you chose their priorities and types. 3-6 sentences.",
    ),
  language: z.string().min(1),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  keyPoints: z
    .array(z.string())
    .nullable()
    .describe(
      "A list of 3-7 key points, decisions, or critical insights discussed in the meeting. Do NOT duplicate pain points here — those go in the dedicated painPoints field.",
    ),
  sentiment: z
    .string()
    .nullable()
    .describe(
      "Analyze the user's emotion or tone. MUST be one of: POSITIVE, NEUTRAL, NEGATIVE, MIXED",
    ),
  sentimentExplanation: z
    .string()
    .nullable()
    .describe(
      "A 1-2 sentence text explanation of the overall sentiment, mood, and tone of the transcript.",
    ),
  painPoints: z
    .array(PainPointRawSchema)
    .describe(
      "Friction, blockers, and unmet needs raised in the meeting, ranked most-severe first. Return an EMPTY array if none are genuinely present — never invent pain points.",
    ),
  tasks: z.array(TranscriptTaskRawSchemaWithSubtasks),
});

const transcriptAnalysisSchemaForGeneration: ZodTypeAny = z.object({
  language: z.string().min(1),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  keyPoints: z
    .array(z.string())
    .nullable()
    .describe(
      "A list of 3-7 key points, decisions, or critical insights discussed in the meeting. Do NOT duplicate pain points here — those go in the dedicated painPoints field.",
    ),
  sentiment: z
    .string()
    .nullable()
    .describe(
      "Analyze the user's emotion or tone. MUST be one of: POSITIVE, NEUTRAL, NEGATIVE, MIXED",
    ),
  sentimentExplanation: z
    .string()
    .nullable()
    .describe(
      "A 1-2 sentence text explanation of the overall sentiment, mood, and tone of the transcript.",
    ),
  painPoints: z
    .array(PainPointRawSchema)
    .describe(
      "Friction, blockers, and unmet needs raised in the meeting, ranked most-severe first. Return an EMPTY array if none are genuinely present — never invent pain points.",
    ),
  tasks: z.array(TranscriptTaskRawSchemaWithSubtasks),
  // Last field + nullable: debug-only, must never block extraction if truncated.
  chainOfThought: z
    .string()
    .nullable()
    .describe(
      "Your reasoning for the extraction, written for the user: which discussion points led to which tasks, and why you chose their priorities and types. 3-6 sentences.",
    ),
});

export type PainPointSeverity = "blocker" | "high" | "medium" | "low";
export type PainPointStatus = "raised" | "being_addressed" | "resolved_in_meeting";

/** Cleaned, parsed pain point (nulls from strict-mode schema coerced to undefined). */
export interface PainPoint {
  problem: string;
  affected?: string;
  severity: PainPointSeverity;
  status: PainPointStatus;
  evidence?: string;
  suggestedResolution?: string;
}

export interface TranscriptAnalysis {
  chainOfThought?: string;
  language: string;
  title?: string;
  summary?: string;
  keyPoints?: string[];
  painPoints?: PainPoint[];
  sentiment?: string;
  sentimentExplanation?: string;
  tasks: TranscriptTask[];
}

export type TaskCategory = "engineering" | "design" | "support" | "ops" | "research";

export interface TranscriptTask {
  title: string;
  summary?: string;
  description?: string;
  /**
   * Persisted to `Task.acceptanceCriteria` (a `String` column) as a markdown
   * bullet list joined from the LLM's array output. See `joinAcceptanceCriteria`.
   */
  acceptanceCriteria?: string;
  /** Raw array form, preserved for integrations / future structured API. */
  acceptanceCriteriaList?: string[];
  priority?: TaskPriority;
  status?: TaskStatus;
  type?: TaskType;
  category?: TaskCategory;
  dueDate?: string;
  storyPoints?: number;
  dependencies?: string[];
  subtasks?: TranscriptTask[];
}

/**
 * Convert the LLM's `string[]` array of acceptance criteria into the
 * markdown bullet list format the existing DB column + Jira/Linear/Notion
 * integrations expect. Robust to legacy `string` input from older sessions.
 */
const joinAcceptanceCriteria = (raw: unknown): { joined: string; list: string[] } => {
  let list: string[] = [];
  if (Array.isArray(raw)) {
    list = raw.filter((x) => typeof x === "string" && x.trim().length > 0);
  } else if (typeof raw === "string" && raw.trim().length > 0) {
    // Legacy fallback: split on newline-then-bullet to recover discrete items.
    list = raw
      .split(/\n+\s*[-•*]\s*|\n+/)
      .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
      .filter(Boolean);
    if (list.length === 0) list = [raw.trim()];
  }
  const joined = list.map((item) => `- ${item}`).join("\n");
  return { joined, list };
};

export interface CreateTranscriptInput {
  projectId: string;
  userId: string;
  content: string;
  title?: string | null;
  source: string;
  recordedAt?: Date | null;
  metadata?: Prisma.InputJsonValue | null;
  contextPrompt?: string | null;
  contextIds?: string[];
  persona?: "SECRETARY" | "ARCHITECT" | "PRODUCT_MANAGER" | "DEVELOPER" | null;
  objective?: string | null;
  complexityLevel?: string | null;
  modelKey?: string | null;
  syncToJira?: boolean;
  syncToLinear?: boolean;
  syncToTrello?: boolean;
  syncToNotion?: boolean;
  syncToAsana?: boolean;
  /** Push the meeting note to Twenty. */
  syncToTwenty?: boolean;
  /**
   * Which Twenty company the note is filed under, chosen when the recording is
   * saved. Falls back to the project's linked company when omitted — one person
   * meets several different clients in a day, so the destination belongs to the
   * MEETING, not to the project.
   */
  twentyCompanyId?: string;
  exportToGoogleDrive?: boolean;
  exportToOneDrive?: boolean;
  workspaceId: string;
  taskStrategy?: "AUTO" | "SINGLE_TICKET" | "SPECIFIC_COUNT";
  taskCount?: number;
  agenticInvestigation?: boolean;
  createDoc?: boolean;
  createSlides?: boolean;
}

export interface CreateTranscriptResult {
  transcript: Transcript;
  tasks: Task[];
  analysis: TranscriptAnalysis;
}

export interface CreateStandaloneTranscriptInput {
  userId: string;
  content: string;
  title?: string;
  source?: TranscriptSource;
  recordedAt?: Date | null;
  metadata?: Prisma.InputJsonValue | null;
  contextPrompt?: string | null;
  contextIds?: string[];
  persona?: "SECRETARY" | "ARCHITECT" | "PRODUCT_MANAGER" | "DEVELOPER";
  objective?: string | null;
  complexityLevel?: string;
  modelKey?: string | null;
}

export interface CreateStandaloneTranscriptResult {
  transcript: Transcript;
  analysis: TranscriptAnalysis;
}

export interface PendingTranscriptResult {
  transcript: Transcript;
}

export interface DeepgramWord {
  word: string;
  punctuated_word?: string;
  start: number;
  end: number;
  speaker?: number;
  globalSpeaker?: string;
}

export interface Utterance {
  speaker: string;
  transcript: string;
  words: DeepgramWord[];
  start: number;
  end: number;
}

export class ProjectTranscriptService {
  private async diarizeAudio(
    micUrl: string | null,
    sysUrl: string | null,
    language?: string | null,
  ): Promise<{
    combinedText: string;
    utterances: Utterance[];
    totalSeconds: number;
    /** Human-readable per-channel failures (stored in metadata — a diarization
     * failure must never be silent: it makes the final transcript fall back to
     * the live text and silently drop everything the live WS missed). */
    diagnostics: string[];
  }> {
    const deepgram = new DeepgramClient({ key: process.env.DEEPGRAM_API_KEY! });
    const diagnostics: string[] = [];

    // Honour the language the user picked in the recorder. nova-3 supports the
    // recorder's monolingual codes (including "ca"), whereas "multi"
    // (code-switching) only covers 10 languages — notably NOT Catalan — so
    // "multi" is the fallback for auto-detect, never an override of an explicit
    // choice. Re-validated here because reprocessed rows may carry old metadata.
    const dgLanguage =
      language && /^[a-z]{2,3}(-[A-Za-z0-9]{2,10})?$/i.test(language) ? language : "multi";

    const resolveDiarization = async (
      source: { url: string } | { buffer: Buffer },
      speakerPrefix: string,
      lang: string = dgLanguage,
    ): Promise<Utterance[]> => {
      console.log(
        `[Diarization] Starting ${speakerPrefix} | lang=${lang} | ${
          "url" in source
            ? `url: ${source.url.slice(0, 80)}...`
            : `cleaned buffer ${source.buffer.length}B`
        }`,
      );
      // A channel failure must be loud AND self-healing: record it for the
      // transcript's metadata, and when a monolingual language was requested
      // retry once with "multi" — a degraded transcript beats losing the whole
      // channel (which silently falls back to the live text).
      const failChannel = async (errMsg: string): Promise<Utterance[]> => {
        logger.error(`[Diarization] Deepgram error for ${speakerPrefix} (lang=${lang}): ${errMsg}`);
        diagnostics.push(`${speakerPrefix} (language=${lang}): ${errMsg}`);
        if (lang !== "multi") {
          logger.warn(`[Diarization] Retrying ${speakerPrefix} with language=multi`);
          return resolveDiarization(source, speakerPrefix, "multi");
        }
        return [];
      };
      try {
        const dgOptions = {
          diarize: true,
          model: "nova-3",
          smart_format: true,
          language: lang,
          utterances: true,
          utt_split: 0.5,
          filler_words: false,
        };
        const res =
          "url" in source
            ? await deepgram.listen.prerecorded.transcribeUrl({ url: source.url }, dgOptions)
            : await deepgram.listen.prerecorded.transcribeFile(source.buffer, dgOptions);
        if (res.error) {
          return failChannel(res.error.message);
        }
        const meta = res.result?.metadata;
        const detectedLang = res.result?.results?.channels?.[0]?.detected_language ?? "?";
        const dgUtterances = res.result?.results?.utterances || [];
        const uniqueSpeakers = new Set(dgUtterances.map((u) => u.speaker)).size;
        console.log(
          `[Diarization] ${speakerPrefix} | requested=${lang} detected=${detectedLang} duration=${(meta?.duration as number | undefined)?.toFixed(1) ?? "?"}s utterances=${dgUtterances.length} speakers=${uniqueSpeakers}`,
        );
        return dgUtterances.map((u) => ({
          speaker: `${speakerPrefix} ${u.speaker}`,
          transcript: u.transcript,
          start: u.start,
          end: u.end,
          words: u.words.map((w) => ({
            ...w,
            globalSpeaker: `${speakerPrefix} ${w.speaker}`,
          })),
        }));
      } catch (err: any) {
        return failChannel(err?.message ?? String(err));
      }
    };

    let micUtterances: Utterance[] = [];
    let sysUtterances: Utterance[] = [];

    console.log(`[Diarization] mic=${!!micUrl} sys=${!!sysUrl}`);

    // Reference-based acoustic echo cancellation (the real fix for loudspeaker
    // bleed). When BOTH channels exist, the mic recording contains a delayed
    // copy of the system audio; we decode both, subtract the modelled echo path
    // (sys = reference) from the mic, and transcribe the CLEANED mic instead of
    // the raw blob — so the far side never re-enters the "User" channel. The
    // stored blobs are untouched, and every failure mode falls back to the raw
    // URL, so transcription can never be worse than before. dropEchoUtterances
    // below stays as a backstop for whatever residual the filter leaves.
    // Opt-in (RECORDER_AEC_ENABLED=true) until measured on real meeting audio:
    // the canceller is proven correct on clean PCM, but linear AEC on two
    // SEPARATELY lossy-coded blobs (mic Opus 32k, sys AAC 128k) is partly
    // decorrelated, so real-world suppression must be measured (see the
    // `[AEC] … erle=` log) before enabling for everyone. Off ⇒ exact prior behaviour.
    let micSource: { url: string } | { buffer: Buffer } | null = micUrl ? { url: micUrl } : null;
    if (micUrl && sysUrl && process.env.RECORDER_AEC_ENABLED === "true") {
      try {
        const SR = 16000;
        const [micPcm, sysPcm] = await Promise.all([
          decodeUrlToMonoPcm(micUrl, SR),
          decodeUrlToMonoPcm(sysUrl, SR),
        ]);
        const { output, delaySamples, erleDb } = cancelEcho(micPcm, sysPcm, { sampleRate: SR });
        micSource = { buffer: encodeWavPcm16(output, SR) };
        logger.info(
          `[AEC] mic cleaned: micLen=${micPcm.length} sysLen=${sysPcm.length} ` +
            `delay=${(delaySamples / SR).toFixed(2)}s erle=${erleDb.toFixed(1)}dB`,
        );
      } catch (err) {
        logger.warn(
          `[AEC] echo cancellation failed, using raw mic: ${err instanceof Error ? err.message : err}`,
        );
        micSource = { url: micUrl };
      }
    }

    if (micSource) micUtterances = await resolveDiarization(micSource, "User");
    if (sysUrl) sysUtterances = await resolveDiarization({ url: sysUrl }, "Others");

    // Speaker-bleed dedup: when the user listened through speakers, the mic
    // audio contains an acoustic copy of the system audio, so the re-transcribed
    // mic channel repeats the others' words as "User: …". Drop mic utterances
    // whose text matches a temporally-overlapping sys utterance (same logic as
    // the live stream's EchoDeduper, but timestamp-aware).
    if (process.env.ECHO_DEDUP_DISABLED !== "true" && sysUtterances.length > 0) {
      const before = micUtterances.length;
      // Estimate the mic↔sys clock offset first (the two stored files don't
      // share a timeline on macOS) so the dedup window is correctly centred.
      const offsetMs = estimateMicSysOffsetMs(micUtterances, sysUtterances);
      // Coverage histogram of KEPT segments: a cluster of survivors in 0.5–0.8
      // means divergent-ASR bleed the exact-token matcher can't catch (the
      // residual after the offset fix). This tells us — with data — whether a
      // content-word/threshold change is warranted before doing it blindly.
      const keptBuckets = { lt05: 0, b05_08: 0, ge08_kept: 0 };
      let fuzzyTwinDrops = 0;
      micUtterances = dropEchoUtterances(micUtterances, sysUtterances, {
        offsetMs,
        onSegment: ({ dropped, coverage, fuzzyTwin }) => {
          if (fuzzyTwin) fuzzyTwinDrops += 1;
          if (dropped) return;
          if (coverage >= 0.8) keptBuckets.ge08_kept += 1;
          else if (coverage >= 0.5) keptBuckets.b05_08 += 1;
          else keptBuckets.lt05 += 1;
        },
      });
      const dropped = before - micUtterances.length;
      logger.info(
        `[Diarization] EchoDedup: mic=${before} sys=${sysUtterances.length} ` +
          `offset=${offsetMs === null ? "unaligned" : `${Math.round(offsetMs)}ms`} ` +
          `dropped=${dropped} (fuzzyTwin=${fuzzyTwinDrops}) kept=${micUtterances.length} | ` +
          `survivors coverage<0.5=${keptBuckets.lt05} 0.5-0.8=${keptBuckets.b05_08} ` +
          `(0.5-0.8 = likely divergent bleed surviving)`,
      );
    }

    // Merge chronologically by utterance start time
    const utterances = [...micUtterances, ...sysUtterances].sort((a, b) => a.start - b.start);

    const combinedText = utterances.map((u) => `${u.speaker}: ${u.transcript}`).join("\n");
    const totalSeconds =
      utterances.length > 0 ? Math.ceil(utterances[utterances.length - 1].end) : 0;

    return { combinedText, utterances, totalSeconds, diagnostics };
  }

  public async createPendingTranscript(
    input: CreateTranscriptInput,
  ): Promise<PendingTranscriptResult> {
    const finalMetadata =
      typeof input.metadata === "undefined" || input.metadata === null
        ? { processingStatus: "PENDING" }
        : { ...(input.metadata as Record<string, unknown>), processingStatus: "PENDING" };

    // Auto-derive contextIds from the projectId if the caller didn't supply
    // any. After the Context→Project refactor most callers only know the
    // project; the project's paired Context is what feeds RAG and AI tasks.
    let contextIds = input.contextIds ?? [];
    if (contextIds.length === 0 && input.projectId) {
      contextIds = await resolveProjectIdsToContextIds([input.projectId]);
    }

    const transcript = await prisma.transcript.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        projectId: input.projectId || null,
        title: input.title || "Generating Transcript...",
        source: (input.source as TranscriptSource) ?? TranscriptSource.MANUAL,
        language: null,
        summary: null,
        transcript: input.content,
        recordedAt: input.recordedAt ?? null,
        contextIds,
        metadata: finalMetadata as unknown as Prisma.JsonObject,
      },
    });

    return { transcript };
  }

  private async identifySpeaker(
    workspaceId: string,
    voiceProfileUrl: string,
    micUrl: string,
    utterances: Utterance[],
  ): Promise<string | null> {
    if (!voiceProfileUrl || voiceProfileUrl.startsWith("local://")) {
      logger.warn(
        "[Voice Biometrics] Skipping — voice profile not uploaded (old local:// profile).",
      );
      return null;
    }

    logger.info(`[Voice Biometrics] Identifying speaker via SpeechBrain microservice...`);

    try {
      const uniqueSpeakers = Array.from(new Set(utterances.map((u) => u.speaker)));
      if (uniqueSpeakers.length < 2) return uniqueSpeakers[0] ?? null;

      const formData = new FormData();
      formData.append("profile_url", voiceProfileUrl);
      formData.append("meeting_url", micUrl);

      // Call the Python Microservice
      const voiceAiUrl = process.env.VOICE_AI_URL || "http://localhost:8001";
      const voiceAiKey = process.env.VOICE_AI_API_KEY || "";
      const verifyRes = await fetch(`${voiceAiUrl}/verify`, {
        method: "POST",
        body: formData,
        headers: voiceAiKey ? { "x-api-key": voiceAiKey } : undefined,
        signal: AbortSignal.timeout(30000),
      });

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        throw new Error(`Python service returned ${verifyRes.status}: ${errorText}`);
      }

      const result = await verifyRes.json();
      logger.info(
        `[Voice Biometrics] Result: Match=${result.match}, Score=${result.score.toFixed(3)}`,
      );

      if (result.match) {
        // Since the current SpeechBrain model only compares Profile vs Whole Meeting,
        // and returns a boolean if the profile voice is present in the meeting.
        // We need to match it to a specific speaker.
        // Wait, the meetingUrl is the RAW meeting url (mixed speakers).
        // Let's fallback to assigning the principal speaker based on the first "User " utterance,
        // since the Python service currently only tells us IF the user is in the meeting.
        // To be precise, we'd need to send the individual speaker clips to the Python service.
        // For now, if the Python service confirms the voice is in the meeting,
        // we'll assign it to the primary microphone user.
        const likelySpeaker =
          uniqueSpeakers.find((s) => s.toLowerCase().startsWith("user ")) ?? uniqueSpeakers[0];
        logger.info(`[Voice Biometrics] Assigned verified profile to: ${likelySpeaker}`);
        return likelySpeaker;
      }

      return null;
    } catch (e: any) {
      const voiceAiUrl = process.env.VOICE_AI_URL || "http://localhost:8001";
      logger.error(`[Voice Biometrics] Identification failed (url=${voiceAiUrl})`, e);
      return null;
    }
  }

  /**
   * Resolve which BrandTheme to use for AI-generated docs/slides.
   * Cascade: explicit choice → project default → workspace default → none.
   * Returns `undefined` when nothing is configured (generation stays unthemed).
   * Standalone recordings (no project) resolve straight to the workspace default.
   */
  private async resolveGenerationThemeId(
    workspaceId: string,
    projectId?: string | null,
    explicitThemeId?: string | null,
  ): Promise<string | undefined> {
    if (explicitThemeId) return explicitThemeId;
    try {
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { themeId: true },
        });
        if (project?.themeId) return project.themeId;
      }
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { defaultThemeId: true },
      });
      return workspace?.defaultThemeId ?? undefined;
    } catch (err) {
      logger.warn("Failed to resolve generation theme; proceeding unthemed", err);
      return undefined;
    }
  }

  public async processPendingTranscript(
    transcriptId: string,
    input: CreateTranscriptInput,
  ): Promise<CreateTranscriptResult> {
    const existing = await prisma.transcript.findUnique({ where: { id: transcriptId } });
    if (!existing) throw new Error("Transcript not found");

    let processedContent = input.content;
    let utterancesJson: Utterance[] | null = null;
    let durationSeconds: number | null = null;
    let speakerCount: number | null = null;

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    let principalSpeaker: string | undefined;
    let diarizationDiagnostics: string[] = [];

    if (existing.rawMicUrl || existing.rawSysUrl) {
      logger.info(`Starting batch diarization for ${existing.id}...`);
      // The ASR language the user picked in the recorder (stored at upload).
      // Distinct from `existing.language`, which the fast-summary LLM later
      // overwrites with a human-readable name ("catalan") that Deepgram
      // wouldn't accept as a code.
      const recordingLanguage =
        ((existing.metadata as Prisma.JsonObject | null)?.recordingLanguage as
          | string
          | undefined) ?? null;
      const diarizationResult = await this.diarizeAudio(
        existing.rawMicUrl,
        existing.rawSysUrl,
        recordingLanguage,
      );
      let { combinedText, utterances } = diarizationResult;
      const { totalSeconds } = diarizationResult;
      diarizationDiagnostics = diarizationResult.diagnostics;
      if (diarizationDiagnostics.length > 0) {
        logger.warn(
          `[Diarization] ${existing.id} completed with channel failures: ${diarizationDiagnostics.join(" | ")}`,
        );
      }

      // Log Deepgram Usage
      if (totalSeconds > 0) {
        aiUsageService
          .logUsage({
            userId: input.userId,
            workspaceId: input.workspaceId,
            feature: "RECORDER",
            provider: "DEEPGRAM",
            model: "nova-3-prerecorded",
            inputTokens: totalSeconds,
            outputTokens: 0,
          })
          .catch((err) => logger.warn("Failed to log Deepgram diarization usage:", err));
      }

      // Check for Voice Profile to enforce Speaker Identification
      if (existing.rawMicUrl && user?.voiceProfileUrl) {
        const matchedSpeaker = await this.identifySpeaker(
          input.workspaceId,
          user.voiceProfileUrl,
          existing.rawMicUrl,
          utterances,
        );

        if (matchedSpeaker && user.name) {
          logger.info(
            `[Voice AI] Overwriting matched speaker '${matchedSpeaker}' with verified identity '${user.name}'`,
          );

          principalSpeaker = user.name;

          // Replace in Utterances
          utterances = utterances.map((u) => ({
            ...u,
            speaker: u.speaker === matchedSpeaker ? user.name! : u.speaker,
          }));

          // Re-generate combined text
          combinedText = utterances.map((u) => `${u.speaker}: ${u.transcript}`).join("\n");
        }
      }

      if (!principalSpeaker && utterances.length > 0) {
        // Fallback to the first microphone speaker or the first speaker overall
        principalSpeaker =
          utterances.find((u) => u.speaker.toLowerCase().startsWith("user "))?.speaker ??
          utterances[0].speaker;
      }

      if (combinedText && utterances.length > 0) {
        processedContent = combinedText;
        utterancesJson = utterances;
        speakerCount = new Set(utterances.map((u) => u.speaker)).size;
        durationSeconds = Math.ceil(utterances[utterances.length - 1].end);
      }
    }

    // PHASE 1: Fast Summary to Unlock UI Early
    try {
      const fastModel = await getWorkspaceModel(input.workspaceId, "openai/gpt-4o-mini");
      const {
        output: fastParsed,
        usage,
        providerMetadata,
      } = await generateText({
        model: fastModel,
        providerOptions: getStructuredProviderOptions("openai/gpt-4o-mini"),
        output: Output.object({
          name: "TranscriptQuickSummary",
          description:
            "Extracts a fast high-level title, language, and 2-sentence summary for the transcript.",
          schema: z.object({
            title: z.string(),
            language: z.string(),
            summary: z.string(),
          }),
        }),
        system:
          "Extract a short title (max 6 words), language (e.g. 'english'), and a 2-sentence summary.",
        prompt: `Transcript:\n${processedContent.slice(0, 8000)}`,
        maxRetries: 1,
      });

      if (usage) {
        const fastUsage = extractOpenRouterUsage({ usage, providerMetadata });
        aiUsageService
          .logUsage({
            userId: input.userId,
            workspaceId: input.workspaceId,
            feature: "TASK_EXTRACTION",
            provider: "openrouter", // or get fallback provider
            model: "openai/gpt-4o-mini",
            inputTokens: fastUsage.inputTokens,
            outputTokens: fastUsage.outputTokens,
            cost: fastUsage.cost,
            cachedTokens: fastUsage.cachedTokens,
          })
          .catch(() => {
            logger.error(`Failed to log fast summary usage for transcript ${transcriptId}`);
          });
      }

      const currentMetadata = (existing.metadata as Record<string, unknown>) || {};
      await prisma.transcript.update({
        where: { id: transcriptId },
        data: {
          title: existing.title === "Generating Transcript..." ? fastParsed.title : existing.title,
          language: fastParsed.language,
          summary: fastParsed.summary,
          transcript: processedContent,
          durationSeconds: durationSeconds ?? null,
          speakerCount: speakerCount ?? null,
          utterances: (utterancesJson as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
          metadata: {
            ...currentMetadata,
            processingStatus: "EXTRACTING_TASKS",
            principalSpeaker,
            ...(diarizationDiagnostics.length > 0 ? { diarizationDiagnostics } : {}),
          } as unknown as Prisma.InputJsonValue,
        },
      });
      logger.info(`Fast summary generated and UI unlocked for ${existing.id}`);
    } catch (err) {
      logger.warn(`Fast summary failed, falling back to basic UI unlock for ${existing.id}`, err);
      const currentMetadata = (existing.metadata as Record<string, unknown>) || {};
      await prisma.transcript.update({
        where: { id: transcriptId },
        data: {
          transcript: processedContent,
          durationSeconds: durationSeconds ?? null,
          speakerCount: speakerCount ?? null,
          utterances: (utterancesJson as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
          metadata: {
            ...currentMetadata,
            processingStatus: "EXTRACTING_TASKS",
            principalSpeaker,
            ...(diarizationDiagnostics.length > 0 ? { diarizationDiagnostics } : {}),
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }

    // PHASE 2: FAST Task Extraction (NO agentic investigation) + Speaker Insights (in parallel).
    // The agentic GitNexus investigation is deferred to a background BullMQ job
    // (TaskRefinementQueue) so users see basic tickets in ~30-40s instead of 300s.

    // --- GitHub Engineering Auto-Detection ---
    // If the project's knowledge base contains a GitHub-synced repo (sourceType=GITHUB_SYNC),
    // we know this is an engineering context. Automatically elevate persona to DEVELOPER so
    // the AI writes code-aware engineering tickets (file refs, function names, technical AC)
    // instead of generic business tickets.
    let effectivePersona = input.persona ?? undefined;
    let effectiveObjective = input.objective ?? undefined;
    const contextIdsForCheck = input.contextIds ?? [];
    if (!effectivePersona && contextIdsForCheck.length > 0) {
      try {
        const githubFile = await prisma.contextFile.findFirst({
          where: {
            contextId: { in: contextIdsForCheck },
            metadata: { path: ["source"], equals: "GITHUB_SYNC" },
          },
          select: { id: true, metadata: true },
        });
        if (githubFile) {
          effectivePersona = "DEVELOPER";
          // Inject an explicit engineering objective if user didn't provide one.
          // This steers the LLM toward producing deep technical tickets with file
          // paths, function names, and verifiable code-level acceptance criteria.
          if (!effectiveObjective) {
            effectiveObjective =
              "This is an engineering transcript from a project with a connected GitHub repository. " +
              "Analyze deeply and produce engineering-grade tickets. Each ticket MUST include: " +
              "specific file paths or module names where applicable, function/class names that need changing, " +
              "concrete acceptance criteria with testable technical conditions (e.g. 'endpoint returns 401 on missing token', " +
              "'migration runs without errors', 'unit test covers edge case X'). " +
              "If a bug is mentioned, identify the likely root cause and include it in the description.";
            logger.info(
              `[processPendingTranscript] GitHub repo detected in context — auto-elevated persona to DEVELOPER for transcript ${transcriptId}`,
            );
          }
        }
      } catch (err) {
        logger.warn(
          "[processPendingTranscript] Failed to detect GitHub context for persona auto-elevation",
          err,
        );
      }
    }

    const [analysisRaw, speakerInsights] = await Promise.all([
      this.analyzeTranscript(
        input.userId,
        input.workspaceId,
        processedContent,
        input.contextPrompt ?? "",
        input.contextIds,
        effectivePersona,
        effectiveObjective,
        input.complexityLevel ?? undefined,
        input.modelKey ?? undefined,
        input.taskStrategy ?? undefined,
        input.taskCount ?? undefined,
        false, // agenticInvestigation always false in main pipeline — deferred to refinement
        transcriptId,
      ),
      this.extractSpeakerInsights(
        input.workspaceId,
        utterancesJson ?? [],
        processedContent,
        principalSpeaker,
        input.modelKey ?? undefined,
      ),
    ]);

    const result = await prisma.$transaction(async (tx) => {
      const currentMetadata = (existing.metadata as Record<string, unknown>) || {};

      // Build transcript-level graph trace: AI → Recording → all tasks
      const transcriptGraphNodes: Prisma.JsonArray = [
        { id: "ai", name: "Plan AI Extractor", group: "function", val: 30 },
        { id: "recording", name: existing.title || "Recording", group: "database", val: 25 },
      ];
      const transcriptGraphLinks: Prisma.JsonArray = [{ source: "ai", target: "recording" }];
      for (const [idx, taskCandidate] of analysisRaw.tasks.entries()) {
        const taskId = `task-${idx}`;
        const taskName =
          taskCandidate.title.length > 25
            ? taskCandidate.title.substring(0, 25) + "..."
            : taskCandidate.title;
        transcriptGraphNodes.push({ id: taskId, name: taskName, group: "ticket", val: 18 });
        transcriptGraphLinks.push({ source: "recording", target: taskId });
      }

      const newMetadata = {
        ...currentMetadata,
        processingStatus: "COMPLETED",
        rawTasks: analysisRaw.tasks,
        keyPoints: analysisRaw.keyPoints,
        sentimentExplanation: analysisRaw.sentimentExplanation,
        // The model's own reasoning for WHY it extracted these tasks — already
        // generated as part of the structured analysis (chainOfThought), so
        // persisting it costs nothing. Surfaced as a collapsible "AI reasoning"
        // panel on the AI Tasks tab (web + recorder).
        extractionReasoning: analysisRaw.chainOfThought ?? null,
        principalSpeaker,
        // Speakers tab fuel — empty array when there are no diarized
        // utterances (text-only transcripts). Human name corrections
        // (metadata.speakerNameOverrides) are re-applied over the fresh AI pass
        // so a reprocess never silently undoes what a user fixed by hand.
        speakers: speakerInsights.map((s) => {
          const override = (currentMetadata as { speakerNameOverrides?: Record<string, string> })
            .speakerNameOverrides?.[s.label];
          return override ? { ...s, identifiedName: override } : s;
        }),
        aiGraphTrace: {
          nodes: transcriptGraphNodes,
          links: transcriptGraphLinks,
        },
      };

      const transcript = await tx.transcript.update({
        where: { id: transcriptId },
        data: {
          title:
            existing.title === "Generating Transcript..."
              ? analysisRaw.title ||
                `Meeting — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : existing.title,
          language: analysisRaw.language,
          summary: analysisRaw.summary ?? null,
          sentiment: analysisRaw.sentiment ?? null,
          durationSeconds: durationSeconds ?? null,
          speakerCount: speakerCount ?? null,
          metadata: newMetadata as unknown as Prisma.InputJsonValue,
          transcript: processedContent,
          utterances: (utterancesJson as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
        },
      });

      const createdTasks: Task[] = [];

      if (input.projectId) {
        for (const [index, taskCandidate] of analysisRaw.tasks.entries()) {
          const startDate = this.resolveStartDate(input.recordedAt);
          const dueDate = this.resolveDueDate(
            taskCandidate.dueDate,
            taskCandidate.priority,
            startDate,
          );
          const createdTask = await tx.task.create({
            data: {
              projectId: input.projectId,
              title: taskCandidate.title,
              description: taskCandidate.description ?? null,
              summary: taskCandidate.summary ?? null,
              acceptanceCriteria: taskCandidate.acceptanceCriteria ?? null,
              priority: this.resolveTaskPriority(taskCandidate.priority),
              status: this.resolveTaskStatus(taskCandidate.status),
              type: this.resolveTaskType(taskCandidate.type),
              position: index,
              startDate,
              dueDate,
              storyPoints: taskCandidate.storyPoints ?? null,
              metadata: {
                generatedFromTranscriptId: transcript.id,
                generatorVersion: "session-transcript-service@2",
                // Category lets the frontend filter eng work vs support
                // actions vs design tasks etc. Defaults to "engineering"
                // when the LLM didn't classify (backwards compatible).
                category: taskCandidate.category ?? "engineering",
                // Discrete acceptance-criteria array, preserved alongside
                // the joined string in `Task.acceptanceCriteria` for
                // integrations that want structured data.
                acceptanceCriteriaList: taskCandidate.acceptanceCriteriaList ?? [],
                aiGraphTrace: {
                  nodes: [
                    { id: "ai", name: "Plan AI Extractor", group: "function" as const, val: 30 },
                    {
                      id: "transcript",
                      name: transcript.title || "Recording",
                      group: "database" as const,
                      val: 25,
                    },
                    {
                      id: `task-${index}`,
                      name:
                        taskCandidate.title.length > 25
                          ? taskCandidate.title.substring(0, 25) + "..."
                          : taskCandidate.title,
                      group: "ticket" as const,
                      val: 20,
                    },
                  ],
                  links: [
                    { source: "ai", target: "transcript" },
                    { source: "transcript", target: `task-${index}` },
                  ],
                },
              } satisfies Prisma.JsonObject,
            },
          });
          createdTasks.push(createdTask);

          // Save Subtasks Hierarchically
          if (taskCandidate.subtasks && taskCandidate.subtasks.length > 0) {
            for (const [subIndex, subTaskCandidate] of taskCandidate.subtasks.entries()) {
              const subStartDate = this.resolveStartDate(input.recordedAt);
              const subDueDate = this.resolveDueDate(
                subTaskCandidate.dueDate,
                subTaskCandidate.priority,
                subStartDate,
              );
              const createdSubTask = await tx.task.create({
                data: {
                  projectId: input.projectId!,
                  parentId: createdTask.id,
                  title: subTaskCandidate.title,
                  description: subTaskCandidate.description ?? null,
                  summary: subTaskCandidate.summary ?? null,
                  acceptanceCriteria: subTaskCandidate.acceptanceCriteria ?? null,
                  priority: this.resolveTaskPriority(subTaskCandidate.priority),
                  status: this.resolveTaskStatus(subTaskCandidate.status),
                  type: this.resolveTaskType(subTaskCandidate.type),
                  position: subIndex,
                  startDate: subStartDate,
                  dueDate: subDueDate,
                  storyPoints: subTaskCandidate.storyPoints ?? null,
                  metadata: {
                    generatedFromTranscriptId: transcript.id,
                    generatorVersion: "session-transcript-service@2",
                    category: subTaskCandidate.category ?? "engineering",
                    acceptanceCriteriaList: subTaskCandidate.acceptanceCriteriaList ?? [],
                  } satisfies Prisma.JsonObject,
                },
              });
              createdTasks.push(createdSubTask);
            }
          }
        }

        if (createdTasks.length > 0) {
          await tx.taskTranscriptLink.createMany({
            data: createdTasks.map((task) => ({
              taskId: task.id,
              transcriptId: transcript.id,
            })),
          });

          // Batch all task dependencies into a single createMany call
          const allDependencyData: { taskId: string; dependsOnTaskId: string; type: "BLOCKS" }[] =
            [];
          for (let i = 0; i < analysisRaw.tasks.length; i++) {
            const candidateDeps = analysisRaw.tasks[i].dependencies;
            if (candidateDeps && candidateDeps.length > 0) {
              const currentTaskId = createdTasks[i].id;
              const validDependantIds = candidateDeps
                .map(
                  (depTitle: string) =>
                    createdTasks.find((ct) => ct.title.toLowerCase() === depTitle.toLowerCase())
                      ?.id,
                )
                .filter((id: string | undefined): id is string => Boolean(id));

              for (const depId of validDependantIds) {
                allDependencyData.push({
                  taskId: currentTaskId,
                  dependsOnTaskId: depId,
                  type: "BLOCKS",
                });
              }
            }
          }

          if (allDependencyData.length > 0) {
            await tx.taskDependency.createMany({ data: allDependencyData });
          }
        }
      }

      // Pain points are tied to the transcript + workspace (not a project), so
      // they persist even for project-less recordings (recorder/mobile). The
      // LLM ranks them most-severe first; `position` preserves that order.
      const painPointsToCreate = analysisRaw.painPoints ?? [];
      if (painPointsToCreate.length > 0) {
        await tx.painPoint.createMany({
          data: painPointsToCreate.map((p, index) => ({
            transcriptId: transcript.id,
            workspaceId: input.workspaceId,
            problem: p.problem,
            affected: p.affected ?? null,
            // Analysis strings are lowercase ("blocker"); enum values are their
            // uppercase form — a direct, lossless mapping.
            severity: p.severity.toUpperCase() as PrismaPainPointSeverity,
            status: p.status.toUpperCase() as PrismaPainPointStatus,
            evidence: p.evidence ?? null,
            suggestedResolution: p.suggestedResolution ?? null,
            position: index,
          })),
        });
      }

      return { transcript, createdTasks };
    });

    if (result.createdTasks.length > 0) {
      this.autoSyncTasks(input.workspaceId, result.transcript, result.createdTasks, {
        syncToJira: input.syncToJira,
        syncToLinear: input.syncToLinear,
        syncToTrello: input.syncToTrello,
        syncToNotion: input.syncToNotion,
        syncToAsana: input.syncToAsana,
      }).catch((err) => {
        logger.error(`Failed to auto-sync tasks for transcript ${result.transcript.id}`, err);
      });
    }

    // Auto-push the meeting note to Twenty. Deliberately OUTSIDE the
    // `createdTasks.length > 0` gate above: a meeting with no extracted tasks
    // still belongs in the client's CRM.
    if (input.syncToTwenty) {
      this.autoPushToTwenty(input.workspaceId, result.transcript, input.twentyCompanyId).catch(
        (err) => {
          logger.error(`Failed to auto-push transcript ${result.transcript.id} to Twenty`, err);
        },
      );
    }

    // Auto-Export Document to Cloud Storage
    if (input.exportToGoogleDrive || input.exportToOneDrive) {
      this.autoExportDocument(input.workspaceId, result.transcript, analysisRaw, {
        exportToGoogleDrive: input.exportToGoogleDrive,
        exportToOneDrive: input.exportToOneDrive,
      }).catch((err) => {
        logger.error(
          `Failed to auto-export document to cloud storage for transcript ${result.transcript.id}`,
          err,
        );
      });
    }

    // Resolve the brand theme once for both doc + slide auto-generation.
    // Cascade: project default → workspace default → none (see helper).
    const generatedThemeId =
      input.createDoc || input.createSlides
        ? await this.resolveGenerationThemeId(input.workspaceId, result.transcript.projectId)
        : undefined;

    // Auto-Generate Document
    if (input.createDoc) {
      void this.setPostMeetingTaskStatus(result.transcript.id, "doc", { status: "PENDING" });
      // Seed the doc with the best available title. The transcript title may
      // still be the "Generating Transcript..." placeholder if the AI summary
      // step couldn't derive one — in that case fall back to the summary
      // snippet so the doc doesn't inherit the placeholder.
      const transcriptTitle = result.transcript.title?.trim();
      const isPlaceholderTitle = !transcriptTitle || transcriptTitle === "Generating Transcript...";
      const summarySnippet = analysisRaw?.summary?.trim().slice(0, 80);
      const seedTitle = !isPlaceholderTitle
        ? transcriptTitle
        : summarySnippet && summarySnippet.length > 3
          ? summarySnippet
          : "Meeting Document";
      docGenerationService
        .startGeneration(input.userId, input.workspaceId, {
          title: seedTitle,
          prompt: `Generate a comprehensive meeting document based on the following transcript summary and extracted tasks. Ensure the language and style are highly corporate, formal, and professional.`,
          transcriptIds: [result.transcript.id],
          contextIds: input.contextIds,
          themeId: generatedThemeId,
        })
        .then(async (doc) => {
          logger.info(`Auto-generated document ${doc.id} for transcript ${result.transcript.id}`);
          const publicUrl = `/doc/public/${doc.id}`;
          await this.setPostMeetingTaskStatus(result.transcript.id, "doc", {
            status: "OK",
            url: `/docs/view/${doc.id}`,
          });

          // Batch-update all tasks with publicDocUrl in a single transaction
          // instead of N findUnique+update calls.
          const taskIds = result.createdTasks.map((t) => t.id);
          if (taskIds.length > 0) {
            const tasksWithMeta = await prisma.task.findMany({
              where: { id: { in: taskIds } },
              select: { id: true, metadata: true },
            });
            await prisma.$transaction(
              tasksWithMeta.map((t) => {
                const metadata: TaskMetadata = (t.metadata as TaskMetadata) ?? {};
                metadata.publicDocUrl = publicUrl;
                return prisma.task.update({
                  where: { id: t.id },
                  data: { metadata: metadata as Prisma.InputJsonObject },
                });
              }),
            );
          }
        })
        .catch(async (err) => {
          logger.error(
            `Failed to auto-generate document for transcript ${result.transcript.id}`,
            err,
          );
          await this.setPostMeetingTaskStatus(result.transcript.id, "doc", {
            status: "FAILED",
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }

    // Auto-Generate Slides
    if (input.createSlides) {
      void this.setPostMeetingTaskStatus(result.transcript.id, "slides", { status: "PENDING" });
      slideGenerationService
        .startPresentationGeneration(
          input.userId,
          input.workspaceId,
          undefined, // templateId
          generatedThemeId, // themeId (project/workspace default cascade)
          input.contextIds ?? [],
          [result.transcript.id], // transcriptIds
          `Create a presentation summarizing the key points, decisions, and action items from the meeting.`,
          result.transcript.title || "Meeting Slides",
        )
        .then(async (pres) => {
          logger.info(`Auto-generated slides ${pres.id} for transcript ${result.transcript.id}`);
          const publicUrl = `/p/${pres.id}`;
          await this.setPostMeetingTaskStatus(result.transcript.id, "slides", {
            status: "OK",
            url: `/presentations/${pres.id}`,
          });

          // Batch-update all tasks with publicSlidesUrl in a single transaction
          const taskIds = result.createdTasks.map((t) => t.id);
          if (taskIds.length > 0) {
            const tasksWithMeta = await prisma.task.findMany({
              where: { id: { in: taskIds } },
              select: { id: true, metadata: true },
            });
            await prisma.$transaction(
              tasksWithMeta.map((t) => {
                const metadata: TaskMetadata = (t.metadata as TaskMetadata) ?? {};
                metadata.publicSlidesUrl = publicUrl;
                return prisma.task.update({
                  where: { id: t.id },
                  data: { metadata: metadata as Prisma.InputJsonObject },
                });
              }),
            );
          }
        })
        .catch(async (err) => {
          logger.error(
            `Failed to auto-generate slides for transcript ${result.transcript.id}`,
            err,
          );
          await this.setPostMeetingTaskStatus(result.transcript.id, "slides", {
            status: "FAILED",
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }

    // PHASE 3: Enqueue background refinement if agentic investigation was requested.
    // This runs the heavy GitNexus MCP investigation and upgrades the already-visible
    // fast-pass tasks with code references, improved acceptance criteria, and blast-radius context.
    if (input.agenticInvestigation !== false && result.createdTasks.length > 0) {
      taskRefinementQueue
        .add("refine-tasks", {
          transcriptId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          content: processedContent,
          contextIds: input.contextIds,
          contextPrompt: input.contextPrompt ?? undefined,
          persona: effectivePersona,
          objective: effectiveObjective,
          complexityLevel: input.complexityLevel ?? undefined,
          modelKey: input.modelKey ?? undefined,
          taskIds: result.createdTasks.map((t) => t.id),
        })
        .then(() => {
          logger.info(`Enqueued task refinement job for transcript ${transcriptId}`);
          // Mark transcript as REFINING_TASKS so frontend can show a subtle indicator
          this.setTranscriptProcessingStatus(transcriptId, "REFINING_TASKS").catch(() => {});
        })
        .catch((err) =>
          logger.error(`Failed to enqueue task refinement for transcript ${transcriptId}`, err),
        );
    }

    // PHASE 4: Auto-generate / update Project Digest.
    // Fire-and-forget: the digest is a project-level living document that
    // re-synthesizes ALL meetings every time a new one is processed.
    if (input.projectId) {
      generateProjectDigest(input.userId, input.workspaceId, input.projectId)
        .then((res) => {
          if (res) {
            logger.info(
              `[AutoDigest] Updated project digest doc ${res.digestDocId} for project ${input.projectId}`,
            );
          }
        })
        .catch((err) => {
          logger.error(
            `[AutoDigest] Failed to auto-generate project digest for project ${input.projectId}`,
            err,
          );
        });
    }

    // PHASE 5: Vectorize the transcript into the project's context so that
    // live chat, threaded assistant, and any other queryContexts caller can
    // retrieve it via RAG. Runs fire-and-forget — a failure here must never
    // block the main pipeline response.
    if (input.projectId && processedContent.trim().length > 0) {
      const transcriptTitle = result.transcript.title || `Meeting ${transcriptId}`;
      const transcriptDate = result.transcript.recordedAt
        ? new Date(result.transcript.recordedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

      // Format the raw text with a header so chunks carry meeting metadata
      const vectorText = `Meeting: ${transcriptTitle}\nDate: ${transcriptDate}\n\n${processedContent}`;

      resolveProjectIdsToContextIds([input.projectId])
        .then((contextIds) => {
          const contextId = contextIds[0];
          if (!contextId) {
            logger.warn(
              `[TranscriptVectorize] No contextId resolved for project ${input.projectId} — skipping vectorization of transcript ${transcriptId}`,
            );
            return;
          }
          return indexRawText({
            contextId,
            // Deterministic fileId: re-processing the same transcript replaces its old vectors.
            fileId: `transcript:${transcriptId}`,
            fileName: `${transcriptTitle} (${transcriptDate})`,
            mimeType: "text/plain",
            rawText: vectorText,
          });
        })
        .then(() => {
          logger.info(
            `[TranscriptVectorize] Indexed transcript ${transcriptId} into project context.`,
          );
        })
        .catch((err) => {
          logger.warn(
            `[TranscriptVectorize] Failed to vectorize transcript ${transcriptId} — RAG will miss this meeting but processing succeeded.`,
            err,
          );
        });
    }

    return {
      transcript: result.transcript,
      tasks: result.createdTasks,
      analysis: analysisRaw,
    };
  }

  public async analyzeTranscript(
    userId: string,
    workspaceId: string,
    content: string,
    contextPrompt: string,
    contextIds?: string[],
    persona?: "SECRETARY" | "ARCHITECT" | "PRODUCT_MANAGER" | "DEVELOPER",
    objective?: string,
    complexityLevel?: string,
    modelKey?: string,
    taskStrategy?: "AUTO" | "SINGLE_TICKET" | "SPECIFIC_COUNT",
    taskCount?: number,
    agenticInvestigation: boolean = true,
    /** Optional transcript id to exclude from the "previous meetings" lookup — the one being analyzed right now. */
    excludeTranscriptId?: string,
  ): Promise<TranscriptAnalysis> {
    // Structured-output extraction defaults to Gemini Flash: it handles
    // `response_format: json_schema` reliably and cheaply. Premium models
    // (e.g. claude-sonnet) intermittently return OpenRouter's body-level 400
    // "Provider returned error" on structured output, which OpenRouter's
    // automatic model fallback does NOT recover from. Callers can still pass
    // an explicit `modelKey` to override.
    const activeModel = modelKey || TICKET_MODEL;
    const model = await getWorkspaceModel(workspaceId, activeModel);
    const todayIso = new Date().toISOString().split("T")[0];

    // RAG vs Fast-Track Router
    let dynamicContext = "";
    if (contextIds && contextIds.length > 0) {
      try {
        const routerResult = await aiContextRouter.decideStrategy(contextIds, activeModel);

        if (routerResult.strategy === "FULL_INJECTION") {
          logger.info(
            `ContextRouter bypassed RAG. Using FULL_INJECTION for ${routerResult.estimatedTokens} estimated tokens.`,
          );
          const fullChunks = await getFullContextPayloads(contextIds);
          if (fullChunks.length > 0) {
            dynamicContext = `\n[FULL CONTEXT INJECTED]:\n${fullChunks.join("\n\n")}\n`;
          }
        } else {
          logger.info(
            `ContextRouter triggered RAG for ${routerResult.estimatedTokens} estimated tokens.`,
          );
          // RAG: Query context vectors using 500 chars as query
          const query = content.slice(0, 500);
          const maxChunks = getMaxContextChunks(activeModel);
          const chunks = await queryContexts(contextIds, query, maxChunks);
          if (chunks.length > 0) {
            dynamicContext = `\nRetrieved targeted context snippets from knowledge base:\n${chunks.join("\n\n")}\n`;
          }
        }
      } catch (error) {
        logger.warn("Failed to retrieve dynamic context for transcript", error);
      }

      // Also include previous meetings attached to the same context(s) so task
      // generation can reference prior decisions, action items, and history.
      // Excludes the transcript currently being analyzed.
      try {
        const previousMeetings = await prisma.transcript.findMany({
          where: {
            workspaceId,
            contextIds: { hasSome: contextIds },
            ...(excludeTranscriptId ? { id: { not: excludeTranscriptId } } : {}),
          },
          select: {
            id: true,
            title: true,
            summary: true,
            transcript: true,
            recordedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10, // cap so we don't blow the context window
        });

        if (previousMeetings.length > 0) {
          const blocks = previousMeetings.map((t) => {
            const heading = `## Previous Meeting: ${t.title || "Untitled"}${
              t.recordedAt ? ` (${new Date(t.recordedAt).toISOString().slice(0, 10)})` : ""
            }`;
            const body = t.summary?.trim() ? t.summary : (t.transcript ?? "").slice(0, 3000);
            return `${heading}\n${body}`;
          });
          const previousSection = `\n\nPrevious Meetings on Selected Contexts (most recent first):\n${blocks.join(
            "\n\n---\n\n",
          )}\n`;
          dynamicContext += previousSection;
          logger.info(
            `Included ${previousMeetings.length} previous meetings in task-generation context`,
          );
        }
      } catch (error) {
        logger.warn("Failed to retrieve previous meetings for task generation", error);
      }
    }

    let finalContextSection =
      (contextPrompt ? `Relevant context:\n${contextPrompt}\n\n` : "") + dynamicContext;

    // Step 1: Optional Agentic Investigation via MCP
    const tools = agenticInvestigation ? mcpClientService.getAiTools() : undefined;
    if (tools) {
      try {
        logger.info(`Starting Two-Step Agentic Investigation for Transcript using fast model`);
        const fastModel = await getWorkspaceModel(workspaceId, "openai/gpt-4o-mini");
        const investigation = await generateText({
          model: fastModel,
          providerOptions: getFallbackProviderOptions("openai/gpt-4o-mini"),
          tools,
          stopWhen: stepCountIs(2),
          system:
            "You are an AI Software Architect. The user is generating Agile task tickets from a transcript or request. IF the request is a simple, non-technical business or life task (like sending an email, scheduling a meeting, calling someone), DO NOT query the codebase. Simply return 'No codebase context needed.' OTHERWISE, use your tools to query the codebase knowledge graph and gather relevant structural context (e.g. affected components, database models, related execution flows). Summarize your findings so the task generator can write highly accurate, technically specific acceptance criteria.",
          prompt: `Transcript/Request:\n${content}\n\nObjective: ${objective ?? "Extract tasks"}\n\nPlease investigate the codebase ONLY IF this is a technical software task to gather any missing structural context.`,
        });

        if (investigation.text) {
          finalContextSection += `\n\n### Codebase Investigation Context:\n${investigation.text}\n`;
        }

        const investUsage = extractOpenRouterUsage(investigation);
        aiUsageService
          .logUsage({
            userId,
            workspaceId,
            feature: "TASK_EXTRACTION",
            provider: "openrouter",
            model: "openai/gpt-4o-mini",
            inputTokens: investUsage.inputTokens,
            outputTokens: investUsage.outputTokens,
            cost: investUsage.cost,
            cachedTokens: investUsage.cachedTokens,
          })
          .catch(() => {});
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes("Missing Authentication header") || err.message.includes("401"))
        ) {
          logger.warn("Auth error during MCP agentic investigation step (skipping)", err.message);
        } else {
          logger.error("Failed during MCP agentic investigation step for transcript", err);
        }
      }
    }

    let personaInstructions = "";
    switch (persona) {
      case "SECRETARY":
        personaInstructions = `You are a meticulous Secretary.
Focus on extreme precision. Only extract tasks and requirements explicitly mentioned in the transcript.
Do NOT guess technical details or generate new tasks. If the user hasn't explicitly said it, don't include it.`;
        break;
      case "ARCHITECT":
        personaInstructions = `You are an AI Senior Architect.
Use the provided codebase context to DECOMPOSE high-level goals into a detailed technical execution plan.
Create specific tasks for different components, files, or database changes needed based on the actual code found in the context.`;
        break;
      case "PRODUCT_MANAGER":
        personaInstructions = `You are a Product Manager.
Focus on user value, feature scope, and roadmap. Turn goals into actionable user stories and milestones.
Identify potential risks or dependencies from a product perspective.`;
        break;
      case "DEVELOPER":
        personaInstructions = `You are a Senior Full-Stack Developer.
Focus on implementation details, refactoring opportunities, and coding best practices.
Break down goals into specific coding tasks, PRs, and technical improvements.`;
        break;
    }

    // Inject Custom User Personas and Instructions
    personaInstructions += await getPersonaInstructions(userId, workspaceId);

    const objectiveSection = objective
      ? `\nPRIMARY OBJECTIVE / MAIN PROMPT:\n"${objective}"\n\nIMPORTANT: The user has provided the above objective. This is the MOST IMPORTANT instruction. Prioritize this objective over the transcript content. If the transcript implies 3 tasks but the objective says "create one task", you MUST follow the objective.`
      : "";

    let strategyInstruction = "";
    if (taskStrategy === "AUTO" || !taskStrategy) {
      strategyInstruction = `\nAGILE SLICE & DICE (AUTO MODE): If the transcript covers a large complex feature, decompose it into 1 macro Task with type "EPIC". Place 3 to 6 specialized sub-tasks inside that EPIC's 'subtasks' array (e.g., Frontend, Backend, DevOps tasks). The EPIC's 'storyPoints' field MUST equal the sum of its subtasks' 'storyPoints' (e.g., subtasks of 1+3+5 → EPIC = 9). Assign fibonacci storyPoints (1, 2, 3, 5, 8, 13) to each subtask based on technical complexity (database schema changes = 5 pts, simple UI tweak = 1 pt). The macro task MUST have type: "EPIC" — NOT "STORY".`;
    } else if (taskStrategy === "SINGLE_TICKET") {
      strategyInstruction = `\nAGILE MEGA-TICKET MODE: You MUST extract exactly ONE single macro ticket (type: "EPIC" or "STORY") that houses all notes and acceptance criteria inside its description. DO NOT generate subtasks.`;
    } else if (taskStrategy === "SPECIFIC_COUNT") {
      const count = taskCount || 5;
      strategyInstruction = `\nAGILE FIXED MODE: You MUST extract EXACTLY ${count} standalone task tickets (type: "TASK" or "STORY"). DO NOT generate subtasks. DO NOT generate an Epic.`;
    }

    let complexityLevelInstruction = "";
    if (complexityLevel) {
      complexityLevelInstruction = `\nIMPORTANT: Adjust the grammatical complexity of the validation steps and descriptions to match a "${complexityLevel}" level.`;
    }

    // Guard against pathologically large injected context (e.g. whole repos/docs
    // full-injected for a long meeting). Past a point, structured-output models
    // (Gemini especially) truncate the JSON response → extraction fails. Cap the
    // CONTEXT; the transcript itself is kept in full (it's the primary signal).
    const MAX_CONTEXT_CHARS = 100_000; // ~25k tokens
    if (finalContextSection.length > MAX_CONTEXT_CHARS) {
      logger.warn(
        `[analyzeTranscript] Injected context too large (${finalContextSection.length} chars) — ` +
          `truncating to ${MAX_CONTEXT_CHARS} for reliable structured extraction.`,
      );
      finalContextSection =
        finalContextSection.slice(0, MAX_CONTEXT_CHARS) +
        "\n\n[Context truncated for length — showing the most relevant portion only.]";
    }

    const prompt = `Today is ${todayIso}. ${personaInstructions}

Analyze the following transcript/request and the provided codebase context.

1. Detect the predominant human language (ISO name, e.g. "english" or "spanish").
2. GENERATE a short, representative title for the transcript (max 10 words).
3. Provide a succinct summary (max 80 words).
4. Extract or GENERATE actionable tasks:
   - Each task MUST have a clear title.
   - **summary**: REQUIRED. A concise, 1-sentence overview of the task (max 20 words).
   - **description**: Detailed technical steps or context.
   - **acceptanceCriteria**: REQUIRED. A JSON array of distinct verifiable conditions (e.g. ["Endpoint returns 200 on success", "Logged-out users get 401"]). Each element is a SINGLE atomic criterion. NEVER use markdown bullets ('- foo') inside any element. NEVER return one concatenated string.
   - status (${TASK_STATUS_LIST}) and priority (${TASK_PRIORITY_LIST}).
   - **type**: One of "TASK", "BUG", "STORY", or "EPIC". Use "EPIC" ONLY when the task has a non-empty 'subtasks' array. Otherwise use TASK (concrete unit of work), BUG (defect), or STORY (user-facing feature).
   - **category**: One of "engineering", "design", "support", "ops", "research". Use this to split work types: "engineering" = code/dev work, "design" = mocks/UX, "support" = customer outreach + admin flag toggles (NOT engineering), "ops" = infra/devops/migrations, "research" = spikes and investigations. The user filters their ticket board by this.
   - **storyPoints**: REQUIRED. Use the Fibonacci scale (1, 2, 3, 5, 8, 13). Engineering rule of thumb: trivial admin/support actions = 1, simple UI tweak = 1, single-file refactor = 2, cross-file feature = 3, schema migration or new integration = 5, multi-platform feature = 8, full system redesign = 13. Never omit this field.
5. Extract PAIN POINTS — frictions, blockers, complaints, risks, or unmet needs raised by participants. These describe PROBLEMS, distinct from the action items above (a pain point may motivate a task, but state the problem, not the fix). For each:
   - **problem**: REQUIRED. The friction in one clear sentence.
   - **affected**: Who/what it hurts (a person, team, or customer), or null if unclear.
   - **severity**: REQUIRED. One of "blocker" (work cannot proceed), "high" (significant drag), "medium" (notable friction), "low" (minor annoyance).
   - **status**: REQUIRED. One of "raised" (mentioned, no plan), "being_addressed" (someone already on it), "resolved_in_meeting" (settled during the call).
   - **evidence**: A short verbatim quote from the transcript grounding the pain point, or null. NEVER fabricate a quote.
   - **suggestedResolution**: A concise next step, or null.
   - Rank the array most-severe first. CRITICAL: return an EMPTY array if the meeting raised no genuine pain points — do NOT invent friction to fill the list.

CRITICAL LANGUAGE RULE: The generated title, summary, task titles, descriptions, and acceptance criteria MUST be written entirely in the detected predominant human language of the transcript. If the transcript is spoken in Spanish, ALL output fields must be in Spanish!


Do NOT guess due dates. Only populate dueDate if explicitly mentioned.
${complexityLevelInstruction}
${strategyInstruction}

${objectiveSection}

${finalContextSection}

Transcript/Request:
${content}`;

    let object;
    let extractedUsage: ReturnType<typeof extractOpenRouterUsage> | undefined;

    try {
      let attempt = 0;
      const maxManualRetries = 3;

      while (attempt < maxManualRetries) {
        try {
          const result = await generateText({
            model,
            // Pin the OpenRouter provider so repeated identical-prefix calls (the
            // retries below; future batched extraction) reuse Gemini's implicit
            // cache instead of cold-missing when OpenRouter bounces Google
            // endpoints. Orthogonal to — and keeps — the json_schema model
            // fallbacks. NOTE: steady-state reuse stays limited until the prompt
            // prefix is front-loaded (cf. getCachedContextModel's repo route).
            providerOptions: getCachedStructuredProviderOptions(activeModel),
            output: Output.object({
              name: "TranscriptFullAnalysis",
              description:
                "Performs deep extraction of meeting tasks, key points, and metadata from the transcript.",
              schema: transcriptAnalysisSchemaForGeneration,
            }),
            prompt,
            maxOutputTokens: 8192,
            temperature: 0.2,
            maxRetries: 2,
          });
          object = result.output;
          extractedUsage = extractOpenRouterUsage(result);
          break;
        } catch (error: any) {
          attempt++;
          const isTransientError =
            error?.name === "AI_APICallError" &&
            (error?.message?.includes("Failed to process successful response") ||
              error?.message?.includes("JSON error injected into SSE stream") ||
              error?.data?.code === 429);

          if (isTransientError && attempt < maxManualRetries) {
            logger.warn(
              `LLM API transient error (${error.message || "Unknown error"}). Retrying (attempt ${attempt}/${maxManualRetries})...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            continue;
          }

          throw error;
        }
      }

      if (extractedUsage) {
        aiUsageService
          .logUsage({
            userId,
            workspaceId,
            feature: "TRANSCRIPT",
            provider: "openrouter",
            model: activeModel,
            inputTokens: extractedUsage.inputTokens,
            outputTokens: extractedUsage.outputTokens,
            cost: extractedUsage.cost,
            cachedTokens: extractedUsage.cachedTokens,
          })
          .catch(() => {
            logger.error(`Failed to log full analysis usage for transcript`);
          });
      }

      const parsed = TranscriptAnalysisRawSchema.parse(object);

      // Log the AI's internal reasoning block to trace logic execution
      logger.info(`[AI Thinking Mode]: ${parsed.chainOfThought}`);

      return {
        chainOfThought: parsed.chainOfThought ?? undefined,
        language: parsed.language,
        // Schemas use `.nullable()` for strict structured-output mode, so coerce
        // the resulting `null`s back to `undefined` to match TranscriptAnalysis.
        title: parsed.title ?? undefined,
        summary: parsed.summary ?? undefined,
        // Forward keyPoints so the persisted metadata.keyPoints is actually
        // populated (it was previously read downstream but never returned here).
        keyPoints: parsed.keyPoints ?? undefined,
        sentiment: parsed.sentiment ?? undefined,
        sentimentExplanation: parsed.sentimentExplanation ?? undefined,
        painPoints: parsed.painPoints.map((p) => ({
          problem: p.problem,
          affected: p.affected ?? undefined,
          severity: p.severity,
          status: p.status,
          evidence: p.evidence ?? undefined,
          suggestedResolution: p.suggestedResolution ?? undefined,
        })),
        tasks: parsed.tasks.map((task) => {
          const ac = joinAcceptanceCriteria(task.acceptanceCriteria);
          return {
            title: task.title,
            summary: task.summary,
            description: task.description,
            acceptanceCriteria: ac.joined,
            acceptanceCriteriaList: ac.list,
            priority: this.normalizeTaskPriority(task.priority),
            status: this.normalizeTaskStatus(task.status),
            type: this.normalizeTaskType(task.type),
            category: task.category ?? undefined,
            dueDate: task.dueDate ?? undefined,
            storyPoints: task.storyPoints ?? undefined,
            dependencies: task.dependencies ?? undefined,
            subtasks: task.subtasks?.map((subtask) => {
              const subAc = joinAcceptanceCriteria(subtask.acceptanceCriteria);
              return {
                title: subtask.title,
                summary: subtask.summary,
                description: subtask.description,
                acceptanceCriteria: subAc.joined,
                acceptanceCriteriaList: subAc.list,
                priority: this.normalizeTaskPriority(subtask.priority),
                status: this.normalizeTaskStatus(subtask.status),
                type: this.normalizeTaskType(subtask.type),
                category: subtask.category ?? undefined,
                dueDate: subtask.dueDate ?? undefined,
                storyPoints: subtask.storyPoints ?? undefined,
                dependencies: subtask.dependencies ?? undefined,
              };
            }),
          };
        }),
      } satisfies TranscriptAnalysis;
    } catch (error: unknown) {
      // IMPORTANT: we deliberately THROW here rather than return a fallback
      // "Processing Error" object. Returning a fake-success result caused the
      // worker to mark the transcript COMPLETED (not FAILED), so the recorder
      // never showed a Retry button. By throwing, the worker's catch sets
      // `processingStatus: "FAILED"` + records the message in
      // `metadata.errorMessage` (shown in the recorder tooltip) and the Retry
      // button appears. See transcriptGenerationWorker.ts.
      const isAuthError =
        error instanceof Error &&
        (error.message.includes("Missing Authentication header") || error.message.includes("401"));

      if (isAuthError) {
        logger.warn("OpenRouter API key is invalid or missing.", (error as Error).message);
        throw new Error(
          "Your OpenRouter API key is invalid or revoked. Please update it in your Workspace Settings, then retry.",
        );
      }

      logger.error("Failed to analyse transcript with OpenAI", error);
      // Surface a concise, human-readable reason — the raw provider error is
      // already logged above for debugging.
      const reason =
        error instanceof Error && error.message.includes("Provider returned error")
          ? "The AI provider rejected the request. Please retry — we'll route to a more compatible model."
          : "The AI failed to generate tasks from this transcript. Please retry, or try a shorter recording.";
      throw new Error(reason);
    }
  }

  /**
   * Ask the LLM to attribute each diarized speaker to a real name, role, and
   * personality summary. Falls back to "Speaker N" when no name can be
   * confidently inferred. Compute speaking-time + utterance-count from the
   * raw utterance list (deterministic, not from the LLM).
   *
   * Returns [] if utterances is empty (text-only transcripts can't be
   * diarized, so nothing to insight on).
   */
  public async extractSpeakerInsights(
    workspaceId: string,
    utterances: Utterance[],
    fullTranscript: string,
    principalSpeakerLabel: string | undefined,
    modelKey?: string,
  ): Promise<SpeakerInsight[]> {
    if (!utterances || utterances.length === 0) return [];

    // Compute deterministic stats per speaker first (don't trust the LLM with
    // numbers it could easily get wrong).
    const stats = new Map<string, { seconds: number; count: number }>();
    for (const u of utterances) {
      const cur = stats.get(u.speaker) ?? { seconds: 0, count: 0 };
      cur.seconds += Math.max(0, (u.end ?? 0) - (u.start ?? 0));
      cur.count += 1;
      stats.set(u.speaker, cur);
    }
    const speakerLabels = Array.from(stats.keys());

    // Build a compact transcript view the LLM can scan for name cues. We cap
    // each utterance to 280 chars and the whole prompt to ~25k so big
    // meetings still fit.
    const MAX_PROMPT_CHARS = 25000;
    let transcriptForLLM = "";
    for (const u of utterances) {
      const snippet = (u.transcript ?? "").trim().slice(0, 280);
      const line = `${u.speaker}: ${snippet}\n`;
      if (transcriptForLLM.length + line.length > MAX_PROMPT_CHARS) break;
      transcriptForLLM += line;
    }

    const SpeakerSchema = z.object({
      label: z
        .string()
        .describe(
          "EXACT Deepgram label as it appears in the transcript (e.g. 'Speaker 0', 'User 0'). Do not invent.",
        ),
      identifiedName: z
        .string()
        .nullable()
        .describe(
          "Real name inferred from greetings ('Hi Sarah'), introductions, signatures. Null if unsure — DO NOT GUESS.",
        ),
      // `.nullable()` (not `.optional()`) for strict structured-output mode —
      // see the note above TranscriptTaskRawSchema.
      role: z
        .string()
        .nullable()
        .describe(
          "Role / title / function inferred from context ('Engineer', 'Product Manager', 'Client'). Null if not inferable.",
        ),
      summary: z
        .string()
        .describe("One sentence: what this person contributed / their main thread in the meeting."),
      keyQuotes: z
        .array(z.string())
        .max(3)
        .nullable()
        .describe("Up to 3 verbatim short quotes that best represent this speaker. Null if none."),
      sentiment: z
        .enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"])
        .nullable()
        .describe("Emotional tone of this speaker through the meeting."),
    });

    const SpeakersResponseSchema = z.object({
      speakers: z.array(SpeakerSchema),
    });

    // Known-people vocabulary: the workspace's member names. Speech-to-text
    // renders names phonetically ("Naila" for Nayla), and the LLM then invents
    // a spelling. Most meetings are with the same team, so feeding the CORRECT
    // spellings as candidates fixes the majority of misspellings at the source.
    // Best-effort — an empty list simply omits the block.
    let knownPeopleBlock = "";
    try {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        select: { user: { select: { name: true } } },
        take: 50,
      });
      const names = members
        .map((m) => m.user?.name?.trim())
        .filter((n): n is string => !!n && n.length > 1);
      if (names.length > 0) {
        knownPeopleBlock = `\nKNOWN WORKSPACE MEMBERS (correct spellings): ${[...new Set(names)].join(", ")}.\nWhen a name heard in the transcript phonetically matches one of these, use THIS spelling (e.g. transcript says "Naila" but the member list has "Nayla" → output "Nayla").\n`;
      }
    } catch {
      // Non-fatal: identification simply runs without the vocabulary.
    }

    const prompt = `You are analyzing a diarized meeting transcript. The audio model labeled speakers as "${speakerLabels.join('", "')}" (these are anonymous labels).

Your job: for EACH label, infer the real person's name (only if mentioned in the conversation), their role, a one-sentence summary of their contribution, up to 3 representative quotes, and an overall sentiment.
${knownPeopleBlock}
CRITICAL RULES:
1. Use the EXACT label string in your output — don't rename "Speaker 0" → "Speaker 1".
2. Only set identifiedName when you're confident (someone says "Hi <name>", "<name> mentioned…", they introduce themselves, etc.). Otherwise set null.
3. Don't invent quotes — paste verbatim from the transcript.
4. Don't invent names that aren't in the transcript. Correcting the SPELLING of a heard name to a known workspace member is allowed and encouraged; adding a person nobody addressed is not.
5. Output exactly one entry per label, even if the speaker barely talked.
6. NEVER assign the same identifiedName to two different labels unless the transcript truly shows the same person split across labels.

TRANSCRIPT (label-prefixed):
${transcriptForLLM}`;

    try {
      const model = await getWorkspaceModel(workspaceId, modelKey || DEFAULT_AI_MODEL);
      const { output, usage, providerMetadata } = await generateText({
        model,
        providerOptions: getStructuredProviderOptions(modelKey || DEFAULT_AI_MODEL),
        output: Output.object({
          name: "SpeakerIdentification",
          description:
            "Matches transcript speakers to their most likely labels based on context and dialogue.",
          schema: SpeakersResponseSchema,
        }),
        temperature: 0.1,
        prompt,
      });

      if (usage) {
        const speakerUsage = extractOpenRouterUsage({ usage, providerMetadata });
        aiUsageService
          .logUsage({
            userId: "system",
            workspaceId,
            feature: "TASK_EXTRACTION",
            provider: "openrouter",
            model: modelKey || DEFAULT_AI_MODEL,
            inputTokens: speakerUsage.inputTokens,
            outputTokens: speakerUsage.outputTokens,
            cost: speakerUsage.cost,
            cachedTokens: speakerUsage.cachedTokens,
          })
          .catch(() => {});
      }

      // Merge LLM output with deterministic stats. Make sure every label
      // appears even if the LLM dropped one.
      const byLabel = new Map<string, z.infer<typeof SpeakerSchema>>();
      for (const s of output.speakers) byLabel.set(s.label, s);

      return speakerLabels.map((label) => {
        const ai = byLabel.get(label);
        const { seconds, count } = stats.get(label) ?? { seconds: 0, count: 0 };
        return {
          label,
          identifiedName: ai?.identifiedName ?? null,
          role: ai?.role ?? null,
          isPrincipalSpeaker: principalSpeakerLabel === label,
          summary: ai?.summary ?? "",
          keyQuotes: ai?.keyQuotes ?? [],
          sentiment: ai?.sentiment ?? undefined,
          speakingTimeSeconds: Math.round(seconds),
          utteranceCount: count,
        } satisfies SpeakerInsight;
      });
    } catch (err) {
      logger.warn("extractSpeakerInsights failed — falling back to label-only", err);
      // Hard fallback: deterministic stats only.
      return speakerLabels.map((label) => {
        const { seconds, count } = stats.get(label) ?? { seconds: 0, count: 0 };
        return {
          label,
          identifiedName: null,
          role: null,
          isPrincipalSpeaker: principalSpeakerLabel === label,
          summary: "",
          keyQuotes: [],
          speakingTimeSeconds: Math.round(seconds),
          utteranceCount: count,
        } satisfies SpeakerInsight;
      });
    }
  }

  private parseDueDate(raw: string | undefined): Date | null {
    if (!raw) {
      return null;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private resolveTaskPriority(priority?: TaskPriority | undefined): TaskPriority {
    if (!priority) {
      return TaskPriority.MEDIUM;
    }

    return priority;
  }

  private resolveTaskStatus(status?: TaskStatus | undefined): TaskStatus {
    if (!status) {
      return TaskStatus.BACKLOG;
    }

    return status;
  }

  private resolveStartDate(recordedAt?: Date | null): Date {
    if (recordedAt) {
      return recordedAt;
    }

    return new Date();
  }

  private resolveDueDate(
    rawDueDate: string | undefined,
    priority: TaskPriority | undefined,
    startDate: Date,
  ): Date | null {
    const parsedDueDate = this.parseDueDate(rawDueDate);
    if (parsedDueDate) {
      return parsedDueDate;
    }

    return null;
  }

  private normalizeTaskPriority(priority?: string | null): TaskPriority | undefined {
    if (!priority) {
      return undefined;
    }

    const normalized = priority.toUpperCase();
    if (TASK_PRIORITY_SET.has(normalized)) {
      return normalized as TaskPriority;
    }

    return undefined;
  }

  private normalizeTaskStatus(status?: string | null): TaskStatus | undefined {
    if (!status) {
      return undefined;
    }

    const normalized = status.toUpperCase();
    if (TASK_STATUS_SET.has(normalized)) {
      return normalized as TaskStatus;
    }

    return undefined;
  }

  private resolveTaskType(type?: string): TaskType {
    if (!type) return TaskType.TASK;
    const normalized = type.toUpperCase().replace(/\s+/g, "_");
    if (Object.values(TaskType).includes(normalized as TaskType)) {
      return normalized as TaskType;
    }
    return TaskType.TASK;
  }

  private normalizeTaskType(type?: string | null): TaskType | undefined {
    if (!type) return undefined;
    const normalized = type.toUpperCase().replace(/\s+/g, "_");
    if (Object.values(TaskType).includes(normalized as TaskType)) {
      return normalized as TaskType;
    }
    return undefined;
  }

  private async autoSyncTasks(
    workspaceId: string,
    transcript: Transcript,
    tasks: Task[],
    options?: {
      syncToJira?: boolean;
      syncToLinear?: boolean;
      syncToTrello?: boolean;
      syncToNotion?: boolean;
      syncToAsana?: boolean;
    },
  ): Promise<void> {
    const integrations = await prisma.workspaceIntegration.findMany({
      where: {
        workspaceId,
        status: IntegrationStatus.CONNECTED,
      },
    });

    if (integrations.length === 0) return;

    const providerToKind: Partial<Record<IntegrationProvider, PostMeetingTaskKind>> = {
      [IntegrationProvider.JIRA]: "jira",
      [IntegrationProvider.LINEAR]: "linear",
      [IntegrationProvider.TRELLO]: "trello",
      [IntegrationProvider.NOTION]: "notion",
      [IntegrationProvider.ASANA]: "asana",
    };

    for (const integration of integrations) {
      const kind = providerToKind[integration.provider];
      try {
        if (integration.provider === IntegrationProvider.JIRA && options?.syncToJira !== false) {
          const meta = integration.metadata as unknown as JiraIntegrationMetadata | null;
          if (!meta?.defaultProjectId) {
            await this.setPostMeetingTaskStatus(transcript.id, "jira", {
              status: "FAILED",
              error:
                "No default Jira project configured. Go to Integrations → Jira to select a project.",
            });
            continue;
          }
          await this.setPostMeetingTaskStatus(transcript.id, "jira", { status: "PENDING" });
          let firstTaskUrl: string | undefined;
          for (const task of tasks) {
            const syncResult = await jiraIntegrationService.createJiraIssue(
              workspaceId,
              task.id,
              meta.defaultProjectId,
            );
            if (!firstTaskUrl) firstTaskUrl = syncResult.url;
            await this.updateTaskTargetMetadata(task.id, "jira", {
              issueId: syncResult.issueId,
              issueKey: syncResult.issueKey,
              url: syncResult.url,
            });
          }
          await this.setPostMeetingTaskStatus(transcript.id, "jira", {
            status: "OK",
            count: tasks.length,
            url: firstTaskUrl,
          });
        } else if (
          integration.provider === IntegrationProvider.LINEAR &&
          options?.syncToLinear !== false
        ) {
          const meta = integration.metadata as unknown as LinearIntegrationMetadata | null;
          if (!meta?.defaultTeamId) {
            await this.setPostMeetingTaskStatus(transcript.id, "linear", {
              status: "FAILED",
              error:
                "No default Linear team configured. Go to Integrations → Linear to select a team.",
            });
            continue;
          }
          await this.setPostMeetingTaskStatus(transcript.id, "linear", { status: "PENDING" });
          let firstTaskUrl: string | undefined;
          for (const task of tasks) {
            const syncResult = await linearIntegrationService.createLinearIssue(
              workspaceId,
              task.id,
              meta.defaultTeamId,
            );
            if (!firstTaskUrl) firstTaskUrl = syncResult.url;
            await this.updateTaskTargetMetadata(task.id, "linear", {
              issueId: syncResult.issueId,
              identifier: syncResult.identifier,
              url: syncResult.url,
            });
          }
          await this.setPostMeetingTaskStatus(transcript.id, "linear", {
            status: "OK",
            count: tasks.length,
            url: firstTaskUrl,
          });
        } else if (
          integration.provider === IntegrationProvider.TRELLO &&
          options?.syncToTrello !== false
        ) {
          const meta = integration.metadata as unknown as TrelloIntegrationMetadata | null;
          if (!meta?.defaultBoardId || !meta?.defaultListId) {
            await this.setPostMeetingTaskStatus(transcript.id, "trello", {
              status: "FAILED",
              error:
                "No default Trello board/list configured. Go to Integrations → Trello to select a board and list.",
            });
            continue;
          }
          await this.setPostMeetingTaskStatus(transcript.id, "trello", { status: "PENDING" });
          let firstTaskUrl: string | undefined;
          for (const task of tasks) {
            const syncResult = await trelloIntegrationService.createTrelloCard(
              workspaceId,
              task.id,
              meta.defaultBoardId,
              meta.defaultListId,
            );
            if (!firstTaskUrl) firstTaskUrl = syncResult.url;
            logger.info(`Auto-synced task ${task.id} to Trello card ${syncResult.cardId}`);
            await this.updateTaskTargetMetadata(task.id, "trello", {
              cardId: syncResult.cardId,
              shortLink: syncResult.shortLink,
              url: syncResult.url,
            });
          }
          await this.setPostMeetingTaskStatus(transcript.id, "trello", {
            status: "OK",
            count: tasks.length,
            url: firstTaskUrl,
          });
        } else if (
          integration.provider === IntegrationProvider.NOTION &&
          options?.syncToNotion !== false
        ) {
          await this.setPostMeetingTaskStatus(transcript.id, "notion", { status: "PENDING" });
          // Export the entire transcript instead of individual tasks
          const syncResult = await notionIntegrationService.exportTranscriptToNotion(
            workspaceId,
            transcript,
            tasks,
          );

          logger.info(
            `Auto-synced transcript ${transcript.id} to Notion page ${syncResult.pageId}`,
          );

          // Still tag each task with the notion target so the UI knows it was synced
          for (const task of tasks) {
            await this.updateTaskTargetMetadata(task.id, "notion", {
              pageId: syncResult.pageId,
              url: syncResult.url,
            });
          }
          await this.setPostMeetingTaskStatus(transcript.id, "notion", {
            status: "OK",
            count: 1,
            url: syncResult.url,
          });
        } else if (
          integration.provider === IntegrationProvider.ASANA &&
          options?.syncToAsana !== false
        ) {
          const meta = integration.metadata as unknown as AsanaIntegrationMetadata | null;
          if (!meta?.defaultProjectGid) {
            await this.setPostMeetingTaskStatus(transcript.id, "asana", {
              status: "FAILED",
              error:
                "No default Asana project configured. Go to Integrations → Asana to select a project.",
            });
            continue;
          }
          await this.setPostMeetingTaskStatus(transcript.id, "asana", { status: "PENDING" });
          let firstTaskUrl: string | undefined;
          for (const task of tasks) {
            const syncResult = await asanaIntegrationService.createAsanaTask(
              workspaceId,
              task.id,
              meta.defaultProjectGid,
            );
            if (!firstTaskUrl) firstTaskUrl = syncResult.url;
            logger.info(`Auto-synced task ${task.id} to Asana task ${syncResult.taskGid}`);
            await this.updateTaskTargetMetadata(task.id, "asana", {
              taskGid: syncResult.taskGid,
              url: syncResult.url,
            });
          }
          await this.setPostMeetingTaskStatus(transcript.id, "asana", {
            status: "OK",
            count: tasks.length,
            url: firstTaskUrl,
          });
        }
      } catch (error) {
        logger.error(`Auto-sync failed for ${integration.provider}`, error);
        if (kind) {
          await this.setPostMeetingTaskStatus(transcript.id, kind, {
            status: "FAILED",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Re-run a single post-meeting side effect (sync, export, generate) for a
   * transcript whose original attempt failed. The caller (controller) is
   * responsible for auth — this method assumes access has been verified.
   *
   * Fires the work as a non-awaited promise; the status transition is
   * observable via `metadata.postMeetingTasks.{kind}` on the next poll.
   */
  public async retryPostMeetingTask(
    workspaceId: string,
    userId: string,
    transcriptId: string,
    kind: PostMeetingTaskKind,
  ): Promise<void> {
    const transcript = await prisma.transcript.findUnique({ where: { id: transcriptId } });
    if (!transcript) throw new Error("Transcript not found");

    const existingTasks = (transcript.metadata as { postMeetingTasks?: PostMeetingTasksRecord })
      ?.postMeetingTasks;
    if (existingTasks?.[kind]?.status === "PENDING") {
      throw new Error("ALREADY_PENDING");
    }

    const links = await prisma.taskTranscriptLink.findMany({
      where: { transcriptId },
      include: { task: true },
    });
    const tasks: Task[] = links.map((l) => l.task);

    // Optimistically set PENDING so the UI reflects it immediately
    await this.setPostMeetingTaskStatus(transcriptId, kind, { status: "PENDING" });

    const fireAndForget = (work: () => Promise<unknown>, label: string) => {
      work().catch((err) => {
        logger.error(`Retry of post-meeting task ${kind} (${label}) errored`, err);
      });
    };

    if (
      kind === "jira" ||
      kind === "linear" ||
      kind === "trello" ||
      kind === "notion" ||
      kind === "asana"
    ) {
      fireAndForget(
        () =>
          this.autoSyncTasks(workspaceId, transcript, tasks, {
            syncToJira: kind === "jira",
            syncToLinear: kind === "linear",
            syncToTrello: kind === "trello",
            syncToNotion: kind === "notion",
            syncToAsana: kind === "asana",
          }),
        "autoSyncTasks",
      );
      return;
    }

    if (kind === "twenty") {
      // Routed through the same idempotent path as the automatic push, so the
      // retry button can never become a second source of duplicate CRM notes.
      fireAndForget(() => this.autoPushToTwenty(workspaceId, transcript), "autoPushToTwenty");
      return;
    }

    if (kind === "googleDrive" || kind === "oneDrive") {
      // Reconstruct a minimal TranscriptAnalysis from persisted DB state.
      // Only `title`, `summary`, and `tasks` are read by autoExportDocument.
      const minimalAnalysis = {
        language: "en",
        title: transcript.title ?? "Meeting Summary",
        summary: transcript.summary ?? "",
        tasks: tasks.map((t) => ({
          title: t.title,
          description: t.description ?? undefined,
          acceptanceCriteria:
            ((t.metadata as Record<string, unknown> | null)?.acceptanceCriteria as
              | string
              | undefined) ?? undefined,
        })),
      } as unknown as TranscriptAnalysis;

      fireAndForget(
        () =>
          this.autoExportDocument(workspaceId, transcript, minimalAnalysis, {
            exportToGoogleDrive: kind === "googleDrive",
            exportToOneDrive: kind === "oneDrive",
          }),
        "autoExportDocument",
      );
      return;
    }

    if (kind === "doc") {
      fireAndForget(async () => {
        try {
          const themeId = await this.resolveGenerationThemeId(workspaceId, transcript.projectId);
          const doc = await docGenerationService.startGeneration(userId, workspaceId, {
            title: transcript.title || "Meeting Document",
            prompt: `Generate a comprehensive meeting document based on the following transcript summary and extracted tasks. Ensure the language and style are highly corporate, formal, and professional.`,
            transcriptIds: [transcriptId],
            contextIds: [],
            themeId,
          });
          await this.setPostMeetingTaskStatus(transcriptId, "doc", {
            status: "OK",
            url: `/docs/view/${doc.id}`,
          });
        } catch (err) {
          logger.error(
            `[retryPostMeetingTask] doc generation failed for transcript ${transcriptId}`,
            err,
          );
          await this.setPostMeetingTaskStatus(transcriptId, "doc", {
            status: "FAILED",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }, "doc generation");
      return;
    }

    if (kind === "slides") {
      fireAndForget(async () => {
        try {
          const themeId = await this.resolveGenerationThemeId(workspaceId, transcript.projectId);
          const pres = await slideGenerationService.startPresentationGeneration(
            userId,
            workspaceId,
            undefined,
            themeId,
            [],
            [transcriptId],
            `Create a presentation summarizing the key points, decisions, and action items from the meeting.`,
            transcript.title || "Meeting Slides",
          );
          await this.setPostMeetingTaskStatus(transcriptId, "slides", {
            status: "OK",
            url: `/presentations/${pres.id}`,
          });
        } catch (err) {
          logger.error(
            `[retryPostMeetingTask] slides generation failed for transcript ${transcriptId}`,
            err,
          );
          await this.setPostMeetingTaskStatus(transcriptId, "slides", {
            status: "FAILED",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }, "slides generation");
      return;
    }
  }

  /**
   * Update the transcript's `metadata.processingStatus` field.
   * Used to transition between REFINING_TASKS → COMPLETED after background refinement.
   */
  public async setTranscriptProcessingStatus(transcriptId: string, status: string): Promise<void> {
    const transcript = await prisma.transcript.findUnique({
      where: { id: transcriptId },
      select: { metadata: true },
    });
    if (!transcript) return;

    const meta: Prisma.JsonObject =
      typeof transcript.metadata === "object" && transcript.metadata
        ? { ...(transcript.metadata as Prisma.JsonObject) }
        : {};

    meta.processingStatus = status;

    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { metadata: meta as Prisma.InputJsonValue },
    });
  }

  /**
   * Background refinement: runs the agentic GitNexus investigation and
   * upgrades already-persisted fast-pass tasks with enriched descriptions,
   * acceptance criteria, and code references.
   *
   * Called by the TaskRefinementWorker. If this fails, the fast-pass tasks
   * remain usable — refinement is best-effort.
   */
  /**
   * Big-context cached code investigation (the preferred path for projects with
   * a connected GitHub repo). If the project's context contains a repomix repo
   * that fits the budget, read it directly with a cached Gemini call and return
   * a plain-text investigation (relevant files, functions, likely root causes,
   * edge cases — with real file/symbol references).
   *
   * Why this design:
   *  - `generateText` (no json_schema) sidesteps Gemini's weakness with nested
   *    structured-output schemas — the part that historically crashed.
   *  - No GitNexus/MCP dependency, so it can't silently no-op when the MCP
   *    server is down.
   *  - Prompt layout is [stable system + repo] → [variable transcript], so the
   *    large repo prefix stays warm in Gemini's implicit prompt cache across a
   *    meeting's burst of calls (cheap on repeat).
   *
   * Returns a discriminated result so the caller can pick the RIGHT fallback:
   * the global GitNexus MCP is indexed on the Plan AI codebase itself, so it is
   * only an acceptable fallback when NO repo is connected ("no_repo"). When a
   * repo IS connected but this path missed (not indexed yet / too large /
   * errored), the caller must use that repo's ladybug — or skip enrichment —
   * never the plan MCP (wrong codebase context, see IMPROVEMENTS.md #28).
   */
  private async investigateRepoWithCache(payload: {
    workspaceId: string;
    userId: string;
    content: string;
    contextIds?: string[];
    objective?: string;
    onProgress?: (update: Record<string, unknown>) => Promise<void>;
  }): Promise<
    | { status: "success"; text: string }
    | { status: "not_needed" }
    | { status: "no_repo" }
    | { status: "repo_not_ready"; githubFileId: string }
    | { status: "too_large"; githubFileId: string }
    | { status: "error"; githubFileId: string }
  > {
    const { workspaceId, userId, content, contextIds, objective, onProgress } = payload;
    if (!contextIds || contextIds.length === 0) return { status: "no_repo" };

    // Only proceed if a GitHub repo is actually connected to this context.
    const githubFile = await prisma.contextFile.findFirst({
      where: {
        contextId: { in: contextIds },
        metadata: { path: ["source"], equals: "GITHUB_SYNC" },
      },
      select: { id: true },
    });
    if (!githubFile) {
      logger.info(
        `[TaskRefinement/Repomix] No GITHUB_SYNC ContextFile found for contextIds=${contextIds.join(",")} — skipping repomix path.`,
      );
      return { status: "no_repo" };
    }
    logger.info(
      `[TaskRefinement/Repomix] Found GitHub ContextFile id=${githubFile.id}. Fetching repomix chunks from Qdrant...`,
    );

    // Fetch ONLY the repomix chunks (not PDFs, transcripts, or other context
    // files from the same project) — keeps the prompt clean and avoids mixing
    // business docs with source code.
    const chunks = await getRepomixContextPayloads(contextIds, githubFile.id);
    const repoText = chunks.join("\n\n");
    if (!repoText.trim()) {
      logger.info(
        `[TaskRefinement/Repomix] Qdrant returned 0 chunks for fileId=${githubFile.id} — repo not yet indexed or empty.`,
      );
      return { status: "repo_not_ready", githubFileId: githubFile.id };
    }
    logger.info(
      `[TaskRefinement/Repomix] Loaded ${chunks.length} chunks (${repoText.length} chars) for fileId=${githubFile.id}.`,
    );

    // Budget guard. ~700k tokens ≈ 2.8M chars, leaving room for the transcript
    // + response inside Gemini's 1M window. Larger repos fall back to MCP/RAG.
    const MAX_REPO_CHARS = 2_800_000;
    if (repoText.length > MAX_REPO_CHARS) {
      logger.info(
        `[TaskRefinement] Connected repo too large for cached injection (${repoText.length} chars) — falling back to ladybug CLI`,
      );
      return { status: "too_large", githubFileId: githubFile.id };
    }

    // Hybrid: enrich the full-code prompt with the call-graph structure from
    // this repo's ladybug (execution flows related to the meeting). Raw source
    // shows the LLM the code, but not the cross-file call relationships — the
    // graph does. Best-effort and time-boxed inside the service: on any
    // failure we proceed with the repomix-only prompt.
    let structuralContext: string | null = null;
    try {
      const tGraph = Date.now();
      await onProgress?.({ phase: "hybrid:attempting" });
      // Search concept = the MEETING CONTENT, never the objective: the
      // objective is generation instructions ("produce engineering-grade
      // tickets…") and made a useless graph query (prod log 2026-06-11).
      structuralContext = await ladybugService.getStructuralContext(
        githubFile.id,
        content.slice(0, 300),
        objective?.trim()
          ? objective.slice(0, 120)
          : "execution flows relevant to the meeting topics",
      );
      logger.info(
        `[TaskRefinement] 🧭 Hybrid graph context: ${
          structuralContext ? `${structuralContext.length} chars` : "unavailable"
        } in ${Date.now() - tGraph}ms`,
      );
      await onProgress?.({
        phase: structuralContext ? "hybrid:ready" : "hybrid:unavailable",
        chars: structuralContext?.length ?? 0,
        ms: Date.now() - tGraph,
      });
    } catch (err) {
      logger.error("[TaskRefinement] Hybrid graph context failed — repomix-only prompt", err);
      await onProgress?.({
        phase: "hybrid:error",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      const model = await getCachedContextModel(workspaceId);
      const result = await generateText({
        model,
        providerOptions: getCachedContextProviderOptions(),
        // Stable prefix (system + repo) first; VARIABLE parts (graph flows,
        // transcript) last → the repo prefix stays cacheable across calls for
        // the same project. Do NOT move the graph block before the repo.
        system:
          "You are a senior software architect. You are given the FULL source code of a project (below), followed by a meeting transcript. Analyze the code in light of what the meeting discusses. Identify the specific files, functions, classes and modules involved, the likely root cause of any bug mentioned, edge cases, and concrete technical risks. ALWAYS cite real file paths and symbol names taken from the provided code — never invent them. Be precise and technical; this feeds an engineering ticket generator. If the transcript is genuinely non-technical, reply exactly 'No codebase context needed.'",
        prompt: `PROJECT SOURCE CODE:\n${repoText}\n\n---\n\n${
          structuralContext
            ? `CODE GRAPH — execution flows related to this meeting (from static call-graph analysis; use these to understand cross-file relationships):\n${structuralContext}\n\n---\n\n`
            : ""
        }MEETING TRANSCRIPT:\n${content}\n\nObjective: ${objective ?? "Produce engineering tickets"}\n\nProvide your code investigation.`,
        maxRetries: 2,
      });

      const repoUsage = extractOpenRouterUsage(result);
      aiUsageService
        .logUsage({
          userId,
          workspaceId,
          feature: "TASK_EXTRACTION",
          provider: "openrouter",
          model: CACHED_CONTEXT_MODEL,
          inputTokens: repoUsage.inputTokens,
          outputTokens: repoUsage.outputTokens,
          cost: repoUsage.cost,
          cachedTokens: repoUsage.cachedTokens,
        })
        .catch(() => {});

      const text = result.text?.trim();
      // The model read the FULL repo and decided no codebase context applies —
      // that's a final verdict, not a miss: don't fall back to anything.
      if (!text || text === "No codebase context needed.") return { status: "not_needed" };
      logger.info(
        `[TaskRefinement] Repomix-cached investigation produced ${text.length} chars (model=${CACHED_CONTEXT_MODEL})`,
      );
      return { status: "success", text };
    } catch (err) {
      logger.error(
        "[TaskRefinement] Repomix-cached investigation failed — will try the repo's ladybug",
        err,
      );
      return { status: "error", githubFileId: githubFile.id };
    }
  }

  public async refineTasksWithInvestigation(
    payload: {
      transcriptId: string;
      workspaceId: string;
      userId: string;
      content: string;
      contextIds?: string[];
      contextPrompt?: string;
      persona?: "SECRETARY" | "ARCHITECT" | "PRODUCT_MANAGER" | "DEVELOPER";
      objective?: string;
      complexityLevel?: string;
      modelKey?: string;
      taskIds: string[];
    },
    onProgress?: (update: Record<string, unknown>) => Promise<void>,
  ): Promise<void> {
    const {
      transcriptId,
      workspaceId,
      userId,
      content,
      contextIds,
      contextPrompt,
      objective,
      modelKey,
      taskIds,
    } = payload;

    logger.info(
      `[TaskRefinement] Starting agentic investigation for transcript ${transcriptId} (${taskIds.length} tasks, contextIds=${(contextIds ?? []).join(",")})`,
    );
    await onProgress?.({
      phase: "start",
      transcriptId,
      taskCount: taskIds.length,
      contextIds: contextIds ?? [],
    });

    // Step 1: Gather codebase investigation context.
    // Preferred path: a connected GitHub repo (repomix) read directly with a
    // cached Gemini call — cheap, reliable, and independent of GitNexus/MCP.
    logger.info(`[TaskRefinement] Step 1: Attempting repomix-cached investigation...`);
    await onProgress?.({ phase: "repomix:attempting" });
    const t0 = Date.now();
    const repoInvestigation = await this.investigateRepoWithCache({
      workspaceId,
      userId,
      content,
      contextIds,
      objective,
      onProgress,
    });
    let investigationContext = repoInvestigation.status === "success" ? repoInvestigation.text : "";

    if (investigationContext) {
      logger.info(
        `[TaskRefinement] ✅ Repomix path succeeded (${investigationContext.length} chars). Skipping MCP.`,
      );
      await onProgress?.({
        phase: "repomix:success",
        chars: investigationContext.length,
        ms: Date.now() - t0,
      });
    } else {
      logger.info(`[TaskRefinement] Repomix path status=${repoInvestigation.status}.`);
      await onProgress?.({
        phase: "repomix:miss",
        status: repoInvestigation.status,
        ms: Date.now() - t0,
      });
    }

    // Fallback tool selection. The global GitNexus MCP is indexed on the PLAN
    // AI codebase — using it for a customer's connected repo injects the wrong
    // codebase's context. So:
    //  - no repo connected         → plan MCP is acceptable (legacy behavior)
    //  - repo connected, miss      → that repo's ladybug (CLI tools), or skip
    //  - repomix verdict reached   → no fallback at all
    let tools: ToolSet | undefined;
    let toolSource: "mcp" | "ladybug" | undefined;
    let ladybugCleanup: (() => void) | undefined;

    if (
      !investigationContext &&
      repoInvestigation.status !== "not_needed" &&
      repoInvestigation.status !== "success"
    ) {
      if (repoInvestigation.status === "no_repo") {
        tools = mcpClientService.getAiTools();
        if (tools) toolSource = "mcp";
      } else {
        await onProgress?.({
          phase: "ladybug:restoring",
          githubFileId: repoInvestigation.githubFileId,
        });
        const tLadybug = Date.now();
        const prepared = await ladybugService.prepareQueryTools(repoInvestigation.githubFileId);
        logger.info(
          `[TaskRefinement] Ladybug restore ${prepared ? "OK" : "unavailable"} for file ${repoInvestigation.githubFileId} in ${Date.now() - tLadybug}ms`,
        );
        if (prepared) {
          tools = prepared.tools;
          ladybugCleanup = prepared.cleanup;
          toolSource = "ladybug";
          logger.info(
            `[TaskRefinement] 🐞 Ladybug restored for file ${repoInvestigation.githubFileId} — querying the CONNECTED repo's graph.`,
          );
          await onProgress?.({
            phase: "ladybug:ready",
            githubFileId: repoInvestigation.githubFileId,
          });
        } else {
          logger.info(
            `[TaskRefinement] Repo is connected (status=${repoInvestigation.status}) but no ladybug is available — skipping enrichment instead of querying the WRONG (plan) MCP index.`,
          );
          await onProgress?.({ phase: "ladybug:unavailable", status: repoInvestigation.status });
        }
      }
    }

    if (tools) {
      logger.info(
        `[TaskRefinement] Step 2: ${toolSource} tools available — running agentic investigation (model=${"google/gemini-2.5-flash"})...`,
      );
      await onProgress?.({
        phase: "mcp:attempting",
        source: toolSource,
        model: "google/gemini-2.5-flash",
      });
      const MCP_MODEL = "google/gemini-2.5-flash";
      const tMcp = Date.now();
      try {
        // Use the workspace's configured model for the MCP investigation.
        // Falls back to gemini-2.5-flash which is better at tool use than gpt-4o-mini.
        const mcpModel = await getWorkspaceModel(workspaceId, MCP_MODEL);
        const investigation = await generateText({
          model: mcpModel,
          providerOptions: getFallbackProviderOptions(MCP_MODEL),
          tools,
          // Ladybug CLI roundtrips are local and cheap — allow a deeper
          // investigation than the remote MCP path.
          stopWhen: stepCountIs(toolSource === "ladybug" ? 4 : 2),
          system:
            "You are an AI Software Architect. The user is generating Agile task tickets from a transcript or request. IF the request is a simple, non-technical business or life task (like sending an email, scheduling a meeting, calling someone), DO NOT query the codebase. Simply return 'No codebase context needed.' OTHERWISE, use your tools to query the codebase knowledge graph and gather relevant structural context (e.g. affected components, database models, related execution flows). Summarize your findings so the task generator can write highly accurate, technically specific acceptance criteria.",
          prompt: `Transcript/Request:\n${content}\n\nObjective: ${objective ?? "Extract tasks"}\n\nPlease investigate the codebase ONLY IF this is a technical software task to gather any missing structural context.`,
        });

        if (investigation.text && investigation.text.trim() !== "No codebase context needed.") {
          investigationContext = investigation.text;
          logger.info(
            `[TaskRefinement] ✅ ${toolSource} investigation produced ${investigationContext.length} chars (steps=${investigation.steps?.length ?? 0}).`,
          );
          await onProgress?.({
            phase: "mcp:success",
            source: toolSource,
            chars: investigationContext.length,
            steps: investigation.steps?.length ?? 0,
            ms: Date.now() - tMcp,
          });
        } else {
          logger.info(
            `[TaskRefinement] ${toolSource} investigation returned 'No codebase context needed.' — skipping enrichment.`,
          );
          await onProgress?.({
            phase: "mcp:not_needed",
            source: toolSource,
            ms: Date.now() - tMcp,
          });
        }

        const investUsage = extractOpenRouterUsage(investigation);
        aiUsageService
          .logUsage({
            userId,
            workspaceId,
            feature: "TASK_EXTRACTION",
            provider: "openrouter",
            model: MCP_MODEL,
            inputTokens: investUsage.inputTokens,
            outputTokens: investUsage.outputTokens,
            cost: investUsage.cost,
            cachedTokens: investUsage.cachedTokens,
          })
          .catch(() => {});
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes("Missing Authentication header") || err.message.includes("401"))
        ) {
          logger.warn(
            "[TaskRefinement] ❌ Auth error during MCP investigation (skipping)",
            err.message,
          );
          await onProgress?.({ phase: "mcp:auth_error", ms: Date.now() - tMcp });
        } else {
          logger.error(
            "[TaskRefinement] ❌ Failed during agentic investigation — continuing without it",
            err,
          );
          await onProgress?.({
            phase: "mcp:error",
            source: toolSource,
            error: err instanceof Error ? err.message : String(err),
            ms: Date.now() - tMcp,
          });
        }
      } finally {
        ladybugCleanup?.();
      }
    } else if (!investigationContext && repoInvestigation.status === "no_repo") {
      // No connected repo and the plan MCP isn't available either
      logger.info(
        `[TaskRefinement] GitNexus MCP unavailable (isAvailable=${mcpClientService.isAvailable}). No codebase investigation will be performed.`,
      );
      await onProgress?.({ phase: "mcp:unavailable", isAvailable: mcpClientService.isAvailable });
    }

    // If no meaningful investigation context was gathered, skip refinement
    if (!investigationContext) {
      logger.info(
        `[TaskRefinement] No codebase context gathered for transcript ${transcriptId} — skipping enrichment`,
      );
      await onProgress?.({ phase: "skip:no_context" });
      await this.setTranscriptProcessingStatus(transcriptId, "COMPLETED");
      return;
    }

    // Step 2: For each existing task, enrich with investigation context
    const activeModel = modelKey || TICKET_MODEL;
    const model = await getWorkspaceModel(workspaceId, activeModel);

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: {
        id: true,
        title: true,
        description: true,
        acceptanceCriteria: true,
        parentId: true,
        metadata: true,
      },
    });

    // Only refine top-level tasks (not subtasks) to save LLM calls.
    // Subtask refinement can be added later if needed.
    const topLevelTasks = tasks.filter((t) => !t.parentId);

    if (topLevelTasks.length === 0) {
      await this.setTranscriptProcessingStatus(transcriptId, "COMPLETED");
      return;
    }

    const TaskRefinementSchema = z.object({
      tasks: z.array(
        z.object({
          id: z.string(),
          enrichedDescription: z
            .string()
            .describe(
              "The improved task description incorporating specific file references, component names, function signatures, and technical context from the codebase investigation. Keep the original intent but add concrete implementation details.",
            ),
          enrichedAcceptanceCriteria: z
            .array(z.string())
            .describe(
              "Improved acceptance criteria that reference specific files, functions, or components from the codebase. Each item is a single atomic verifiable condition.",
            ),
        }),
      ),
    });

    const taskSummaries = topLevelTasks
      .map(
        (t) =>
          `[ID: ${t.id}]\nTitle: ${t.title}\nDescription: ${t.description ?? "(none)"}\nAcceptance Criteria: ${t.acceptanceCriteria ?? "(none)"}`,
      )
      .join("\n\n---\n\n");

    try {
      const { output, usage, providerMetadata } = await generateText({
        model,
        providerOptions: getStructuredProviderOptions(activeModel),
        output: Output.object({
          name: "CodebaseTaskRefinement",
          description:
            "Enriches agile tasks with precise technical context gathered from the codebase.",
          schema: TaskRefinementSchema,
        }),
        temperature: 0.15,
        prompt: `You are enriching existing agile tickets with codebase intelligence. Below is codebase investigation context gathered from the project's knowledge graph, followed by the existing tasks.

Your job: For each task, produce an ENRICHED description and acceptance criteria that incorporates specific file paths, function names, component names, database models, or execution flows found in the investigation. Do NOT change the intent of the task — only add technical precision.

If a task is non-technical (e.g. "Send email to client"), return its description and acceptance criteria UNCHANGED.

### Codebase Investigation Context:
${investigationContext}

${contextPrompt ? `### Additional Context:\n${contextPrompt}\n` : ""}

### Existing Tasks to Enrich:
${taskSummaries}`,
        maxRetries: 2,
      });

      if (usage) {
        const enrichUsage = extractOpenRouterUsage({ usage, providerMetadata });
        aiUsageService
          .logUsage({
            userId,
            workspaceId,
            feature: "TASK_EXTRACTION",
            provider: "openrouter",
            model: activeModel,
            inputTokens: enrichUsage.inputTokens,
            outputTokens: enrichUsage.outputTokens,
            cost: enrichUsage.cost,
            cachedTokens: enrichUsage.cachedTokens,
          })
          .catch(() => {});
      }

      // Batch task enrichment updates into a single $transaction instead of
      // sequential findUnique+update per task.
      const updateOps: ReturnType<typeof prisma.task.update>[] = [];
      for (const enrichedTask of output.tasks) {
        const existingTask = topLevelTasks.find((t) => t.id === enrichedTask.id);
        if (!existingTask) continue;

        const { joined, list } = joinAcceptanceCriteria(enrichedTask.enrichedAcceptanceCriteria);

        const descriptionChanged = enrichedTask.enrichedDescription !== existingTask.description;
        const acChanged = joined !== existingTask.acceptanceCriteria;

        if (descriptionChanged || acChanged) {
          const metadata = (existingTask.metadata as Record<string, unknown>) ?? {};
          metadata.refinedAt = new Date().toISOString();
          metadata.refinedFromTranscriptId = transcriptId;
          if (descriptionChanged) metadata.preRefinementDescription = existingTask.description;
          if (acChanged) metadata.preRefinementAcceptanceCriteria = existingTask.acceptanceCriteria;
          metadata.acceptanceCriteriaList = list;

          updateOps.push(
            prisma.task.update({
              where: { id: enrichedTask.id },
              data: {
                ...(descriptionChanged ? { description: enrichedTask.enrichedDescription } : {}),
                ...(acChanged ? { acceptanceCriteria: joined } : {}),
                metadata: metadata as Prisma.InputJsonObject,
              },
            }),
          );
        }
      }

      let enrichedCount = 0;
      if (updateOps.length > 0) {
        await prisma.$transaction(updateOps);
        enrichedCount = updateOps.length;
      }

      logger.info(
        `[TaskRefinement] Enriched ${enrichedCount}/${topLevelTasks.length} tasks for transcript ${transcriptId}`,
      );
    } catch (err) {
      logger.error(
        `[TaskRefinement] LLM enrichment call failed for transcript ${transcriptId}`,
        err,
      );
    }

    // Always mark as COMPLETED when refinement finishes (even on partial failure)
    await this.setTranscriptProcessingStatus(transcriptId, "COMPLETED");
  }

  /**
   * Persist the outcome of a single fire-and-forget post-meeting task to the
   * transcript's `metadata.postMeetingTasks.{kind}`. Best-effort: failures to
   * write status never bubble up — the side effect itself is what matters.
   */
  /**
   * Public so one-off pushes triggered from a controller (e.g. the manual
   * "Send to Twenty" dialog) record their outcome in the same place the
   * automatic pipeline does. Without that, a manual push succeeds but the
   * transcript view shows nothing for it.
   */
  public async setPostMeetingTaskStatus(
    transcriptId: string,
    kind: PostMeetingTaskKind,
    update: Omit<PostMeetingTaskStatus, "finishedAt"> & { finishedAt?: string },
  ): Promise<void> {
    try {
      const transcript = await prisma.transcript.findUnique({
        where: { id: transcriptId },
        select: { metadata: true },
      });
      if (!transcript) return;

      const meta: Prisma.JsonObject =
        typeof transcript.metadata === "object" && transcript.metadata
          ? { ...(transcript.metadata as Prisma.JsonObject) }
          : {};

      const tasks: PostMeetingTasksRecord =
        (meta.postMeetingTasks as PostMeetingTasksRecord | undefined) ?? {};

      const finishedAt =
        update.status === "OK" || update.status === "FAILED" || update.status === "SKIPPED"
          ? (update.finishedAt ?? new Date().toISOString())
          : update.finishedAt;

      tasks[kind] = { ...update, finishedAt };
      meta.postMeetingTasks = tasks as unknown as Prisma.JsonObject;

      await prisma.transcript.update({
        where: { id: transcriptId },
        data: { metadata: meta as Prisma.InputJsonValue },
      });
    } catch (err) {
      logger.error(
        `Failed to record post-meeting task status (${kind}) for transcript ${transcriptId}`,
        err,
      );
    }
  }

  private async updateTaskTargetMetadata(
    taskId: string,
    provider: "jira" | "linear" | "trello" | "notion" | "asana",
    payload: unknown,
  ) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { metadata: true },
    });
    if (!task) return;

    const existingMetadata = (task.metadata as unknown as TaskMetadata) || {};

    if (provider === "jira") {
      existingMetadata.jira = payload as TaskMetadata["jira"];
    } else if (provider === "linear") {
      existingMetadata.linear = payload as TaskMetadata["linear"];
    } else if (provider === "trello") {
      existingMetadata.trello = payload as TaskMetadata["trello"];
    } else if (provider === "asana") {
      existingMetadata.asana = payload as TaskMetadata["asana"];
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        metadata: existingMetadata as unknown as Prisma.InputJsonValue,
      },
    });
  }
  /**
   * Pushes the meeting note to Twenty.
   *
   * Company resolution, in order:
   *   1. `explicitCompanyId` — picked by the user when saving the recording.
   *      This is the normal path: one person meets several DIFFERENT clients in
   *      a day, so the destination belongs to the meeting.
   *   2. The project's linked company — a convenience default for recurring
   *      client projects, not a requirement.
   *
   * Neither available → SKIPPED, not FAILED: it's a missing choice, not an error.
   */
  private async autoPushToTwenty(
    workspaceId: string,
    transcript: Transcript,
    explicitCompanyId?: string,
  ): Promise<void> {
    let projectMetadata: unknown = null;
    if (!explicitCompanyId?.trim() && transcript.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: transcript.projectId, workspaceId },
        select: { metadata: true },
      });
      projectMetadata = project?.metadata ?? null;
    }
    const companyId = resolveTwentyCompanyId(explicitCompanyId, projectMetadata);

    if (!companyId) {
      await this.setPostMeetingTaskStatus(transcript.id, "twenty", {
        status: "SKIPPED",
        error: "No Twenty company was chosen for this meeting.",
      });
      return;
    }

    await this.setPostMeetingTaskStatus(transcript.id, "twenty", { status: "PENDING" });
    try {
      const result = await twentyIntegrationService.pushMeetingNote(workspaceId, transcript, {
        companyId,
      });
      await this.setPostMeetingTaskStatus(transcript.id, "twenty", {
        status: "OK",
        url: result.url,
      });
      logger.info(
        `[twenty] auto-pushed transcript ${transcript.id} → note ${result.noteId} (${result.outcome})`,
      );
    } catch (err) {
      await this.setPostMeetingTaskStatus(transcript.id, "twenty", {
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  private async autoExportDocument(
    workspaceId: string,
    transcript: Transcript,
    analysisRaw: TranscriptAnalysis,
    options: { exportToGoogleDrive?: boolean; exportToOneDrive?: boolean },
  ): Promise<void> {
    const title = transcript.title || analysisRaw.title || "Meeting Summary";
    const date = (transcript.recordedAt || new Date()).toISOString().split("T")[0];
    const filename = `${date} - ${title.replace(/[/\\?%*:|"<>]/g, "-")}.docx`;

    // Convert the summary + tasks into Markdown
    let markdownContent = `# ${title}\n\n`;
    markdownContent += `## Summary\n${analysisRaw.summary}\n\n`;
    markdownContent += `## Action Items & Tasks\n`;

    if (analysisRaw.tasks.length === 0) {
      markdownContent += "No tasks extracted.\n";
    } else {
      analysisRaw.tasks.forEach((task: TranscriptTask, index: number) => {
        markdownContent += `### ${index + 1}. ${task.title}\n`;
        markdownContent += `**Description:** ${task.description || "N/A"}\n\n`;
        if (task.acceptanceCriteria) {
          markdownContent += `**Acceptance Criteria:**\n`;
          markdownContent += `${task.acceptanceCriteria}\n`;
        }
        markdownContent += "\n";
      });
    }

    markdownContent += `\n## Full Transcript\n\n`;
    markdownContent += transcript.transcript || "No transcript available.";
    markdownContent += "\n";

    // Generate .docx Buffer
    const buffer = await DocumentGenerator.generateDocx(markdownContent);

    if (options.exportToGoogleDrive) {
      await this.setPostMeetingTaskStatus(transcript.id, "googleDrive", { status: "PENDING" });
      try {
        const link = await googleIntegrationService.uploadFileToDrive(
          workspaceId,
          filename,
          buffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        logger.info(`Successfully exported document to Google Drive: ${link}`);
        await this.setPostMeetingTaskStatus(transcript.id, "googleDrive", {
          status: "OK",
          url: typeof link === "string" ? link : undefined,
        });
      } catch (err) {
        logger.error("Error exporting to Google Drive:", err);
        await this.setPostMeetingTaskStatus(transcript.id, "googleDrive", {
          status: "FAILED",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (options.exportToOneDrive) {
      await this.setPostMeetingTaskStatus(transcript.id, "oneDrive", { status: "PENDING" });
      try {
        const link = await microsoftIntegrationService.uploadFileToOneDrive(
          workspaceId,
          filename,
          buffer,
        );
        logger.info(`Successfully exported document to OneDrive: ${link}`);
        await this.setPostMeetingTaskStatus(transcript.id, "oneDrive", {
          status: "OK",
          url: typeof link === "string" ? link : undefined,
        });
      } catch (err) {
        logger.error("Error exporting to OneDrive:", err);
        await this.setPostMeetingTaskStatus(transcript.id, "oneDrive", {
          status: "FAILED",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}

export const projectTranscriptService = new ProjectTranscriptService();
