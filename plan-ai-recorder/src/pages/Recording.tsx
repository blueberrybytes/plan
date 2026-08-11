import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Tab,
  Tabs,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Switch,
  Tooltip,
} from "@mui/material";
import {
  Stop as StopIcon,
  CheckCircle as DoneIcon,
  ArrowBack as BackIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  VolumeUp as SpeakerIcon,
  Headset as HeadsetIcon,
} from "@mui/icons-material";
import { IconButton, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AudioRecorder, type AecTelemetry } from "../services/audioRecorder";
import { loadConfig, saveConfig, saveLanguagePreference } from "../utils/recorderConfig";
import {
  persistUnsavedTranscript,
  clearUnsavedTranscript,
} from "../utils/unsavedTranscript";
import ReactMarkdown from "react-markdown";
import { DEEPGRAM_LANGUAGES, AUTO_LANGUAGE_OPTION } from "../utils/deepgramLanguages";
import type { Context, Project, AiModel, UserIntegrationSummary, TwentyCompanyItem } from "../services/planAiApi";

type Phase = "recording" | "context_selection" | "saving" | "done" | "error";

export interface TranscriptBlock {
  id: string;
  source: "mic" | "sys";
  text: string;
  /**
   * When the first segment of this bubble was SPOKEN (epoch ms). Deferred mic
   * commits (grace queue) insert at this position, so the transcript always
   * reads in true conversation order even when text consolidates late.
   */
  ts: number;
}

const LANGUAGE_OPTIONS = [
  AUTO_LANGUAGE_OPTION,
  ...Object.entries(DEEPGRAM_LANGUAGES)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([code, name]) => ({ code, name })),
];

const ChatMessageItem = ({
  msg,
}: {
  msg: { role: "user" | "assistant"; content: string };
}) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
        bgcolor:
          msg.role === "user" ? "primary.dark" : "rgba(255,255,255,0.05)",
        p: 1.5,
        pr: 5,
        borderRadius: 2,
        maxWidth: "85%",
        position: "relative",
        "&:hover .copy-btn": { opacity: 1 },
      }}
    >
      <Box
        sx={{
          typography: "body2",
          "& h3, & h4": {
            mt: 1,
            mb: 1,
            color: "text.primary",
            fontWeight: 600,
          },
          "& ul": { my: 0.5, pl: 2 },
          "& li": { mb: 0.5 },
          "& p": { my: 0 },
          color:
            msg.role === "user" ? "primary.contrastText" : "text.secondary",
        }}
      >
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </Box>

      <IconButton
        className="copy-btn"
        size="small"
        onClick={handleCopy}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          opacity: 0,
          transition: "opacity 0.2s",
          bgcolor: "background.paper",
          "&:hover": { bgcolor: "background.default" },
        }}
      >
        {copied ? (
          <CheckIcon fontSize="small" color="success" />
        ) : (
          <CopyIcon fontSize="small" />
        )}
      </IconButton>
    </Box>
  );
};

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = h > 0 ? [h, m, s] : [m, s];
  return parts.map((v) => String(v).padStart(2, "0")).join(":");
};

// Animated waveform bars
const Waveform: React.FC<{ active: boolean }> = ({ active }) => (
  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: 40 }}>
    {Array.from({ length: 20 }).map((_, i) => (
      <Box
        key={i}
        sx={{
          width: 3,
          borderRadius: 2,
          bgcolor: "primary.main",
          transition: "height 0.15s ease",
          height: active ? `${8 + Math.random() * 28}px` : "4px",
          animation: active
            ? `wave${i % 4} ${0.8 + (i % 3) * 0.2}s ease-in-out infinite alternate`
            : "none",
          opacity: active ? 0.9 : 0.3,
          "@keyframes wave0": {
            from: { height: "4px" },
            to: { height: "32px" },
          },
          "@keyframes wave1": {
            from: { height: "8px" },
            to: { height: "24px" },
          },
          "@keyframes wave2": {
            from: { height: "12px" },
            to: { height: "36px" },
          },
          "@keyframes wave3": {
            from: { height: "6px" },
            to: { height: "20px" },
          },
          animationDelay: `${i * 0.06}s`,
        }}
      />
    ))}
  </Stack>
);

// Crash recovery lives in ../utils/unsavedTranscript — written continuously
// while recording, cleared only after a confirmed save, recovered from Home.

// ── Acoustic-echo dedup ─────────────────────────────────────────────────────
// When the user is on a speaker (no headphones), the remote audio (Others)
// plays out loud and the mic recaptures it, so the SAME speech is transcribed
// twice: once on the system stream ("Others", correct) and once on the mic
// stream ("User", an echo). Browser AEC (now ON by default) removes most of that
// bleed at capture, but residual bleed — and AEC-off sessions (headphones mode
// toggled while actually on a speaker) — can still leak through. So this
// client-side text dedup is a backstop: we drop a mic segment when it closely
// matches a recent system segment.
const ECHO_WINDOW_MS = 6000; // echo arrives near-simultaneously with the system audio
const ECHO_MIN_WORDS = 4; // don't dedup tiny utterances ("ok", "sí") — too risky
const ECHO_SIMILARITY = 0.7; // overlap-coefficient threshold to treat as an echo

const normalizeForCompare = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

// Stopwords carry no identity. Matching on raw tokens let a LONG "Others"
// segment (macOS sys chunks merge into big finals) swallow any short genuine
// "Me" utterance made mostly of common words — the user's own speech vanished
// from the UI (field report 2026-06-11). Similarity is now computed on
// CONTENT words only.
const ECHO_STOPWORDS = new Set([
  // Spanish
  "el","la","los","las","un","una","unos","unas","de","del","al","a","en","y","o","u",
  "que","qué","no","sí","si","es","está","estás","esta","este","esto","con","por","para",
  "se","me","te","le","lo","mi","tu","su","nos","os","les","pero","como","cómo","más",
  "menos","muy","ya","hay","ha","he","has","han","ser","son","era","fue","yo","tú","él",
  "ella","eso","esa","ese","cuando","cuándo","donde","dónde","porque","pues","también",
  "bien","vale","ahora","luego","entonces","aquí","ahí","allí",
  // English
  "the","a","an","of","to","in","on","at","and","or","is","are","was","were","be","been",
  "it","its","this","that","these","those","i","you","he","she","we","they","my","your",
  "his","her","our","their","not","no","yes","do","does","did","have","has","had","but",
  "so","if","then","there","here","what","when","where","why","how","with","for","as",
  "by","about","just","like","okay","ok","right","well","now",
]);

const contentTokens = (normalized: string): Set<string> =>
  new Set(normalized.split(" ").filter((t) => t && !ECHO_STOPWORDS.has(t)));

/** Minimum CONTENT words on each side before an echo match is even possible. */
const ECHO_MIN_CONTENT_WORDS = 3;

/** Echo-pipeline debug logging — grep the console for [EchoDbg]. */
const echoDbg = (...args: unknown[]) => console.log("[EchoDbg]", ...args);

