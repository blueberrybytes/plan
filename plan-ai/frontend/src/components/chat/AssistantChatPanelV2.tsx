import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Folder as FolderIcon,
  RestartAlt as RestartIcon,
} from "@mui/icons-material";
import type { FileUIPart } from "ai";
import { useListProjectsQuery } from "../../store/apis/projectApi";
import ChatInput from "./shared/ChatInput";
import ChatEmptyState, { ChatSuggestion } from "./shared/ChatEmptyState";
import { useChatAutoScroll } from "./shared/useChatAutoScroll";
import { useAssistantChat } from "./shared/useAssistantChat";
import { useChatAttachments } from "./shared/useChatAttachments";
import AttachmentPreviewStrip from "./shared/AttachmentPreviewStrip";
import AttachmentMessageStrip from "./shared/AttachmentMessageStrip";
import AssistantPartsRenderer from "./AssistantPartsRenderer";
import MarkdownRenderer from "../common/MarkdownRenderer";
import type { AssistantUIMessage } from "./shared/assistantChatTypes";

const LS_PROJECT_KEY = "chathome_project_id";

/**
 * The assistant chat on the recommended AI SDK stack (`useChat` + UI Message
 * Stream). Renders structured message parts, so it shows the model's reasoning
 * in a "Thinking" panel and tool actions as confirmation cards — the Claude
 * Code-style UX — with attachments and persistence at parity with the legacy
 * panel.
 *
 * Shipped alongside the legacy `AssistantChatPanel`, gated behind a flag so the
 * migration is verified before it replaces the old surface.
 */
interface Props {
  lockedProjectId?: string;
  suggestions?: ChatSuggestion[];
  showWelcome?: boolean;
  /** Persistence bucket, mapped from the legacy panel's storageKey. */
  storageKey?: string;
}

