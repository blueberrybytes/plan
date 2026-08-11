import React from "react";
import { Box, Chip, Tooltip, CircularProgress } from "@mui/material";
import {
  CheckCircleOutline as OkIcon,
  ErrorOutline as FailedIcon,
  RemoveCircleOutline as SkippedIcon,
} from "@mui/icons-material";
import type { components } from "../types/api";

type PostMeetingTaskKind = components["schemas"]["PostMeetingTaskKind"];
type PostMeetingTaskStatus = components["schemas"]["PostMeetingTaskStatus"];
type PostMeetingTasksRecord = components["schemas"]["PostMeetingTasksRecord"];

const LABELS: Record<PostMeetingTaskKind, string> = {
  jira: "Jira",
  linear: "Linear",
  trello: "Trello",
  notion: "Notion",
  asana: "Asana",
  googleDrive: "Drive",
  oneDrive: "OneDrive",
  doc: "Doc",
  slides: "Slides",
  twenty: "Twenty",
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

interface SyncBadgesProps {
  tasks?: PostMeetingTasksRecord | null;
}

const SyncBadges: React.FC<SyncBadgesProps> = ({ tasks }) => {
  if (!tasks) return null;

  const entries: Array<[PostMeetingTaskKind, PostMeetingTaskStatus]> = ORDER.filter(
    (kind) => tasks[kind] !== undefined,
  ).map((kind) => [kind, tasks[kind] as PostMeetingTaskStatus]);

  if (entries.length === 0) return null;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
      {entries.map(([kind, status]) => {
        const tooltip = `${LABELS[kind]} — ${status.status.toLowerCase()}${
          status.error ? `: ${status.error}` : status.count ? ` (${status.count})` : ""
        }`;
        const chipProps =
          status.status === "OK"
            ? { color: "success" as const, icon: <OkIcon sx={{ fontSize: 14 }} /> }
            : status.status === "FAILED"
              ? { color: "error" as const, icon: <FailedIcon sx={{ fontSize: 14 }} /> }
              : status.status === "PENDING"
                ? {
                    color: "warning" as const,
                    icon: <CircularProgress size={12} thickness={5} />,
                  }
                : {
                    color: "default" as const,
                    icon: <SkippedIcon sx={{ fontSize: 14 }} />,
                  };
        return (
          <Tooltip key={kind} title={tooltip}>
            <Chip
              size="small"
              variant="outlined"
              label={LABELS[kind]}
              {...chipProps}
              sx={{ fontSize: "0.7rem", height: 22 }}
              {...(status.url
                ? {
                    component: "a",
                    href: status.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    clickable: true,
                  }
                : {})}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default SyncBadges;
