import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  TextField,
  Autocomplete,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Mic as MicIcon,
  DesktopWindows as DesktopIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  BugReport as BugIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Transcript, Project } from "../services/planAiApi";
import type { DesktopSource } from "../types/electron";
import { AudioLevelMonitor } from "../components/AudioLevelMonitor";
import {
  saveConfig,
  loadConfig,
  saveLanguagePreference,
  loadLanguagePreference,
  type RecordingConfig,
} from "../utils/recorderConfig";
import {
  loadUnsavedTranscript,
  clearUnsavedTranscript,
  type UnsavedTranscript,
} from "../utils/unsavedTranscript";
import { DEEPGRAM_LANGUAGES, AUTO_LANGUAGE_OPTION } from "../utils/deepgramLanguages";
import { PrivacyConsentDialog } from "../components/PrivacyConsentDialog";
import WorkspaceSwitcher from "../components/WorkspaceSwitcher";

const Home: React.FC = () => {
  const { user, dbUser, token, signOut, api, activeWorkspaceId } = useAuth();
  const navigate = useNavigate();

  // Check role injected by backend via AuthProvider
  const isAdmin = dbUser?.role === "ADMIN";

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [desktopSources, setDesktopSources] = useState<DesktopSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [systemSourceId, setSystemSourceId] = useState<string | null>(null);
  const [hasScreenPermission, setHasScreenPermission] = useState(true);
  const [hasMicPermission, setHasMicPermission] = useState(true);

  // "" = auto-detect. Restored from the persisted choice: Home remounts after
  // every meeting, and a bare useState("") silently reverted the user's pick to
  // auto-detect, then overwrote the saved config with it on the next Start.
  const [language, setLanguage] = useState<string>(
    () => loadLanguagePreference() ?? loadConfig()?.language ?? "",
  );
  const [micInputs, setMicInputs] = useState<MediaDeviceInfo[]>([]);
  const [micDeviceId, setMicDeviceId] = useState<string>(() => {
    const saved = localStorage.getItem("planai_mic_device_id");
    // Treat "default" as no-preference — the macOS "Default" alias device
    // gets hijacked by Zoom/Teams, so we need the auto-selection to find real hardware
    return saved && saved !== "default" ? saved : "default";
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    // Apple App Store Privacy Consent Requirement Check
    const hasConsented = localStorage.getItem("planai_privacy_consent_v1");
    if (!hasConsented) {
      setConsentOpen(true);
    }
  }, []);

  const handleAcceptConsent = () => {
    localStorage.setItem("planai_privacy_consent_v1", "true");
    setConsentOpen(false);
  };

  const handleDeclineConsent = async () => {
    // Forcefully stop user from using internal app without consenting to privacy policy
    await signOut();
  };

  console.log(
    "[Home] Rendering component. sources:",
    desktopSources.length,
    "systemSourceId:",
    systemSourceId,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Project filter for the recordings LIST. Separate from `selectedProjectId`
  // below, which picks the project a NEW recording will be filed under —
  // conflating the two would silently change where the next meeting lands.
  const [listProjectFilter, setListProjectFilter] = useState<string>("");
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const list = await api.listTranscripts(debouncedSearch, listProjectFilter || undefined);
      setTranscripts(list);
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "Failed to load recordings.",
        );
      } else {
        console.warn("[Home] Silent fetch failed", err);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, activeWorkspaceId, debouncedSearch, listProjectFilter, api]);

  const loadProjects = useCallback(() => {
    if (!api) return;
    api.listProjects().then(setProjects).catch(console.error);
  }, [api]);

  // ── Crash recovery: meeting transcript that never reached the backend ──
  // Written continuously while recording (see Recording.tsx); only cleared
  // after a confirmed save. If it survives to the next launch, the meeting
  // was lost mid-flow (app closed at the config screen, crash, failed upload)
  // and we offer to save it as a text-only recording.
  const [unsavedMeeting, setUnsavedMeeting] = useState<UnsavedTranscript | null>(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const pending = loadUnsavedTranscript();
    // Ignore trivial fragments — a couple of words isn't a lost meeting.
    if (pending && pending.content.trim().length > 40) {
      setUnsavedMeeting(pending);
    }
  }, []);

  const handleRecoverMeeting = useCallback(async () => {
    if (!unsavedMeeting || !api) return;
    setRecovering(true);
    try {
      const recordedAt = unsavedMeeting.savedAt
        ? new Date(unsavedMeeting.savedAt).toISOString()
        : new Date().toISOString();
      await api.saveRecording({
        content: unsavedMeeting.content,
        title: `Recovered Meeting (${new Date(unsavedMeeting.savedAt || Date.now()).toLocaleString()})`,
        recordedAt,
        // Text-only: the audio blobs died with the crashed session.
        // skipAi left off so the normal pipeline still generates tasks/summary.
      });
      clearUnsavedTranscript();
      setUnsavedMeeting(null);
      void fetchData(true);
    } catch (err) {
      console.error("[Home] Failed to recover unsaved meeting", err);
      setError(err instanceof Error ? err.message : "Failed to recover the unsaved meeting.");
    } finally {
      setRecovering(false);
    }
  }, [unsavedMeeting, api, fetchData]);

  const handleDiscardMeeting = useCallback(() => {
    clearUnsavedTranscript();
    setUnsavedMeeting(null);
  }, []);

  useEffect(() => {
    void fetchData(false);
    loadProjects();
  }, [fetchData, loadProjects]);

  // Refetch projects when the recorder window regains focus, so deletions /
  // additions performed on the web app show up immediately.
  useEffect(() => {
    const handleFocus = () => {
      loadProjects();
      void fetchData(true);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadProjects, fetchData]);

  // Poll for updates if any transcript is still being processed.
  // Relies solely on `processingStatus` — never on the title text, which
  // can legitimately contain "Generating" even after processing completes.
  useEffect(() => {
    const hasPending = transcripts.some((t) => {
      const status = t.metadata?.processingStatus;
      return (
        status === "PENDING" ||
        status === "PROCESSING" ||
        status === "EXTRACTING_TASKS" ||
        status === "REFINING_TASKS"
      );
    });

    if (hasPending) {
      console.log("[Home] Pending transcripts found. Polling every 5s...");
      const intervalId = setInterval(() => {
        void fetchData(true);
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [transcripts, fetchData]);

  // Enumerate microphone input devices
  useEffect(() => {
    const loadMicDevices = async () => {
      try {
        // Need to request permission first so labels are available
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === "audioinput");
        setMicInputs(inputs);

        // Diagnostic: log all available mic devices
        console.log(`[Home] 🎤 Found ${inputs.length} mic input(s):`, inputs.map((d, i) => `[${i}] "${d.label}" (${d.deviceId.slice(0, 12)}…)`));

        // Respect saved preference if the device is still connected
        const saved = localStorage.getItem("planai_mic_device_id");
        if (saved && saved !== "default" && inputs.some((d) => d.deviceId === saved)) {
          console.log(`[Home] Using saved mic preference: "${inputs.find(d => d.deviceId === saved)?.label}"`);
          setMicDeviceId(saved);
          return; // User's previous choice is still valid
        }

        // Auto-select the ACTUAL hardware mic, not the macOS "Default -" alias.
        // The "Default -" device is a macOS abstraction that gets hijacked when
        // Zoom, Teams, or Granola are running, causing silent/broken audio.
        const realInputs = inputs.filter(
          (d) => !d.label.startsWith("Default") && !d.label.toLowerCase().includes("virtual"),
        );

        // Prefer MacBook's own mic (most reliable, always physically present)
        const macbookMic = realInputs.find((d) =>
          d.label.toLowerCase().includes("macbook"),
        );
        // Fallback: any other non-default built-in mic
        const builtinMic = realInputs.find((d) =>
          d.label.toLowerCase().includes("built-in"),
        );

        const bestMic = macbookMic || builtinMic || realInputs[0];
        if (bestMic) {
          console.log(`[Home] Auto-selected mic: "${bestMic.label}" (skipped ${inputs.length - realInputs.length} alias/virtual devices)`);
          setMicDeviceId(bestMic.deviceId);
          localStorage.setItem("planai_mic_device_id", bestMic.deviceId);
        }
      } catch (err) {
        console.warn("[Home] Failed to enumerate mic devices:", err);
      }
    };
    void loadMicDevices();
  }, []);

  const handleEditStart = (e: React.MouseEvent, t: Transcript) => {
    e.stopPropagation();
    setEditingId(t.id);
    setEditTitle(t.title || "Untitled Recording");
  };

  const handleEditCancel = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const handleEditSave = async (e: React.SyntheticEvent, id: string) => {
    e.stopPropagation();
    if (!editTitle.trim() || !api) return;

    try {
      setSavingId(id);
      await api.updateTranscript(id, { title: editTitle.trim() });
      setTranscripts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: editTitle.trim() } : t)),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update title:", err);
      // Optional: show error toast here
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteTranscript = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this recording?"))
      return;
    try {
      await api.deleteTranscript(id);
      void fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transcript",
      );
    }
  };

  const fetchDesktopSources = useCallback(async () => {
    try {
      const screenPerms =
        await window.electron.checkScreenRecordingPermission?.();
      setHasScreenPermission(screenPerms ?? true);

      const micPerms = await window.electron.checkMicrophonePermission?.();
      setHasMicPermission(micPerms ?? true);

      if (window.electron.platform !== "darwin" || screenPerms) {
        const sources = await window.electron.getDesktopSources();
        if (sources && sources.length > 0) {
          setDesktopSources(sources);
          // Immediate auto-select primary screen if nothing picked
          if (!systemSourceId) {
            const primary = sources.find((s) => s.id.startsWith("screen:"));
            if (primary) {
              console.log(
                "[Home] Automatically defaulted to primary screen audio:",
                primary.name,
              );
              setSystemSourceId(primary.id);
            }
          }
        }
      } else {
        console.warn(
          "[Home] Screen permissions missing, skipping desktop capturer mapping.",
        );
        setDesktopSources([]);
      }
    } catch (err) {
      console.error("[Home] Failed to fetch desktop sources:", err);
      // Give the user visibility on exactly why system sources failed to load
      alert(
        `System Audio Init Error: ${err instanceof Error ? err.message : String(err)}`,
      );
      setDesktopSources([]);
    }
  }, [systemSourceId]);

  useEffect(() => {
    void fetchDesktopSources();

    const handleFocus = () => {
      console.log(
        "[Home] Window focused, re-checking permissions and sources...",
      );
      void fetchDesktopSources();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchDesktopSources]);

  useEffect(() => {
    console.log("[Home] desktopSources state:", desktopSources.length);
  }, [desktopSources]);

  useEffect(() => {
    console.log("[Home] systemSourceId state:", systemSourceId);
  }, [systemSourceId]);

  const handleStartRecording = () => {
    // Echo cancellation is ON automatically; it only turns off if the user
    // flipped it to headphones mode in a prior recording (persisted choice).
    // The live override lives on the Recording screen now, not here.
    const speakerMode = localStorage.getItem("planai_speaker_mode") !== "false";
    const config: RecordingConfig = {
      systemSourceId,
      language,
      micDeviceId,
      speakerMode,
      projectIds: selectedProjectId ? [selectedProjectId] : undefined,
    };
    saveConfig(config);
    // Re-assert the language on Start, so the preference repairs itself if it
    // was only recovered from the session config (sign-out clears localStorage
    // but not sessionStorage) rather than read back from its own key.
    saveLanguagePreference(language);
    navigate(`/recording`);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <PrivacyConsentDialog
        open={consentOpen}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
      />

      {/* Drag region / title bar */}
      <Box
        sx={{
          height: 28,
          WebkitAppRegion: "drag",
          bgcolor: "background.default",
          flexShrink: 0,
        }}
      />

      {unsavedMeeting && (
        <Alert
          severity="warning"
          sx={{ borderRadius: 0, flexShrink: 0 }}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                disabled={recovering}
                onClick={() => void handleRecoverMeeting()}
              >
                {recovering ? "Recovering…" : "Recover"}
              </Button>
              <Button
                color="inherit"
                size="small"
                disabled={recovering}
                onClick={handleDiscardMeeting}
              >
                Discard
              </Button>
            </Stack>
          }
        >
          A meeting from{" "}
          {unsavedMeeting.savedAt
            ? new Date(unsavedMeeting.savedAt).toLocaleString()
            : "a previous session"}{" "}
          was never saved. Recover it as a text-only recording?
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* ── LEFT: Transcripts list ────────────────────────────── */}
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <WorkspaceSwitcher />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.5 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                color: "text.secondary",
                textTransform: "uppercase",
              }}
            >
              Recent Recordings
            </Typography>
            <Tooltip title="Refresh recordings">
              <IconButton size="small" onClick={() => void fetchData()}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Box sx={{ px: 2, pb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                sx: { fontSize: "0.875rem", borderRadius: 2 },
              }}
            />
            <Tooltip
              title={
                listProjectFilter
                  ? `Filtered: ${projects.find((p) => p.id === listProjectFilter)?.title ?? "project"}`
                  : "Filter by project"
              }
            >
              <IconButton
                size="small"
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                sx={{
                  border: "1px solid",
                  borderColor: listProjectFilter ? "primary.main" : "divider",
                  borderRadius: 2,
                  color: listProjectFilter ? "primary.main" : "text.secondary",
                }}
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={() => setFilterMenuAnchor(null)}
              slotProps={{ paper: { sx: { maxHeight: 320, minWidth: 220 } } }}
            >
              <MenuItem
                selected={!listProjectFilter}
                onClick={() => {
                  setListProjectFilter("");
                  setFilterMenuAnchor(null);
                }}
              >
                All projects
              </MenuItem>
              <Divider />
              {projects.map((p) => (
                <MenuItem
                  key={p.id}
                  selected={listProjectFilter === p.id}
                  onClick={() => {
                    setListProjectFilter(p.id);
                    setFilterMenuAnchor(null);
                  }}
                >
                  {p.title}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Divider sx={{ opacity: 0.4 }} />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error" sx={{ fontSize: "0.75rem" }}>
                {error}
              </Alert>
            </Box>
          ) : transcripts.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ p: 2, textAlign: "center" }}
            >
              No recordings yet.
            </Typography>
          ) : (
            <List
              dense
              disablePadding
              sx={{
                overflowY: "auto",
                flex: 1,
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "rgba(255,255,255,0.1)",
                  borderRadius: 3,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                },
              }}
            >
              {transcripts.map((t) => (
                <ListItemButton
                  key={t.id}
                  onClick={() => {
                    if (editingId !== t.id) navigate(`/transcript/${t.id}`);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                  }}
                >
                  {editingId === t.id ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        flex: 1,
                        mr: 1,
                        gap: 0.5,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TextField
                        size="small"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            void handleEditSave(e, t.id);
                          if (e.key === "Escape") handleEditCancel(e);
                        }}
                        sx={{ flex: 1 }}
                        InputProps={{
                          sx: { fontSize: "0.875rem", py: 0 },
                        }}
                      />
                      <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => void handleEditSave(e, t.id)}
                        disabled={savingId === t.id}
                      >
                        {savingId === t.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <CheckIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        color="default"
                        onClick={handleEditCancel}
                        disabled={savingId === t.id}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                              {t.title || "Untitled Recording"}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {"project" in t && t.project?.title && (
                                <Typography variant="caption" sx={{ border: '1px solid rgba(147, 197, 253, 0.5)', px: 0.5, py: 0.2, borderRadius: 1, fontSize: '0.65rem', color: "#93c5fd", bgcolor: "rgba(147, 197, 253, 0.1)" }}>
                                  📁 {t.project.title}
                                </Typography>
                              )}
                              {t.durationSeconds && (
                                <Typography variant="caption" sx={{ border: '1px solid rgba(255,255,255,0.2)', px: 0.5, py: 0.2, borderRadius: 1, fontSize: '0.65rem', color: "text.secondary" }}>
                                  ⏱️ {Math.floor(t.durationSeconds / 60)}m {t.durationSeconds % 60}s
                                </Typography>
                              )}
                              {t.speakerCount ? (
                                <Typography variant="caption" sx={{ border: '1px solid rgba(255,255,255,0.2)', px: 0.5, py: 0.2, borderRadius: 1, fontSize: '0.65rem', color: "text.secondary" }}>
                                  🎙️ {t.speakerCount}
                                </Typography>
                              ) : null}
                              {t.sentiment && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
                                    Sentiment:
                                  </Typography>
                                  <Typography variant="caption" sx={{ border: `1px solid ${t.sentiment === 'POSITIVE' ? '#4ade80' : t.sentiment === 'NEGATIVE' ? '#f87171' : '#fbbf24'}`, px: 0.5, py: 0.2, borderRadius: 1, fontSize: '0.65rem', color: t.sentiment === 'POSITIVE' ? '#4ade80' : t.sentiment === 'NEGATIVE' ? '#f87171' : '#fbbf24' }}>
                                    {t.sentiment}
                                  </Typography>
                                </Box>
                              )}
                              {/* Live processing indicator — covers all four
                                  in-flight states. Two-pass extraction means
                                  the user sees "Generating tickets…" first
                                  (Pass 1), then "✨ Enhancing with code…"
                                  during Pass 2 background enrichment. */}
                              {(() => {
                                const status = t.metadata?.processingStatus;
                                if (
                                  status !== "PENDING" &&
                                  status !== "PROCESSING" &&
                                  status !== "EXTRACTING_TASKS" &&
                                  status !== "REFINING_TASKS"
                                )
                                  return null;
                                const label =
                                  status === "REFINING_TASKS"
                                    ? "✨ Enhancing with code…"
                                    : status === "EXTRACTING_TASKS"
                                      ? "Generating tickets…"
                                      : "Processing…";
                                const isRefining = status === "REFINING_TASKS";
                                return (
                                  <Tooltip
                                    title={
                                      isRefining
                                        ? "Tickets are usable now — Plan AI is enriching them with file + symbol references from your codebase in the background."
                                        : "AI is processing the recording. Tickets will appear here once ready."
                                    }
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        border: `1px solid ${isRefining ? "#a78bfa" : "#60a5fa"}`,
                                        bgcolor: isRefining
                                          ? "rgba(167, 139, 250, 0.1)"
                                          : "rgba(96, 165, 250, 0.1)",
                                        color: isRefining ? "#a78bfa" : "#60a5fa",
                                        px: 0.5,
                                        py: 0.2,
                                        borderRadius: 1,
                                      }}
                                    >
                                      <CircularProgress
                                        size={10}
                                        thickness={6}
                                        sx={{
                                          color: isRefining ? "#a78bfa" : "#60a5fa",
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ fontSize: "0.65rem", color: "inherit" }}
                                      >
                                        {label}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                );
                              })()}
              {(() => {
                                // Show the Retry affordance for both genuinely
                                // FAILED transcripts and "legacy" ones that
                                // were masked as completed before the backend
                                // started throwing on AI failure (they carry a
                                // fallback error title + 0 tasks). This makes
                                // pre-fix broken recordings recoverable without
                                // delete + re-record.
                                const status = t.metadata?.processingStatus;
                                const title = t.title || "";
                                const isErrorTitle =
                                  title.startsWith("Processing Error") ||
                                  title.startsWith("Failed Transcript") ||
                                  title.startsWith("Authentication Error");
                                if (status !== "FAILED" && !isErrorTitle) return null;
                                return (
                                <Tooltip title={t.metadata?.errorMessage || "Failed to process"}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ border: '1px solid #f87171', px: 0.5, py: 0.2, borderRadius: 1, fontSize: '0.65rem', color: '#f87171', bgcolor: 'rgba(248, 113, 113, 0.1)' }}>
                                      ⚠️ Failed
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        api.reprocessTranscript(t.id).then(() => fetchData()).catch((err) => setError(err instanceof Error ? err.message : "Failed to retry transcript."));
                                      }}
                                      sx={{ fontSize: "0.6rem", py: 0, minWidth: 0 }}
                                    >
                                      Retry
                                    </Button>
                                  </Box>
                                </Tooltip>
                                );
                              })()}
                              {t.metadata?.processingStatus !== "FAILED" && (() => {
                                const postMeetingTasks = t.metadata?.postMeetingTasks;
                                if (!postMeetingTasks) return null;
                                const failed = Object.entries(postMeetingTasks).filter(
                                  ([, v]) => v?.status === "FAILED",
                                );
                                if (failed.length === 0) return null;
                                const tooltip = failed
                                  .map(([k, v]) => `${k}: ${v?.error || "failed"}`)
                                  .join("\n");
                                return (
                                  <Tooltip title={<span style={{ whiteSpace: "pre-line" }}>{tooltip}</span>}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        border: '1px solid #fbbf24',
                                        px: 0.5,
                                        py: 0.2,
                                        borderRadius: 1,
                                        fontSize: '0.65rem',
                                        color: '#fbbf24',
                                        bgcolor: 'rgba(251, 191, 36, 0.1)',
                                      }}
                                    >
                                      ⚠️ {failed.length} sync failed
                                    </Typography>
                                  </Tooltip>
                                );
                              })()}
                            </Box>
                          </Box>
                        }
                        secondary={new Date(t.createdAt).toLocaleString()}
                        secondaryTypographyProps={{
                          fontSize: "0.7rem",
                          mt: 0.5,
                        }}
                      />
                      <IconButton
                        size="small"
                        color="default"
                        onClick={(e) => handleEditStart(e, t)}
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon
                          fontSize="small"
                          sx={{ fontSize: "1.1rem" }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => void handleDeleteTranscript(e, t.id)}
                      >
                        <DeleteIcon
                          fontSize="small"
                          sx={{ fontSize: "1.1rem" }}
                        />
                      </IconButton>
                    </>
                  )}
                </ListItemButton>
              ))}
            </List>
          )}

          <Divider sx={{ mt: "auto", opacity: 0.4 }} />

          <Box sx={{ px: 2, pt: 2, pb: 0 }}>
            <Button
              variant="outlined"
              fullWidth
              size="small"
              onClick={() => {
                const webUrl =
                  import.meta.env.VITE_PLAN_AI_WEB_URL ||
                  "https://plan-ai.blueberrybytes.com";
                void window.electron.openExternalUrl(webUrl);
              }}
              sx={{
                color: "text.secondary",
                borderColor: "rgba(255,255,255,0.1)",
                textTransform: "none",
                fontSize: "0.75rem",
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                },
              }}
            >
              Explore Web Features ↗
            </Button>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ px: 2, py: 1.5, minWidth: 0 }}
          >
            <Box
              onClick={() => navigate("/profile")}
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                gap: 1,
                cursor: "pointer",
                p: 0.5,
                borderRadius: 1,
                minWidth: 0,
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              <Avatar
                src={user?.photoURL || undefined}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "primary.dark",
                  fontSize: "0.7rem",
                  flexShrink: 0,
                }}
              >
                {!user?.photoURL && user?.email?.[0]?.toUpperCase()}
              </Avatar>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ flex: 1, minWidth: 0 }}
              >
                {user?.email}
              </Typography>
            </Box>
            {isAdmin && (
              <Tooltip title="Admin Debug">
                <IconButton
                  size="small"
                  onClick={() => navigate("/debug")}
                  sx={{ flexShrink: 0 }}
                >
                  <BugIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Sign out">
              <IconButton
                size="small"
                onClick={async () => {
                  if (window.electron?.clearAuthSession) {
                    try {
                      console.log(
                        "[Home Logout] Wiping Chromium Apple Cookies...",
                      );
                      await window.electron.clearAuthSession();
                    } catch (err) {
                      console.warn(
                        "[Home Logout] Failed to clear Electron auth session:",
                        err,
                      );
                    }
                  }
                  await signOut();
                }}
                sx={{ flexShrink: 0 }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* ── RIGHT: General Recording  ───────────────────────── */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            pt: 10,
            gap: 4,
          }}
        >
          {/* Global Permission Warnings */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 600,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mb: 2,
            }}
          >
            {!hasScreenPermission && window.electron.platform === "darwin" && (
              <Alert
                severity="error"
                variant="filled"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() =>
                      window.electron.openSystemPreferences?.("screen")
                    }
                  >
                    Open Settings
                  </Button>
                }
              >
                Screen Recording permission is required to capture system audio.
                Please enable it in macOS System Settings &rarr; Privacy &
                Security, then <strong>restart the app.</strong>
              </Alert>
            )}
            {!hasMicPermission && window.electron.platform === "darwin" && (
              <Alert
                severity="warning"
                variant="filled"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() =>
                      window.electron.openSystemPreferences?.("microphone")
                    }
                  >
                    Open Settings
                  </Button>
                }
              >
                Microphone permission is required to record your voice. Please
                enable it in macOS System Settings &rarr; Privacy & Security.
              </Alert>
            )}
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Start capturing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Record meetings or voice notes directly from your desktop.
            </Typography>
          </Box>

          {/* Recording Sources Configuration (Hidden, Auto-selected) */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 300,
              p: 2,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: "1px solid rgba(255,255,255,0.1)",
              mb: 4,
            }}
          >
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Active Audio Sources
            </Typography>

            {/* Live Audio Monitors (Mic & System) */}
            <AudioLevelMonitor
              systemSourceId={systemSourceId}
              micDeviceId={micDeviceId}
            />

            {/* Microphone Source Selector */}
            {micInputs.length > 1 && (
              <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                <InputLabel id="mic-source-label">
                  <MicIcon
                    sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }}
                  />
                  Microphone
                </InputLabel>
                <Select
                  labelId="mic-source-label"
                  value={micDeviceId}
                  label="Microphone"
                  onChange={(e) => {
                    setMicDeviceId(e.target.value);
                    localStorage.setItem("planai_mic_device_id", e.target.value);
                  }}
                  sx={{ fontSize: "0.8rem" }}
                >
                  {micInputs.map((d) => (
                    <MenuItem
                      key={d.deviceId}
                      value={d.deviceId}
                      sx={{ fontSize: "0.8rem" }}
                    >
                      {d.label || `Microphone (${d.deviceId.slice(0, 8)}…)`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Echo cancellation is now automatic at recording start (kills
                loudspeaker bleed at capture). The override for headphone users
                lives on the Recording screen, so the toggle was removed here. */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1, fontStyle: "italic", mb: 2 }}
            >
              * Automatically capturing Microphone and System Audio (Screen 1)
            </Typography>

            <Divider sx={{ mb: 2, opacity: 0.2 }} />

            <Autocomplete
              size="small"
              fullWidth
              options={[
                AUTO_LANGUAGE_OPTION,
                ...Object.entries(DEEPGRAM_LANGUAGES)
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([code, name]) => ({ code, name })),
              ]}
              getOptionLabel={(option) => option.name}
              value={
                language === ""
                  ? AUTO_LANGUAGE_OPTION
                  : {
                      code: language,
                      name: DEEPGRAM_LANGUAGES[language] || language,
                    }
              }
              onChange={(_, newValue) => {
                const code = newValue ? newValue.code : "";
                setLanguage(code);
                saveLanguagePreference(code);
              }}
              isOptionEqualToValue={(option, value) =>
                option.code === value.code
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Spoken Language"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                  }}
                />
              )}
            />

            <TextField
              select
              fullWidth
              size="small"
              sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.05)" }}
              label="Project (Optional)"
              value={selectedProjectId || "none"}
              onChange={(e) =>
                setSelectedProjectId(e.target.value === "none" ? "" : e.target.value)
              }
              InputProps={{
                sx: { fontSize: "0.8rem" },
              }}
            >
              <MenuItem value="none" sx={{ fontSize: "0.8rem" }}>
                <em>None (Use default keywords)</em>
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: "0.8rem" }}>
                  {p.title}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box
            sx={{
              width: "100%",
              maxWidth: 350,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<MicIcon />}
              onClick={handleStartRecording}
              fullWidth
              disabled={
                window.electron.platform === "darwin" &&
                (!hasScreenPermission || !hasMicPermission)
              }
              sx={{ py: 1.5, fontSize: "1rem", borderRadius: 2 }}
            >
              Start Recording
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
