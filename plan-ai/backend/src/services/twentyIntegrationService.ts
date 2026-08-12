import { IntegrationProvider, IntegrationStatus, Prisma, type Transcript } from "@prisma/client";
import prisma from "../prisma/prismaClient";
import { logger } from "../utils/logger";
import EnvUtils from "../utils/EnvUtils";
import type { TwentyIntegrationMetadata } from "./integrationMetadataTypes";
import type { TranscriptMetadata, TwentyNoteRef, SpeakerInsight } from "./transcriptMetadataTypes";
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

/**
 * Link text for the meeting document. Shared so the "already linked" check in
 * `appendDocLinkToNote` and the text written at push time can't drift apart.
 */
const DOC_LINK_LABEL = "[Ver acta completa en Plan AI]";

// ── transcript attachment ──────────────────────────────────────────────────
//
// The note stays a readable summary; the full transcript rides along as a file
// on the company record, so account managers can dig into the actual words
// without the CRM timeline turning into a wall of text.
//
// Contract verified against a live Twenty instance (2026-08). Uploads are
// presigned, NOT GraphQL multipart:
//   1. createFileUpload(filename, size, fileFolder, fieldMetadataId) on
//      /metadata → { fileId, uploadUrl, contentType }
//   2. PUT the bytes to uploadUrl (the signature is the auth — no Bearer)
//   3. completeFileUpload(fileId) → { path, url }
//   4. POST /rest/attachments with file:[{fileId,label}] + targetCompanyId
//      (`companyId` is rejected, same as noteTarget).

/** Uploads for a FILES-typed field land here; there is no "Attachment" folder. */
const TWENTY_FILE_FOLDER = "FilesField";

/** Twenty caps `fileCategory` to this enum, UPPER_SNAKE — "TextDocument" 400s. */
const TWENTY_TEXT_DOCUMENT_CATEGORY = "TEXT_DOCUMENT";

/**
 * `attachment.file` field id, per Twenty host.
 *
 * Workspace-scoped metadata that costs two queries to resolve and never changes
 * while the process runs, so it's looked up once per host rather than per push.
 */
const attachmentFileFieldIds = new Map<string, string>();

/** `<baseUrl>|<nameSingular>` → object metadata id. Same reasoning as above. */
const objectMetadataIds = new Map<string, string>();

/**
 * Timeline event name.
 *
 * Why write this at all when the note already lands on the company: a note is
 * stamped when we PUSH it, which can be hours after the meeting, so the CRM
 * timeline tells the wrong story. A timeline activity carries its own
 * `happensAt`, so the meeting sits where it actually happened. Notes created
 * through the API generate no timeline activity of their own, so this adds an
 * entry rather than duplicating one.
 *
 * The name is NOT free-form. Twenty's timeline renders each entry from a known
 * event name plus the linked-record fields; a made-up name (we tried
 * `meeting.recorded`) is accepted by the API and then renders as a blank row
 * with a generic icon — worse than no entry at all in a client's CRM. Verified
 * on a live instance (2026-08) by putting candidate shapes side by side.
 */
