import { IntegrationProvider, IntegrationStatus, Prisma, type Transcript } from "@prisma/client";
import prisma from "../prisma/prismaClient";
import { logger } from "../utils/logger";
import type { TwentyIntegrationMetadata } from "./integrationMetadataTypes";
import type {
  TranscriptMetadata,
  TwentyNoteRef,
  SpeakerInsight,
} from "./transcriptMetadataTypes";
import type {
  TwentyManualConnectRequest,
  TwentySummaryResponse,
  TwentyCompanyItem,
  TwentyPersonItem,
  PushTranscriptToTwentyResponse,
} from "./twentyTypes";

/**
 * Twenty CRM integration.
 *
 * Twenty is normally SELF-HOSTED, so unlike every other provider the API host
 * is per-workspace and lives in the integration metadata. Auth is a static API
 * key (Settings → API & Webhooks), not OAuth.
 *
 * The interesting part is `pushMeetingNote`: two teammates who each recorded
 * the same client call must not produce two notes inside the customer's CRM.
 * See the "meeting identity" section below and TWENTY.md.
 */

/** Twenty is slow-ish on cold self-hosted instances but we never block on it. */
const REQUEST_TIMEOUT_MS = 15_000;

/** Never ship a wall of raw transcript into someone's CRM. */
const MAX_NOTE_MARKDOWN_CHARS = 20_000;

// ── meeting identity tuning ────────────────────────────────────────────────
/** Client clocks drift; widen both intervals before comparing. */
const CLOCK_SKEW_MS = 10 * 60 * 1000;
/** Two recordings of one meeting always share at least this much wall time. */
const MIN_ABSOLUTE_OVERLAP_MS = 5 * 60 * 1000;
/** …and at least this fraction of the shorter recording. */
const MIN_RELATIVE_OVERLAP = 0.3;
/** Same meeting ⇒ the two recordings started within this window of each other. */
const MAX_START_DELTA_MS = 30 * 60 * 1000;

interface MeetingInterval {
  startedAt: Date;
  endedAt: Date;
}

/**
 * Do these two recordings describe the SAME real-world meeting?
 *
 * Deliberately generous on overlap (two people rarely hit record at the same
 * second, and one may join late) but strict on start delta, so back-to-back
 * meetings with the same company don't collapse into one.
 */
export const isSameMeeting = (a: MeetingInterval, b: MeetingInterval): boolean => {
  const aStart = a.startedAt.getTime() - CLOCK_SKEW_MS;
  const aEnd = a.endedAt.getTime() + CLOCK_SKEW_MS;
  const bStart = b.startedAt.getTime() - CLOCK_SKEW_MS;
  const bEnd = b.endedAt.getTime() + CLOCK_SKEW_MS;

  const overlapMs = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
  if (overlapMs <= 0) return false;

  const shorterMs = Math.min(aEnd - aStart, bEnd - bStart);
  const requiredOverlap = Math.max(MIN_ABSOLUTE_OVERLAP_MS, shorterMs * MIN_RELATIVE_OVERLAP);
  if (overlapMs < requiredOverlap) return false;

  const startDelta = Math.abs(a.startedAt.getTime() - b.startedAt.getTime());
  return startDelta <= MAX_START_DELTA_MS;
};

/**
 * Best-effort real capture window.
 *
 * `recordedAt` is UPLOAD time and `durationSeconds` comes from the last
 * utterance, so neither is a true meeting start. When the client reported a
 * real `metadata.recording.startedAt` we use it; otherwise we walk backwards
 * from the upload. That fallback is biased, but BOTH recordings of a meeting
 * are biased the same way, so their overlap stays comparable.
 */
export const resolveMeetingInterval = (transcript: Transcript): MeetingInterval | null => {
  const metadata = (transcript.metadata ?? null) as TranscriptMetadata | null;
  const durationMs = Math.max(0, (transcript.durationSeconds ?? 0) * 1000);

  const reported = metadata?.recording?.startedAt;
  if (reported) {
    const startedAt = new Date(reported);
    if (!Number.isNaN(startedAt.getTime())) {
      const wallMs = (metadata?.recording?.wallClockSeconds ?? 0) * 1000;
      const spanMs = Math.max(wallMs, durationMs);
      return { startedAt, endedAt: new Date(startedAt.getTime() + spanMs) };
    }
  }

  if (!transcript.recordedAt || durationMs <= 0) return null;
  const endedAt = transcript.recordedAt;
  return { startedAt: new Date(endedAt.getTime() - durationMs), endedAt };
};

/** UTC calendar day; the coarse bucket the unique constraint keys on. */
const toDayBucket = (date: Date): string => date.toISOString().slice(0, 10);

