import { Platform } from "react-native";

let BASE_URL = process.env.EXPO_PUBLIC_PLAN_AI_API_URL ?? "http://localhost:8080";
if (__DEV__ && Platform.OS === 'android') {
  BASE_URL = BASE_URL.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export const streamAssistantMessage = async (
  headers: HeadersInit,
  messages: AssistantMessage[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: any) => void,
  projectId?: string,
) => {
  try {
    // reasoning=1 opts into the model's streamed thinking, wrapped in
    // <think>…</think>, which the screen shows in a collapsible panel.
    const url = `${BASE_URL}/api/chat/assistant/stream?reasoning=1`;
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        messages: messages.map((m, i) => ({
          id: `msg-${Date.now()}-${i}`,
          role: m.role,
          content: m.content,
          parts: [{ type: 'text', text: m.content }]
        })),
        projectId: projectId || undefined,
      }),
      // @ts-ignore - needed for react native fetch streaming
      reactNative: { textStreaming: true }
    } as any);

    if (!response.ok) {
      let msg = response.statusText;
      try {
        const body = await response.json();
        if (body.message) msg = body.message;
      } catch (e) {}
      throw new Error(msg);
    }

    if (response.body && typeof (response.body as any).getReader === 'function') {
      const reader = (response.body as any).getReader();
      const decoder = new TextDecoder("utf-8");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } else {
      const text = await response.text();
      onChunk(text);
    }
    
    onDone();
  } catch (err) {
    console.error("[AssistantApi] Stream error:", err);
    onError(err);
  }
};
