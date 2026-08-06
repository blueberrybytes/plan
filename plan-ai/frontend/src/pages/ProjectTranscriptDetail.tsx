/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  DescriptionOutlined,
  Place as LocationIcon,
} from "@mui/icons-material";
import SidebarLayout from "../components/layout/SidebarLayout";
import {
  useGetProjectQuery,
  useGetProjectTranscriptQuery,
  useListProjectTasksQuery,
  useReprocessProjectTranscriptMutation,
} from "../store/apis/projectApi";
import { useTranslation } from "react-i18next";
import { ContentCopy as CopyIcon, Check as CheckIcon } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import ReactJson from "react-json-view";
import MermaidRenderer from "../components/common/MermaidRenderer";
import { AiGraphTrace, ContextGraph } from "../components/project/ContextGraph";
import PostMeetingTasksPanel from "../components/project/PostMeetingTasksPanel";
import PainPointsPanel from "../components/project/PainPointsPanel";
import ExtractionReasoningPanel from "../components/transcripts/ExtractionReasoningPanel";
import SpeakerInsightsTab, {
  type SpeakerInsight,
} from "../components/transcript/SpeakerInsightsTab";
import TranscriptBody from "../components/transcript/TranscriptBody";
import type { components } from "../types/api";

type TranscriptMetadata = components["schemas"]["TranscriptMetadata"];