// ── Deferred mic-final commit ───────────────────────────────────────────────
// LOUD speaker bleed defeats the energy gate (indistinguishable from real
// speech by level), and on macOS its sys twin arrives 2–5s LATE, so checking
// "is this an echo?" at mic-final time always answers "no". Instead of ever
// deleting painted text (forbidden — product decision), we HOLD mic finals in
// a pending queue while the far side is active: the interim line stays visible
// (live feedback intact), and after the grace period we either commit the
// bubble or — if the late sys twin arrived and matches — never paint it.
const ECHO_PENDING_GRACE_MS = 6500; // covers observed macOS sys lag (2–5s) + margin
const FAR_SIDE_ACTIVE_MS = 8000; // any sys interim/final this recent ⇒ defer mic commits

interface EchoScore {
  score: number;
  micContent: number;
  sysContent: number;
  shared: string[];
  eligible: boolean;
}

/**
 * Overlap coefficient on CONTENT-word sets. Both sides must carry enough
 * content words — short/filler-only utterances never match (too risky).
 * Returns the full breakdown so the decision can be logged.
 */
const echoScore = (micNorm: string, sysNorm: string): EchoScore => {
  const mic = contentTokens(micNorm);
  const sys = contentTokens(sysNorm);
  const shared: string[] = [];
  mic.forEach((tok) => {
    if (sys.has(tok)) shared.push(tok);
  });
  const eligible = mic.size >= ECHO_MIN_CONTENT_WORDS && sys.size >= ECHO_MIN_CONTENT_WORDS;
  const score = eligible ? shared.length / Math.min(mic.size, sys.size) : 0;
  return { score, micContent: mic.size, sysContent: sys.size, shared, eligible };
};

const isEchoMatch = (micNorm: string, sysNorm: string): boolean =>
  echoScore(micNorm, sysNorm).score >= ECHO_SIMILARITY;

