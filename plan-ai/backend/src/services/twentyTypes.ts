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

/**
 * Links a Plan AI project to a company in Twenty.
 *
 * This is what makes an unattended push possible. Every other integration can
 * work from a single workspace-wide default (a Jira project, a Trello board),
 * but a CRM note has to land on a DIFFERENT company per meeting — so the
 * destination is resolved per project, once, and every meeting recorded into
 * that project inherits it.
 */
export interface LinkProjectToTwentyCompanyRequest {
  projectId: string;
  /** Null unlinks the project (auto-push stops; manual push still works). */
  companyId: string | null;
  companyName?: string | null;
}

export interface ProjectTwentyLink {
  projectId: string;
  companyId: string | null;
  companyName: string | null;
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
