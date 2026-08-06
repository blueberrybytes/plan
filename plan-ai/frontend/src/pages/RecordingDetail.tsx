import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Button,
  Divider,
  Tabs,
  Tab,
  Alert,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  Place as LocationIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useGetTranscriptQuery, useReprocessTranscriptMutation } from "../store/apis/transcriptApi";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../store/slices/app/appSlice";
import ReactMarkdown from "react-markdown";
import MermaidRenderer from "../components/common/MermaidRenderer";
import SyncBadges from "../components/recording/SyncBadges";
import ExtractionReasoningPanel from "../components/transcripts/ExtractionReasoningPanel";
import SpeakerInsightsTab, {
  type SpeakerInsight,
} from "../components/transcript/SpeakerInsightsTab";
import TranscriptBody from "../components/transcript/TranscriptBody";
import { exportMarkdownToDocx } from "../utils/docxExport";
import { jsPDF } from "jspdf";

const ChatMessageItem = ({ msg }: { msg: { role: string; content: string } }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        alignSelf: msg.role === "USER" ? "flex-end" : "flex-start",
        bgcolor: msg.role === "USER" ? "primary.dark" : "rgba(255,255,255,0.05)",
        p: 1.5,
        pr: 5,
        borderRadius: 2,
        maxWidth: "85%",
        position: "relative",
        mb: 2,
        "&:hover .copy-btn": { opacity: 1 },
      }}
    >
      <Box
        sx={{
          typography: "body2",
          "& h3, & h4": { mt: 1, mb: 1, color: "text.primary", fontWeight: 600 },
          "& ul": { my: 0.5, pl: 2 },
          "& li": { mb: 0.5 },
          "& p": { my: 0 },
          color: msg.role === "USER" ? "primary.contrastText" : "text.secondary",
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
        {copied ? <CheckIcon fontSize="small" color="success" /> : <CopyIcon fontSize="small" />}
      </IconButton>
    </Box>
  );
};