const Recording: React.FC = () => {
  const navigate = useNavigate();
  const { token, api } = useAuth();

  const config = loadConfig();

  const [phase, setPhase] = useState<Phase>("recording");
  const [isWsConnected, setIsWsConnected] = useState(true);
  const [isStopping, setIsStopping] = useState(false);
  const [isMicSpeaking, setIsMicSpeaking] = useState(false);
  const [isSysSpeaking, setIsSysSpeaking] = useState(false);
  const [language, setLanguage] = useState(config?.language || "");
  // Echo cancellation: ON automatically (undefined ⇒ on). The header toggle
  // lets a headphone user turn it off live without restarting the recording.
  const [speakerMode, setSpeakerMode] = useState(config?.speakerMode ?? true);
  const [elapsed, setElapsed] = useState(0);
  const [blocks, setBlocks] = useState<TranscriptBlock[]>([]);
  const [micDelta, setMicDelta] = useState("");
  const [sysDelta, setSysDelta] = useState("");
  const [chunkCount, setChunkCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [blobs, setBlobs] = useState<{ micBlob?: Blob; sysBlob?: Blob }>({});
  // Echo-canceller outcome from stop() — uploaded with the transcript so echoey
  // recordings can be diagnosed from their metadata instead of the console.
  const [aecTelemetry, setAecTelemetry] = useState<AecTelemetry | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    const config = loadConfig();
    if (config?.projectIds && config.projectIds.length > 0) return config.projectIds[0];
    return "";
  });

  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<string>(() => {
    const config = loadConfig();
    return config?.contextIds && config.contextIds.length > 0 ? config.contextIds[0] : "";
  });

  const [aiModels, setAiModels] = useState<AiModel[]>([]);
  const [modelKey, setModelKey] = useState<string>("");
  const [complexityLevel, setComplexityLevel] = useState<string>("");

  const [integrations, setIntegrations] = useState<UserIntegrationSummary[]>([]);

  // ── Twenty CRM destination ────────────────────────────────────────────────
  // The company is chosen PER RECORDING: one person meets several different
  // clients in a day, and most recordings don't even have a project yet (the
  // picker defaults to "Create new project for me"). The project's linked
  // company, when there is one, only pre-fills the field.
  const hasTwenty = integrations.some((i) => i.provider === "TWENTY" && i.status === "CONNECTED");
  const [twentyCompany, setTwentyCompany] = useState<TwentyCompanyItem | null>(null);
  const [twentyCompanies, setTwentyCompanies] = useState<TwentyCompanyItem[]>([]);
  const [twentyQuery, setTwentyQuery] = useState("");
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);

  // Pre-fill from the project's link (convenience for recurring clients).
  useEffect(() => {
    if (twentyCompany) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    const meta =
      (project?.metadata as { twentyCompanyId?: string; twentyCompanyName?: string } | null) ??
      null;
    if (meta?.twentyCompanyId) {
      setTwentyCompany({ id: meta.twentyCompanyId, name: meta.twentyCompanyName ?? "Linked company" });
    }
  }, [projects, selectedProjectId, twentyCompany]);

  // Debounced search — the CRM is a self-hosted instance, don't hammer it.
  useEffect(() => {
    if (!hasTwenty || twentyQuery.trim().length < 2) return;
    const handle = setTimeout(() => {
      setIsSearchingCompanies(true);
      api
        .searchTwentyCompanies(twentyQuery.trim())
        .then(setTwentyCompanies)
        .catch(() => setTwentyCompanies([]))
        .finally(() => setIsSearchingCompanies(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [twentyQuery, hasTwenty, api]);

  const [syncToJira, setSyncToJira] = useState<boolean>(false);
  const [syncToLinear, setSyncToLinear] = useState<boolean>(false);
  const [syncToTrello, setSyncToTrello] = useState<boolean>(false);
  const [syncToNotion, setSyncToNotion] = useState<boolean>(false);
  const [syncToAsana, setSyncToAsana] = useState<boolean>(false);
  const [syncToTwenty, setSyncToTwenty] = useState<boolean>(false);
  const [exportToGoogleDrive, setExportToGoogleDrive] = useState<boolean>(false);
  const [exportToOneDrive, setExportToOneDrive] = useState<boolean>(false);
  const [taskStrategy, setTaskStrategy] = useState<"AUTO" | "SINGLE_TICKET" | "SPECIFIC_COUNT">("AUTO");
  const [taskCount, setTaskCount] = useState<number>(5);

  const [createDoc, setCreateDoc] = useState<boolean>(true);
  const [createSlides, setCreateSlides] = useState<boolean>(false);

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const [liveSummary, setLiveSummary] = useState<string>("");
  const [liveSummaryLoading, setLiveSummaryLoading] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const previousTranscriptLength = useRef<number>(0);
  const summaryPollCounterRef = useRef<number>(0);
  const summaryPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Real wall-clock instant capture began — NOT derived from `elapsed` (which
  // only ticks once the timer interval starts and drifts under tab throttling).
  // Sent with the upload so the backend can tell whether two teammates'
  // recordings of the same meeting overlap; `recordedAt` alone is upload time,
  // useless for that comparison.
  const recordingStartedAtRef = useRef<Date | null>(null);
  const typescriptNullBoxRef_ignoreThis = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef<boolean>(false);
  const transcriptBoxRef = useRef<HTMLDivElement>(null);
  // Last built transcript text — kept so the error screen can offer Retry,
  // "save text only", and copy-to-clipboard without losing the recording.
  const lastPayloadRef = useRef<string>("");
  const [copied, setCopied] = useState(false);
  const [liveCopied, setLiveCopied] = useState(false);

  // Build a portable plaintext snapshot of the live transcript. In real time we
  // only know the audio *channel* each line came from (mic vs system audio), not
  // who the speaker is — individual names are only resolved after the recording
  // is processed on the backend. So lines are labelled "Me" (your mic) and
  // "Others" (meeting audio), the header says so, and timestamps are relative to
  // the recording start (derived from the elapsed counter).
  const buildLiveTranscriptText = useCallback((): string => {
    const startEpoch = Date.now() - elapsed * 1000;
    const stamp = (tsMs: number) =>
      formatTime(Math.max(0, Math.round((tsMs - startEpoch) / 1000)));

    const header = [
      `Live transcript — ${new Date(startEpoch).toLocaleString()}`,
      `Duration ${formatTime(elapsed)} · ${chunkCount} segment${chunkCount !== 1 ? "s" : ""}`,
      "Speakers are labelled by audio channel (Me = your microphone, Others = meeting audio); individual names are identified after the recording is processed.",
    ].join("\n");

    const body = blocks
      .map((b) => `[${stamp(b.ts)}] ${b.source === "mic" ? "Me" : "Others"}: ${b.text}`)
      .join("\n");

    const interim: string[] = [];
    if (micDelta.trim()) interim.push(`[${formatTime(elapsed)}] Me: ${micDelta.trim()}`);
    if (sysDelta.trim())
      interim.push(`[${formatTime(elapsed)}] Others: ${sysDelta.trim()}`);

    return [
      header,
      body,
      interim.length ? `— In progress —\n${interim.join("\n")}` : "",
    ]
      .filter((s) => s.trim().length > 0)
      .join("\n\n");
  }, [blocks, micDelta, sysDelta, elapsed, chunkCount]);

  const handleCopyLiveTranscript = useCallback(async () => {
    const text = buildLiveTranscriptText();
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setLiveCopied(true);
      setTimeout(() => setLiveCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [buildLiveTranscriptText]);

  // Recent finalized system ("Others") segments, used to detect mic echo.
  const recentSysSegmentsRef = useRef<{ text: string; ts: number }[]>([]);
  // Mic finals waiting out the grace period (far side active) before painting.
  const pendingMicRef = useRef<{ text: string; normalized: string; ts: number }[]>([]);
  // Last time ANY system audio activity (interim or final) was observed.
  const lastSysSeenRef = useRef(0);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const handleTranscriptScroll = () => {
    if (!transcriptBoxRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = transcriptBoxRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    userScrolledUp.current = distanceFromBottom > 50;
  };

  const handleSendChat = async () => {
    const msg = chatMessage.trim();
    if (!msg || !api) return;

    setChatMessage("");
    setChatHistory((p) => [...p, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const fullTranscript = blocks
        .map((b) => `${b.source === "mic" ? "User" : "Others"}: ${b.text}`)
        .join("\n");

      const combinedDelta =
        (micDelta ? `\nUser: ${micDelta}` : "") +
        (sysDelta ? `\nOthers: ${sysDelta}` : "");

      const { response } = await api.sendLiveChatMessage({
        content: msg,
        liveTranscript: fullTranscript + combinedDelta,
        contextIds: selectedContextId ? [selectedContextId] : undefined,
        projectIds: selectedProjectId ? [selectedProjectId] : undefined,
        history: chatHistory,
        modelKey: modelKey || undefined,
        complexityLevel: complexityLevel || undefined,
      });

      setChatHistory((p) => [...p, { role: "assistant", content: response }]);
    } catch (err) {
      setChatHistory((p) => [
        ...p,
        {
          role: "assistant",
          content: `❌ Error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        if (chatBoxRef.current) {
          chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  // Insert finalized text into the transcript at its CHRONOLOGICAL position
  // (by spoken-at timestamp), merging into an adjacent same-speaker bubble.
  // The ONLY place that paints final text. Deferred commits from the grace
  // queue land where they were actually said — never misordered at the end.
  const appendBlock = useCallback((source: "mic" | "sys", text: string, ts: number) => {
    setBlocks((prev) => {
      // Position: after every block spoken at or before `ts`.
      let idx = prev.length;
      while (idx > 0 && prev[idx - 1].ts > ts) idx--;
      if (idx > 0 && prev[idx - 1].source === source) {
        const updated = [...prev];
        updated[idx - 1] = { ...updated[idx - 1], text: `${updated[idx - 1].text} ${text}` };
        return updated;
      }
      const updated = [...prev];
      updated.splice(idx, 0, { id: Math.random().toString(), source, text, ts });
      return updated;
    });
  }, []);

  const handleTranscript = useCallback(
    (source: "mic" | "sys", text: string, isFinal: boolean) => {
      const cleanText = text.trim();
      const lowerText = cleanText.toLowerCase();

      // OpenAI Whisper loves to hallucinate these specific phrases when fed background noise
      if (
        !token ||
        !cleanText ||
        lowerText === "thank you." ||
        lowerText === "thank you" ||
        lowerText.includes("[silence]") ||
        lowerText.includes("(silence)") ||
        lowerText.includes("[music]")
      ) {
        return;
      }

      if (isFinal) {
        const normalized = normalizeForCompare(cleanText);
        const now = Date.now();
        echoDbg(`FINAL ${source} @${new Date(now).toISOString().slice(11, 23)} "${cleanText}"`);

        if (source === "sys") {
          lastSysSeenRef.current = now;
          // Remember recent system speech so we can spot its mic echo later.
          recentSysSegmentsRef.current.push({ text: normalized, ts: now });
          recentSysSegmentsRef.current = recentSysSegmentsRef.current.filter(
            (s) => now - s.ts <= ECHO_WINDOW_MS,
          );
          echoDbg(
            `  sys noted. contentWords=${contentTokens(normalized).size} window=[${recentSysSegmentsRef.current
              .map((s) => `${((now - s.ts) / 1000).toFixed(1)}s`)
              .join(", ")}]`,
          );

          // NOTE — deliberately NO retroactive cleanup here. We tried erasing
          // the already-painted "Me" copy when its late "Others" twin arrived
          // (macOS sys lags 2–5s), and it ate the user's REAL speech on fuzzy
          // matches. Product decision (2026-06-11): a duplicate line is
          // cosmetic, lost words are unrecoverable — the UI never deletes
          // text it has already shown. Bleed that slips through stays visible.
        } else if (source === "mic") {
          // Drop the mic segment if it's an OBVIOUS echo of sys audio we
          // already have (sys arrived first — the easy direction).
          const wordCount = normalized.split(" ").filter(Boolean).length;
          if (wordCount >= ECHO_MIN_WORDS) {
            let dropped = false;
            for (const s of recentSysSegmentsRef.current) {
              const age = now - s.ts;
              if (age > ECHO_WINDOW_MS) continue;
              const sc = echoScore(normalized, s.text);
              echoDbg(
                `  mic-vs-sys(age=${(age / 1000).toFixed(1)}s): score=${sc.score.toFixed(2)} ` +
                  `micContent=${sc.micContent} sysContent=${sc.sysContent} eligible=${sc.eligible} ` +
                  `shared=[${sc.shared.join(",")}] sys="${s.text.slice(0, 60)}"`,
              );
              if (sc.score >= ECHO_SIMILARITY) {
                dropped = true;
                break;
              }
            }
            if (dropped) {
              echoDbg(`  mic verdict: DROPPED (echo already on sys) words=${wordCount}`);
              setMicDelta("");
              return; // speaker echo — already captured on the "Others" track
            }
          }

          // Hard direction (macOS): LOUD bleed beats the gate AND its sys twin
          // hasn't arrived yet. While the far side is active, hold this final
          // in the grace queue — the interim text stays on screen, and the
          // flusher either paints it or (if the late twin matches) never does.
          const farSideActive = now - lastSysSeenRef.current <= FAR_SIDE_ACTIVE_MS;
          if (farSideActive) {
            pendingMicRef.current.push({ text: cleanText, normalized, ts: now });
            echoDbg(
              `  mic verdict: DEFERRED ${ECHO_PENDING_GRACE_MS / 1000}s (far side active) pending=${pendingMicRef.current.length}`,
            );
            return; // micDelta stays visible — live feedback is not lost
          }
          echoDbg(`  mic verdict: KEPT (no far-side activity) words=${wordCount}`);
        }

        appendBlock(source, cleanText, now);
        if (source === "mic") setMicDelta("");
        if (source === "sys") setSysDelta("");
        setChunkCount((n) => n + 1);
      } else {
        if (source === "mic") setMicDelta(cleanText);
        if (source === "sys") {
          setSysDelta(cleanText);
          lastSysSeenRef.current = Date.now();
        }
      }

      // Auto-scroll
      setTimeout(() => {
        if (transcriptBoxRef.current && !userScrolledUp.current) {
          transcriptBoxRef.current.scrollTop =
            transcriptBoxRef.current.scrollHeight;
        }
      }, 50);
    },
    [token],
  );

  // ── Grace-queue flusher: paint or discard deferred mic finals ──
  // Every 500ms, mic finals older than the grace period are resolved: if a
  // late-arriving sys segment matches (the macOS bleed case), the text is
  // never painted; otherwise it's committed. Nothing visible is ever removed.
  useEffect(() => {
    const iv = setInterval(() => {
      if (pendingMicRef.current.length === 0) return;
      const now = Date.now();
      const ready = pendingMicRef.current.filter((p) => now - p.ts >= ECHO_PENDING_GRACE_MS);
      if (ready.length === 0) return;
      pendingMicRef.current = pendingMicRef.current.filter(
        (p) => now - p.ts < ECHO_PENDING_GRACE_MS,
      );
      for (const p of ready) {
        const twin = recentSysSegmentsRef.current.find(
          (s) => s.ts >= p.ts - 1000 && isEchoMatch(p.normalized, s.text),
        );
        if (twin) {
          echoDbg(
            `flush DROP (late sys twin +${((twin.ts - p.ts) / 1000).toFixed(1)}s) "${p.text}"`,
          );
        } else {
          echoDbg(`flush COMMIT "${p.text}"`);
          appendBlock("mic", p.text, p.ts);
          setChunkCount((n) => n + 1);
        }
      }
      // Clear the stale interim once the queue drains (a fresh interim repaints
      // within ~300ms if the user is still talking).
      if (pendingMicRef.current.length === 0) setMicDelta("");
    }, 500);
    return () => clearInterval(iv);
  }, [appendBlock]);

  // ── Crash recovery: persist the transcript continuously while recording ──
  // Blocks only change when an utterance FINALIZES (every few seconds), so
  // this is naturally throttled. Before this existed, the recovery copy was
  // only written at save time — stopping the recording and closing the app at
  // the config screen lost the whole meeting silently.
  useEffect(() => {
    if (blocks.length === 0) return;
    const text = blocks
      .map((b) => `${b.source === "mic" ? "User" : "Others"}: ${b.text}`)
      .join("\n");
    persistUnsavedTranscript(text);
  }, [blocks]);

  // ── Close guard: warn before closing the window while a meeting is unsaved ─
  // Covers recording, the post-stop config screen, the save in flight, and the
  // save-failed screen. Electron honors beforeunload, so this blocks ⌘W/close
  // until the user confirms.
  useEffect(() => {
    const hasUnsaved =
      blocks.length > 0 &&
      (phase === "recording" ||
        phase === "context_selection" ||
        phase === "saving" ||
        phase === "error");
    if (!hasUnsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase, blocks.length]);

  const handleSave = useCallback(async (
    skipAiParam?: boolean | React.MouseEvent,
    options?: { skipAudio?: boolean },
  ) => {
    const skipAi = typeof skipAiParam === 'boolean' ? skipAiParam : false;
    const skipAudio = options?.skipAudio === true;
    if (!token) return;
    setPhase("saving");

    try {
      // Build final block text
      let fullPayload = blocks
        .map((b) => `${b.source === "mic" ? "User" : "Others"}: ${b.text}`)
        .join("\n");

      // Resolve any mic finals still in the grace queue: drop only proven
      // echoes (late sys twin matched); everything else is SAVED — stopping
      // the recording must never lose the user's words.
      for (const p of pendingMicRef.current) {
        const isLateEcho = recentSysSegmentsRef.current.some(
          (s) => s.ts >= p.ts - 1000 && isEchoMatch(p.normalized, s.text),
        );
        if (!isLateEcho) fullPayload += `\nUser: ${p.text}`;
      }
      pendingMicRef.current = [];

      if (micDelta) fullPayload += `\nUser: ${micDelta}`;
      if (sysDelta) fullPayload += `\nOthers: ${sysDelta}`;

      // Retain the transcript so the error screen can recover it (retry /
      // text-only save / copy) and so it survives a crash via localStorage.
      lastPayloadRef.current = fullPayload;
      persistUnsavedTranscript(fullPayload);

      let targetProjectId = selectedProjectId;

      if (!targetProjectId) {
        const now = new Date();
        const hour = now.getHours();
        let timeLabel = "Meeting";
        if (hour < 12) timeLabel = "Morning Sync";
        else if (hour < 17) timeLabel = "Afternoon Sync";
        else timeLabel = "Evening Sync";

        const formattedDate = new Intl.DateTimeFormat(navigator.language || 'en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }).format(now);

        let aiTitle: string | null = null;
        try {
          if (!skipAi && fullPayload.length > 50) {
            const res = await api.sendLiveChatMessage({
              content: "Generate a short, concise, 3-5 word title for this meeting based on the transcript. Reply ONLY with the title string, no quotes.",
              liveTranscript: fullPayload,
            });
            if (res.response) {
              aiTitle = res.response.replace(/["']/g, "").trim();
            }
          }
        } catch (e) {
          console.warn("Failed to generate AI project title", e);
        }

        const newProject = await api.createProject({
          title: aiTitle || `${timeLabel} (${formattedDate})`,
          description:
            "Automatically created to hold tasks generated from your recent audio recording.",
        });
        targetProjectId = newProject.id;
      }

      const startedAt = recordingStartedAtRef.current;
      const savedTranscript = await api.saveRecording({
        content: fullPayload,
        recordedAt: new Date().toISOString(),
        recordingStartedAt: startedAt ? startedAt.toISOString() : undefined,
        recordingWallClockSeconds: startedAt
          ? Math.round((Date.now() - startedAt.getTime()) / 1000)
          : undefined,
        projectId: targetProjectId,
        // Selected ASR language ("" = auto) — persisted so the backend's batch
        // re-diarization uses it instead of "multi" (which has no Catalan).
        language: language || undefined,
        // contextIds intentionally not passed — backend resolves from projectId
        // (the project's paired Context) when omitted.
        contextIds: selectedContextId ? [selectedContextId] : undefined,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
        modelKey: modelKey || undefined,
        complexityLevel: complexityLevel || undefined,
        syncToJira,
        syncToLinear,
        syncToTrello,
        syncToNotion,
        syncToAsana,
        syncToTwenty: syncToTwenty && Boolean(twentyCompany),
        twentyCompanyId: twentyCompany?.id,
        exportToGoogleDrive,
        exportToOneDrive,
        taskStrategy,
        taskCount,
        createDoc,
        createSlides,
        skipAi,
        // Text-only retry: drop the heavy audio blobs (the usual cause of the
        // upload timing out / aborting) so the transcript itself still saves.
        micFile: skipAudio ? undefined : blobs.micBlob,
        sysFile: skipAudio ? undefined : blobs.sysBlob,
        aecTelemetry: aecTelemetry ?? undefined,
      });

      // Saved successfully — clear the local recovery copy.
      clearUnsavedTranscript();

      // Navigate back to the home/dashboard immediately to allow async processing
      navigate(`/`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save transcript.",
      );
      setPhase("error");
    }
  }, [
    token,
    api,
    selectedProjectId,
    selectedContextId,
    blocks,
    micDelta,
    sysDelta,
    blobs,
    syncToJira,
    syncToLinear,
    syncToTrello,
    syncToNotion,
    syncToAsana,
    syncToTwenty,
    twentyCompany,
    exportToGoogleDrive,
    exportToOneDrive,
    taskStrategy,
    taskCount,
    createDoc,
    createSlides,
    chatHistory,
    modelKey,
    complexityLevel,
  ]);

  const handleStop = useCallback(() => {
    if (!token) return;
    // Show the configuration screen so users can pick Projects
    setPhase("context_selection");
  }, [token]);

  useEffect(() => {
    if (phase === "context_selection") {
      api.listProjects().then(setProjects).catch(console.error);
      if (api.listIntegrations) {
        api.listIntegrations().then((ints) => {
          setIntegrations(ints);
          const jira = ints.find((i) => i.provider === "JIRA" && i.status === "CONNECTED");
          if (jira && (jira.metadata as Record<string, unknown>)?.defaultProjectId) {
            setSyncToJira(true);
          }
          const linear = ints.find((i) => i.provider === "LINEAR" && i.status === "CONNECTED");
          if (linear && (linear.metadata as Record<string, unknown>)?.defaultTeamId) {
            setSyncToLinear(true);
          }
          const trello = ints.find((i) => i.provider === "TRELLO" && i.status === "CONNECTED");
          if (trello && (trello.metadata as Record<string, unknown>)?.defaultBoardId) {
            setSyncToTrello(true);
          }
          const notion = ints.find((i) => i.provider === "NOTION" && i.status === "CONNECTED");
          if (notion) {
            setSyncToNotion(true);
          }
          const asana = ints.find((i) => i.provider === "ASANA" && i.status === "CONNECTED");
          if (asana && (asana.metadata as Record<string, unknown>)?.defaultProjectGid) {
            setSyncToAsana(true);
          }
          const google = ints.find((i) => i.provider === "GOOGLE_DRIVE" && i.status === "CONNECTED");
          if (google) {
            setExportToGoogleDrive(true);
          }
          const onedrive = ints.find((i) => i.provider === "ONEDRIVE" && i.status === "CONNECTED");
          if (onedrive) {
            setExportToOneDrive(true);
          }
        }).catch(console.error);
      }
    }
  }, [phase, api]);

  // Load contexts immediately so they can be selected during recording for Live Chat
  const loadContexts = useCallback(() => {
    if (!api) return;
    api.listContexts().then(setContexts).catch(console.error);
  }, [api]);

  useEffect(() => {
    if (api) {
      loadContexts();
      api.listAiModels().then(setAiModels).catch(console.error);
    }
  }, [api, loadContexts]);

  // Refetch contexts when the recorder window regains focus, so deletions
  // made on the web app are reflected without restarting.
  useEffect(() => {
    const handleFocus = () => loadContexts();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadContexts]);

  // Live Summary Polling Loop (Every 15 seconds, mapped to 1s UI ticks)
  useEffect(() => {
    if (phase !== "recording" || !api) return;

    summaryPollTimerRef.current = setInterval(() => {
      setSummaryProgress((prev) => (prev >= 100 ? 5 : prev + 5));
      summaryPollCounterRef.current += 1;

      if (summaryPollCounterRef.current >= 15) {
        summaryPollCounterRef.current = 0;

        // Functional state updates to read the latest blocks without triggering stale closures
        setBlocks((currentBlocks) => {
          const fullPayload = currentBlocks
            .map((b) => `${b.source === "mic" ? "User" : "Others"}: ${b.text}`)
            .join("\n");

          if (fullPayload.length === 0) return currentBlocks;

          // Only trigger API if the transcript changed to save cost
          if (fullPayload.length > previousTranscriptLength.current) {
            previousTranscriptLength.current = fullPayload.length;

            setLiveSummaryLoading(true);
            setLiveSummary((prevSummary) => {
              api
                .getLiveSummary({
                  liveTranscript: fullPayload,
                  contextIds: selectedContextId
                    ? [selectedContextId]
                    : undefined,
                  projectIds: selectedProjectId
                    ? [selectedProjectId]
                    : undefined,
                  modelKey: modelKey || undefined,
                  previousSummary: prevSummary || undefined,
                })
                .then((newSummary) => {
                  setLiveSummary(newSummary);
                })
                .catch((err) => {
                  console.warn("Live summary poll failed: ", err);
                })
                .finally(() => {
                  setLiveSummaryLoading(false);
                });
              return prevSummary;
            });
          }

          return currentBlocks;
        });
      }
    }, 1000); // 1s UI progress intervals

    return () => {
      if (summaryPollTimerRef.current)
        clearInterval(summaryPollTimerRef.current);
    };
  }, [phase, api, selectedContextId, modelKey]);

  // Start recorder on mount
  useEffect(() => {
    if (!token) return;

    recordingStartedAtRef.current = new Date();

    const recorder = new AudioRecorder({
      api,
      onTranscript: handleTranscript,
      onSpeechEvent: (source, eventType) => {
        const isSpeaking = eventType === "speech_started";
        if (source === "mic") setIsMicSpeaking(isSpeaking);
        if (source === "sys") setIsSysSpeaking(isSpeaking);
      },
      onStop: () => void handleStop(),
      onDisconnect: () => setIsWsConnected(false),
      // Auto-reconnect feedback: keep the "reconnecting" banner up while the
      // recorder retries in the background, then restore once it's back.
      onReconnecting: () => setIsWsConnected(false),
      onReconnected: () => setIsWsConnected(true),
      onError: (err) => {
        setError(err.message || "Connection lost. Audio transcription stopped.");
        const code = (err as Error & { code?: string }).code ?? null;
        setErrorCode(code);
        if (code === "MISSING_API_KEY" || code === "INVALID_API_KEY" || code === "USAGE_LIMIT_EXCEEDED" || code === "SUBSCRIPTION_REQUIRED") {
          setPhase("error");
        }
      },
    });

    recorderRef.current = recorder;

    // Add a small delay to ensure Home page unmounted and released devices
    const startTimeout = setTimeout(() => {
      recorder.start().catch((err) => {
        console.error("[Recording] Start failed:", err);
        setError(err instanceof Error ? err.message : String(err));
        setPhase("error");
      });
    }, 1000);

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed((t) => t + 1);
    }, 1000);

    return () => {
      clearTimeout(startTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      recorder.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = async () => {
    setIsStopping(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const result = await recorderRef.current?.stop();
    if (result) setBlobs(result);
    setAecTelemetry(recorderRef.current?.getAecTelemetry() ?? null);
    setIsStopping(false);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    recorderRef.current?.changeLanguage(newLang);

    // Persist to config so next recording defaults to it
    if (config) {
      saveConfig({ ...config, language: newLang });
    }
    // …and to the cross-session default, so returning Home doesn't reset the
    // selector to auto-detect and silently re-record under "multi".
    saveLanguagePreference(newLang);
  };

  const handleSpeakerModeChange = (enabled: boolean) => {
    setSpeakerMode(enabled);
    // Apply live to the running recording (re-acquires the mic with new AEC).
    void recorderRef.current?.setSpeakerMode(enabled);
    // Persist: session config for this recording + the cross-session default.
    if (config) {
      saveConfig({ ...config, speakerMode: enabled });
    }
    localStorage.setItem("planai_speaker_mode", String(enabled));
  };

  // ── Done / Error states ───────────────────────────────────────────────────
  if (phase === "context_selection") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100%",
          minHeight: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          gap: 3,
          p: 4,
          pt: 3,
          pb: 12,
        }}
      >
        <Typography variant="h6">Recording stopped</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
          Configure how you want this recording processed before saving.
        </Typography>

        {/* ── Group 1: Project & Task Strategy ── */}
        <Box sx={{ width: '100%', maxWidth: 480, p: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, bgcolor: 'background.paper' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', display: 'block', mb: 1.5 }}>
            Project & Task Strategy
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel shrink>Project (Optional)</InputLabel>
              <Select
                value={selectedProjectId}
                label="Project (Optional)"
                onChange={(e) => setSelectedProjectId(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Create new project for me</em>
                </MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel shrink>Agile Task Generation</InputLabel>
              <Select
                value={taskStrategy}
                label="Agile Task Generation"
                onChange={(e) => setTaskStrategy(e.target.value as "AUTO" | "SINGLE_TICKET" | "SPECIFIC_COUNT")}
                displayEmpty
              >
                <MenuItem value="AUTO">AI Slice & Dice (1 Epic + Auto Sub-tasks)</MenuItem>
                <MenuItem value="SINGLE_TICKET">Force 1 Mega-Ticket</MenuItem>
                <MenuItem value="SPECIFIC_COUNT">Specific fixed number of tasks</MenuItem>
              </Select>
            </FormControl>

            {taskStrategy === "SPECIFIC_COUNT" && (
              <TextField
                fullWidth
                size="small"
                label="Number of Tasks"
                type="number"
                value={taskCount}
                onChange={(e) => setTaskCount(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: 20 }}
              />
            )}
          </Stack>
        </Box>

        {/* ── Group 2: Sync to Integrations ── */}
        {integrations.some((i) => i.status === "CONNECTED") && (
          <Box sx={{ width: '100%', maxWidth: 480, p: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, bgcolor: 'background.paper' }}>
            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', display: 'block', mb: 1 }}>
              Sync to Integrations
            </Typography>
            <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
              {integrations.some((i) => i.provider === "JIRA" && i.status === "CONNECTED") && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={syncToJira} onChange={(e) => setSyncToJira(e.target.checked)} />}
                  label={<Typography variant="body2">Jira</Typography>}
                />
              )}
              {integrations.some((i) => i.provider === "LINEAR" && i.status === "CONNECTED") && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={syncToLinear} onChange={(e) => setSyncToLinear(e.target.checked)} />}
                  label={<Typography variant="body2">Linear</Typography>}
                />
              )}
              {integrations.some((i) => i.provider === "TRELLO" && i.status === "CONNECTED") && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={syncToTrello} onChange={(e) => setSyncToTrello(e.target.checked)} />}
                  label={<Typography variant="body2">Trello</Typography>}
                />
              )}
              {integrations.some((i) => i.provider === "NOTION" && i.status === "CONNECTED") && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={syncToNotion} onChange={(e) => setSyncToNotion(e.target.checked)} />}
                  label={<Typography variant="body2">Notion</Typography>}
                />
              )}
              {integrations.some((i) => i.provider === "ASANA" && i.status === "CONNECTED") && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={syncToAsana} onChange={(e) => setSyncToAsana(e.target.checked)} />}
                  label={<Typography variant="body2">Asana</Typography>}
                />
              )}
              {hasTwenty && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={syncToTwenty}
                        onChange={(e) => setSyncToTwenty(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2">Twenty CRM</Typography>}
                  />
                  {/* The company is picked PER MEETING: the same person sees
                      several different clients in a day. The project's linked
                      company (if any) just pre-fills this. */}
                  {syncToTwenty && (
                    <Autocomplete
                      size="small"
                      sx={{ mt: 1 }}
                      options={twentyCompanies}
                      value={twentyCompany}
                      loading={isSearchingCompanies}
                      getOptionLabel={(o) => o.name}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      filterOptions={(x) => x}
                      onInputChange={(_, v) => setTwentyQuery(v)}
                      onChange={(_, v) => setTwentyCompany(v)}
                      noOptionsText={
                        twentyQuery.trim().length < 2
                          ? 'Type at least 2 characters…'
                          : 'No companies found'
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Company in Twenty"
                          placeholder="Search…"
                          error={syncToTwenty && !twentyCompany}
                          helperText={
                            syncToTwenty && !twentyCompany
                              ? 'Pick a company or the note will be skipped'
                              : ' '
                          }
                        />
                      )}
                    />
                  )}
                </Box>
              )}
              {integrations.find((i) => i.provider === "GOOGLE_DRIVE" && i.status === "CONNECTED") && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={exportToGoogleDrive} onChange={(e) => setExportToGoogleDrive(e.target.checked)} />}
                  label={<Typography variant="body2">Google Drive</Typography>}
                />
              )}
              {integrations.find((i) => i.provider === "ONEDRIVE" && i.status === "CONNECTED") && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={exportToOneDrive} onChange={(e) => setExportToOneDrive(e.target.checked)} />}
                  label={<Typography variant="body2">OneDrive</Typography>}
                />
              )}
            </FormGroup>
          </Box>
        )}

        {/* ── Group 3: Generate Assets ── */}
        <Box sx={{ width: '100%', maxWidth: 480, p: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, bgcolor: 'background.paper' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', display: 'block', mb: 1 }}>
            Generate Assets
          </Typography>
          <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={createDoc} onChange={(e) => setCreateDoc(e.target.checked)} />}
              label={<Typography variant="body2">📄 Document</Typography>}
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={createSlides} onChange={(e) => setCreateSlides(e.target.checked)} />}
              label={<Typography variant="body2">📊 Slides</Typography>}
            />
          </FormGroup>
        </Box>

        {/* ── Actions ── */}
        <Stack direction="column" spacing={1.5} sx={{ width: '100%', maxWidth: 480, mt: 1 }}>
          <Button variant="contained" fullWidth onClick={() => handleSave(false)} sx={{ py: 1.5 }}>
            Save & Generate Summary and Tasks
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => handleSave(true)}
            sx={{ 
              textDecoration: "underline", 
              color: "text.secondary", 
              fontSize: "0.8rem",
              "&:hover": { color: "text.primary" } 
            }}
          >
            Save Recording Only (Discard Tasks)
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              // FIELD INCIDENT (2026-06-11): a user clicked this thinking it
              // was "exit", and the meeting was permanently discarded with no
              // confirmation. This is the ONLY destructive action on this
              // screen — it must always confirm.
              const confirmed = window.confirm(
                "Discard this meeting permanently?\n\nThe transcript and audio will NOT be saved and cannot be recovered.",
              );
              if (!confirmed) return;
              // Intentional discard — drop the crash-recovery copy too, or the
              // user would be prompted to "recover" a meeting they just threw away.
              clearUnsavedTranscript();
              navigate("/");
            }}
            sx={{
              textDecoration: "underline",
              color: "error.main",
              fontSize: "0.8rem",
              "&:hover": { color: "error.dark" }
            }}
          >
            Ignore all and do not store
          </Button>
        </Stack>
      </Box>
    );
  }

  if (phase === "saving") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 3,
          p: 4,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6">Saving recording…</Typography>
        <Typography variant="body2" color="text.secondary">
          Uploading your transcript securely.
        </Typography>
        <LinearProgress sx={{ width: "100%", maxWidth: 320 }} />
      </Box>
    );
  }

  if (phase === "done") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 3,
          p: 4,
        }}
      >
        <DoneIcon sx={{ fontSize: 64, color: "success.main" }} />
        <Typography variant="h6">Recording saved!</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Your transcript has been successfully saved.
          <br />
          Open Plan AI down in your browser to view and organize it.
        </Typography>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate("/")}
        >
          Back to recordings
        </Button>
      </Box>
    );
  }

  if (phase === "error") {
    const isKeyIssue =
      errorCode === "MISSING_API_KEY" ||
      errorCode === "INVALID_API_KEY" ||
      (error ? /MISSING_API_KEY|INVALID_API_KEY|API key|Deepgram|OpenRouter/i.test(error) : false);

    const isQuotaIssue = errorCode === "USAGE_LIMIT_EXCEEDED";
    const isSubIssue = errorCode === "SUBSCRIPTION_REQUIRED";

    const openWorkspaceSettings = () => {
      const baseUrl = import.meta.env.VITE_PLAN_AI_WEB_URL || "http://localhost:3000";
      window.open(`${baseUrl.replace(/\/+$/, "")}/settings/workspace`, "_blank");
    };

    const openBilling = () => {
      const baseUrl = import.meta.env.VITE_PLAN_AI_WEB_URL || "http://localhost:3000";
      window.open(`${baseUrl.replace(/\/+$/, "")}/billing`, "_blank");
    };

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 3,
          p: 4,
        }}
      >
        <Alert severity={isQuotaIssue ? "warning" : "error"} sx={{ width: "100%", maxWidth: 400 }}>
          {error ?? "An unexpected error occurred."}
        </Alert>
        {isKeyIssue && (
          <Button variant="contained" onClick={openWorkspaceSettings}>
            Open Workspace Settings
          </Button>
        )}
        {(isQuotaIssue || isSubIssue) && (
          <Button variant="contained" onClick={openBilling}>
            {isQuotaIssue ? "Upgrade Plan" : "Choose a Plan"}
          </Button>
        )}

        {/* Recovery actions — shown whenever there's an unsaved transcript so
            a failed upload (e.g. aborted audio upload) never loses the text. */}
        {lastPayloadRef.current.trim().length > 0 && (
          <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 400 }}>
            <Button variant="contained" onClick={() => void handleSave()}>
              Retry saving
            </Button>
            <Button
              variant="outlined"
              onClick={() => void handleSave(false, { skipAudio: true })}
            >
              Save transcript only (skip audio)
            </Button>
            <Button
              variant="text"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lastPayloadRef.current);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  /* clipboard unavailable */
                }
              }}
            >
              {copied ? "Copied!" : "Copy transcript to clipboard"}
            </Button>
          </Stack>
        )}

        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate("/")}
        >
          Back to recordings
        </Button>
      </Box>
    );
  }

  // ── Active recording ──────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Drag region */}
      <Box
        sx={{
          height: 28,
          WebkitAppRegion: "drag",
          bgcolor: "background.default",
        }}
      />

      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 3,
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          {(isMicSpeaking || isSysSpeaking) ? (
            <Waveform active={true} />
          ) : (
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "error.main",
                animation: "pulse 1.2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.3 },
                },
              }}
            />
          )}
          <Typography variant="subtitle2" fontWeight={700}>
            {(isMicSpeaking || isSysSpeaking) ? "Speaking..." : "Listening..."}
          </Typography>
          <Chip label={formatTime(elapsed)} size="small" variant="outlined" />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Autocomplete
              size="small"
              options={LANGUAGE_OPTIONS}
              getOptionLabel={(option) => option.name}
              value={
                LANGUAGE_OPTIONS.find((o) => o.code === language) || LANGUAGE_OPTIONS[0]
              }
              onChange={(_, newValue) => {
                handleLanguageChange(newValue ? newValue.code : "");
              }}
              isOptionEqualToValue={(option, value) =>
                option.code === value.code
              }
              ListboxProps={{
                sx: { maxHeight: 250 }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                    "& .MuiInputBase-root": {
                      height: 32,
                      fontSize: "0.8rem",
                      py: 0,
                    },
                    "& input": {
                      fontSize: "0.8rem",
                    },
                  }}
                />
              )}
            />
          </FormControl>

          <Tooltip
            title={
              speakerMode
                ? "Echo cancellation ON (loudspeaker). Click if you're on headphones."
                : "Headphones mode — no echo cancellation. Click if you're on a loudspeaker."
            }
          >
            <IconButton
              size="small"
              color={speakerMode ? "primary" : "default"}
              onClick={() => handleSpeakerModeChange(!speakerMode)}
              aria-label="Toggle echo cancellation"
            >
              {speakerMode ? (
                <SpeakerIcon fontSize="small" />
              ) : (
                <HeadsetIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="error"
            startIcon={isStopping ? <CircularProgress size={16} color="inherit" /> : <StopIcon />}
            onClick={() => void stopRecording()}
            size="small"
            disabled={isStopping}
          >
            {isStopping ? "Finalizing..." : "Stop & Save"}
          </Button>
        </Stack>
      </Stack>

      {!isWsConnected && (
        <Alert
          severity="error"
          sx={{ m: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (recorderRef.current) {
                  recorderRef.current.reconnect();
                  setIsWsConnected(true);
                  setError(null);
                  setErrorCode(null);
                }
              }}
            >
              RECONNECT
            </Button>
          }
        >
          Connection lost — reconnecting automatically… Your audio is still
          recording and nothing is lost. (You can also press RECONNECT.)
        </Alert>
      )}

      {error && isWsConnected && (
        <Alert severity="warning" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Waveform */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 3,
          px: 3,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Waveform active />
      </Box>

      {/* Split layout: Transcript (Left), Live Assistant (Right) */}
      <Stack direction="row" sx={{ flex: 1, overflow: "hidden" }}>
        {/* Transcript area */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 3, py: 1 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Live Transcript
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              {chunkCount > 0 && (
                <Chip
                  label={`${chunkCount} segment${chunkCount !== 1 ? "s" : ""}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              <Tooltip title={liveCopied ? "Copied!" : "Copy transcript"}>
                {/* span keeps the tooltip working while the button is disabled */}
                <span>
                  <IconButton
                    size="small"
                    onClick={handleCopyLiveTranscript}
                    disabled={blocks.length === 0 && !micDelta && !sysDelta}
                    sx={{ color: "text.secondary" }}
                  >
                    {liveCopied ? (
                      <CheckIcon fontSize="small" color="success" />
                    ) : (
                      <CopyIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          <Divider sx={{ opacity: 0.3 }} />

          {/* Live composition slots — pinned at the TOP, above the scrollable
              history, with stronger contrast (user request: live first, easy
              to glance; consolidated reading below never jumps). */}
          {(micDelta || sysDelta) && (
            <Box
              sx={{
                flexShrink: 0,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                bgcolor: "rgba(255,255,255,0.06)",
                px: 3,
                py: 1.25,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              {micDelta && (
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography
                    variant="caption"
                    color="primary.main"
                    sx={{ fontWeight: "bold", flexShrink: 0, width: 56 }}
                  >
                    Me ▸
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.primary",
                      whiteSpace: "pre-wrap",
                      fontWeight: 500,
                    }}
                  >
                    {micDelta}
                  </Typography>
                </Stack>
              )}
              {sysDelta && (
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography
                    variant="caption"
                    color="secondary.main"
                    sx={{ fontWeight: "bold", flexShrink: 0, width: 56 }}
                  >
                    Others ▸
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.primary",
                      whiteSpace: "pre-wrap",
                      fontWeight: 500,
                    }}
                  >
                    {sysDelta}
                  </Typography>
                </Stack>
              )}
            </Box>
          )}

          <Box
            ref={transcriptBoxRef}
            onScroll={handleTranscriptScroll}
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 3,
              py: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {blocks.length === 0 && !micDelta && !sysDelta && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic" }}
              >
                Start speaking, your transcript will appear here in real-time…
              </Typography>
            )}

            {blocks.map((block) => (
              <Box key={block.id}>
                <Typography
                  variant="caption"
                  color={block.source === "mic" ? "primary.main" : "secondary.main"}
                  sx={{ fontWeight: "bold" }}
                >
                  {block.source === "mic" ? "Me" : "Others"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    lineHeight: 1.8,
                    color: "text.primary",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {block.text}
                </Typography>
              </Box>
            ))}

          </Box>

        </Box>

        {/* Live Meeting Assistant Sidebar */}
        <Box
          sx={{
            width: 380,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            justifyContent="flex-start"
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              bgcolor: "rgba(255,255,255,0.02)",
            }}
          >
            <BotIcon fontSize="small" color="primary" />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "text.primary",
              }}
            >
              Live Assistant
            </Typography>
          </Stack>

          {/* Context and Logic Selectors */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >


            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <Select
                value={modelKey}
                onChange={(e) => setModelKey(e.target.value)}
                displayEmpty
                sx={{ fontSize: "0.8rem", height: 32 }}
              >
                <MenuItem value="" sx={{ fontSize: "0.8rem" }}>
                  <em>Default AI</em>
                </MenuItem>
                {aiModels.map((m) => (
                  <MenuItem
                    key={m.key}
                    value={m.key}
                    sx={{ fontSize: "0.8rem" }}
                  >
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <Select
                value={complexityLevel}
                onChange={(e) => setComplexityLevel(e.target.value)}
                displayEmpty
                sx={{ fontSize: "0.8rem", height: 32 }}
              >
                <MenuItem value="" sx={{ fontSize: "0.8rem" }}>
                  <em>Default Complexity</em>
                </MenuItem>
                <MenuItem value="Beginner" sx={{ fontSize: "0.8rem" }}>
                  Basic / Simple
                </MenuItem>
                <MenuItem value="Intermediate" sx={{ fontSize: "0.8rem" }}>
                  Intermediate
                </MenuItem>
                <MenuItem value="Advanced" sx={{ fontSize: "0.8rem" }}>
                  Advanced / Technical
                </MenuItem>
                <MenuItem value="Native" sx={{ fontSize: "0.8rem" }}>
                  Expert / Academic
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: "rgba(255,255,255,0.06)" }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{ minHeight: 40 }}
            >
              <Tab
                label="Summary & Tasks"
                value="summary"
                sx={{ fontSize: "0.75rem", minHeight: 40, py: 0 }}
              />
              <Tab
                label="Live Chat"
                value="chat"
                sx={{ fontSize: "0.75rem", minHeight: 40, py: 0 }}
              />
            </Tabs>
          </Box>

          {/* Tab 1: AI Summary & Tasks */}
          {activeTab === "summary" && (
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {liveSummaryLoading && (
                  <Typography
                    variant="caption"
                    sx={{ color: "primary.main", fontStyle: "italic" }}
                  >
                    Updating...
                  </Typography>
                )}
                <CircularProgress
                  variant="determinate"
                  value={summaryProgress}
                  size={16}
                  thickness={5}
                />
              </Box>
              {liveSummary ? (
                <Box
                  sx={{
                    typography: "body2",
                    "& h3, & h4": {
                      mt: 1,
                      mb: 1,
                      color: "text.primary",
                      fontWeight: 600,
                    },
                    "& ul": { my: 0.5, pl: 2 },
                    "& li": { mb: 0.5 },
                    color: "text.secondary",
                  }}
                >
                  <ReactMarkdown>{liveSummary}</ReactMarkdown>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", fontStyle: "italic", mt: 4 }}
                >
                  Waiting for initial data... The summary will appear
                  automatically after ~20 seconds of conversation.
                </Typography>
              )}
            </Box>
          )}

          {/* Tab 2: Live Chat */}
          {activeTab === "chat" && (
            <>
              <Box
                ref={chatBoxRef}
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {chatHistory.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", fontStyle: "italic", mt: 4 }}
                  >
                    Ask questions about the meeting in real-time.
                  </Typography>
                )}

                {chatHistory.map((msg, idx) => (
                  <ChatMessageItem key={idx} msg={msg} />
                ))}

                {chatLoading && (
                  <Box sx={{ alignSelf: "flex-start", p: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ fontStyle: "italic" }}
                    >
                      Thinking...
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask a question..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendChat();
                      }
                    }}
                    multiline
                    maxRows={3}
                    sx={{
                      "& .MuiInputBase-root": { fontSize: "0.875rem", p: 1 },
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => void handleSendChat()}
                    disabled={chatLoading || !chatMessage.trim()}
                    sx={{ alignSelf: "flex-end", mb: 0.5 }}
                  >
                    <SendIcon />
                  </IconButton>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </Stack>

      {/* Config chips */}
      {config && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            px: 3,
            py: 1.5,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexWrap: "wrap",
          }}
        >
          {config.systemSourceId && (
            <Chip label="System audio + mic" size="small" variant="outlined" />
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Recording;
