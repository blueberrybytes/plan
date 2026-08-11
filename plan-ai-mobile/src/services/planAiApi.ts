import { Platform } from "react-native";
import * as Sentry from '@sentry/react-native';
import type { components } from '../types/api';

// ── Types sourced from the generated backend swagger ──────────────────────────
export type Workspace              = components['schemas']['WorkspaceResponse'];
export type WorkspaceMemberResponse = components['schemas']['WorkspaceMemberResponse'];
export type WorkspaceTeamResponse  = components['schemas']['WorkspaceTeamResponse'];
export type Project                = components['schemas']['ProjectResponse'];
export type Task                   = components['schemas']['TaskResponse'];
// StandaloneTranscriptResponse includes mobile-specific fields:
// durationSeconds, speakerCount, sentiment, tasks, utterances, chatThread
export type TranscriptMetadata = components['schemas']['TranscriptMetadata'];

export type Transcript = Omit<components['schemas']['StandaloneTranscriptResponse'], 'metadata'> & {
  metadata?: TranscriptMetadata | null;
};
export type Context                = components['schemas']['ContextResponse'];
export type ContextFileResponse    = components['schemas']['ContextFileResponse'];
export type AiModel                = components['schemas']['AiModelResponse'];
export type UserIntegrationSummary = components['schemas']['IntegrationSummaryResponse'];
export type TwentyCompanyItem      = components['schemas']['TwentyCompanyItem'];
export type DocDocumentResponse    = components['schemas']['DocDocumentResponse'];
export type UserResponse           = components['schemas']['UserResponse'];
export type CreateStandaloneTranscriptBody = components['schemas']['CreateStandaloneTranscriptBody'];
export type SubscriptionStatusResponse = components['schemas']['SubscriptionStatusResponse'];
export type UpdateSpeakerNamesBody = components['schemas']['UpdateSpeakerNamesBody'];

let rawBaseUrl = process.env.EXPO_PUBLIC_PLAN_AI_API_URL ?? "http://localhost:8080";
if (__DEV__ && Platform.OS === 'android') {
  rawBaseUrl = rawBaseUrl.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
}
let BASE_URL = rawBaseUrl.replace(/\/+$/, "");