/** Text of a user message = its text parts joined. */
const userText = (m: AssistantUIMessage): string =>
  (m.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("");

/** File parts on a message, mapped to the legacy attachment strip's shape. */
const fileAttachments = (m: AssistantUIMessage) =>
  (m.parts ?? [])
    .filter((p): p is FileUIPart => p.type === "file")
    .map((p) => ({ url: p.url, type: p.mediaType, name: p.filename ?? "attachment" }));

const AssistantChatPanelV2: React.FC<Props> = ({
  lockedProjectId,
  suggestions: suggestionsOverride,
  showWelcome = true,
  storageKey = "redux:chatHome",
}) => {
  const theme = useTheme();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (lockedProjectId) return lockedProjectId;
    if (typeof window === "undefined") return "";
    return localStorage.getItem(LS_PROJECT_KEY) || "";
  });
  const { data: projectsResponse } = useListProjectsQuery(undefined);
  const projects = useMemo(() => projectsResponse?.data?.projects ?? [], [projectsResponse]);
  const effectiveProjectId = lockedProjectId ?? selectedProjectId;
  const focusedProject = projects.find((p) => p.id === effectiveProjectId);

  // Legacy storageKey ("redux:chatHome" | "local:<key>") → a V2 localStorage
  // bucket, kept separate so the two surfaces don't clobber each other's history.
  const persistKey = useMemo(
    () => `assistant_v2:${storageKey.replace(/^local:/, "")}`,
    [storageKey],
  );

  const { messages, sendMessage, setMessages, isStreaming } = useAssistantChat({
    projectId: effectiveProjectId,
    persist: { kind: "local", key: persistKey },
  });

  const { scrollRef, handleScroll } = useChatAutoScroll([messages], isStreaming);
  const [input, setInput] = useState("");

  const attachments = useChatAttachments({ uploadEndpoint: "/api/chat/attachments" });
  const { isDraggingOver, dragProps } = attachments.useDragDrop();

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    const files: FileUIPart[] = attachments.pending.map((a) => ({
      type: "file",
      url: a.url,
      mediaType: a.type,
      filename: a.name,
    }));
    if ((!trimmed && files.length === 0) || isStreaming) return;
    sendMessage({ text: trimmed, files: files.length ? files : undefined });
    attachments.clear();
    setInput("");
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(persistKey);
    } catch {
      // ignore
    }
  };

  const suggestions: ChatSuggestion[] = suggestionsOverride ?? [
    {
      label: "Pending action items from meetings",
      prompt: "List all open action items from my recordings across the workspace.",
    },
    {
      label: "Sync tasks to Linear",
      prompt: "Preview syncing this project's tasks to Linear, then let me confirm.",
    },
    {
      label: "Catch me up on this week",
      prompt: "Give me a digest of meetings from the past 7 days — themes and follow-ups.",
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header: project focus + clear */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, md: 5 },
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
        }}
      >
        <FolderIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary">
          Focus:
        </Typography>
        {lockedProjectId ? (
          <Chip
            label={focusedProject?.title ?? "Project"}
            size="small"
            color="primary"
            sx={{ fontSize: "0.7rem", height: 22 }}
          />
        ) : (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedProjectId}
              displayEmpty
              onChange={(e) => {
                const val = e.target.value;
                setSelectedProjectId(val);
                if (typeof window !== "undefined") {
                  if (val) localStorage.setItem(LS_PROJECT_KEY, val);
                  else localStorage.removeItem(LS_PROJECT_KEY);
                }
              }}
              renderValue={(v) => {
                if (!v) return <em style={{ opacity: 0.6 }}>All projects</em>;
                return projects.find((p) => p.id === v)?.title || v;
              }}
              sx={{ fontSize: "0.85rem", height: 32, borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>All projects (workspace-wide)</em>
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          label="New chat (beta)"
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.65rem", height: 20 }}
        />
        {messages.length > 0 && (
          <Button
            size="small"
            startIcon={<RestartIcon fontSize="small" />}
            onClick={clearChat}
            sx={{ fontSize: "0.7rem", textTransform: "none", color: "text.secondary" }}
          >
            Clear chat
          </Button>
        )}
      </Box>

      {/* Messages (drag-drop target) */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        {...dragProps}
        sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, md: 5 }, position: "relative" }}
      >
        {isDraggingOver && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(67,97,238,0.12)",
              border: 2,
              borderStyle: "dashed",
              borderColor: "primary.main",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            <Typography variant="h6" color="primary">
              Drop files to attach
            </Typography>
          </Box>
        )}
        {messages.length === 0 ? (
          showWelcome ? (
            <ChatEmptyState
              title={
                focusedProject
                  ? `Ask me about ${focusedProject.title}`
                  : "How can I help you today?"
              }
              subtitle="I can search your meetings, answer questions, and take actions like syncing tasks to Linear — with your confirmation."
              suggestions={suggestions}
              onSelect={handleSend}
            />
          ) : null
        ) : (
          <Box sx={{ maxWidth: "xl", mx: "auto", width: "100%" }}>
            {messages.map((m, idx) => {
              const isLast = idx === messages.length - 1;
              const isInflight = isStreaming && isLast && m.role === "assistant";
              const isUser = m.role === "user";
              const files = fileAttachments(m);
              return (
                <Box
                  key={m.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    mb: 2,
                  }}
                >
                  {files.length > 0 && <AttachmentMessageStrip attachments={files} />}
                  <Box
                    sx={{
                      maxWidth: "85%",
                      px: isUser ? 2 : 0,
                      py: isUser ? 1 : 0,
                      borderRadius: 2,
                      bgcolor: isUser ? "primary.main" : "transparent",
                      color: isUser ? "primary.contrastText" : "text.primary",
                    }}
                  >
                    {isUser ? (
                      <MarkdownRenderer content={userText(m)} />
                    ) : (
                      <AssistantPartsRenderer parts={m.parts} isStreaming={isInflight} />
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <input
        ref={attachments.fileInputRef}
        type="file"
        multiple
        hidden
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf,text/csv,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json"
        onChange={(e) => void attachments.upload(e.target.files)}
      />

      {attachments.error && (
        <Box sx={{ px: 3, pb: 1 }}>
          <Alert
            severity="error"
            onClose={() => attachments.setError(null)}
            sx={{ fontSize: "0.85rem" }}
          >
            {attachments.error}
          </Alert>
        </Box>
      )}

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => handleSend(input)}
        disabled={isStreaming || attachments.isUploading}
        sendDisabled={!input.trim() && attachments.pending.length === 0}
        maxContentWidth="xl"
        placeholder={
          focusedProject ? `Ask anything about ${focusedProject.title}...` : "Ask me anything..."
        }
        topSlot={
          <AttachmentPreviewStrip
            attachments={attachments.pending}
            onRemove={attachments.removeAt}
            isUploading={attachments.isUploading}
          />
        }
        leftSlot={
          <Tooltip title="Attach image, PDF, or doc">
            <span>
              <IconButton
                size="small"
                onClick={attachments.openFilePicker}
                disabled={isStreaming || attachments.isUploading}
                sx={{ ml: 0.5 }}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        }
      />
    </Box>
  );
};

export default AssistantChatPanelV2;
