import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { useSendLiveChatMessageMutation } from "../../store/apis/chatApi";
import type { components } from "../../types/api";

type Meeting = components["schemas"]["TranscriptResponse"];

interface MeetingsChatDrawerProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  meetings: Meeting[];
  /**
   * Question to ask automatically when the drawer opens (the saved-question
   * buttons in MeetingsTab). Fires once per open, so reopening with the same
   * preset asks again but re-rendering doesn't.
   */
  initialQuestion?: string;
}

interface LocalMessage {
  role: "user" | "assistant";
  content: string;
}

// Keep the injected meetings context within a sane prompt budget. The /live
// endpoint also RAG-queries the project's knowledge base via projectIds, so
// truncated transcripts are complemented by retrieval.
const TOTAL_CONTEXT_CHARS = 60_000;

/**
 * Concatenate the project's meetings (newest first) into one annotated
 * transcript block. Confidential meetings are excluded — same policy as the
 * project digest. Each meeting gets a fair share of the char budget, with
 * title/date/summary always included.
 */
function buildMeetingsContext(meetings: Meeting[], untitledLabel: string): string {
  const visible = meetings.filter(
    (m) => (m.metadata as Record<string, unknown> | null)?.confidential !== true,
  );
  if (visible.length === 0) return "";

  const perMeeting = Math.floor(TOTAL_CONTEXT_CHARS / visible.length);
  return visible
    .map((m) => {
      const date = m.recordedAt ?? m.createdAt;
      const header = `## ${m.title ?? untitledLabel} — ${new Date(date).toLocaleString()}`;
      const summary = m.summary ? `Summary: ${m.summary}` : "";
      const body = (m.transcript ?? "").slice(0, Math.max(perMeeting - header.length, 500));
      return [header, summary, body].filter(Boolean).join("\n");
    })
    .join("\n\n---\n\n");
}

/**
 * Ephemeral Q&A sidebar over the project's meetings. Uses the stateless
 * POST /api/chat/live endpoint — nothing is persisted server-side; the
 * conversation lives only in component state and dies with the drawer's
 * unmount or the Clear button.
 */
const MeetingsChatDrawer: React.FC<MeetingsChatDrawerProps> = ({
  open,
  onClose,
  projectId,
  meetings,
  initialQuestion,
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [sendLiveChatMessage, { isLoading }] = useSendLiveChatMessageMutation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const ask = React.useCallback(
    async (question: string, history: LocalMessage[]) => {
      setMessages((prev) => [...prev, { role: "user", content: question }]);
      try {
        const response = await sendLiveChatMessage({
          content: question,
          liveTranscript: buildMeetingsContext(meetings, t("meetings.untitled", "Untitled meeting")),
          projectIds: [projectId],
          history,
        }).unwrap();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response || t("meetings.chat.emptyResponse", "I couldn't generate an answer."),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("meetings.chat.error", "Something went wrong. Please try again."),
          },
        ]);
      }
    },
    [meetings, projectId, sendLiveChatMessage, t],
  );

  // Fire the preset question once per open. Guarded by a ref rather than the
  // messages array so a user who opens a preset, clears nothing and scrolls
  // doesn't re-trigger it.
  const firedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      firedFor.current = null;
      return;
    }
    if (!initialQuestion || firedFor.current === initialQuestion) return;
    firedFor.current = initialQuestion;
    setMessages([]);
    void ask(initialQuestion, []);
  }, [open, initialQuestion, ask]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;
    setInput("");
    await ask(question, messages);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 420 }, display: "flex" } }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}
      >
        <QuestionAnswerOutlinedIcon color="primary" fontSize="small" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {t("meetings.chat.title", "Ask about meetings")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("meetings.chat.subtitle", "Quick questions — nothing is saved")}
          </Typography>
        </Box>
        {messages.length > 0 && (
          <Tooltip title={t("meetings.chat.clear", "Clear conversation")}>
            <IconButton size="small" onClick={() => setMessages([])}>
              <DeleteSweepOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <IconButton size="small" onClick={onClose} aria-label={t("common.close", "Close")}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Messages */}
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", px: 2, py: 2 }}>
        {messages.length === 0 && !isLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
            {t(
              "meetings.chat.empty",
              "Ask anything about this project's meetings — decisions, action items, who said what…",
            )}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {messages.map((m, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: m.role === "user" ? "primary.main" : "action.hover",
                  color: m.role === "user" ? "primary.contrastText" : "text.primary",
                  "& p": { m: 0 },
                  "& p + p, & ul, & ol": { mt: 1 },
                  fontSize: "0.875rem",
                  wordBreak: "break-word",
                }}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  <Typography variant="body2">{m.content}</Typography>
                )}
              </Box>
            ))}
            {isLoading && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                  {t("meetings.chat.thinking", "Thinking…")}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      {/* Input */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ p: 1.5, borderTop: 1, borderColor: "divider", alignItems: "flex-end" }}
      >
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={4}
          autoFocus
          placeholder={t("meetings.chat.placeholder", "e.g. What did we decide about pricing?")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <IconButton
          color="primary"
          onClick={() => void handleSend()}
          disabled={!input.trim() || isLoading}
          aria-label={t("meetings.chat.send", "Send")}
        >
          <SendIcon />
        </IconButton>
      </Stack>
    </Drawer>
  );
};

export default MeetingsChatDrawer;