async function handleResponseWithRetry<T>(
  res: Response,
  retryRequest: () => Promise<Response>,
): Promise<T> {
  if (res.status >= 500) {
    const errorMsg = `API 5xx Error: ${res.status} on ${res.url}`;
    console.error(errorMsg);
    Sentry.captureException(new Error(errorMsg), {
      tags: { url: res.url, status: res.status.toString() },
      extra: { statusText: res.statusText }
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
    console.log(`[planAiApi] Requesting auth token (force: ${forceRefresh})...`);
    const token = await getToken(forceRefresh);
    console.log(`[planAiApi] Token received.`);
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

  const safeFetch = async (url: string, init?: RequestInit, silent = false, timeoutMs = 60000): Promise<Response> => {
    console.log(`[planAiApi] Invoking fetch to URL: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // configurable timeout

    try {
      const res = await fetch(url, { ...init, signal: controller.signal as any });
      clearTimeout(timeoutId);
      console.log(`[planAiApi] Fetch successful, status: ${res.status}`);
      return res;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[planAiApi] Network/CORS/DNS Error:", err);
      if (err.name === 'AbortError') {
         Sentry.captureException(new Error(`API Connection Timeout`), { tags: { url } });
         if (!silent) alert(`API Connection Timeout: The server did not respond after ${timeoutMs/1000}s. \nURL: ${url}`);
      } else {
         Sentry.captureException(err, { tags: { url } });
         if (!silent) alert(`API Connection Error: ${err instanceof Error ? err.message : String(err)} \nURL: ${url}`);
      }
      throw err;
    }
  };

  // Variant of safeFetch that suppresses the alert banner on network errors.
  // Use this when the caller already handles the error gracefully (e.g. .catch(() => [])).
  const silentFetch = (url: string, init?: RequestInit, timeoutMs = 60000) => safeFetch(url, init, true, timeoutMs);

  return {
    getAuthHeaders,
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

    async listDocuments(): Promise<DocDocumentResponse[]> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/documents`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<DocDocumentResponse[]>(res, () => req(true));
    },

    async getDocument(id: string): Promise<DocDocumentResponse> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/documents/${id}`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<DocDocumentResponse>(res, () => req(true));
    },

    async listProjects(): Promise<Project[]> {
      const req = async (force: boolean) =>
        silentFetch(`${BASE_URL}/api/projects?pageSize=50`, {
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

    async listProjectTasks(projectId: string): Promise<Task[]> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/projects/${projectId}/tasks?pageSize=200`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<{ tasks: Task[] }>(res, () => req(true)).then(
        (d) => d.tasks,
      );
    },

    async createProjectTask(
      projectId: string,
      payload: { 
        title: string; 
        description?: string; 
        summary?: string;
        acceptanceCriteria?: string;
        status?: string; 
        priority?: string;
        type?: string;
        dueDate?: string;
        metadata?: components['schemas']['TaskMetadata'];
      },
    ): Promise<Task> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/projects/${projectId}/tasks`, {
          method: "POST",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        });

      const res = await req(false);
      return handleResponseWithRetry<Task>(res, () => req(true));
    },

    async refineProjectTask(
      projectId: string,
      payload: {
        title: string;
        summary?: string | null;
        description?: string | null;
        acceptanceCriteria?: string | null;
        type: string;
        priority: string;
      }
    ): Promise<any> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/projects/${projectId}/tasks/refine`, {
          method: "POST",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        });

      const res = await req(false);
      return handleResponseWithRetry<any>(res, () => req(true));
    },

    async updateProjectTask(
      projectId: string,
      taskId: string,
      payload: Partial<Pick<Task, "status" | "priority" | "dueDate" | "title">>,
    ): Promise<Task> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/projects/${projectId}/tasks/${taskId}`, {
          method: "PUT",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        });

      const res = await req(false);
      return handleResponseWithRetry<Task>(res, () => req(true));
    },

    async listContexts(): Promise<Context[]> {
      const req = async (force: boolean) =>
        silentFetch(`${BASE_URL}/api/contexts?pageSize=50`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<{ contexts: Context[] }>(res, () => req(true)).then(
        (d) => d.contexts,
      );
    },

    async getContext(id: string): Promise<Context> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/contexts/${id}`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<Context>(res, () => req(true));
    },

    async uploadContextFile(
      contextId: string,
      fileInfo: { uri: string; name: string; type: string }
    ): Promise<Context> {
      const req = async (force: boolean) => {
        const formData = new FormData();
        formData.append("files", {
          uri: fileInfo.uri,
          name: fileInfo.name,
          type: fileInfo.type || "application/octet-stream",
        } as any);

        const token = await getToken(force);
        if (!token) throw new Error("No auth token available");

        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const wsId = getWorkspaceId();
        if (wsId) headers["X-Workspace-Id"] = wsId;

        return safeFetch(`${BASE_URL}/api/contexts/${contextId}/files`, {
          method: "POST",
          headers,
          body: formData,
        }, false, 300000);
      };

      const res = await req(false);
      return handleResponseWithRetry<Context>(res, () => req(true));
    },

    async deleteContextFile(contextId: string, fileId: string): Promise<Context> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/contexts/${contextId}/files/${fileId}`, {
          method: "DELETE",
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<Context>(res, () => req(true));
    },

    async listAiModels(): Promise<AiModel[]> {
      const req = async (force: boolean) =>
        safeFetch(`${BASE_URL}/api/ai/models`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<AiModel[]>(res, () => req(true));
    },

    async listTranscripts(q?: string): Promise<Transcript[]> {
      const req = async (force: boolean) => {
        const url = new URL(`${BASE_URL}/api/transcripts`);
        url.searchParams.set("pageSize", "50");
        // RECORDING + TELEGRAM: this list is where the team sees inbound work,
        // and Berry's Telegram leads are inbound work. Filtering on RECORDING
        // alone hid every prospect from the app entirely.
        url.searchParams.set("sources", "RECORDING,TELEGRAM");
        if (q) url.searchParams.set("q", q);

        return silentFetch(url.toString(), {
          headers: await getAuthHeaders(force),
        });
      };

      const res = await req(false);
      return handleResponseWithRetry<{ transcripts: Transcript[] }>(res, () => req(true)).then(
        (d) => d.transcripts,
      );
    },

    /** Companies from the connected Twenty CRM, for the post-recording picker. */
    async searchTwentyCompanies(q: string): Promise<TwentyCompanyItem[]> {
      const req = async (force: boolean) =>
        silentFetch(`${BASE_URL}/api/twenty/companies?q=${encodeURIComponent(q)}`, {
          headers: await getAuthHeaders(force),
        });

      const res = await req(false);
      return handleResponseWithRetry<TwentyCompanyItem[]>(res, () => req(true));
    },

    async listIntegrations(): Promise<UserIntegrationSummary[]> {
      const req = async (force: boolean) =>
        silentFetch(`${BASE_URL}/api/integrations`, {
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

    async saveVoiceProfile(voiceFile?: { uri: string; name: string; type: string }): Promise<void> {
      const req = async (force: boolean) => {
        const token = await getToken(force);
        if (!token) throw new Error("No auth token available");

        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const wsId = getWorkspaceId();
        if (wsId) headers["X-Workspace-Id"] = wsId;

        const formData = new FormData();
        if (voiceFile) {
          formData.append("voiceFile", {
            uri: voiceFile.uri.startsWith("file://") ? voiceFile.uri : `file://${voiceFile.uri}`,
            name: voiceFile.name,
            type: voiceFile.type,
          } as any);
        }

        return safeFetch(`${BASE_URL}/api/session/me/voice-profile`, {
          method: "POST",
          headers,
          body: formData,
        });
      };

      const res = await req(false);
      await handleResponseWithRetry(res, () => req(true));
    },

    async saveRecording(payload: CreateStandaloneTranscriptBody & {
      skipAi?: boolean;
      micFile?: Blob;
      sysFile?: Blob;
      location?: { latitude: number; longitude: number; accuracy?: number | null };
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
        if (payload.syncToTwenty) formData.append("syncToTwenty", "true");
        if (payload.twentyCompanyId) formData.append("twentyCompanyId", payload.twentyCompanyId);
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
        if (payload.location) {
          formData.append("location", JSON.stringify(payload.location));
        }

        // Determine mime types based on platform or defaults
        if (payload.micFile) {
          formData.append("micFile", payload.micFile as any);
        }
        if (payload.sysFile) {
          formData.append("sysFile", payload.sysFile as any);
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
        }, false, 300000);
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
     * label ("Speaker 0", "User 1") to the corrected human name; a blank value
     * clears the identification. Returns the updated transcript.
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
        safeFetch(`${BASE_URL}/api/chat/live`, {
          method: "POST",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        }, false, 300000);

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
        safeFetch(`${BASE_URL}/api/chat/live-summary`, {
          method: "POST",
          headers: await getAuthHeaders(force),
          body: JSON.stringify(payload),
        }, false, 300000);

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

    async transcribeAudio(fileUri: string): Promise<string> {
      const req = async (force: boolean) => {
        const formData = new FormData();
        const safeUri = fileUri.startsWith("file://") ? fileUri : `file://${fileUri}`;
        formData.append("mic", {
          uri: safeUri,
          name: "dictation.m4a",
          type: "audio/m4a",
        } as any);

        const headers = await getAuthHeaders(force);
        delete (headers as any)["Content-Type"]; // Allow React Native fetch to generate boundary

        return safeFetch(`${BASE_URL}/api/audio/transcribe-chunk`, {
          method: "POST",
          headers,
          body: formData,
        });
      };

      const res = await req(false);
      const data = await handleResponseWithRetry<{ text: string }>(res, () => req(true));
      return data.text.replace(/^User:\s*/i, "").trim();
    },
  };
};
