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
  Grid,
  CardActionArea,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Mic as MicIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  Bookmark as ContextIcon,
} from "@mui/icons-material";
import type { components } from "../types/api";
import { useTranslation } from "react-i18next";
import {
  useListGlobalTranscriptsQuery,
  useDeleteTranscriptMutation,
} from "../store/apis/transcriptApi";
import { useListProjectsQuery } from "../store/apis/projectApi";
import SidebarLayout from "../components/layout/SidebarLayout";
import PageHeader from "../components/layout/PageHeader";
import { useNavigate } from "react-router-dom";

const Recordings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all_dates");
  const [sentimentFilter, setSentimentFilter] = useState("all_sentiments");
  const [projectFilter, setProjectFilter] = useState("all_projects");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: projectsData } = useListProjectsQuery(undefined);
  const projects = projectsData?.data?.projects ?? [];

  // Every filter is applied SERVER-SIDE. Date and sentiment used to be filtered
  // on the client, which only ever narrowed the 20 rows of the current page —
  // so "This Week" could show nothing while matching recordings sat on page 2.
  const { data, isLoading, error, refetch, isFetching } = useListGlobalTranscriptsQuery(
    {
      page,
      pageSize: 20,
      source: "RECORDING",
      q: debouncedSearch || undefined,
      projectId: projectFilter !== "all_projects" ? projectFilter : undefined,
      sentiment: sentimentFilter !== "all_sentiments" ? sentimentFilter : undefined,
      dateFilter: dateFilter !== "all_dates" ? dateFilter : undefined,
    },
    { refetchOnFocus: true },
  );

  const [deleteTranscript] = useDeleteTranscriptMutation();

  const handleDelete = async (id: string) => {
    if (window.confirm(t("confirmDeletionDialog.title"))) {
      try {
        await deleteTranscript(id).unwrap();
      } catch (err) {
        console.error("Failed to delete transcript", err);
      }
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <Box sx={{ p: 4 }}>
          <Typography color="error">Failed to load recordings.</Typography>
        </Box>
      </SidebarLayout>
    );
  }

  const transcripts = data?.data?.transcripts || [];

  return (
    <SidebarLayout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title={t("sidebarLayout.nav.recordings")}
          subtitle={t("recordings.subtitle")}
          icon={<MicIcon />}
        />

        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Tooltip title={isFetching ? "Refreshing..." : "Refresh"}>
            <span>
              <IconButton
                onClick={() => refetch()}
                disabled={isLoading || isFetching}
                size="small"
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }}
              >
                {isFetching ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <TextField
            placeholder={t("common.search", "Search recordings...")}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", sm: 300 } }}
          />

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              select
              size="small"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              sx={{ width: 140 }}
            >
              <MenuItem value="all_dates">All Dates</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={sentimentFilter}
              onChange={(e) => {
                setSentimentFilter(e.target.value);
                setPage(1);
              }}
              sx={{ width: 160 }}
            >
              <MenuItem value="all_sentiments">All Sentiments</MenuItem>
              <MenuItem value="POSITIVE">Positive</MenuItem>
              <MenuItem value="MIXED">Mixed</MenuItem>
              <MenuItem value="NEGATIVE">Negative</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(1);
              }}
              sx={{ width: 200 }}
            >
              <MenuItem value="all_projects">{t("recordings.allProjects")}</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {transcripts.length === 0 ? (
          <Card sx={{ textAlign: "center", py: 8 }}>
            <MicIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No recordings found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Download the Desktop App to start capturing live audio.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {transcripts.map(
              (transcript: components["schemas"]["StandaloneTranscriptResponse"]) => {
                const durationFormatted = transcript.durationSeconds
                  ? `${Math.floor(transcript.durationSeconds / 60)}m ${transcript.durationSeconds % 60}s`
                  : null;

                const getSentimentColor = (sentiment?: string | null) => {
                  if (sentiment === "POSITIVE") return "success";
                  if (sentiment === "NEGATIVE") return "error";
                  if (sentiment === "MIXED") return "warning";
                  return "default";
                };

                return (
                  <Grid item xs={12} md={6} lg={4} key={transcript.id}>
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      <CardActionArea
                        onClick={() => navigate(`/recordings/${transcript.id}`)}
                        sx={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Typography
                              variant="h6"
                              sx={{ fontSize: "1.1rem", fontWeight: 600, mb: 1 }}
                            >
                              {transcript.title || "Untitled Recording"}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDelete(transcript.id);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {transcript.recordedAt
                              ? new Date(transcript.recordedAt).toLocaleString()
                              : new Date(transcript.createdAt).toLocaleString()}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              mb: 2,
                            }}
                          >
                            {transcript.summary ||
                              transcript.transcript ||
                              "No transcript content available."}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: "auto", pt: 1 }}
                          >
                            {durationFormatted && (
                              <Chip
                                size="small"
                                icon={<TimeIcon fontSize="small" />}
                                label={durationFormatted}
                                variant="outlined"
                              />
                            )}
                            {transcript.speakerCount ? (
                              <Chip
                                size="small"
                                icon={<GroupIcon fontSize="small" />}
                                label={`${transcript.speakerCount} Speakers`}
                                variant="outlined"
                              />
                            ) : null}
                            {transcript.sentiment && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Sentiment:
                                </Typography>
                                <Chip
                                  size="small"
                                  label={transcript.sentiment}
                                  color={getSentimentColor(transcript.sentiment)}
                                  variant={
                                    transcript.sentiment === "NEUTRAL" ? "outlined" : "filled"
                                  }
                                  sx={{ fontWeight: "bold" }}
                                />
                              </Box>
                            )}
                            {(transcript.contexts ?? []).map((ctx) => (
                              <Chip
                                key={ctx.id}
                                size="small"
                                icon={<ContextIcon fontSize="small" />}
                                label={ctx.name}
                                variant="outlined"
                                sx={{
                                  fontWeight: 500,
                                  borderColor: ctx.color || undefined,
                                  color: ctx.color || undefined,
                                  "& .MuiChip-icon": { color: ctx.color || undefined },
                                }}
                              />
                            ))}
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              },
            )}
          </Grid>
        )}

        {data?.data && data.data.total > 20 && (
          <Stack direction="row" justifyContent="center" sx={{ mt: 4 }} spacing={2}>
            <Button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button disabled={page * 20 >= data.data.total} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </Stack>
        )}
      </Box>
    </SidebarLayout>
  );
};

export default Recordings;
