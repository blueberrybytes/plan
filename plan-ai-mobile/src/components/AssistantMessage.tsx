import React, { useEffect, useState } from "react";
import { View, Pressable, Platform } from "react-native";
import { Text, useTheme, Card, Button, ActivityIndicator } from "react-native-paper";
import Markdown from "react-native-markdown-display";
import { planAiApi } from "../context/AuthContext";
import type { AssistantUIMessage, TaskSyncOutput } from "../services/assistantChat";

/**
 * Renders one assistant message's PARTS from the AI SDK UI Message Stream:
 * reasoning → collapsible "Thinking" panel, text → markdown, and the Linear
 * tool → a confirmation card. Parts are the SDK's typed union, narrowed by
 * `part.type` — no `any`.
 */

let BASE_URL = process.env.EXPO_PUBLIC_PLAN_AI_API_URL ?? "http://localhost:8080";
if (__DEV__ && Platform.OS === "android") {
  BASE_URL = BASE_URL.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
}

const ThinkingPanel: React.FC<{ text: string; streaming: boolean }> = ({ text, streaming }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(streaming);
  useEffect(() => {
    if (!streaming) setOpen(false);
  }, [streaming]);

  if (!text.trim()) return null;

  return (
    <View
      style={{
        marginBottom: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        backgroundColor: theme.colors.elevation.level2,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 6,
          gap: 4,
        }}
      >
        <Text style={{ fontSize: 13 }}>🧠</Text>
        <Text
          style={{ fontSize: 12, fontWeight: "600", color: theme.colors.onSurfaceVariant, flex: 1 }}
        >
          {streaming ? "Thinking…" : "Thinking"}
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{open ? "▾" : "▸"}</Text>
      </Pressable>
      {open && (
        <Text
          style={{
            paddingHorizontal: 10,
            paddingBottom: 8,
            fontSize: 12,
            fontStyle: "italic",
            color: theme.colors.onSurfaceVariant,
            lineHeight: 18,
          }}
        >
          {text}
        </Text>
      )}
    </View>
  );
};

/**
 * Task-sync confirmation card (Linear/Jira/Asana/Trello/Notion). The model can
 * only ASK (requestTaskSync is a no-op); the WRITE happens here on Confirm, via
 * the trusted server endpoint that re-checks every task.
 */
const TaskSyncConfirmCard: React.FC<{ output: TaskSyncOutput }> = ({ output }) => {
  const [state, setState] = useState<"idle" | "working" | "done" | "cancelled">("idle");
  const [resultText, setResultText] = useState("");

  const tasks = output.tasks ?? [];
  const label = output.providerLabel ?? "the task tool";

  if (output.connected === false) {
    return (
      <Card mode="outlined" style={{ marginTop: 8 }}>
        <Card.Content>
          <Text variant="bodyMedium">
            {label} isn't connected, or no default target is set. Connect it in Integrations first.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const handleConfirm = async () => {
    setState("working");
    try {
      const headers = (await planAiApi.getAuthHeaders()) as Record<string, string>;
      const res = await fetch(`${BASE_URL}/api/chat/assistant/actions/task-sync`, {
        method: "POST",
        headers,
        body: JSON.stringify({ provider: output.provider, taskIds: output.taskIds ?? [] }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data: { results?: { status: string }[] } = await res.json();
      const created = (data.results ?? []).filter((r) => r.status === "created").length;
      setResultText(`Created ${created} item${created === 1 ? "" : "s"} in ${label}.`);
      setState("done");
    } catch {
      setResultText("Something went wrong creating the items.");
      setState("done");
    }
  };

  return (
    <Card mode="outlined" style={{ marginTop: 8 }}>
      <Card.Title
        title={`Sync to ${label}${output.targetName ? ` · ${output.targetName}` : ""}`}
        subtitle="Confirmation required"
        left={(props) => <Text {...props} style={{ fontSize: 20 }}>⚡</Text>}
      />
      <Card.Content>
        {state === "done" || state === "cancelled" ? (
          <Text variant="bodyMedium">{resultText}</Text>
        ) : (
          <>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              {tasks.length > 0
                ? `Create ${tasks.length} item${tasks.length === 1 ? "" : "s"} in ${label}?`
                : `No new tasks to sync (they may already be in ${label}).`}
            </Text>
            {tasks.slice(0, 6).map((t) => (
              <Text key={t.id} variant="bodySmall" style={{ opacity: 0.8 }}>
                • {t.title}
              </Text>
            ))}
            {tasks.length > 6 && (
              <Text variant="bodySmall" style={{ opacity: 0.8 }}>
                …and {tasks.length - 6} more
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Button
                mode="contained"
                compact
                disabled={state === "working" || tasks.length === 0}
                onPress={handleConfirm}
                icon={state === "working" ? () => <ActivityIndicator size={14} /> : undefined}
              >
                {state === "working" ? "Creating…" : "Confirm"}
              </Button>
              <Button
                mode="text"
                compact
                disabled={state === "working"}
                onPress={() => {
                  setResultText("Cancelled — nothing was created.");
                  setState("cancelled");
                }}
              >
                Cancel
              </Button>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

interface Props {
  message: AssistantUIMessage;
  streaming: boolean;
  /** Markdown styles from the screen, so bubbles look consistent. */
  markdownStyles: Record<string, object>;
}

const AssistantMessage: React.FC<Props> = ({ message, streaming, markdownStyles }) => {
  return (
    <View>
      {message.parts.map((part, i) => {
        if (part.type === "reasoning") {
          return <ThinkingPanel key={i} text={part.text} streaming={streaming} />;
        }
        if (part.type === "text") {
          return (
            <Markdown key={i} style={markdownStyles}>
              {part.text}
            </Markdown>
          );
        }
        if (
          part.type === "tool-requestTaskSync" &&
          part.state === "output-available" &&
          part.output.needsConfirmation
        ) {
          return <TaskSyncConfirmCard key={part.toolCallId} output={part.output} />;
        }
        return null;
      })}
    </View>
  );
};

export default AssistantMessage;
