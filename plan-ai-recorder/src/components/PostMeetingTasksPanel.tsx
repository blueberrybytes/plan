import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CheckCircleOutline as OkIcon,
  ErrorOutline as FailedIcon,
  HourglassEmpty as PendingIcon,
  RemoveCircleOutline as SkippedIcon,
  OpenInNew as OpenIcon,
  Refresh as RetryIcon,
} from "@mui/icons-material";
import type { components } from "../types/api";
import { createPlanAiApi } from "../services/planAiApi";

type PostMeetingTaskKind = components["schemas"]["PostMeetingTaskKind"];
type PostMeetingTaskStatus = components["schemas"]["PostMeetingTaskStatus"];
type PostMeetingTasksRecord = components["schemas"]["PostMeetingTasksRecord"];

type PlanAiApi = ReturnType<typeof createPlanAiApi>;

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
  import.meta.env.VITE_PLAN_AI_WEB_URL || "http://localhost:3000";

function statusIcon(status: PostMeetingTaskStatus["status"]) {
  switch (status) {
    case "OK":
      return <OkIcon fontSize="small" sx={{ color: "success.main" }} />;
    case "FAILED":
      return <FailedIcon fontSize="small" sx={{ color: "error.main" }} />;
    case "PENDING":
      return <CircularProgress size={16} />;
    case "SKIPPED":
      return <SkippedIcon fontSize="small" sx={{ color: "text.disabled" }} />;
    default:
      return <PendingIcon fontSize="small" />;
  }
}

function summaryText(kind: PostMeetingTaskKind, entry: PostMeetingTaskStatus): string {
  if (entry.status === "FAILED") return entry.error || "Failed";
  if (entry.status === "PENDING") return "In progress…";
  // The reason is stored on SKIPPED too — it's the actionable part.
  if (entry.status === "SKIPPED") return entry.error || "Skipped";
  if (kind === "twenty") return "Note added to CRM";
  if (kind === "notion") return "Transcript exported";
  if (kind === "doc") return "Document ready";
  if (kind === "slides") return "Slides ready";
  if (kind === "googleDrive" || kind === "oneDrive") return "Uploaded";
  if (entry.count !== undefined) return `${entry.count} tasks synced`;
  return "Done";
}

interface Props {
  api: PlanAiApi;
  transcriptId: string;
  tasks?: PostMeetingTasksRecord;
  /** Called after a successful retry so the parent can refetch. */
  onAfterRetry?: () => void;
}

export const PostMeetingTasksPanel: React.FC<Props> = ({
  api,
  transcriptId,
  tasks,
  onAfterRetry,
}) => {
  const [retryingKind, setRetryingKind] = useState<PostMeetingTaskKind | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  if (!tasks) return null;
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

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Post-meeting tasks
        </Typography>

        {hasFailure && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            One or more post-meeting tasks failed. The transcript itself was processed successfully.
          </Alert>
        )}

        {retryError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRetryError(null)}>
            Retry failed: {retryError}
          </Alert>
        )}

        <Stack spacing={1.25}>
          {entries.map(([kind, entry]) => {
            const isRetryingThis = retryingKind === kind;
            const isInternal = entry.url?.startsWith("/");
            const href = isInternal
              ? `${WEB_APP_URL.replace(/\/+$/, "")}${entry.url}`
              : entry.url;
            const summary = summaryText(kind, entry);

            return (
              <Box
                key={kind}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  py: 0.5,
                }}
              >
                <Box sx={{ display: "flex", width: 24, justifyContent: "center" }}>
                  {isRetryingThis ? <CircularProgress size={16} /> : statusIcon(entry.status)}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {LABELS[kind]}
                  </Typography>
                  <Tooltip title={entry.status === "FAILED" ? entry.error || "" : ""} placement="top">
                    <Typography
                      variant="caption"
                      color={entry.status === "FAILED" ? "error" : "text.secondary"}
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {summary}
                    </Typography>
                  </Tooltip>
                </Box>
                {entry.status === "OK" && href && (
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.8rem" }}
                  >
                    Open <OpenIcon sx={{ fontSize: "0.95rem" }} />
                  </Link>
                )}
                {entry.status === "FAILED" && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<RetryIcon sx={{ fontSize: "0.95rem" }} />}
                    disabled={retryingKind !== null}
                    onClick={() => onRetry(kind)}
                    sx={{ fontSize: "0.7rem", py: 0.25, minWidth: 0 }}
                  >
                    Retry
                  </Button>
                )}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PostMeetingTasksPanel;
