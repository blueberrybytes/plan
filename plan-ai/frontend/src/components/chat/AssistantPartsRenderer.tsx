import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Collapse,
  CircularProgress,
} from "@mui/material";
import {
  Psychology as PsychologyIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Bolt as BoltIcon,
  CheckCircleOutline,
} from "@mui/icons-material";
import { getAuth } from "firebase/auth";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import MarkdownRenderer from "../common/MarkdownRenderer";
import type { AssistantUIMessage, TaskSyncOutput } from "./shared/assistantChatTypes";

/**
 * Renders one assistant message's PARTS from the AI SDK UI Message Stream:
 *   - text          → markdown
 *   - reasoning     → collapsible "Thinking" panel (Claude Code style)
 *   - tool parts    → for `requestLinearSync`, a confirmation card whose Confirm
 *                     button calls the trusted write endpoint and reports back
 *                     to the model via addToolResult.
 *
 * Parts are the SDK's typed union (`AssistantUIMessage["parts"]`), narrowed by
 * `part.type` — no `any`, so tool outputs stay typed.
 */

type Part = AssistantUIMessage["parts"][number];

const ThinkingPanel: React.FC<{ text: string; streaming: boolean }> = ({ text, streaming }) => {
  const [open, setOpen] = useState(streaming);
  useEffect(() => {
    if (!streaming) setOpen(false);
  }, [streaming]);

  if (!text.trim()) return null;

  return (
    <Box
      sx={{
        mb: 1,
        border: 1,
        borderColor: "divider",
        borderRadius: 1.5,
        bgcolor: "action.hover",
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          cursor: "pointer",
        }}
      >
        <PsychologyIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", flex: 1 }}>
          {streaming ? "Thinking…" : "Thinking"}
        </Typography>
        {open ? (
          <ExpandLessIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        )}
      </Box>
      <Collapse in={open}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            px: 1.5,
            pb: 1,
            whiteSpace: "pre-wrap",
            color: "text.secondary",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          {text}
        </Typography>
      </Collapse>
    </Box>
  );
};

/**
 * Confirmation card for a task-sync action (Linear/Jira/Asana/Trello/Notion).
 * The model can only ASK (requestTaskSync is a no-op); the WRITE happens here,
 * when the user clicks Confirm, via the trusted server endpoint that re-checks
 * every task.
 */
const TaskSyncConfirmCard: React.FC<{
  output: TaskSyncOutput;
}> = ({ output }) => {
  const [state, setState] = useState<"idle" | "working" | "done" | "cancelled">("idle");
  const [resultText, setResultText] = useState("");
  const activeWorkspaceId = useSelector((s: RootState) => s.app.activeWorkspaceId);

  const tasks = output.tasks ?? [];
  const label = output.providerLabel ?? "the task tool";

  if (output.connected === false) {
    return (
      <Card variant="outlined" sx={{ mt: 1, bgcolor: "background.paper" }}>
        <CardContent>
          <Typography variant="body2">
            {label} isn&apos;t connected, or no default target is set. Connect it in Integrations
            first.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // The card owns its own outcome — requestLinearSync already carries its
  // (confirmation-request) output from the server, so we don't feed a result
  // back through addToolResult; we just show what the trusted endpoint did.
  const finish = (text: string, next: "done" | "cancelled") => {
    setResultText(text);
    setState(next);
  };

  const handleConfirm = async () => {
    setState("working");
    try {
      const baseUrl = (process.env.REACT_APP_API_BACKEND_URL || "").replace(/\/$/, "");
      const firebaseUser = getAuth().currentUser;
      const token = firebaseUser ? await firebaseUser.getIdToken() : "";
      const res = await fetch(`${baseUrl}/api/chat/assistant/actions/task-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-workspace-id": activeWorkspaceId || "",
        },
        body: JSON.stringify({ provider: output.provider, taskIds: output.taskIds ?? [] }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data: { results?: { status: string }[] } = await res.json();
      const created = (data.results ?? []).filter((r) => r.status === "created").length;
      finish(`Created ${created} item${created === 1 ? "" : "s"} in ${label}.`, "done");
    } catch {
      finish("Something went wrong creating the issues.", "done");
    }
  };

  return (
    <Card variant="outlined" sx={{ mt: 1, bgcolor: "background.paper" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <BoltIcon color="primary" />
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            Sync to {label}
            {output.targetName ? ` · ${output.targetName}` : ""}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Confirmation required
          </Typography>
        </Box>
      </Box>
      <CardContent sx={{ pt: 2, pb: "16px !important" }}>
        {state === "done" || state === "cancelled" ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleOutline
              fontSize="small"
              color={state === "done" ? "success" : "disabled"}
            />
            <Typography variant="body2">{resultText}</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {tasks.length > 0
                ? `Create ${tasks.length} item${tasks.length === 1 ? "" : "s"} in ${label}?`
                : `No new tasks to sync (they may already be in ${label}).`}
            </Typography>
            {tasks.length > 0 && (
              <Box
                component="ul"
                sx={{ pl: 2.5, m: 0, mb: 1.5, "& li": { fontSize: "0.85rem", mb: 0.25 } }}
              >
                {tasks.slice(0, 8).map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
                {tasks.length > 8 && <li>…and {tasks.length - 8} more</li>}
              </Box>
            )}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                disabled={state === "working" || tasks.length === 0}
                onClick={handleConfirm}
                startIcon={
                  state === "working" ? <CircularProgress size={14} color="inherit" /> : undefined
                }
              >
                {state === "working" ? "Creating…" : "Confirm"}
              </Button>
              <Button
                variant="text"
                size="small"
                disabled={state === "working"}
                onClick={() => finish("Cancelled — nothing was created.", "cancelled")}
              >
                Cancel
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface AssistantPartsRendererProps {
  parts: AssistantUIMessage["parts"];
  isStreaming?: boolean;
}

const AssistantPartsRenderer: React.FC<AssistantPartsRendererProps> = ({ parts, isStreaming }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {parts.map((part: Part, i) => {
        if (part.type === "reasoning") {
          return <ThinkingPanel key={i} text={part.text} streaming={Boolean(isStreaming)} />;
        }
        if (part.type === "text") {
          return <MarkdownRenderer key={i} content={part.text} isStreaming={isStreaming} />;
        }
        // The typed tool part: `part.output` is a TaskSyncOutput once available.
        if (
          part.type === "tool-requestTaskSync" &&
          part.state === "output-available" &&
          part.output.needsConfirmation
        ) {
          return <TaskSyncConfirmCard key={part.toolCallId} output={part.output} />;
        }
        return null;
      })}
    </Box>
  );
};

export default AssistantPartsRenderer;
