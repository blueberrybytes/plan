import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../utils/baseQuery";
import type { components } from "../../types/api";

type TwentyManualConnectRequest = components["schemas"]["TwentyManualConnectRequest"];
type TwentySummaryResponse = components["schemas"]["TwentySummaryResponse"];
type TwentyCompanyItem = components["schemas"]["TwentyCompanyItem"];
type TwentyPersonItem = components["schemas"]["TwentyPersonItem"];
type PushTranscriptToTwentyRequest = components["schemas"]["PushTranscriptToTwentyRequest"];
type PushTranscriptToTwentyResponse = components["schemas"]["PushTranscriptToTwentyResponse"];
type LinkProjectToTwentyCompanyRequest = components["schemas"]["LinkProjectToTwentyCompanyRequest"];
type ProjectTwentyLink = components["schemas"]["ProjectTwentyLink"];

export const twentyApi = createApi({
  reducerPath: "twentyApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["TwentySummary"],
  endpoints: (builder) => ({
    connectTwentyManually: builder.mutation<{ data: null }, TwentyManualConnectRequest>({
      query: (body) => ({ url: "/api/twenty/manual-connect", method: "POST", body }),
      invalidatesTags: ["TwentySummary"],
    }),
    getTwentySummary: builder.query<{ data: TwentySummaryResponse }, void>({
      query: () => ({ url: "/api/twenty/summary", method: "GET" }),
      providesTags: ["TwentySummary"],
    }),
    searchTwentyCompanies: builder.query<{ data: TwentyCompanyItem[] }, string>({
      query: (q) => ({ url: "/api/twenty/companies", method: "GET", params: { q } }),
    }),
    searchTwentyPeople: builder.query<{ data: TwentyPersonItem[] }, string>({
      query: (q) => ({ url: "/api/twenty/people", method: "GET", params: { q } }),
    }),
    pushTranscriptToTwenty: builder.mutation<
      { data: PushTranscriptToTwentyResponse },
      PushTranscriptToTwentyRequest
    >({
      query: (body) => ({ url: "/api/twenty/push-transcript", method: "POST", body }),
    }),
    linkProjectToTwentyCompany: builder.mutation<
      { data: ProjectTwentyLink },
      LinkProjectToTwentyCompanyRequest
    >({
      query: (body) => ({ url: "/api/twenty/link-project", method: "POST", body }),
    }),
  }),
});

export const {
  useConnectTwentyManuallyMutation,
  useGetTwentySummaryQuery,
  useLazySearchTwentyCompaniesQuery,
  useLazySearchTwentyPeopleQuery,
  usePushTranscriptToTwentyMutation,
  useLinkProjectToTwentyCompanyMutation,
} = twentyApi;
