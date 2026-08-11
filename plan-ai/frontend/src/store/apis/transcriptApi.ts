import { baseQueryWithReauth } from "../../utils/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { components } from "../../types/api";

type ApiResponseStandaloneTranscriptListResponse =
  components["schemas"]["ApiResponse_StandaloneTranscriptListResponse_"];
type ApiResponseStandaloneTranscriptResponse =
  components["schemas"]["ApiResponse_StandaloneTranscriptResponse_"];
type UpdateSpeakerNamesBody = components["schemas"]["UpdateSpeakerNamesBody"];

export const transcriptApi = createApi({
  reducerPath: "transcriptApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Transcript"],
  endpoints: (builder) => ({
    listGlobalTranscripts: builder.query<
      ApiResponseStandaloneTranscriptListResponse,
      {
        page?: number;
        pageSize?: number;
        source?: "UPLOAD" | "RECORDING" | "ZOOM" | "GMEET" | "TEAMS";
        q?: string;
        /** Scope to one project. Server-side, so it spans every page. */
        projectId?: string;
        sentiment?: string;
        /** "all_dates" | "today" | "week" — applied server-side. */
        dateFilter?: string;
      }
    >({
      query: (params) => ({
        url: "/api/transcripts",
        params,
      }),
      providesTags: ["Transcript"],
    }),
    getTranscript: builder.query<ApiResponseStandaloneTranscriptResponse, string>({
      query: (id: string) => `/api/transcripts/${id}`,
      providesTags: (_result, _error, id: string) => [{ type: "Transcript", id }],
    }),
    deleteTranscript: builder.mutation<{ success: boolean }, string>({
      query: (id: string) => ({
        url: `/api/transcripts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Transcript"],
    }),
    retryPostMeetingTask: builder.mutation<
      { success: boolean },
      {
        transcriptId: string;
        kind: components["schemas"]["PostMeetingTaskKind"];
      }
    >({
      query: ({ transcriptId, kind }) => ({
        url: `/api/transcripts/${transcriptId}/post-meeting-tasks/${kind}/retry`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { transcriptId }) => [
        { type: "Transcript", id: transcriptId },
      ],
    }),
    // Corrects AI-inferred speaker names. Maps the stable diarization label
    // ("Speaker 0") to the corrected human name; blank clears it. Invalidates
    // the detail tag so open views refetch the patched metadata.speakers.
    updateTranscriptSpeakers: builder.mutation<
      ApiResponseStandaloneTranscriptResponse,
      { id: string; overrides: UpdateSpeakerNamesBody["overrides"] }
    >({
      query: ({ id, overrides }) => ({
        url: `/api/transcripts/${id}/speakers`,
        method: "PUT",
        body: { overrides } satisfies UpdateSpeakerNamesBody,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Transcript", id }],
    }),
    reprocessTranscript: builder.mutation<ApiResponseStandaloneTranscriptResponse, string>({
      query: (id: string) => ({
        url: `/api/transcripts/${id}/reprocess`,
        method: "POST",
      }),
      // Invalidate so the detail view refetches and reflects the re-queued
      // PENDING status (and any active polling picks it up).
      invalidatesTags: (_result, _error, id: string) => [{ type: "Transcript", id }, "Transcript"],
    }),
  }),
});

export const {
  useListGlobalTranscriptsQuery,
  useGetTranscriptQuery,
  useDeleteTranscriptMutation,
  useUpdateTranscriptSpeakersMutation,
  useRetryPostMeetingTaskMutation,
  useReprocessTranscriptMutation,
} = transcriptApi;