const ChatMessageItem = ({ msg }: { msg: { role: string; content: string } }) => {
  const [copied, setCopied] = React.useState(false);
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

const formatDateTime = (value: string | null | undefined, fallback: string) => {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
};

const ProjectTranscriptDetail: React.FC = () => {
  const params = useParams();
  const projectId = params.projectId ?? null;
  const transcriptId = params.transcriptId ?? null;
  const { t } = useTranslation();

  const {
    isLoading: isSessionLoading,
    error: sessionError,
    refetch: refetchSession,
  } = useGetProjectQuery(projectId ?? "", { skip: !projectId });

  const [pollingInterval, setPollingInterval] = React.useState(0);

  const {
    data: transcriptData,
    isLoading: isTranscriptLoading,
    isFetching: isTranscriptFetching,
    error: transcriptError,
    refetch: refetchTranscript,
  } = useGetProjectTranscriptQuery(
    { projectId: projectId ?? "", transcriptId: transcriptId ?? "" },
    { skip: !projectId || !transcriptId, pollingInterval },
  );

  React.useEffect(() => {
    const meta = transcriptData?.data?.metadata as TranscriptMetadata | null | undefined;
    const status = meta?.processingStatus;
    const isPending =
      status === "PENDING" || status === "EXTRACTING_TASKS" || status === "REFINING_TASKS";
    const hasPendingPostMeetingTask =
      meta?.postMeetingTasks &&
      Object.values(meta.postMeetingTasks).some((t) => t?.status === "PENDING");
    setPollingInterval(isPending || hasPendingPostMeetingTask ? 3000 : 0);
  }, [transcriptData]);

  const [reprocessTranscript, { isLoading: isReprocessing }] =
    useReprocessProjectTranscriptMutation();

  const handleReprocess = async () => {
    if (!projectId || !transcriptId) return;
    try {
      await reprocessTranscript({ projectId, transcriptId }).unwrap();
      // Flip to the PENDING spinner immediately and start polling.
      setPollingInterval(3000);
      refetchTranscript();
    } catch {
      // Surfaced inline below via the still-visible Retry button; polling stays off.
    }
  };

  const { data: allTasksData } = useListProjectTasksQuery(
    { projectId: projectId ?? "" },
    { skip: !projectId || !transcriptData?.data },
  );

  const [tabValue, setTabValue] = React.useState("transcript");

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const transcriptTasks = React.useMemo(() => {
    if (!allTasksData?.data?.tasks || !transcriptId) return [];
    return allTasksData.data.tasks.filter((task) => {
      const metadata = task.metadata as Record<string, unknown> | null;
      return metadata && metadata.generatedFromTranscriptId === transcriptId;
    });
  }, [allTasksData, transcriptId]);

  const generateMermaidFromTasks = () => {
    if (!transcriptTasks || transcriptTasks.length === 0) return null;
    let code = "graph TD;\n";

    const statusColors: Record<string, string> = {
      COMPLETED: "fill:#4caf50",
      IN_PROGRESS: "fill:#2196f3",
      BLOCKED: "fill:#f44336",
      BACKLOG: "fill:#9e9e9e",
      ARCHIVED: "fill:#757575",
    };

    const nodes = new Map<string, string>();
    transcriptTasks.forEach((t) => {
      const cleanId = t.id.replace(/[^a-zA-Z0-9]/g, "");
      nodes.set(t.id, cleanId);
      const title = (t.title || "Untitled").replace(/"/g, "'").replace(/\n/g, " ");
      code += `  ${cleanId}["[${String(t.status).replace("_", " ")}]<br/>${title}"];\n`;
      if (t.status && statusColors[t.status]) {
        code += `  style ${cleanId} ${statusColors[t.status]},stroke:#fff,stroke-width:2px,color:#fff;\n`;
      }
    });

    transcriptTasks.forEach((t) => {
      const cleanId = nodes.get(t.id);
      if (t.dependencies && t.dependencies.length > 0) {
        t.dependencies.forEach((depId) => {
          const depNode = nodes.get(depId);
          if (depNode && cleanId) {
            code += `  ${depNode} --> ${cleanId};\n`;
          }
        });
      }
    });
    return code;
  };

  const generatedChart = generateMermaidFromTasks();

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  if (!transcriptId) {
    return <Navigate to={`/projects/${projectId}/info`} replace />;
  }

  const transcript = transcriptData?.data ?? null;

  // Treat "legacy" masked transcripts (completed-with-error-title + 0 tasks,
  // from before the backend threw on AI failure) as failed so they surface the
  // Retry affordance instead of rendering the fallback error text as a summary.
  const isErrorTitle =
    (transcript?.title ?? "").startsWith("Processing Error") ||
    (transcript?.title ?? "").startsWith("Failed Transcript") ||
    (transcript?.title ?? "").startsWith("Authentication Error");
  const isFailedTranscript =
    (transcript?.metadata as { processingStatus?: string })?.processingStatus === "FAILED" ||
    isErrorTitle;

  const sessionErrorMessage = (() => {
    if (!sessionError) {
      return null;
    }

    if ("status" in sessionError) {
      if (typeof sessionError.data === "string") {
        return sessionError.data;
      }
      if (
        typeof sessionError.data === "object" &&
        sessionError.data !== null &&
        "message" in sessionError.data &&
        typeof (sessionError.data as { message?: string }).message === "string"
      ) {
        return (sessionError.data as { message?: string }).message;
      }
      return typeof sessionError.status === "number"
        ? t("projectTranscriptDetail.messages.sessionErrorStatus", { status: sessionError.status })
        : t("projectTranscriptDetail.messages.sessionErrorFallback");
    }

    return (
      (sessionError as { message?: string }).message ??
      t("projectTranscriptDetail.messages.sessionErrorFallback")
    );
  })();

  const transcriptErrorMessage = (() => {
    if (!transcriptError) {
      return null;
    }

    if ("status" in transcriptError) {
      if (typeof transcriptError.data === "string") {
        return transcriptError.data;
      }
      if (
        typeof transcriptError.data === "object" &&
        transcriptError.data !== null &&
        "message" in transcriptError.data &&
        typeof (transcriptError.data as { message?: string }).message === "string"
      ) {
        return (transcriptError.data as { message?: string }).message;
      }
      return typeof transcriptError.status === "number"
        ? t("projectTranscriptDetail.messages.transcriptErrorStatus", {
            status: transcriptError.status,
          })
        : t("projectTranscriptDetail.messages.transcriptErrorFallback");
    }

    return (
      (transcriptError as { message?: string }).message ??
      t("projectTranscriptDetail.messages.transcriptErrorFallback")
    );
  })();

  const handleRefresh = () => {
    refetchTranscript();
    refetchSession();
  };

  return (
    <SidebarLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          px: { xs: 2, md: 3 },
          py: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Breadcrumbs
            aria-label={t("projectTranscriptDetail.breadcrumbs.aria")}
            sx={{ flexGrow: 1 }}
          >
            <Link component={RouterLink} underline="hover" color="inherit" to="/projects">
              {t("projectTranscriptDetail.breadcrumbs.sessions")}
            </Link>
            <Link
              component={RouterLink}
              underline="hover"
              color="inherit"
              to={`/projects/${projectId}`}
            >
              {t("projectTranscriptDetail.breadcrumbs.workspace")}
            </Link>
            <Link
              component={RouterLink}
              underline="hover"
              color="inherit"
              to={`/projects/${projectId}/info`}
            >
              {t("projectTranscriptDetail.breadcrumbs.info")}
            </Link>
            <Typography color="text.primary">
              {t("projectTranscriptDetail.breadcrumbs.transcript")}
            </Typography>
          </Breadcrumbs>

          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              to={`/projects/${projectId}/info`}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
            >
              {t("projectTranscriptDetail.buttons.backToInfo")}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isTranscriptFetching || isSessionLoading}
            >
              {t("projectTranscriptDetail.buttons.refresh")}
            </Button>
          </Stack>
        </Stack>

        {isTranscriptLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : transcriptErrorMessage ? (
          <Alert severity="error">{transcriptErrorMessage}</Alert>
        ) : !transcript ? (
          <Alert severity="warning">
            {t("projectTranscriptDetail.messages.transcriptNotFound")}
          </Alert>
        ) : (
          <Stack spacing={3}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {transcript.title ?? t("projectTranscriptDetail.messages.untitled")}
                    </Typography>
                    {transcript.source ? (
                      <Chip
                        label={transcript.source}
                        icon={<DescriptionOutlined />}
                        color="primary"
                        variant="outlined"
                      />
                    ) : null}
                    {transcript.language ? (
                      <Chip label={transcript.language} variant="outlined" />
                    ) : null}
                    {(transcript.metadata as any)?.location && (
                      <Chip
                        size="small"
                        icon={<LocationIcon fontSize="small" />}
                        label={`${(transcript.metadata as any).location.latitude.toFixed(4)}, ${(transcript.metadata as any).location.longitude.toFixed(4)}`}
                        variant="outlined"
                        component="a"
                        href={`https://www.google.com/maps/search/?api=1&query=${(transcript.metadata as any).location.latitude},${(transcript.metadata as any).location.longitude}`}
                        target="_blank"
                        clickable
                      />
                    )}
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                    <Stack spacing={0.5}>
                      <Typography variant="overline" color="text.secondary">
                        {t("projectTranscriptDetail.meta.recorded")}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(
                          transcript.recordedAt,
                          t("projectTranscriptDetail.table.missing"),
                        )}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="overline" color="text.secondary">
                        {t("projectTranscriptDetail.meta.created")}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(
                          transcript.createdAt,
                          t("projectTranscriptDetail.table.missing"),
                        )}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="overline" color="text.secondary">
                        {t("projectTranscriptDetail.meta.updated")}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(
                          transcript.updatedAt,
                          t("projectTranscriptDetail.table.missing"),
                        )}
                      </Typography>
                    </Stack>
                  </Stack>

                  {transcript.summary && !isFailedTranscript ? (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {t("projectTranscriptDetail.sections.summary")}
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {transcript.summary}
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            {!isFailedTranscript && (
              <PainPointsPanel
                painPoints={transcript.painPoints}
                projectId={projectId ?? ""}
                transcriptId={transcript.id}
              />
            )}

            {(transcript.metadata as { processingStatus?: string })?.processingStatus ===
            "PENDING" ? (
              <Card variant="outlined">
                <CardContent
                  sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6 }}
                >
                  <CircularProgress size={48} sx={{ mb: 3 }} />
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
                </CardContent>
              </Card>
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
                    The AI worker encountered an error while processing this transcript:{" "}
                    <strong>{(transcript.metadata as any)?.errorMessage || "Unknown Error"}</strong>
                    <br />
                    <br />
                    Tasks and summaries could not be generated.
                  </Alert>
                )}
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      {(transcript.metadata as any)?.processingStatus === "EXTRACTING_TASKS" && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          🤖 AI is currently extracting tasks from this transcript in the
                          background. They will appear here shortly!
                        </Alert>
                      )}
                      {(transcript.metadata as any)?.processingStatus === "REFINING_TASKS" && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          ✨ Enriching tickets with codebase context… Tasks are usable now and will
                          be updated shortly.
                        </Alert>
                      )}
                      <ExtractionReasoningPanel
                        reasoning={(transcript.metadata as any)?.extractionReasoning}
                      />
                      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                          value={tabValue}
                          onChange={handleTabChange}
                          variant="scrollable"
                          scrollButtons="auto"
                        >
                          <Tab label="Raw Transcript" value="transcript" sx={{ fontWeight: 600 }} />
                          {Boolean(
                            (transcript.metadata as Record<string, unknown>)?.aiGraphTrace,
                          ) && (
                            <Tab
                              label="✨ AI Context Graph"
                              value="context-graph"
                              sx={{ fontWeight: 600, color: "primary.main" }}
                            />
                          )}
                          {transcriptTasks && transcriptTasks.length > 0 && generatedChart && (
                            <Tab
                              label="Architecture Map"
                              value="architecture"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                          {(() => {
                            const meta = transcript.metadata as TranscriptMetadata | null;
                            const pt = meta?.postMeetingTasks;
                            const hasErrors =
                              meta?.errorMessage ||
                              (pt && Object.values(pt).some((s) => s?.status === "FAILED"));
                            return hasErrors ? (
                              <Tab
                                label="Errors"
                                value="errors"
                                sx={{ fontWeight: 600, color: "error.main" }}
                              />
                            ) : null;
                          })()}
                          {(() => {
                            const speakers = (
                              transcript.metadata as { speakers?: SpeakerInsight[] } | null
                            )?.speakers;
                            return speakers && speakers.length > 0 ? (
                              <Tab label="Speakers" value="speakers" sx={{ fontWeight: 600 }} />
                            ) : null;
                          })()}
                          <Tab label="Metadata" value="metadata" sx={{ fontWeight: 600 }} />
                        </Tabs>
                      </Box>

                      {tabValue === "context-graph" &&
                        (() => {
                          const trace = (transcript.metadata as Record<string, unknown>)
                            ?.aiGraphTrace as AiGraphTrace | undefined;
                          if (!trace || !Array.isArray(trace.nodes) || trace.nodes.length === 0)
                            return null;
                          return (
                            <Box sx={{ mt: 2 }}>
                              <ContextGraph height={400} nodes={trace.nodes} links={trace.links} />
                            </Box>
                          );
                        })()}

                      {tabValue === "transcript" && (
                        <Box sx={{ mt: 2 }}>
                          <TranscriptBody transcript={transcript} />
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

                      {tabValue === "errors" && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
                          {(transcript.metadata as TranscriptMetadata | null)?.errorMessage && (
                            <Alert severity="error">
                              <strong>Processing error:</strong>{" "}
                              {(transcript.metadata as TranscriptMetadata).errorMessage}
                            </Alert>
                          )}
                          {(() => {
                            const pt = (transcript.metadata as TranscriptMetadata | null)
                              ?.postMeetingTasks;
                            if (!pt) return null;
                            return Object.entries(pt)
                              .filter(([, s]) => s?.status === "FAILED")
                              .map(([kind, status]) => (
                                <Alert key={kind} severity="error">
                                  <strong>{kind} sync failed:</strong>{" "}
                                  {status?.error || "Unknown error"}
                                </Alert>
                              ));
                          })()}
                        </Box>
                      )}

                      {tabValue === "speakers" && (
                        <Box sx={{ mt: 2 }}>
                          <SpeakerInsightsTab
                            transcriptId={transcriptId}
                            onSpeakersUpdated={() => {
                              // Project transcripts are cached by projectApi, out of
                              // reach of transcriptApi's tag invalidation — refetch.
                              void refetchTranscript();
                            }}
                            speakers={
                              (transcript.metadata as { speakers?: SpeakerInsight[] } | null)
                                ?.speakers ?? []
                            }
                            principalSpeakerLabel={
                              (transcript.metadata as { principalSpeaker?: string } | null)
                                ?.principalSpeaker ?? null
                            }
                          />
                        </Box>
                      )}

                      {tabValue === "metadata" && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            overflow: "auto",
                          }}
                        >
                          <ReactJson
                            src={(transcript.metadata as Record<string, unknown>) || {}}
                            theme="monokai"
                            collapsed={2}
                            displayDataTypes={false}
                            enableClipboard={false}
                            name={false}
                            style={{ backgroundColor: "transparent", fontSize: "0.9rem" }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </>
            )}

            <PostMeetingTasksPanel
              tasks={(transcript.metadata as TranscriptMetadata | null)?.postMeetingTasks}
              transcriptId={transcript.id}
            />

            {transcript.chatThread && transcript.chatThread.messages.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Live Chat History
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "background.paper",
                        p: 2,
                        borderRadius: 1,
                      }}
                    >
                      {transcript.chatThread.messages.map((msg, idx) => (
                        <ChatMessageItem key={idx} msg={msg} />
                      ))}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t("projectTranscriptDetail.sections.metadata")}
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: "background.paper",
                      p: 2,
                      borderRadius: 1,
                      overflowX: "auto",
                    }}
                  >
                    <ReactJson
                      src={(transcript.metadata as Record<string, unknown>) || {}}
                      collapsed={1}
                      displayDataTypes={false}
                      enableClipboard={false}
                      name={false}
                      style={{ backgroundColor: "transparent", fontSize: "0.9rem" }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {sessionErrorMessage ? <Alert severity="warning">{sessionErrorMessage}</Alert> : null}
      </Box>
    </SidebarLayout>
  );
};

export default ProjectTranscriptDetail;