const RecordingDetail: React.FC = () => {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [pollingInterval, setPollingInterval] = useState(0);

  const {
    data: transcript,
    isLoading,
    error,
  } = useGetTranscriptQuery(recordingId || "", {
    skip: !recordingId,
    pollingInterval,
  });

  React.useEffect(() => {
    const status = transcript?.data?.metadata?.processingStatus;
    const isPending = status === "PENDING" || status === "REFINING_TASKS";
    setPollingInterval(isPending ? 3000 : 0);
  }, [transcript]);

  const [reprocessTranscript, { isLoading: isReprocessing }] = useReprocessTranscriptMutation();

  // Treat "legacy" masked transcripts (completed-with-error-title + 0 tasks,
  // from before the backend threw on AI failure) as failed so they surface
  // the Retry affordance instead of rendering the fallback error text.
  const transcriptTitle = transcript?.data?.title || "";
  const isErrorTitle =
    transcriptTitle.startsWith("Processing Error") ||
    transcriptTitle.startsWith("Failed Transcript") ||
    transcriptTitle.startsWith("Authentication Error");
  const isFailedTranscript =
    transcript?.data?.metadata?.processingStatus === "FAILED" || isErrorTitle;

  const handleReprocess = async () => {
    if (!recordingId) return;
    try {
      await reprocessTranscript(recordingId).unwrap();
      dispatch(setToastMessage({ message: "Re-queued for AI processing", severity: "success" }));
      setPollingInterval(3000);
    } catch {
      dispatch(
        setToastMessage({ message: "Could not re-queue. Please try again.", severity: "error" }),
      );
    }
  };

  interface RawTask {
    id?: string;
    title?: string;
    status?: string;
    dependencies?: string[];
  }

  // Generate dynamic mindmap from tasks
  const generateMermaidFromTasks = () => {
    // For standalone recordings, tasks are not stored in the DB as Task entities,
    // but they are auto-injected into metadata.rawTasks by the backend.
    const metadata = transcript?.data?.metadata;
    const rawMetaTasks = metadata?.rawTasks as RawTask[] | undefined;
    const tasks = transcript?.data?.tasks?.length ? transcript.data.tasks : rawMetaTasks;
    if (!tasks || tasks.length === 0) return null;
    let code = "graph TD;\n";

    const statusColors: Record<string, string> = {
      COMPLETED: "fill:#4caf50",
      IN_PROGRESS: "fill:#2196f3",
      BLOCKED: "fill:#f44336",
      BACKLOG: "fill:#9e9e9e",
      ARCHIVED: "fill:#757575",
    };

    const nodes = new Map<string, string>();
    tasks.forEach((t: RawTask, index: number) => {
      // In rough metadata tasks, we might need a fallback ID if 'id' is undefined.
      const rawId = t.id || `raw-${index}`;
      const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, "");
      nodes.set(t.title?.toLowerCase() || index.toString(), cleanId);
      const title = (t.title || "Untitled").replace(/"/g, "'").replace(/\n/g, " ");
      code += `  ${cleanId}["[${String(t.status).replace("_", " ")}]<br/>${title}"];\n`;
      if (t.status && statusColors[t.status]) {
        code += `  style ${cleanId} ${statusColors[t.status]},stroke:#fff,stroke-width:2px,color:#fff;\n`;
      }
    });

    tasks.forEach((t: RawTask, index: number) => {
      // Find clean ID for this current task
      const cleanId = nodes.get(t.title?.toLowerCase() || index.toString());
      if (t.dependencies && t.dependencies.length > 0) {
        t.dependencies.forEach((depIdOrTitle: string) => {
          // dependencies from transcript extraction could be titles or IDs
          const depNode = nodes.get(depIdOrTitle?.toLowerCase()) || nodes.get(depIdOrTitle);
          if (depNode && cleanId) {
            code += `  ${depNode} --> ${cleanId};\n`;
          }
        });
      }
    });
    return code;
  };

  const generatedChart = generateMermaidFromTasks();

  const [copying, setCopying] = useState(false);
  const [tabValue, setTabValue] = useState("summary");
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  // When a transcript has no AI summary (e.g. standalone / pasted text),
  // default to the "transcript" tab instead of showing an empty summary.
  React.useEffect(() => {
    if (transcript && !transcript.data?.summary && tabValue === "summary") {
      setTabValue("transcript");
    }
  }, [transcript, tabValue]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleCopy = async () => {
    const text = transcript?.data?.transcript;
    if (!text) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      dispatch(
        setToastMessage({ message: "Transcript copied to clipboard!", severity: "success" }),
      );
    } catch (err) {
      console.error("Failed to copy text", err);
      dispatch(setToastMessage({ message: "Failed to copy transcript", severity: "error" }));
    } finally {
      setTimeout(() => setCopying(false), 2000);
    }
  };

  const generateExportContent = () => {
    const tData = transcript?.data;
    if (!tData) return "";

    let exportContent = `# ${tData.title || "Untitled Recording"}\n\n`;

    if (tData.recordedAt || tData.createdAt) {
      exportContent += `**Recorded on:** ${new Date(tData.recordedAt || tData.createdAt).toLocaleString()}\n`;
    }
    if (tData.durationSeconds) {
      exportContent += `**Duration:** ${Math.floor(tData.durationSeconds / 60)}m ${tData.durationSeconds % 60}s\n`;
    }
    if (tData.speakerCount) {
      exportContent += `**Speakers:** ${tData.speakerCount}\n`;
    }
    if (tData.sentiment) {
      exportContent += `**Sentiment:** ${tData.sentiment}\n`;
    }
    if (tData.metadata?.sentimentExplanation) {
      exportContent += `*${tData.metadata.sentimentExplanation}*\n`;
    }
    exportContent += `\n---\n\n`;

    if (tData.summary) {
      exportContent += `## AI Summary\n\n${tData.summary}\n\n`;
    }

    if (tData.metadata?.keyPoints && tData.metadata.keyPoints.length > 0) {
      exportContent += `## Critical Insights & Pain Points\n\n`;
      tData.metadata.keyPoints.forEach((point: string) => {
        exportContent += `- ${point}\n`;
      });
      exportContent += `\n\n`;
    }

    if (tData.transcript) {
      exportContent += `## Full Transcript\n\n${tData.transcript}\n\n`;
    }
    return exportContent;
  };

  const handleExportPdf = () => {
    setExportAnchor(null);
    const tData = transcript?.data;
    if (!tData) return;

    const pdf = new jsPDF();
    const margin = 15;
    const maxLineWidth = pdf.internal.pageSize.width - margin * 2;
    const pageHeight = pdf.internal.pageSize.height;
    let cursorY = margin;

    const addText = (text: string, fontSize = 12, isBold = false) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = pdf.splitTextToSize(text, maxLineWidth);
      lines.forEach((line: string) => {
        if (cursorY + fontSize * 0.35 > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin + 5;
        }
        pdf.text(line, margin, cursorY);
        cursorY += fontSize * 0.45;
      });
      cursorY += fontSize * 0.2; // spacing after block
    };

    addText(tData.title || "Untitled Recording", 18, true);
    cursorY += 5;

    if (tData.recordedAt || tData.createdAt) {
      addText(`Recorded on: ${new Date(tData.recordedAt || tData.createdAt).toLocaleString()}`, 11);
    }
    if (tData.durationSeconds) {
      addText(
        `Duration: ${Math.floor(tData.durationSeconds / 60)}m ${tData.durationSeconds % 60}s`,
        11,
      );
    }
    if (tData.speakerCount) {
      addText(`Speakers: ${tData.speakerCount}`, 11);
    }
    if (tData.sentiment) {
      addText(`Sentiment: ${tData.sentiment}`, 11);
    }
    if (tData.metadata?.sentimentExplanation) {
      cursorY += 2;
      addText(tData.metadata.sentimentExplanation, 11, true);
    }

    cursorY += 10;

    if (tData.summary) {
      addText("AI Summary", 14, true);
      addText(tData.summary, 11);
      cursorY += 5;
    }

    if (tData.metadata?.keyPoints && tData.metadata.keyPoints.length > 0) {
      addText("Critical Insights & Pain Points", 14, true);
      tData.metadata.keyPoints.forEach((point: string) => {
        addText(`• ${point}`, 11);
      });
      cursorY += 5;
    }

    if (tData.transcript) {
      addText("Full Transcript", 14, true);
      // Remove generic filler characters to prevent rendering glitches
      const cleanTranscript = tData.transcript.replace(/\t/g, "  ");
      addText(cleanTranscript, 11);
    }

    pdf.save(`${(tData.title || "transcript").replace(/[/\\?%*:|"<>]/g, "-")}.pdf`);
  };

  const handleExportMarkdown = () => {
    setExportAnchor(null);
    const content = generateExportContent();
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(transcript?.data?.title || "transcript").replace(/[/\\?%*:|"<>]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = async () => {
    setExportAnchor(null);
    const content = generateExportContent();
    if (!content) return;
    await exportMarkdownToDocx(transcript?.data?.title || "Export", content);
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <Box sx={{ display: "flex", justifyContent: "center", p: 4, mt: 8 }}>
          <CircularProgress />
        </Box>
      </SidebarLayout>
    );
  }

  if (error || !transcript) {
    return (
      <SidebarLayout>
        <Box sx={{ p: 4, mt: 4 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate("/recordings")} sx={{ mb: 2 }}>
            Back to Recordings
          </Button>
          <Typography color="error">Failed to load the recording details.</Typography>
        </Box>
      </SidebarLayout>
    );
  }

  const location = transcript.data?.metadata?.location;

  return (
    <SidebarLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #export-content, #export-content * { visibility: visible; }
          #export-content { position: absolute; left: 0; top: 0; margin: 0; padding: 0; max-width: 100% !important; }
          .no-print { display: none !important; }
          pre, code, blockquote, img, svg, table, tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          h1, h2, h3 { page-break-after: avoid !important; break-after: avoid !important; }
        }
      `}</style>
      <Box id="export-content" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
        {/* Header */}
        <Stack
          className="no-print"
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => navigate("/recordings")}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                {transcript.data?.title || "Untitled Recording"}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                useFlexGap
                sx={{ mt: 0.5, flexWrap: "wrap" }}
              >
                <Typography color="text.secondary" variant="body2" sx={{ mr: 1 }}>
                  Recorded on{" "}
                  {transcript.data?.recordedAt
                    ? new Date(transcript.data.recordedAt).toLocaleString()
                    : transcript.data?.createdAt
                      ? new Date(transcript.data.createdAt).toLocaleString()
                      : "Unknown"}
                </Typography>

                {transcript.data?.durationSeconds && (
                  <Chip
                    size="small"
                    icon={<TimeIcon fontSize="small" />}
                    label={`${Math.floor(transcript.data.durationSeconds / 60)}m ${transcript.data.durationSeconds % 60}s`}
                    variant="outlined"
                  />
                )}
                {transcript.data?.speakerCount ? (
                  <Chip
                    size="small"
                    icon={<GroupIcon fontSize="small" />}
                    label={`${transcript.data.speakerCount} Speakers`}
                    variant="outlined"
                  />
                ) : null}
                {location && (
                  <Chip
                    size="small"
                    icon={<LocationIcon fontSize="small" />}
                    label={`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                    variant="outlined"
                    component="a"
                    href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                    target="_blank"
                    clickable
                  />
                )}
                {transcript.data?.sentiment && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Sentiment:
                    </Typography>
                    <Chip
                      size="small"
                      label={transcript.data.sentiment}
                      color={
                        transcript.data.sentiment === "POSITIVE"
                          ? "success"
                          : transcript.data.sentiment === "NEGATIVE"
                            ? "error"
                            : transcript.data.sentiment === "MIXED"
                              ? "warning"
                              : "default"
                      }
                      variant={transcript.data.sentiment === "NEUTRAL" ? "outlined" : "filled"}
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>
                )}
              </Stack>

              {transcript.data?.metadata?.sentimentExplanation && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    fontStyle: "italic",
                    borderLeft: "2px solid",
                    borderColor: "divider",
                    pl: 2,
                    py: 0.5,
                  }}
                >
                  {transcript.data.metadata.sentimentExplanation}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} className="no-print">
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              disabled={!transcript.data?.transcript}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportAnchor}
              open={Boolean(exportAnchor)}
              onClose={() => setExportAnchor(null)}
            >
              <MenuItem onClick={handleExportPdf}>Export to PDF</MenuItem>
              <MenuItem onClick={handleExportMarkdown}>Export to Markdown</MenuItem>
              <MenuItem onClick={handleExportDocx}>Export to Word (.docx)</MenuItem>
            </Menu>
          </Stack>
        </Stack>

        <SyncBadges tasks={transcript.data?.metadata?.postMeetingTasks} />

        <Divider sx={{ mb: 4, mt: 2 }} />

        {/* Content */}
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recording Details
            </Typography>

            {transcript.data?.metadata?.processingStatus === "PENDING" ? (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 4,
                  bgcolor: "background.default",
                  borderRadius: 2,
                }}
              >
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  AI is analyzing your recording...
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", maxWidth: 400 }}
                >
                  This process might take up to 30 seconds for long transcripts. The page will
                  refresh automatically when finished.
                </Typography>
              </Box>
            ) : (
              <>
                {isFailedTranscript && (
                  <Alert
                    severity="error"
                    sx={{ mt: 2, mb: 3 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        startIcon={
                          isReprocessing ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <RefreshIcon />
                          )
                        }
                        onClick={handleReprocess}
                        disabled={isReprocessing}
                      >
                        {isReprocessing ? "Retrying…" : "Retry"}
                      </Button>
                    }
                  >
                    {transcript.data?.metadata?.errorMessage ||
                      "The AI worker encountered an error while processing this transcript. Tasks and summaries could not be generated."}
                  </Alert>
                )}
                {transcript.data?.metadata?.processingStatus === "REFINING_TASKS" && (
                  <Alert severity="info" sx={{ mb: 2 }} icon={<CircularProgress size={16} />}>
                    Enriching tickets with codebase context… Tasks are usable now and will be
                    updated shortly.
                  </Alert>
                )}
                <Box sx={{ mb: 2 }}>
                  <ExtractionReasoningPanel
                    reasoning={
                      (transcript.data?.metadata as Record<string, unknown> | null | undefined)
                        ?.extractionReasoning as string | undefined
                    }
                  />
                </Box>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
                >
                  {transcript.data?.summary && (
                    <Tab label="AI Summary" value="summary" sx={{ fontWeight: 600 }} />
                  )}
                  {transcript.data?.documents && transcript.data.documents.length > 0 && (
                    <Tab label="Generated Docs" value="documents" sx={{ fontWeight: 600 }} />
                  )}
                  {transcript.data?.metadata?.keyPoints &&
                    transcript.data.metadata.keyPoints.length > 0 && (
                      <Tab
                        label="Key Points & Pain Points"
                        value="keypoints"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  <Tab label="Raw Transcript" value="transcript" sx={{ fontWeight: 600 }} />
                  {(transcript.data?.metadata as { speakers?: unknown[] } | null)?.speakers &&
                    (transcript.data?.metadata as { speakers: unknown[] }).speakers.length > 0 && (
                      <Tab label="Speakers" value="speakers" sx={{ fontWeight: 600 }} />
                    )}
                  {generatedChart && (
                    <Tab label="Architecture Map" value="architecture" sx={{ fontWeight: 600 }} />
                  )}
                  {transcript.data?.chatThread &&
                    transcript.data.chatThread.messages.length > 0 && (
                      <Tab label="Live Chat" value="chat" sx={{ fontWeight: 600 }} />
                    )}
                  {(() => {
                    const pt = transcript.data?.metadata?.postMeetingTasks;
                    const hasErrors =
                      transcript.data?.metadata?.errorMessage ||
                      (pt && Object.values(pt).some((s) => s?.status === "FAILED"));
                    return hasErrors ? (
                      <Tab
                        label="Errors"
                        value="errors"
                        sx={{ fontWeight: 600, color: "error.main" }}
                      />
                    ) : null;
                  })()}
                  <Tab label="Metadata" value="metadata" sx={{ fontWeight: 600 }} />
                </Tabs>

                {tabValue === "summary" && (
                  <Box sx={{ p: 3, bgcolor: "action.hover", borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, fontSize: "1.05rem" }}>
                      {transcript.data?.summary}
                    </Typography>
                  </Box>
                )}

                {tabValue === "documents" && (
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Generated Documents
                    </Typography>
                    <Stack spacing={2}>
                      {(transcript.data?.documents || []).map((doc) => (
                        <Card
                          key={doc.id}
                          variant="outlined"
                          sx={{ "&:hover": { bgcolor: "action.hover", cursor: "pointer" } }}
                          onClick={() => navigate(`/docs/view/${doc.id}`)}
                        >
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {doc.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Status: {doc.status}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}

                {tabValue === "keypoints" && (
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Critical Insights & Pain Points
                    </Typography>
                    <Stack spacing={2} component="ul" sx={{ m: 0, pl: 2 }}>
                      {(transcript.data?.metadata?.keyPoints || []).map((point, idx) => (
                        <Typography
                          component="li"
                          key={idx}
                          variant="body1"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {point}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                {tabValue === "transcript" && (
                  <Box
                    sx={{
                      position: "relative",
                      p: 3,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={handleCopy}
                      disabled={copying || !transcript.data?.transcript}
                      sx={{ position: "absolute", top: 16, right: 16 }}
                    >
                      {copying ? "Copied!" : "Copy Text"}
                    </Button>
                    <Box sx={{ mt: 4 }}>
                      <TranscriptBody transcript={transcript.data} />
                    </Box>
                  </Box>
                )}

                {tabValue === "speakers" && (
                  <Box sx={{ p: { xs: 0, md: 2 } }}>
                    <SpeakerInsightsTab
                      transcriptId={recordingId ?? null}
                      speakers={
                        (
                          transcript.data?.metadata as {
                            speakers?: SpeakerInsight[];
                          } | null
                        )?.speakers ?? []
                      }
                      principalSpeakerLabel={
                        (
                          transcript.data?.metadata as {
                            principalSpeaker?: string;
                          } | null
                        )?.principalSpeaker ?? null
                      }
                    />
                  </Box>
                )}

                {tabValue === "architecture" && generatedChart && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <MermaidRenderer chart={generatedChart} />
                  </Box>
                )}

                {tabValue === "chat" && transcript.data?.chatThread && (
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {transcript.data.chatThread.messages.map((msg, idx) => (
                      <ChatMessageItem key={idx} msg={msg} />
                    ))}
                  </Box>
                )}

                {tabValue === "errors" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {transcript.data?.metadata?.errorMessage && (
                      <Alert severity="error">
                        <strong>Processing error:</strong> {transcript.data.metadata.errorMessage}
                      </Alert>
                    )}
                    {(() => {
                      const pt = transcript.data?.metadata?.postMeetingTasks;
                      if (!pt) return null;
                      return Object.entries(pt)
                        .filter(([, s]) => s?.status === "FAILED")
                        .map(([kind, status]) => (
                          <Alert key={kind} severity="error">
                            <strong>{kind} sync failed:</strong> {status?.error || "Unknown error"}
                          </Alert>
                        ));
                    })()}
                  </Box>
                )}

                {tabValue === "metadata" && (
                  <Box
                    sx={{
                      position: "relative",
                      p: 2,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      maxHeight: 600,
                      overflow: "auto",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() =>
                        navigator.clipboard.writeText(
                          JSON.stringify(transcript.data?.metadata ?? {}, null, 2),
                        )
                      }
                      sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                      Copy JSON
                    </Button>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        mt: 4,
                        fontSize: "0.8rem",
                        fontFamily: "monospace",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {JSON.stringify(transcript.data?.metadata ?? {}, null, 2)}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </SidebarLayout>
  );
};

export default RecordingDetail;
