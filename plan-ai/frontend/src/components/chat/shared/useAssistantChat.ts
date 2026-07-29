import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { getAuth } from "firebase/auth";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import type { AssistantUIMessage } from "./assistantChatTypes";

/**
 * The assistant chat over the AI SDK UI Message Stream protocol.
 *
 * Replaces the hand-rolled `useAssistantStream` (fetch + text decode + regex
 * `[UI:...]` markers) with `useChat`, which gives structured message parts —
 * text, reasoning, and tool calls — natively. That is what makes the Claude
 * Code-style UX possible: a real "Thinking" panel from reasoning parts and tool
 * confirmation cards from tool parts, instead of parsing markers out of text.
 *
 * Points at `/assistant/stream-ui`. Auth mirrors the GitNexus reference: the
 * Redux user is a plain object, so the live Firebase token comes from
 * `getAuth().currentUser`.
 */
/** Where to persist the conversation between remounts. */
type PersistTarget = { kind: "local"; key: string };

export function useAssistantChat(opts: { projectId?: string; persist?: PersistTarget }) {
  const activeWorkspaceId = useSelector((state: RootState) => state.app.activeWorkspaceId);

  const transport = useMemo(() => {
    const baseUrl = (process.env.REACT_APP_API_BACKEND_URL || "").replace(/\/$/, "");
    const endpoint = `${baseUrl}/api/chat/assistant/stream-ui`;

    return new DefaultChatTransport({
      api: endpoint,
      // projectId scopes the assistant's tools/RAG; the workspace header is
      // required by the endpoint's auth + subscription guard.
      body: { projectId: opts.projectId || undefined },
      fetch: async (url, options) => {
        const firebaseUser = getAuth().currentUser;
        const token = firebaseUser ? await firebaseUser.getIdToken() : "";
        return fetch(endpoint, {
          ...(options as RequestInit),
          headers: {
            ...((options as RequestInit)?.headers as Record<string, string>),
            Authorization: `Bearer ${token}`,
            "x-workspace-id": activeWorkspaceId || "",
            "Content-Type": "application/json",
          },
        });
      },
    });
    // Re-create when scope or workspace changes so the body/headers stay correct.
  }, [opts.projectId, activeWorkspaceId]);

  const chat = useChat<AssistantUIMessage>({ transport });
  const { messages, setMessages, status } = chat;

  // ── Persistence ─────────────────────────────────────────────────────────
  // Rehydrate ONCE on mount from localStorage, then write back whenever the
  // conversation settles (not mid-stream, to avoid thrashing storage on every
  // token). The AI SDK stores full parts, so reasoning/tool cards survive too.
  const persistKey = opts.persist?.key;
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current || !persistKey) return;
    didHydrate.current = true;
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const stored = JSON.parse(raw) as AssistantUIMessage[];
        if (Array.isArray(stored) && stored.length) setMessages(stored);
      }
    } catch {
      // corrupt/absent → start empty
    }
  }, [persistKey, setMessages]);

  useEffect(() => {
    if (!persistKey || status === "streaming" || status === "submitted") return;
    try {
      localStorage.setItem(persistKey, JSON.stringify(messages));
    } catch {
      // quota — ignore
    }
  }, [persistKey, messages, status]);

  return {
    ...chat,
    isStreaming: status === "submitted" || status === "streaming",
  };
}
