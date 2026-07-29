import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Button,
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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { setChatHomeMessages } from "../../store/slices/chatHome/chatHomeSlice";
import { useListProjectsQuery } from "../../store/apis/projectApi";
import ChatBubble from "./shared/ChatBubble";
import ChatInput from "./shared/ChatInput";
import ChatEmptyState, { ChatSuggestion } from "./shared/ChatEmptyState";
import { useChatAutoScroll } from "./shared/useChatAutoScroll";
import { useAssistantStream, AssistantUIMessage } from "./shared/useAssistantStream";
import { useChatAttachments } from "./shared/useChatAttachments";
import AttachmentPreviewStrip from "./shared/AttachmentPreviewStrip";
import AttachmentMessageStrip from "./shared/AttachmentMessageStrip";
import AssistantChatPanelV2 from "./AssistantChatPanelV2";

interface AssistantChatPanelProps {
  /**
   * When set, the panel hides its project selector and forces every request
   * to be scoped to this project. Used by the Project Detail page's
   * "Assistant" tab so the focus is implicit.
   */
  lockedProjectId?: string;
  /**
   * Storage key for persisting messages between mounts:
   * - "redux:chatHome" → Redux chatHome slice (used by /home)
   * - "local:<key>"    → localStorage under that key (used per-project)
   */
  storageKey?: string;
  /** Custom suggestions for the empty state. Defaults to sensible per-context picks. */
  suggestions?: ChatSuggestion[];
  /** Show the welcome screen on empty. Default true. */
  showWelcome?: boolean;
}

const LS_PROJECT_KEY = "chathome_project_id";

/**
 * The reusable assistant chat surface.
 *
 * Composition only — all behavior lives in shared primitives:
 *   - useAssistantStream:   messages state + streaming network
 *   - useChatAutoScroll:    pin-to-bottom scrolling
 *   - <ChatBubble />:       a single message
 *   - <ChatInput />:        textfield + send
 *   - <ChatEmptyState />:   welcome + suggestion cards
 *
 * The remaining concerns are surface-specific: project focus selector +
 * persistence target (Redux vs localStorage per project).
 */
