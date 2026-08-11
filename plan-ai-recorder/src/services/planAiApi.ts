const BASE_URL = import.meta.env.VITE_PLAN_AI_API_URL ?? "";
import * as Sentry from "@sentry/electron/renderer";
import type { components } from '../types/api';

// ── Types sourced from the generated backend swagger ──────────────────────────
export type Workspace             = components['schemas']['WorkspaceResponse'];
export type WorkspaceMemberResponse = components['schemas']['WorkspaceMemberResponse'];
export type WorkspaceTeamResponse = components['schemas']['WorkspaceTeamResponse'];
export type Project               = components['schemas']['ProjectResponse'];
export type Task                  = components['schemas']['TaskResponse'];
// StandaloneTranscriptResponse includes mobile-specific fields:
// durationSeconds, speakerCount, sentiment, tasks, utterances, chatThread
export type TranscriptMetadata = components['schemas']['TranscriptMetadata'];

export type Transcript = Omit<components['schemas']['StandaloneTranscriptResponse'], 'metadata'> & {
  metadata?: TranscriptMetadata | null;
};
export type Context               = components['schemas']['ContextResponse'];
export type AiModel               = components['schemas']['AiModelResponse'];
export type UserIntegrationSummary = components['schemas']['IntegrationSummaryResponse'];
export type UserResponse = components['schemas']['UserResponse'];
export type CreateStandaloneTranscriptBody = components['schemas']['CreateStandaloneTranscriptBody'];
export type SubscriptionStatusResponse = components['schemas']['SubscriptionStatusResponse'];
export type UpdateSpeakerNamesBody = components['schemas']['UpdateSpeakerNamesBody'];

async function handleResponseWithRetry<T>(
  res: Response,
  retryRequest: () => Promise<Response>,
): Promise<T> {
  if (res.status >= 500) {
    Sentry.captureException(new Error(`API 5xx Error: ${res.status} on ${res.url}`), {
      extra: { status: res.status, url: res.url, statusText: res.statusText }
    });
  }

  // 403 = role-based permission failure — refreshing the token won't help, return error immediately
  if (res.status === 403) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((body as { message?: string }).message ?? `HTTP 403`);
  }

  // 401 = token expired/invalid — refresh and retry once
  if (res.status === 401) {
    console.log(`HTTP 401 encountered, attempting token refresh...`);
    const refreshedRes = await retryRequest();
    if (!refreshedRes.ok) {
      const body = await refreshedRes.json().catch(() => ({ message: refreshedRes.statusText }));
      throw new Error((body as { message?: string }).message ?? `HTTP ${refreshedRes.status}`);
    }
    const json = await refreshedRes.json() as any;
    return json.data !== undefined ? json.data : json;
  }

  // 429 = rate limit — show a friendly message instead of a raw error
  if (res.status === 429) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const data = body as Record<string, unknown>;
    if (data.code === "usage_limit_exceeded") {
      const limitType = data.limitType as string;
      const friendly = limitType === "llm" ? "AI token" : limitType === "recording" ? "recording hour" : "generation";
      throw new Error(`You've reached your monthly ${friendly} limit. Upgrade your plan or wait until next billing cycle.`);
    }
    throw new Error("Rate limit reached. Please wait a moment before trying again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  const json = await res.json() as any;
  return json.data !== undefined ? json.data : json;
}

