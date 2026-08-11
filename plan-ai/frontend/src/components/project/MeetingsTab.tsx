import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useTranslation } from "react-i18next";
import { useListProjectTranscriptsQuery } from "../../store/apis/projectApi";
import MeetingsChatDrawer from "./MeetingsChatDrawer";

interface MeetingsTabProps {
  projectId: string;
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  general: "General",
  briefing: "Briefing / Discovery",
  tasks: "Tasks / Standup",
  decision: "Decision / Strategy",
  client: "Client",
};

/**
 * The questions teams actually ask every week, as one-click chips. The chat
 * already answers all of these — but a blank input gets ignored, so the value
 * here is purely that the user no longer has to think of the question.
 * `label` is the chip; `prompt` is what actually gets sent.
 */
const SAVED_QUESTIONS = [
  {
    key: "catchUp",
    labelKey: "meetings.saved.catchUp.label",
    labelFallback: "Catch me up",
    promptKey: "meetings.saved.catchUp.prompt",
    promptFallback:
      "Catch me up on this project: what has happened across these meetings, where do we stand right now, and what changed most recently?",
  },
  {
    key: "pending",
    labelKey: "meetings.saved.pending.label",
    labelFallback: "What's pending",
    promptKey: "meetings.saved.pending.prompt",
    promptFallback:
      "List every open action item and commitment from these meetings that is still outstanding. Include who owns each one and flag anything that looks overdue or blocked.",
  },
  {
    key: "decisions",
    labelKey: "meetings.saved.decisions.label",
    labelFallback: "Decisions taken",
    promptKey: "meetings.saved.decisions.prompt",
    promptFallback:
      "List the concrete decisions agreed across these meetings. For each one, say which meeting it came from and what the reasoning was.",
  },
  {
    key: "risks",
    labelKey: "meetings.saved.risks.label",
    labelFallback: "Risks & blockers",
    promptKey: "meetings.saved.risks.prompt",
    promptFallback:
      "What risks, blockers, concerns or points of friction have come up across these meetings? Include anything a client complained about or pushed back on.",
  },
  {
    key: "nextMeeting",
    labelKey: "meetings.saved.nextMeeting.label",
    labelFallback: "Prep next meeting",
    promptKey: "meetings.saved.nextMeeting.prompt",
    promptFallback:
      "Prepare me for the next meeting on this project: what was decided last time, what we promised and haven't delivered, what is still open, and which questions I should ask.",
  },
  {
    key: "promises",
    labelKey: "meetings.saved.promises.label",
    labelFallback: "What we promised",
    promptKey: "meetings.saved.promises.prompt",
    promptFallback:
      "What have we promised or committed to the client across these meetings? Flag anything that was promised but doesn't appear to have been delivered yet.",
  },
] as const;

/** Output chips derived from a transcript's postMeetingTasks metadata. */
const OutputChips: React.FC<{ metadata: Record<string, unknown> | null }> = ({ metadata }) => {
  const pmt = (metadata?.postMeetingTasks as Record<string, { status?: string }> | undefined) ?? {};
  const chips: React.ReactNode[] = [];
  if (pmt.doc)
    chips.push(
      <Chip key="doc" size="small" icon={<ArticleOutlinedIcon />} label="Doc" variant="outlined" />,
    );
  if (pmt.slides)
    chips.push(
      <Chip
        key="slides"
        size="small"
        icon={<SlideshowOutlinedIcon />}
        label="Slides"
        variant="outlined"
      />,
    );
  const integrations = ["jira", "linear", "trello", "notion", "asana"].filter((k) => pmt[k]);
  if (integrations.length > 0) {
    chips.push(
      <Chip
        key="tickets"
        size="small"
        icon={<AssignmentOutlinedIcon />}
        label="Tickets"
        variant="outlined"
      />,
    );
  }
  if (chips.length === 0) return null;
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
      {chips}
    </Stack>
  );
};

const MeetingsTab: React.FC<MeetingsTabProps> = ({ projectId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: transcriptsData, isLoading } = useListProjectTranscriptsQuery(
    { projectId, params: undefined },
    { skip: !projectId },
  );

  const meetings = transcriptsData?.data?.transcripts ?? [];
  const [chatOpen, setChatOpen] = React.useState(false);
  const [presetQuestion, setPresetQuestion] = React.useState<string | undefined>(undefined);

  return (
    <Stack spacing={3}>
      {/* The Project Digest card used to live here. It now sits above the tabs
          (ProjectDigestBanner) so it's the first thing seen when opening a
          project, instead of being buried two clicks deep in this tab. */}

      {/* Saved questions — the questions a team actually asks every week.
          An empty chat box gets ignored; a row of concrete questions gets used.
          These run against the same meetings context as the free-form chat. */}
      {meetings.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {t("meetings.saved.title", "Quick answers")}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {SAVED_QUESTIONS.map((q) => (
              <Chip
                key={q.key}
                icon={<AutoAwesomeIcon fontSize="small" />}
                label={t(q.labelKey, q.labelFallback)}
                onClick={() => {
                  setPresetQuestion(t(q.promptKey, q.promptFallback));
                  setChatOpen(true);
                }}
                variant="outlined"
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Divider />

      {/* Meetings timeline */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="overline" color="text.secondary">
          {t("meetings.timeline", "Meetings")} ({meetings.length})
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<QuestionAnswerOutlinedIcon />}
          onClick={() => {
            setPresetQuestion(undefined);
            setChatOpen(true);
          }}
          disabled={meetings.length === 0}
        >
          {t("meetings.chat.cta", "Ask about meetings")}
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : meetings.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("meetings.empty", "No meetings yet. Record or upload one to get started.")}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {meetings.map((m) => {
            const meta = (m.metadata as Record<string, unknown> | null) ?? {};
            const meetingType = typeof meta.meetingType === "string" ? meta.meetingType : "general";
            const isConfidential = meta.confidential === true;
            const recorded = m.recordedAt ? new Date(m.recordedAt) : null;
            return (
              <Card key={m.id} variant="outlined">
                <CardActionArea
                  onClick={() => navigate(`/projects/${projectId}/info/transcripts/${m.id}`)}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      sx={{ mb: 0.5, gap: 0.5 }}
                    >
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={MEETING_TYPE_LABELS[meetingType] ?? meetingType}
                      />
                      {isConfidential && (
                        <Chip
                          size="small"
                          color="warning"
                          icon={<LockOutlinedIcon />}
                          label={t("meetings.confidential", "Confidential")}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {recorded ? recorded.toLocaleString() : ""}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {m.title ?? t("meetings.untitled", "Untitled meeting")}
                    </Typography>
                    {m.summary && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
                        {m.summary.length > 200 ? `${m.summary.slice(0, 200)}…` : m.summary}
                      </Typography>
                    )}
                    <OutputChips metadata={meta} />
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      )}

      <Box>
        <Link
          component={RouterLink}
          to={`/projects/${projectId}/info`}
          underline="hover"
          variant="body2"
        >
          {t("meetings.viewAllInfo", "View full project info →")}
        </Link>
      </Box>

      <MeetingsChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        projectId={projectId}
        meetings={meetings}
        initialQuestion={presetQuestion}
      />
    </Stack>
  );
};

export default MeetingsTab;