const AssistantChatPanelLegacy: React.FC<AssistantChatPanelProps> = ({
  lockedProjectId,
  storageKey = "redux:chatHome",
  suggestions: suggestionsOverride,
  showWelcome = true,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const reduxChatHomeMessages = useSelector((state: RootState) => state.chatHome.messages);

  // ── Persistence target (Redux for /home, localStorage per-project) ──────
  const usesRedux = storageKey === "redux:chatHome";

  const readPersisted = useCallback((): AssistantUIMessage[] => {
    if (usesRedux) return reduxChatHomeMessages || [];
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as AssistantUIMessage[]) : [];
    } catch {
      return [];
    }
  }, [usesRedux, reduxChatHomeMessages, storageKey]);

  const writePersisted = useCallback(
    (next: AssistantUIMessage[]) => {
      if (usesRedux) {
        dispatch(setChatHomeMessages(next));
        return;
      }
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
    },
    [usesRedux, dispatch, storageKey],
  );

  // ── Project focus state (hidden when locked) ────────────────────────────
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (lockedProjectId) return lockedProjectId;
    if (typeof window === "undefined") return "";
    return localStorage.getItem(LS_PROJECT_KEY) || "";
  });
  const { data: projectsResponse } = useListProjectsQuery(undefined);
  const projects = useMemo(() => projectsResponse?.data?.projects ?? [], [projectsResponse]);
  const effectiveProjectId = lockedProjectId ?? selectedProjectId;
  const focusedProject = projects.find((p) => p.id === effectiveProjectId);

  // ── Chat state + streaming (extracted hook) ─────────────────────────────
  const initialMessages = useMemo(() => readPersisted(), [readPersisted]);
  const { messages, isStreaming, send, clear, setMessages } = useAssistantStream({
    projectId: effectiveProjectId,
    onMessagesChange: writePersisted,
    initialMessages,
  });

  // Hydrate ONCE — useAssistantStream's initialMessages is captured at hook
  // create time, so we re-sync if persistence delivers messages later
  // (e.g. Redux rehydration finishing after first render).
  const didHydrate = useRef(false);
  useEffect(() => {
    if (didHydrate.current) return;
    if (messages.length === 0 && initialMessages.length > 0) {
      setMessages(() => initialMessages);
    }
    didHydrate.current = true;
  }, [initialMessages, messages.length, setMessages]);

  // ── Auto-scroll behavior (extracted hook) ───────────────────────────────
  const { scrollRef, handleScroll } = useChatAutoScroll([messages], isStreaming);

  // ── Input state ─────────────────────────────────────────────────────────
  const [input, setInput] = useState("");

  // ── Attachments (images, PDFs, docs) ────────────────────────────────────
  const attachments = useChatAttachments({
    uploadEndpoint: "/api/chat/attachments",
  });
  const { isDraggingOver, dragProps } = attachments.useDragDrop();

  const handleSend = useCallback(
    (text: string) => {
      send(text, attachments.pending);
      attachments.clear();
      setInput("");
    },
    [send, attachments],
  );

  // ── Default suggestions ─────────────────────────────────────────────────
  const defaultSuggestions: ChatSuggestion[] = focusedProject
    ? [
        {
          label: `Catch me up on ${focusedProject.title}`,
          prompt: `Give me a digest of the latest 5 meetings in "${focusedProject.title}" — themes, sentiment, and any open action items.`,
        },
        {
          label: "What's pending from meetings?",
          prompt: "List the open action items extracted from this project's recent meetings.",
        },
        {
          label: "Compare the last two meetings",
          prompt: "Find my two most recent meetings in this project and compare them side by side.",
        },
        {
          label: "Themes this month",
          prompt:
            "What are the main themes and pain points across this project's meetings this month?",
        },
      ]
    : [
        {
          label: "Catch me up on this week",
          prompt:
            "Give me a digest of meetings from the past 7 days — themes, sentiment, and follow-ups.",
        },
        {
          label: "How many meetings this month?",
          prompt:
            "Give me meeting stats for this month: count, total hours, and sentiment breakdown.",
        },
        {
          label: "Pending action items from meetings",
          prompt: "List all open action items from my recordings across the workspace.",
        },
        {
          label: "Find a meeting by topic",
          prompt: "Search my recordings for the meeting where we discussed pricing.",
        },
      ];

  const suggestions = suggestionsOverride ?? defaultSuggestions;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Header: focus selector + clear */}
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
          <>
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
                  const p = projects.find((p) => p.id === v);
                  return p?.title || v;
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
            {selectedProjectId && (
              <Chip
                label={`AI scoped to ${focusedProject?.title}`}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={() => {
                  setSelectedProjectId("");
                  if (typeof window !== "undefined") {
                    localStorage.removeItem(LS_PROJECT_KEY);
                  }
                }}
                sx={{ fontSize: "0.7rem", height: 22 }}
              />
            )}
          </>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {messages.length > 0 && (
          <Button
            size="small"
            startIcon={<RestartIcon fontSize="small" />}
            onClick={clear}
            sx={{ fontSize: "0.7rem", textTransform: "none", color: "text.secondary" }}
          >
            Clear chat
          </Button>
        )}
      </Box>

      {/* Messages (drag-drop target — drop a file anywhere on this area) */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        {...dragProps}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: { xs: 2, md: 5 },
          position: "relative",
        }}
      >
        {/* Drop overlay */}
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
              subtitle={
                focusedProject
                  ? "I have access to this project's tasks, recordings, documents, slides, and diagrams."
                  : "I can search your recordings, summarize docs, walk through your slides, and more."
              }
              suggestions={suggestions}
              onSelect={handleSend}
            />
          ) : null
        ) : (
          // Centered column capped to "xl" (~1536px) so messages don't stretch
          // on ultrawide monitors but fill the space generously on normal
          // screens. Bubbles take up to 85% inside the column.
          <Box sx={{ maxWidth: "xl", mx: "auto", width: "100%" }}>
            {messages.map((m, idx) => {
              // The last assistant message is the one currently streaming.
              const isLast = idx === messages.length - 1;
              const isInflight = isStreaming && isLast && m.role === "assistant";
              return (
                <ChatBubble
                  key={m.id}
                  message={m}
                  isStreaming={isInflight}
                  onSendMessage={handleSend}
                  maxWidth="85%"
                  header={
                    m.attachments && m.attachments.length > 0 ? (
                      <AttachmentMessageStrip attachments={m.attachments} />
                    ) : undefined
                  }
                />
              );
            })}
          </Box>
        )}
      </Box>

      {/* Hidden file input — attach button below opens it */}
      <input
        ref={attachments.fileInputRef}
        type="file"
        multiple
        hidden
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf,text/csv,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json"
        onChange={(e) => void attachments.upload(e.target.files)}
      />

      {/* Inline upload error */}
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

      {/* Input — same xl cap as the message column so they feel aligned */}
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

/**
 * Dispatcher: routes to the new AI-SDK `useChat` surface (reasoning panel +
 * tool confirmation cards) when `localStorage.assistant_chat_v2 = "1"`, else the
 * legacy panel. A hook-free wrapper so each branch keeps a consistent hook order.
 * The flag lets the migration be verified before it becomes the default; the
 * legacy panel still owns attachments + persistence until then.
 */
const AssistantChatPanel: React.FC<AssistantChatPanelProps> = (props) => {
  const useV2 = typeof window !== "undefined" && localStorage.getItem("assistant_chat_v2") === "1";
  if (useV2) {
    return (
      <AssistantChatPanelV2
        lockedProjectId={props.lockedProjectId}
        suggestions={props.suggestions}
        showWelcome={props.showWelcome}
        storageKey={props.storageKey}
      />
    );
  }
  return <AssistantChatPanelLegacy {...props} />;
};

export default AssistantChatPanel;
