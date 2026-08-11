import React, { useState } from "react";
import { View, Linking } from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  Button,
  IconButton,
  useTheme,
} from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import type { components } from "@/types/api";

type PostMeetingTaskKind = components["schemas"]["PostMeetingTaskKind"];
type PostMeetingTaskStatus = components["schemas"]["PostMeetingTaskStatus"];
type PostMeetingTasksRecord = components["schemas"]["PostMeetingTasksRecord"];

const LABELS: Record<PostMeetingTaskKind, string> = {
  jira: "Jira sync",
  linear: "Linear sync",
  trello: "Trello sync",
  notion: "Notion export",
  asana: "Asana sync",
  googleDrive: "Google Drive export",
  oneDrive: "OneDrive export",
  doc: "Document generation",
  slides: "Slides generation",
  twenty: "Twenty CRM note",
};

const ORDER: PostMeetingTaskKind[] = [
  "jira",
  "linear",
  "trello",
  "asana",
  "notion",
  "twenty",
  "googleDrive",
  "oneDrive",
  "doc",
  "slides",
];

const WEB_APP_URL =
  process.env.EXPO_PUBLIC_PLAN_AI_WEB_URL ?? "https://plan-ai.blueberrybytes.com";

function summaryText(kind: PostMeetingTaskKind, entry: PostMeetingTaskStatus): string {
  if (entry.status === "FAILED") return entry.error || "Failed";
  if (entry.status === "PENDING") return "In progress…";
  if (entry.status === "SKIPPED") return "Skipped";
  if (kind === "notion") return "Transcript exported";
  if (kind === "doc") return "Document ready";
  if (kind === "slides") return "Slides ready";
  if (kind === "googleDrive" || kind === "oneDrive") return "Uploaded";
  if (entry.count !== undefined) return `${entry.count} tasks synced`;
  return "Done";
}

interface Props {
  transcriptId: string;
  tasks?: PostMeetingTasksRecord;
  /** Called after a successful retry so the parent can refetch the transcript. */
  onAfterRetry?: () => void;
}

export const PostMeetingTasksPanel: React.FC<Props> = ({
  transcriptId,
  tasks,
  onAfterRetry,
}) => {
  const theme = useTheme();
  const { api } = useAuth();
  const [retryingKind, setRetryingKind] = useState<PostMeetingTaskKind | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  if (!tasks || !api) return null;
  const entries = ORDER.filter((kind) => tasks[kind]).map(
    (kind) => [kind, tasks[kind] as PostMeetingTaskStatus] as const,
  );
  if (entries.length === 0) return null;

  const hasFailure = entries.some(([, s]) => s.status === "FAILED");

  const onRetry = async (kind: PostMeetingTaskKind) => {
    setRetryingKind(kind);
    setRetryError(null);
    try {
      await api.retryPostMeetingTask(transcriptId, kind);
      onAfterRetry?.();
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryingKind(null);
    }
  };

  const openResource = (url: string) => {
    const fullUrl = url.startsWith("/") ? `${WEB_APP_URL.replace(/\/+$/, "")}${url}` : url;
    Linking.openURL(fullUrl).catch(() => {
      /* swallow — user can copy from the failure message */
    });
  };

  return (
    <Surface
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceVariant,
      }}
      elevation={0}
    >
      <Text
        variant="titleSmall"
        style={{
          fontWeight: "bold",
          color: theme.colors.primary,
          marginBottom: 12,
        }}
      >
        Post-meeting tasks
      </Text>

      {hasFailure && (
        <View
          style={{
            backgroundColor: theme.colors.errorContainer,
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: theme.colors.onErrorContainer, fontSize: 13 }}>
            One or more post-meeting tasks failed. The transcript itself was processed successfully.
          </Text>
        </View>
      )}

      {retryError && (
        <View
          style={{
            backgroundColor: theme.colors.errorContainer,
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: theme.colors.onErrorContainer, fontSize: 13 }}>
            Retry failed: {retryError}
          </Text>
        </View>
      )}

      <View style={{ gap: 12 }}>
        {entries.map(([kind, entry]) => {
          const isRetryingThis = retryingKind === kind;
          const iconColor =
            entry.status === "OK"
              ? "#16a34a"
              : entry.status === "FAILED"
                ? theme.colors.error
                : entry.status === "PENDING"
                  ? theme.colors.primary
                  : theme.colors.outline;

          const iconName =
            entry.status === "OK"
              ? "check-circle-outline"
              : entry.status === "FAILED"
                ? "alert-circle-outline"
                : entry.status === "PENDING"
                  ? "timer-sand"
                  : "minus-circle-outline";

          return (
            <View
              key={kind}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              {entry.status === "PENDING" || isRetryingThis ? (
                <ActivityIndicator size={18} />
              ) : (
                <IconButton
                  icon={iconName}
                  iconColor={iconColor}
                  size={20}
                  style={{ margin: 0, padding: 0, width: 24, height: 24 }}
                />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  variant="bodyMedium"
                  style={{ fontWeight: "600", color: theme.colors.onSurface }}
                >
                  {LABELS[kind]}
                </Text>
                <Text
                  variant="bodySmall"
                  numberOfLines={2}
                  style={{
                    color:
                      entry.status === "FAILED"
                        ? theme.colors.error
                        : theme.colors.onSurfaceVariant,
                  }}
                >
                  {summaryText(kind, entry)}
                </Text>
              </View>
              {entry.status === "OK" && entry.url && (
                <Button
                  mode="text"
                  compact
                  onPress={() => openResource(entry.url!)}
                  icon="open-in-new"
                  labelStyle={{ fontSize: 12 }}
                >
                  Open
                </Button>
              )}
              {entry.status === "FAILED" && (
                <Button
                  mode="outlined"
                  compact
                  loading={isRetryingThis}
                  disabled={retryingKind !== null}
                  onPress={() => onRetry(kind)}
                  icon="refresh"
                  labelStyle={{ fontSize: 12 }}
                >
                  Retry
                </Button>
              )}
            </View>
          );
        })}
      </View>
    </Surface>
  );
};

export default PostMeetingTasksPanel;