class TwentyIntegrationService {
  /** https, no trailing slash, no path — rejects anything else. */
  private normalizeBaseUrl(raw: string): string {
    const trimmed = (raw ?? "").trim();
    if (!trimmed) throw new Error("Missing Twenty instance URL");

    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    let url: URL;
    try {
      url = new URL(withScheme);
    } catch {
      throw new Error("Invalid Twenty instance URL");
    }
    if (url.protocol !== "https:") {
      throw new Error("The Twenty instance URL must use https");
    }
    return `${url.protocol}//${url.host}`;
  }

  private async getIntegration(workspaceId: string) {
    const integration = await prisma.workspaceIntegration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: IntegrationProvider.TWENTY } },
    });
    if (!integration || integration.status !== IntegrationStatus.CONNECTED) return null;

    const metadata = (integration.metadata ?? null) as TwentyIntegrationMetadata | null;
    if (!metadata?.baseUrl) return null;

    return { apiKey: integration.accessToken, baseUrl: metadata.baseUrl, metadata };
  }

  private async fetchTwenty<T>(
    baseUrl: string,
    apiKey: string,
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${baseUrl}/rest${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Twenty API ${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
    }
    return (await response.json()) as T;
  }

  /**
   * Twenty's REST responses nest the payload under `data`, and list endpoints
   * key it by collection name. The schema is generated per workspace, so we
   * dig defensively rather than assuming one fixed envelope.
   */
  private unwrap<T>(payload: unknown, key: string): T | undefined {
    if (!payload || typeof payload !== "object") return undefined;
    const root = payload as Record<string, unknown>;
    const data = (root.data ?? root) as Record<string, unknown>;
    if (data && typeof data === "object" && key in data) {
      return data[key] as T;
    }
    return undefined;
  }

  public async verifyManualCredentials(
    workspaceId: string,
    payload: TwentyManualConnectRequest,
  ): Promise<{ success: true }> {
    const baseUrl = this.normalizeBaseUrl(payload.baseUrl);
    const apiKey = (payload.apiKey ?? "").trim();
    if (!apiKey) throw new Error("Missing Twenty API key");

    // Cheapest authenticated call that proves both URL and key.
    try {
      await this.fetchTwenty<unknown>(baseUrl, apiKey, "/companies?limit=1");
    } catch (error) {
      logger.error("[twenty] credential verification failed", error);
      throw new Error(
        "Could not reach Twenty with those credentials. Check the instance URL and API key.",
      );
    }

    const metadata: TwentyIntegrationMetadata = {
      authType: "API_KEY",
      baseUrl,
      connectedAt: new Date().toISOString(),
    };

    await prisma.workspaceIntegration.upsert({
      where: { workspaceId_provider: { workspaceId, provider: IntegrationProvider.TWENTY } },
      create: {
        workspaceId,
        provider: IntegrationProvider.TWENTY,
        status: IntegrationStatus.CONNECTED,
        accessToken: apiKey,
        accountName: new URL(baseUrl).host,
        metadata: metadata as unknown as Prisma.InputJsonObject,
      },
      update: {
        status: IntegrationStatus.CONNECTED,
        accessToken: apiKey,
        accountName: new URL(baseUrl).host,
        metadata: metadata as unknown as Prisma.InputJsonObject,
      },
    });

    return { success: true };
  }

  public async getSummary(workspaceId: string): Promise<TwentySummaryResponse> {
    const integration = await this.getIntegration(workspaceId);
    if (!integration) return { connected: false };
    return {
      connected: true,
      baseUrl: integration.baseUrl,
      workspaceName: integration.metadata.workspaceName,
    };
  }

  public async searchCompanies(workspaceId: string, query: string): Promise<TwentyCompanyItem[]> {
    const integration = await this.getIntegration(workspaceId);
    if (!integration) return [];

    const params = new URLSearchParams({ limit: "20" });
    if (query.trim()) params.set("filter", `name[ilike]:%${query.trim()}%`);

    try {
      const payload = await this.fetchTwenty<unknown>(
        integration.baseUrl,
        integration.apiKey,
        `/companies?${params.toString()}`,
      );
      const rows = this.unwrap<Record<string, unknown>[]>(payload, "companies") ?? [];
      return rows.map((row) => ({
        id: String(row.id ?? ""),
        name: String(row.name ?? "Untitled"),
        domainName:
          typeof row.domainName === "object" && row.domainName
            ? String((row.domainName as Record<string, unknown>).primaryLinkUrl ?? "")
            : undefined,
      }));
    } catch (error) {
      logger.warn("[twenty] company search failed", error);
      return [];
    }
  }

  public async searchPeople(workspaceId: string, query: string): Promise<TwentyPersonItem[]> {
    const integration = await this.getIntegration(workspaceId);
    if (!integration) return [];

    const params = new URLSearchParams({ limit: "30" });
    if (query.trim()) params.set("filter", `name.firstName[ilike]:%${query.trim()}%`);

    try {
      const payload = await this.fetchTwenty<unknown>(
        integration.baseUrl,
        integration.apiKey,
        `/people?${params.toString()}`,
      );
      const rows = this.unwrap<Record<string, unknown>[]>(payload, "people") ?? [];
      return rows.map((row) => {
        const name = row.name as { firstName?: string; lastName?: string } | undefined;
        const emails = row.emails as { primaryEmail?: string } | undefined;
        return {
          id: String(row.id ?? ""),
          name: [name?.firstName, name?.lastName].filter(Boolean).join(" ") || "Unnamed",
          email: emails?.primaryEmail,
          companyId: row.companyId ? String(row.companyId) : undefined,
        };
      });
    } catch (error) {
      logger.warn("[twenty] people search failed", error);
      return [];
    }
  }

  /** Summary + agreements + tasks + a link back. Never the raw transcript. */
  public buildNoteMarkdown(transcript: Transcript, publicDocUrl?: string): string {
    const metadata = (transcript.metadata ?? null) as TranscriptMetadata | null;
    const parts: string[] = [];

    const when = transcript.recordedAt ?? transcript.createdAt;
    parts.push(`**Fecha:** ${when.toISOString().slice(0, 10)}`);

    const speakers: SpeakerInsight[] = metadata?.speakers ?? [];
    if (speakers.length > 0) {
      const attendees = speakers
        .map((s) => {
          const name = s.identifiedName?.trim() || s.label;
          return s.role ? `${name} (${s.role})` : name;
        })
        .join(", ");
      parts.push(`**Asistentes:** ${attendees}`);
    }

    if (transcript.summary) parts.push(`\n## Resumen\n${transcript.summary}`);

    const keyPoints = metadata?.keyPoints ?? [];
    if (keyPoints.length > 0) {
      parts.push(`\n## Puntos clave\n${keyPoints.map((p) => `- ${p}`).join("\n")}`);
    }

    if (publicDocUrl) parts.push(`\n[Ver acta completa en Plan AI](${publicDocUrl})`);

    return parts.join("\n").slice(0, MAX_NOTE_MARKDOWN_CHARS);
  }

  private async createNoteWithTargets(
    baseUrl: string,
    apiKey: string,
    args: { title: string; markdown: string; companyId: string; personIds: string[]; opportunityId?: string },
  ): Promise<{ noteId: string; url?: string }> {
    const created = await this.fetchTwenty<unknown>(baseUrl, apiKey, "/notes", {
      method: "POST",
      body: JSON.stringify({ title: args.title, bodyV2: { markdown: args.markdown } }),
    });

    const note = this.unwrap<Record<string, unknown>>(created, "createNote");
    const noteId = String(note?.id ?? "");
    if (!noteId) throw new Error("Twenty did not return a note id");

    // Targets are what make the note show up on each record's timeline. Created
    // one by one on purpose: a failed link must not lose the note itself.
    const targets: Record<string, string>[] = [{ companyId: args.companyId }];
    for (const personId of args.personIds) targets.push({ personId });
    if (args.opportunityId) targets.push({ opportunityId: args.opportunityId });

    for (const target of targets) {
      try {
        await this.fetchTwenty<unknown>(baseUrl, apiKey, "/noteTargets", {
          method: "POST",
          body: JSON.stringify({ noteId, ...target }),
        });
      } catch (error) {
        logger.warn(`[twenty] could not link note ${noteId} to ${JSON.stringify(target)}`, error);
      }
    }

    return { noteId, url: `${baseUrl}/object/note/${noteId}` };
  }

  /**
   * Push a meeting to Twenty exactly once per real meeting.
   *
   * The `MeetingCrmNote` unique constraint is the lock: two workers racing for
   * the same (workspace, provider, company, day) collide on P2002 rather than
   * on a read-then-write. The loser inspects the winner and either stands down
   * (same meeting → SECONDARY) or claims a suffixed bucket (a genuinely
   * different meeting with that company the same day).
   */
  public async pushMeetingNote(
    workspaceId: string,
    transcript: Transcript,
    args: { companyId: string; personIds?: string[]; opportunityId?: string; forceSeparateNote?: boolean },
  ): Promise<PushTranscriptToTwentyResponse> {
    const integration = await this.getIntegration(workspaceId);
    if (!integration) throw new Error("Twenty is not connected for this workspace");

    const metadata = (transcript.metadata ?? {}) as TranscriptMetadata;

    // Already pushed from this very transcript — return what we made before.
    if (metadata.twenty?.noteId && !args.forceSeparateNote) {
      return {
        outcome: "ALREADY_PUSHED",
        noteId: metadata.twenty.noteId,
        url: metadata.twenty.url,
        canonicalTranscriptId: metadata.twenty.canonicalTranscriptId,
      };
    }

    const interval = resolveMeetingInterval(transcript);
    if (!interval) {
      // Fail closed rather than risk a duplicate inside the client's CRM.
      throw new Error(
        "This transcript has no reliable recording time, so it cannot be safely deduplicated. Push it manually after setting a date.",
      );
    }

    const baseBucket = toDayBucket(interval.startedAt);
    const title = `${transcript.title?.trim() || "Reunión"} · ${baseBucket}`;
    const markdown = this.buildNoteMarkdown(transcript);
    const personIds = args.personIds ?? [];

    // Walk buckets: base, then #2, #3… when the user insists it's a distinct meeting.
    for (let attempt = 0; attempt < 5; attempt++) {
      const dayBucket = attempt === 0 ? baseBucket : `${baseBucket}#${attempt + 1}`;

      try {
        // Claim the slot FIRST; the row is the mutex. noteId filled in after.
        const claim = await prisma.meetingCrmNote.create({
          data: {
            workspaceId,
            provider: IntegrationProvider.TWENTY,
            externalCompanyId: args.companyId,
            dayBucket,
            noteId: "",
            canonicalTranscriptId: transcript.id,
            startedAt: interval.startedAt,
            endedAt: interval.endedAt,
          },
        });

        try {
          const note = await this.createNoteWithTargets(integration.baseUrl, integration.apiKey, {
            title,
            markdown,
            companyId: args.companyId,
            personIds,
            opportunityId: args.opportunityId,
          });

          await prisma.meetingCrmNote.update({
            where: { id: claim.id },
            data: { noteId: note.noteId, url: note.url },
          });

          await this.markTranscript(transcript.id, metadata, {
            noteId: note.noteId,
            url: note.url,
            role: "CANONICAL",
            syncedAt: new Date().toISOString(),
          });

          logger.info(
            `[twenty] created note ${note.noteId} for transcript ${transcript.id} (bucket ${dayBucket})`,
          );
          return { outcome: "CREATED", noteId: note.noteId, url: note.url };
        } catch (error) {
          // Release the mutex so a retry isn't permanently blocked by our failure.
          await prisma.meetingCrmNote.delete({ where: { id: claim.id } }).catch(() => {});
          throw error;
        }
      } catch (error) {
        const isConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (!isConflict) throw error;

        const existing = await prisma.meetingCrmNote.findUnique({
          where: {
            workspaceId_provider_externalCompanyId_dayBucket: {
              workspaceId,
              provider: IntegrationProvider.TWENTY,
              externalCompanyId: args.companyId,
              dayBucket,
            },
          },
        });
        if (!existing) continue; // vanished between calls — try the next bucket

        const sameMeeting = isSameMeeting(interval, {
          startedAt: existing.startedAt,
          endedAt: existing.endedAt,
        });

        logger.info(
          `[twenty][dedup] ws=${workspaceId} company=${args.companyId} bucket=${dayBucket} ` +
            `candidate=${transcript.id} incumbent=${existing.canonicalTranscriptId} ` +
            `sameMeeting=${sameMeeting} forced=${!!args.forceSeparateNote}`,
        );

        if (sameMeeting && !args.forceSeparateNote) {
          await this.markTranscript(transcript.id, metadata, {
            noteId: existing.noteId,
            url: existing.url ?? undefined,
            role: "SECONDARY",
            canonicalTranscriptId: existing.canonicalTranscriptId,
            syncedAt: new Date().toISOString(),
          });
          return {
            outcome: "DEDUPED",
            noteId: existing.noteId,
            url: existing.url ?? undefined,
            canonicalTranscriptId: existing.canonicalTranscriptId,
          };
        }
        // Different meeting (or user overrode) → next bucket.
      }
    }

    throw new Error("Could not allocate a note slot for this meeting in Twenty");
  }

  private async markTranscript(
    transcriptId: string,
    current: TranscriptMetadata,
    ref: TwentyNoteRef,
  ): Promise<void> {
    const next: TranscriptMetadata = {
      ...current,
      twenty: ref,
      postMeetingTasks: {
        ...(current.postMeetingTasks ?? {}),
        twenty: { status: "OK", url: ref.url, finishedAt: new Date().toISOString() },
      },
    };
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { metadata: next as unknown as Prisma.InputJsonObject },
    });
  }
}

export const twentyIntegrationService = new TwentyIntegrationService();