export const createPlanAiApi = (
  getToken: (forceRefresh?: boolean) => Promise<string | null>,
  getWorkspaceId: () => string | null,
) => {
  const getAuthHeaders = async (forceRefresh = false): Promise<HeadersInit> => {
    const token = await getToken(forceRefresh);
    if (!token) throw new Error("No auth token available");
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const wsId = getWorkspaceId();
    if (wsId) {
      headers["X-Workspace-Id"] = wsId;
    }
    return headers;
  };

  const safeFetch = async (url: string, init?: RequestInit, silent = false, timeoutMs = 30000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[planAiApi] Network/CORS/DNS Error:", err);
      if (!silent) {
        if (err.name === 'AbortError') {
          alert(`API Connection Timeout: The server did not respond after ${timeoutMs/1000}s. \nURL: ${url}`);
        } else {
          alert(`API Connection Error: ${err instanceof Error ? err.message : String(err)} \nURL: ${url}`);
        }
      }
      throw err;
    }
  };

  return {
    /**
     * Fetch the user's workspaces. Does NOT require X-Workspace-Id (BearerAuth).
     */
    async getMyWorkspaces(): Promise<Workspace[]> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/workspaces`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<Workspace[]>(res, () => req(true));
    },

    async getWorkspaceMembers(): Promise<WorkspaceTeamResponse> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/workspaces/members`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<WorkspaceTeamResponse>(res, () => req(true));
    },

    async listProjects(): Promise<Project[]> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/projects?pageSize=50`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<{ projects: Project[] }>(res, () => req(true)).then(
        (d) => d.projects,
      );
    },

    async createProject(payload: { title: string; description?: string }): Promise<Project> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/projects`, {
          method: "POST",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        });

      const res = await req(false);
      return handleResponseWithRetry<Project>(res, () => req(true));
    },

    async listContexts(): Promise<Context[]> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/contexts?pageSize=50`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<{ contexts: Context[] }>(res, () => req(true)).then(
        (d) => d.contexts,
      );
    },

    async listAiModels(): Promise<AiModel[]> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/ai/models`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<AiModel[]>(res, () => req(true));
    },

    async listTranscripts(q?: string, projectId?: string): Promise<Transcript[]> {
      const req = async (force: boolean) => {
        const url = new URL(`${BASE_URL}/api/transcripts`);
        url.searchParams.set("pageSize", "50");
        url.searchParams.set("source", "RECORDING");
        if (q) url.searchParams.set("q", q);
        // Server-side so it spans every page, not just the 50 loaded here.
        if (projectId) url.searchParams.set("projectId", projectId);

        return safeFetch(url.toString(), {
          headers: await getAuthHeaders(force),
        });
      };

      const res = await req(false);
      return handleResponseWithRetry<{ transcripts: Transcript[] }>(res, () => req(true)).then(
        (d) => d.transcripts,
      );
    },

    async listIntegrations(): Promise<UserIntegrationSummary[]> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/integrations`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<UserIntegrationSummary[]>(res, () => req(true));
    },

    async transcribeChunk(chunks: { mic?: Blob; system?: Blob }): Promise<string> {
      const req = async (force: boolean) => {
        const token = await getToken(force);
        if (!token) throw new Error("No auth token available");

        const form = new FormData();
        if (chunks.mic) {
          form.append("mic", chunks.mic, "mic.webm");
        }
        if (chunks.system) {
          const isMacNative =
            chunks.system.type.includes("mp4") || chunks.system.type.includes("m4a");
          form.append("system", chunks.system, isMacNative ? "system.m4a" : "system.webm");
        }

        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const wsId = getWorkspaceId();
        if (wsId) headers["X-Workspace-Id"] = wsId;

        return safeFetch(`${BASE_URL}/api/audio/transcribe-chunk`, {
          method: "POST",
          headers,
          body: form,
        });
      };

      const res = await req(false);
      return handleResponseWithRetry<{ text: string }>(res, () => req(true)).then((d) => d.text);
    },

    async startAudioStream(
      language?: string,
      contextIds?: string[],
      projectIds?: string[],
    ): Promise<WebSocket> {
      const token = await getToken(false);
      if (!token) throw new Error("No auth token available");

      const wsProtocol = BASE_URL.startsWith("https") ? "wss:" : "ws:";
      const wsUrl = new URL(`${wsProtocol}//${BASE_URL.replace(/^https?:\/\//, "")}/api/audio/stream`);
      wsUrl.searchParams.set("token", token);

      if (language) {
        wsUrl.searchParams.set("language", language);
      }
      if (contextIds && contextIds.length > 0) {
        wsUrl.searchParams.set("contextIds", contextIds.join(","));
      }
      if (projectIds && projectIds.length > 0) {
        wsUrl.searchParams.set("projectIds", projectIds.join(","));
      }

      const wsId = getWorkspaceId();
      if (wsId) {
        wsUrl.searchParams.set("workspaceId", wsId);
      }

      const ws = new WebSocket(wsUrl.toString());
      return ws;
    },


    async getCurrentUser(): Promise<UserResponse> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/session/me`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<UserResponse>(res, () => req(true));
    },

    async getSubscription(): Promise<SubscriptionStatusResponse> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/billing/subscription`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<SubscriptionStatusResponse>(res, () => req(true));
    },

    async deleteMyAccount(): Promise<void> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/session/me`, {
          method: "DELETE",
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      await handleResponseWithRetry(res, () => req(true));
    },

    async saveRecording(payload: CreateStandaloneTranscriptBody & {
      taskStrategy?: "AUTO" | "SINGLE_TICKET" | "SPECIFIC_COUNT";
      taskCount?: number;
      micFile?: Blob;
      sysFile?: Blob;
      /** Stop-time echo-canceller outcome (see audioRecorder AecTelemetry). */
      aecTelemetry?: object;
      /**
       * Real wall-clock instant capture began (ISO 8601), and elapsed capture
       * seconds. `recordedAt` above is upload time — the backend needs this pair
       * to tell whether two teammates' recordings of the same meeting overlap.
       */
      recordingStartedAt?: string;
      recordingWallClockSeconds?: number;
      skipAi?: boolean;
      exportToGoogleDrive?: boolean;
      exportToOneDrive?: boolean;
      createDoc?: boolean;
      createSlides?: boolean;
    }): Promise<Transcript> {
      const req = async (force: boolean) => {
        const formData = new FormData();
        
        // Append all text payload properties individually or as serialized JSON.
        // The backend `transcriptsController.ts` will parse them.
        formData.append("source", "RECORDING");
        if (payload.content) formData.append("content", payload.content);
        if (payload.title) formData.append("title", payload.title);
        if (payload.recordedAt) formData.append("recordedAt", payload.recordedAt);
        if (payload.projectId) formData.append("projectId", payload.projectId);
        // ASR language the user picked ("ca", "es", …) — the backend stores it
        // so batch re-diarization honours it instead of defaulting to "multi".
        if (payload.language) formData.append("language", payload.language);
        if (payload.modelKey) formData.append("modelKey", payload.modelKey);
        if (payload.complexityLevel) formData.append("complexityLevel", payload.complexityLevel);
        if (payload.syncToJira) formData.append("syncToJira", "true");
        if (payload.syncToLinear) formData.append("syncToLinear", "true");
        if (payload.syncToTrello) formData.append("syncToTrello", "true");
        if (payload.syncToNotion) formData.append("syncToNotion", "true");
        if (payload.syncToAsana) formData.append("syncToAsana", "true");
        if (payload.exportToGoogleDrive) formData.append("exportToGoogleDrive", "true");
        if (payload.exportToOneDrive) formData.append("exportToOneDrive", "true");
        if (payload.createDoc) formData.append("createDoc", "true");
        if (payload.createSlides) formData.append("createSlides", "true");
        if (payload.taskStrategy) formData.append("taskStrategy", payload.taskStrategy);
        if (payload.taskCount) formData.append("taskCount", payload.taskCount.toString());
        if (payload.skipAi) formData.append("skipAi", "true");
        
        if (payload.contextIds && payload.contextIds.length > 0) {
          formData.append("contextIds", JSON.stringify(payload.contextIds));
        }
        if (payload.chatHistory) {
          formData.append("chatHistory", JSON.stringify(payload.chatHistory));
        }
        if (payload.aecTelemetry) {
          formData.append("aecTelemetry", JSON.stringify(payload.aecTelemetry));
        }
        if (payload.recordingStartedAt) {
          formData.append("recordingStartedAt", payload.recordingStartedAt);
        }
        if (payload.recordingWallClockSeconds) {
          formData.append("recordingWallClockSeconds", payload.recordingWallClockSeconds.toString());
        }

        // Determine mime types based on platform or defaults. The mic may be an
        // echo-cancelled MP3/WAV (see audioRecorder AEC) rather than the raw
        // Opus webm, so name it by the blob's actual type.
        if (payload.micFile) {
          const mt = payload.micFile.type;
          const micName = mt.includes("mpeg") || mt.includes("mp3")
            ? "mic.mp3"
            : mt.includes("wav")
              ? "mic.wav"
              : "mic.webm";
          formData.append("micFile", payload.micFile, micName);
        }
        if (payload.sysFile) {
          const isMacNative = payload.sysFile.type.includes("mp4") || payload.sysFile.type.includes("m4a");
          formData.append("sysFile", payload.sysFile, isMacNative ? "sys.m4a" : "sys.webm");
        }

        const token = await getToken(force);
        if (!token) throw new Error("No auth token available");

        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const wsId = getWorkspaceId();
        if (wsId) headers["X-Workspace-Id"] = wsId;

        return safeFetch(`${BASE_URL}/api/transcripts/recorder-upload`, {
          method: "POST",
          headers,
          body: formData,
        }, false, 300000); // 5 minute timeout for large audio file uploads
      };

      const res = await req(false);
      return handleResponseWithRetry<Transcript>(res, () => req(true));
    },

    async getTranscript(id: string): Promise<Transcript> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/transcripts/${id}`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<Transcript>(res, () => req(true));
    },

    async updateTranscript(id: string, payload: { title?: string }): Promise<Transcript> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/transcripts/${id}`, {
          method: "PUT",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        });

      const res = await req(false);
      return handleResponseWithRetry<Transcript>(res, () => req(true));
    },

    /**
     * Correct AI-inferred speaker names. `overrides` maps the stable diarization
     * label ("Speaker 0", "User 1") to the corrected human name; a blank name
     * clears the identification. Returns the updated transcript with
     * `metadata.speakers` already patched.
     */
    async updateTranscriptSpeakers(
      id: string,
      overrides: UpdateSpeakerNamesBody["overrides"],
    ): Promise<Transcript> {
      const body: UpdateSpeakerNamesBody = { overrides };
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/transcripts/${id}/speakers`, {
          method: "PUT",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(body),
        });

      const res = await req(false);
      return handleResponseWithRetry<Transcript>(res, () => req(true));
    },

    async deleteTranscript(id: string): Promise<void> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/transcripts/${id}`, {
          method: "DELETE",
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      await handleResponseWithRetry(res, () => req(true));
    },

    async reprocessTranscript(id: string): Promise<Transcript> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/transcripts/${id}/reprocess`, {
          method: "POST",
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<Transcript>(res, () => req(true));
    },

    async retryPostMeetingTask(
      transcriptId: string,
      kind: components["schemas"]["PostMeetingTaskKind"],
    ): Promise<{ success: boolean }> {
      const req = async (force: boolean) =>
        safeFetch(
          `${BASE_URL}/api/transcripts/${transcriptId}/post-meeting-tasks/${kind}/retry`,
          {
            method: "POST",
            headers: await getAuthHeaders(force),
          },
        );

      const res = await req(false);
      return handleResponseWithRetry<{ success: boolean }>(res, () => req(true));
    },

    async sendLiveChatMessage(payload: {
      content: string;
      liveTranscript: string;
      contextIds?: string[];
      projectIds?: string[];
      history?: { role: "user" | "assistant"; content: string }[];
      modelKey?: string;
      complexityLevel?: string;
    }): Promise<{ response: string }> {
      const req = async (force: boolean) =>
        // Live chat during recording: silent (the chat UI surfaces failures
        // itself — no blocking native alert) and a 120s timeout.
        safeFetch(`${BASE_URL}/api/chat/live`, {
          method: "POST",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        }, true, 120000);

      const res = await req(false);
      return handleResponseWithRetry<{ response: string }>(res, () => req(true));
    },

    async getLiveSummary(payload: {
      liveTranscript: string;
      previousSummary?: string;
      contextIds?: string[];
      projectIds?: string[];
      modelKey?: string;
    }): Promise<string> {
      const req = async (force: boolean) =>
        // Background auto-summary: silent (never pop a blocking alert mid-recording)
        // and a tighter 90s timeout — if it's slow, the next update retries.
        safeFetch(`${BASE_URL}/api/chat/live-summary`, {
          method: "POST",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        }, true, 90000);

      const res = await req(false);
      return handleResponseWithRetry<{ summary: string }>(res, () => req(true)).then(
        (d) => d.summary,
      );
    },

    async autoSyncTranscript(
      transcriptId: string,
    ): Promise<{ pushed: number; skipped: number; errors: string[] }> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/tasks/auto-sync-transcript/${transcriptId}`, {
          method: "POST",
          headers: await getAuthHeaders(force),
          body: JSON.stringify({}),
        });

      const res = await req(false);
      return handleResponseWithRetry<{ pushed: number; skipped: number; errors: string[] }>(
        res,
        () => req(true),
      );
    },
  };
};
