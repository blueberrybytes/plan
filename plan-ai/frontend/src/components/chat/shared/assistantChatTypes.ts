import type { UIMessage, UIDataTypes } from "ai";

/**
 * Typed message shape for the assistant chat, so `message.parts` and tool
 * outputs are fully typed end to end — no `any`, which would silently discard
 * the SDK's typing and break narrowing downstream.
 *
 * Only the tools the UI renders need declaring (the task-sync confirmation
 * card). Other tools the model calls still stream as tool parts at runtime; the
 * renderer ignores them.
 */

export type SyncProvider = "LINEAR" | "JIRA" | "ASANA" | "TRELLO" | "NOTION";

/** Payload `requestTaskSync` returns (the no-op that asks for confirmation).
 *  Mirrors the backend tool return. */
export interface TaskSyncOutput {
  action: "task-sync";
  needsConfirmation: boolean;
  provider: SyncProvider;
  providerLabel: string;
  connected: boolean;
  targetName?: string;
  taskIds: string[];
  tasks: { id: string; title: string; alreadySynced?: boolean }[];
}

export type AssistantUITools = {
  requestTaskSync: {
    input: { provider: SyncProvider; taskIds: string[] };
    output: TaskSyncOutput;
  };
};

export type AssistantUIMessage = UIMessage<never, UIDataTypes, AssistantUITools>;
