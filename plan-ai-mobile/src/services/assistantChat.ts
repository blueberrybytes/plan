import { Platform } from "react-native";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage, UIDataTypes } from "ai";
// Expo's streaming-capable fetch — the piece that makes the AI SDK UI Message
// Stream (SSE) work in React Native, where the default fetch doesn't stream.
import { fetch as expoFetch } from "expo/fetch";
import { useMemo } from "react";
import { planAiApi } from "../context/AuthContext";

let BASE_URL = process.env.EXPO_PUBLIC_PLAN_AI_API_URL ?? "http://localhost:8080";
if (__DEV__ && Platform.OS === "android") {
  BASE_URL = BASE_URL.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
}

export type SyncProvider = "LINEAR" | "JIRA" | "ASANA" | "TRELLO" | "NOTION";

/** Payload `requestTaskSync` returns (the no-op that asks for confirmation).
 *  Mirrors the web `TaskSyncOutput`. */
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

/** Typed tool set so `part.output` is typed, not `any`. */
export type AssistantUITools = {
  requestTaskSync: { input: { provider: SyncProvider; taskIds: string[] }; output: TaskSyncOutput };
};

export type AssistantUIMessage = UIMessage<never, UIDataTypes, AssistantUITools>;

/**
 * The mobile assistant on the recommended AI SDK stack (`useChat` + UI Message
 * Stream). Same protocol as the web assistant, so mobile gets structured message
 * parts — text, reasoning, and tool confirmation cards — natively. This is the
 * surface executives actually use, so it runs the real thing, not a text hack.
 */
export function useAssistantChatMobile(opts: { projectId?: string; modelKey?: string }) {
  const transport = useMemo(() => {
    const query = opts.modelKey ? `?modelKey=${encodeURIComponent(opts.modelKey)}` : "";
    const endpoint = `${BASE_URL}/api/chat/assistant/stream-ui${query}`;

    return new DefaultChatTransport<AssistantUIMessage>({
      api: endpoint,
      body: { projectId: opts.projectId || undefined },
      // expoFetch streams; DefaultChatTransport's fetch type is the web one, so
      // the cast bridges the (compatible) signatures.
      fetch: (async (url: string, options: RequestInit) => {
        const authHeaders = (await planAiApi.getAuthHeaders()) as Record<string, string>;
        return expoFetch(endpoint, {
          ...options,
          headers: { ...(options?.headers as Record<string, string>), ...authHeaders },
        } as Parameters<typeof expoFetch>[1]);
      }) as unknown as typeof fetch,
    });
  }, [opts.projectId, opts.modelKey]);

  const chat = useChat<AssistantUIMessage>({ transport });

  return {
    ...chat,
    isStreaming: chat.status === "submitted" || chat.status === "streaming",
  };
}