const TWENTY_MEETING_EVENT = "linked-note.created";

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
      throw new Error(
        `Twenty API ${response.status} ${response.statusText}: ${body.slice(0, 300)}`,
      );
    }
    return (await response.json()) as T;
  }

  /**
   * Twenty's metadata GraphQL endpoint — a different surface from `/rest`, and
   * the only place file uploads live.
   */
  private async metadataGraphql<T>(
    baseUrl: string,
    apiKey: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${baseUrl}/metadata`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Twenty metadata API ${response.status} ${response.statusText}: ${body.slice(0, 300)}`,
      );
    }

    const payload = (await response.json()) as { data?: T; errors?: { message: string }[] };
    // GraphQL answers 200 with an `errors` array, so a status check isn't enough.
    if (payload.errors?.length) {
      throw new Error(`Twenty metadata API: ${payload.errors.map((e) => e.message).join("; ")}`);
    }
    if (!payload.data) throw new Error("Twenty metadata API returned no data");
    return payload.data;
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
    // Match either name part: attendee names arrive from diarization as whatever
    // was said out loud, which is just as often a surname ("¿lo mira Zhao?").
    // Filtering on firstName alone silently returned zero rows for those.
    // `or(...)` syntax verified against a live Twenty instance (2026-08).
    if (query.trim()) {
      const q = query.trim();
      params.set("filter", `or(name.firstName[ilike]:%${q}%,name.lastName[ilike]:%${q}%)`);
    }

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

    if (publicDocUrl) parts.push(`\n${DOC_LINK_LABEL}(${publicDocUrl})`);

    return parts.join("\n").slice(0, MAX_NOTE_MARKDOWN_CHARS);
  }

  /**
   * Absolute share link for the meeting's generated document, or undefined when
   * no document was produced (the "create doc" option is opt-in).
   *
   * Relative paths are useless inside a CRM note — whoever opens it is not on
   * our domain — so this resolves against APP_URL.
   */
  private resolvePublicDocUrl(transcript: Transcript): string | undefined {
    const metadata = (transcript.metadata ?? null) as TranscriptMetadata | null;
    const path = metadata?.postMeetingTasks?.doc?.publicUrl;
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path)) return path;
    const base = EnvUtils.get("APP_URL", "http://localhost:3000").replace(/\/+$/, "");
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }

  /**
   * Add the document link to a note that was already pushed.
   *
   * The document is generated after the CRM push in the post-meeting pipeline,
   * and neither step waits for the other, so the note is created before the
   * link exists. Rather than delay the note — the valuable part — we patch the
   * link in when the document is ready.
   *
   * Silently does nothing when the meeting was never pushed, and appends only
   * once so a retried generation can't stack duplicate links.
   */
  public async appendDocLinkToNote(
    workspaceId: string,
    transcriptId: string,
    publicDocPath: string,
  ): Promise<void> {
    const integration = await this.getIntegration(workspaceId);
    if (!integration) return;

    const transcript = await prisma.transcript.findUnique({
      where: { id: transcriptId },
      select: { metadata: true },
    });
    const noteRef = ((transcript?.metadata ?? null) as TranscriptMetadata | null)?.twenty;

    // No note, or this recording is a teammate's duplicate pointing at their
    // note — in that case the canonical push owns the body, not us.
    if (!noteRef?.noteId || noteRef.role === "SECONDARY") return;

    const base = EnvUtils.get("APP_URL", "http://localhost:3000").replace(/\/+$/, "");
    const url = /^https?:\/\//i.test(publicDocPath)
      ? publicDocPath
      : `${base}${publicDocPath.startsWith("/") ? publicDocPath : `/${publicDocPath}`}`;

    const fetched = await this.fetchTwenty<unknown>(
      integration.baseUrl,
      integration.apiKey,
      `/notes/${noteRef.noteId}`,
    );
    const note = this.unwrap<{ bodyV2?: { markdown?: string } }>(fetched, "note");
    const body = note?.bodyV2?.markdown ?? "";
    if (body.includes(url)) return;

    await this.fetchTwenty<unknown>(
      integration.baseUrl,
      integration.apiKey,
      `/notes/${noteRef.noteId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          bodyV2: { markdown: `${body}\n\n${DOC_LINK_LABEL}(${url})` },
        }),
      },
    );

    logger.info(`[twenty] linked document ${url} on note ${noteRef.noteId}`);
  }

  /**
   * The full transcript, as a file. Unlike the note body this deliberately
   * carries the raw words — that's the point of shipping it as an attachment
   * instead of pasting it into the timeline.
   */
  public buildTranscriptFileMarkdown(transcript: Transcript): string {
    const metadata = (transcript.metadata ?? null) as TranscriptMetadata | null;
    const when = transcript.recordedAt ?? transcript.createdAt;
    const parts: string[] = [`# ${transcript.title?.trim() || "Reunión"}`, ""];

    parts.push(`**Fecha:** ${when.toISOString().slice(0, 10)}`);
    if (transcript.durationSeconds) {
      parts.push(`**Duración:** ${Math.round(transcript.durationSeconds / 60)} min`);
    }

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

    if (transcript.summary) parts.push("", "## Resumen", transcript.summary);

    parts.push("", "## Transcripción", "");

    // Prefer diarized turns — "who said what" is most of the value of having
    // the raw transcript at all. Fall back to the flat text when absent.
    const utterances = (transcript.utterances ?? null) as
      | { speaker?: string; transcript?: string }[]
      | null;
    if (Array.isArray(utterances) && utterances.length > 0) {
      const nameFor = (speaker?: string) => {
        const match = speakers.find((s) => s.label === speaker);
        return match?.identifiedName?.trim() || speaker || "Speaker";
      };
      for (const u of utterances) {
        if (!u?.transcript) continue;
        parts.push(`**${nameFor(u.speaker)}:** ${u.transcript}`, "");
      }
    } else {
      parts.push(transcript.transcript ?? "(sin transcripción)");
    }

    return parts.join("\n");
  }

  /**
   * Metadata id of a standard object (`attachment`, `note`, …).
   *
   * ObjectFilter can't filter by name, so this pulls the (small) list of object
   * names once per host and caches the answer.
   */
  private async resolveObjectMetadataId(
    baseUrl: string,
    apiKey: string,
    nameSingular: string,
  ): Promise<string> {
    const cacheKey = `${baseUrl}|${nameSingular}`;
    const cached = objectMetadataIds.get(cacheKey);
    if (cached) return cached;

    const objects = await this.metadataGraphql<{
      objects: { edges: { node: { id: string; nameSingular: string } }[] };
    }>(
      baseUrl,
      apiKey,
      `{ objects(paging: { first: 500 }) { edges { node { id nameSingular } } } }`,
    );

    // Cache every object while we have them — the next lookup is free.
    for (const { node } of objects.objects.edges) {
      objectMetadataIds.set(`${baseUrl}|${node.nameSingular}`, node.id);
    }

    const found = objectMetadataIds.get(cacheKey);
    if (!found) throw new Error(`Twenty has no \`${nameSingular}\` object in this workspace`);
    return found;
  }

  /**
   * The id of `attachment.file`, which `createFileUpload` needs to know which
   * field the upload belongs to. Two cheap queries (~4 KB), then cached.
   */
  private async resolveAttachmentFileFieldId(baseUrl: string, apiKey: string): Promise<string> {
    const cached = attachmentFileFieldIds.get(baseUrl);
    if (cached) return cached;

    const objectId = await this.resolveObjectMetadataId(baseUrl, apiKey, "attachment");

    // FieldFilter DOES take objectMetadataId, which keeps this from pulling
    // every field of every object.
    const fields = await this.metadataGraphql<{
      fields: { edges: { node: { id: string; name: string; type: string } }[] };
    }>(
      baseUrl,
      apiKey,
      `query($objectId: UUID!) {
         fields(paging: { first: 200 }, filter: { objectMetadataId: { eq: $objectId } }) {
           edges { node { id name type } }
         }
       }`,
      { objectId },
    );

    const fileField = fields.fields.edges.map((e) => e.node).find((f) => f.name === "file");
    if (!fileField) throw new Error("Twenty's attachment object has no `file` field");

    attachmentFileFieldIds.set(baseUrl, fileField.id);
    return fileField.id;
  }

  /**
   * Upload the transcript and attach it to the company record.
   *
   * Returns the attachment id. Callers treat failure as non-fatal: a meeting
   * note without its transcript file is still worth having, and losing the note
   * over a failed upload would be a bad trade.
   */
  public async attachTranscriptToCompany(
    baseUrl: string,
    apiKey: string,
    transcript: Transcript,
    companyId: string,
  ): Promise<{ attachmentId: string; filename: string }> {
    const content = this.buildTranscriptFileMarkdown(transcript);
    const bytes = Buffer.from(content, "utf8");

    const dateSlug = (transcript.recordedAt ?? transcript.createdAt).toISOString().slice(0, 10);
    const titleSlug = (transcript.title?.trim() || "reunion")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip the accents NFD just split off
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const filename = `${dateSlug}-${titleSlug || "reunion"}.md`;

    const fieldMetadataId = await this.resolveAttachmentFileFieldId(baseUrl, apiKey);

    const target = await this.metadataGraphql<{
      createFileUpload: { fileId: string; uploadUrl: string; contentType: string };
    }>(
      baseUrl,
      apiKey,
      `mutation($filename: String!, $size: Float!, $fileFolder: FileFolder!, $fieldMetadataId: String) {
         createFileUpload(filename: $filename, size: $size, fileFolder: $fileFolder, fieldMetadataId: $fieldMetadataId) {
           fileId uploadUrl contentType
         }
       }`,
      { filename, size: bytes.byteLength, fileFolder: TWENTY_FILE_FOLDER, fieldMetadataId },
    );

    const { fileId, uploadUrl, contentType } = target.createFileUpload;

    // No Authorization header here on purpose — the presigned URL carries its
    // own signature, and some storage backends reject the extra header.
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: bytes,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!put.ok) {
      const body = await put.text().catch(() => "");
      throw new Error(`Twenty file upload ${put.status} ${put.statusText}: ${body.slice(0, 200)}`);
    }

    const completed = await this.metadataGraphql<{ completeFileUpload: { path: string } }>(
      baseUrl,
      apiKey,
      `mutation($fileId: String!) { completeFileUpload(fileId: $fileId) { id path size url } }`,
      { fileId },
    );

    const created = await this.fetchTwenty<unknown>(baseUrl, apiKey, "/attachments", {
      method: "POST",
      body: JSON.stringify({
        name: filename,
        file: [{ fileId, label: filename }],
        fullPath: completed.completeFileUpload.path,
        fileCategory: TWENTY_TEXT_DOCUMENT_CATEGORY,
        targetCompanyId: companyId,
      }),
    });

    const attachment = this.unwrap<Record<string, unknown>>(created, "createAttachment");
    const attachmentId = String(attachment?.id ?? "");
    if (!attachmentId) throw new Error("Twenty did not return an attachment id");

    return { attachmentId, filename };
  }

  /**
   * Put the meeting on the company's timeline at the time it actually happened.
   *
   * The entry describes the note we just created, which is why it needs the
   * note's id and title: Twenty's timeline renders "<who> created a note
   * <name>" from the `linkedRecord*` fields, and without them the row shows a
   * generic icon and no text at all.
   *
   * Links through `targetCompanyId`: timelineActivity exposes MORPH_RELATION
   * targets, so plain `companyId` is rejected — same as noteTarget and
   * attachment.
   */
  public async recordMeetingOnTimeline(
    baseUrl: string,
    apiKey: string,
    args: {
      companyId: string;
      happensAt: Date;
      noteId: string;
      noteTitle: string;
    },
  ): Promise<string> {
    const noteObjectId = await this.resolveObjectMetadataId(baseUrl, apiKey, "note");

    const created = await this.fetchTwenty<unknown>(baseUrl, apiKey, "/timelineActivities", {
      method: "POST",
      body: JSON.stringify({
        name: TWENTY_MEETING_EVENT,
        // The reason this entry exists: `happensAt` is ours to set, so the
        // meeting lands where it happened rather than where it was uploaded.
        happensAt: args.happensAt.toISOString(),
        targetCompanyId: args.companyId,
        // Twenty's own `.created` rows carry an empty properties object; the
        // meeting's details live in the note this points at.
        properties: {},
        linkedObjectMetadataId: noteObjectId,
        linkedRecordId: args.noteId,
        linkedRecordCachedName: args.noteTitle,
      }),
    });

    const activity = this.unwrap<Record<string, unknown>>(created, "createTimelineActivity");
    const activityId = String(activity?.id ?? "");
    if (!activityId) throw new Error("Twenty did not return a timeline activity id");
    return activityId;
  }

  private async createNoteWithTargets(
    baseUrl: string,
    apiKey: string,
    args: {
      title: string;
      markdown: string;
      companyId: string;
      personIds: string[];
      opportunityId?: string;
    },
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
    //
    // Field names verified against a live Twenty instance (2026-08): noteTarget
    // exposes MORPH_RELATION fields `targetCompany` / `targetPerson` /
    // `targetOpportunity`, so the REST foreign keys are `targetCompanyId` etc.
    // The obvious-looking `companyId` is rejected with
    // 'Object noteTarget doesn't have any "companyId" field.'
    const targets: Record<string, string>[] = [{ targetCompanyId: args.companyId }];
    for (const personId of args.personIds) targets.push({ targetPersonId: personId });
    if (args.opportunityId) targets.push({ targetOpportunityId: args.opportunityId });

    let linked = 0;
    for (const target of targets) {
      try {
        await this.fetchTwenty<unknown>(baseUrl, apiKey, "/noteTargets", {
          method: "POST",
          body: JSON.stringify({ noteId, ...target }),
        });
        linked += 1;
      } catch (error) {
        // logger.error (not warn) on purpose: this reaches Sentry. A note that
        // exists but isn't linked is INVISIBLE in the client's CRM — it shows on
        // no timeline — while the user is told the push succeeded. Exactly the
        // silent failure we need an alert for.
        logger.error(`[twenty] could not link note ${noteId} to ${JSON.stringify(target)}`, error, {
          noteId,
          target,
        });
      }
    }

    // Every link failed: the note is orphaned in the CRM. Surface it instead of
    // reporting success — the caller marks the push FAILED so it can be retried.
    if (linked === 0) {
      throw new Error(
        `Twenty note ${noteId} was created but could not be linked to any record (${targets.length} targets failed)`,
      );
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
    args: {
      companyId: string;
      personIds?: string[];
      opportunityId?: string;
      forceSeparateNote?: boolean;
    },
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
    // Include the document link up front when it already exists — true for a
    // manual push of an older meeting. When it doesn't (the automatic push runs
    // before the document is generated) `appendDocLinkToNote` patches it in
    // later, so the link lands either way.
    const markdown = this.buildNoteMarkdown(transcript, this.resolvePublicDocUrl(transcript));
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

          // Attach the full transcript to the company. Only on the canonical
          // push — a SECONDARY recording of the same meeting must not upload a
          // second copy of the same conversation.
          //
          // Non-fatal by design: the note is the valuable part, and it is
          // already created and linked by this point. logger.error so a broken
          // upload still reaches Sentry instead of disappearing.
          let attachmentId: string | undefined;
          try {
            const attached = await this.attachTranscriptToCompany(
              integration.baseUrl,
              integration.apiKey,
              transcript,
              args.companyId,
            );
            attachmentId = attached.attachmentId;
            logger.info(
              `[twenty] attached transcript ${transcript.id} to company ${args.companyId} as ${attached.filename}`,
            );
          } catch (attachError) {
            logger.error(
              `[twenty] note ${note.noteId} created but the transcript file could not be attached`,
              attachError,
              { noteId: note.noteId, companyId: args.companyId, transcriptId: transcript.id },
            );
          }

          // Stamp the company's timeline at the real meeting time. Same
          // canonical-only, non-fatal treatment as the attachment.
          let timelineActivityId: string | undefined;
          try {
            timelineActivityId = await this.recordMeetingOnTimeline(
              integration.baseUrl,
              integration.apiKey,
              {
                companyId: args.companyId,
                happensAt: interval.startedAt,
                noteId: note.noteId,
                noteTitle: title,
              },
            );
          } catch (timelineError) {
            logger.error(
              `[twenty] note ${note.noteId} created but the timeline entry could not be recorded`,
              timelineError,
              { noteId: note.noteId, companyId: args.companyId, transcriptId: transcript.id },
            );
          }

          await this.markTranscript(transcript.id, metadata, {
            noteId: note.noteId,
            url: note.url,
            role: "CANONICAL",
            attachmentId,
            timelineActivityId,
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
