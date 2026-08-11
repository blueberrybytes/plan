export interface TwentyManualConnectRequest {
  /** Root of the Twenty instance, e.g. "https://crm.acme.com". */
  baseUrl: string;
  apiKey: string;
}

export interface TwentySummaryResponse {
  connected: boolean;
  baseUrl?: string;
  workspaceName?: string;
}

export interface TwentyCompanyItem {
  id: string;
  name: string;
  domainName?: string;
}

export interface TwentyPersonItem {
  id: string;
  name: string;
  email?: string;
  companyId?: string;
}

export interface PushTranscriptToTwentyRequest {
  transcriptId: string;
  companyId: string;
  personIds?: string[];
  opportunityId?: string;
  /**
   * Set by the UI when the user rejects an automatic "same meeting" match and
   * insists this really is a separate meeting deserving its own note.
   */
  forceSeparateNote?: boolean;
}

export type TwentyPushOutcome =
  /** The note was created in the CRM from this transcript. */
  | "CREATED"
  /** This transcript had already been pushed; returning the existing note. */
  | "ALREADY_PUSHED"
  /** A teammate's recording of the same meeting already produced the note. */
  | "DEDUPED";

export interface PushTranscriptToTwentyResponse {
  outcome: TwentyPushOutcome;
  noteId: string;
  url?: string;
  /** Present when outcome is DEDUPED — the recording that won. */
  canonicalTranscriptId?: string;
}
