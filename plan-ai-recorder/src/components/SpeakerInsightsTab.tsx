import React from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Person as PersonIcon,
  FormatQuote as QuoteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { components } from "../types/api";

// Sourced from the generated backend swagger — never hand-write this shape.
export type SpeakerInsight = components["schemas"]["SpeakerInsight"];

interface SpeakerInsightsTabProps {
  speakers?: SpeakerInsight[] | null;
  principalSpeakerLabel?: string | null;
  /**
   * Called when the user confirms an inline rename with (diarization label,
   * corrected name). A blank name clears the identification. Should PUT the
   * override to the backend and update the transcript state; a rejection is
   * surfaced inline next to the input. Omit to hide the edit buttons.
   */
  onRenameSpeaker?: (label: string, name: string) => Promise<void>;
}

const SENTIMENT_COLOR: Record<
  NonNullable<SpeakerInsight["sentiment"]>,
  "success" | "default" | "error" | "warning"
> = {
  POSITIVE: "success",
  NEUTRAL: "default",
  NEGATIVE: "error",
  MIXED: "warning",
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const initialsFor = (name: string | null, label: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  const labelMatch = label.match(/(\D+)\s*(\d+)/);
  if (labelMatch) return `${labelMatch[1][0].toUpperCase()}${labelMatch[2]}`;
  return label.slice(0, 2).toUpperCase();
};

const SpeakerInsightsTab: React.FC<SpeakerInsightsTabProps> = ({
  speakers,
  principalSpeakerLabel,
  onRenameSpeaker,
}) => {
  // Inline speaker-name editing. Keyed by the stable diarization label so at
  // most one row is in edit mode at a time.
  const [editingLabel, setEditingLabel] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const startEditing = (s: SpeakerInsight) => {
    setEditingLabel(s.label);
    setEditValue(s.identifiedName ?? "");
    setEditError(null);
  };

  const cancelEditing = () => {
    if (saving) return;
    setEditingLabel(null);
    setEditError(null);
  };

  const confirmEditing = async () => {
    if (editingLabel === null || !onRenameSpeaker || saving) return;
    setSaving(true);
    setEditError(null);
    try {
      // Blank clears the identification (backend contract).
      await onRenameSpeaker(editingLabel, editValue.trim());
      setEditingLabel(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update speaker name",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!speakers || speakers.length === 0) {
    return (
      <Alert severity="info">
        No speaker breakdown available. This usually means the recording wasn&apos;t diarized
        (text-only transcript) or processing hasn&apos;t finished yet.
      </Alert>
    );
  }

  const sorted = [...speakers].sort((a, b) => {
    if (a.isPrincipalSpeaker !== b.isPrincipalSpeaker) {
      return a.isPrincipalSpeaker ? -1 : 1;
    }
    return b.speakingTimeSeconds - a.speakingTimeSeconds;
  });

  return (
    <Stack spacing={2}>
      {sorted.map((s) => {
        const displayName = s.identifiedName || s.label;
        const isPrincipal = s.isPrincipalSpeaker || principalSpeakerLabel === s.label;
        return (
          <Card key={s.label} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                  sx={{
                    bgcolor: isPrincipal ? "primary.main" : "secondary.main",
                    width: 48,
                    height: 48,
                    fontWeight: 600,
                  }}
                >
                  {s.identifiedName ? initialsFor(s.identifiedName, s.label) : <PersonIcon />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ mb: 0.5 }}
                  >
                    {editingLabel === s.label ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <TextField
                          size="small"
                          variant="standard"
                          autoFocus
                          value={editValue}
                          placeholder={s.label}
                          disabled={saving}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void confirmEditing();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEditing();
                            }
                          }}
                          inputProps={{ "aria-label": "Speaker name" }}
                          sx={{ width: 180, "& input": { fontWeight: 700 } }}
                        />
                        <Tooltip title="Save name (Enter)">
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              disabled={saving}
                              onClick={() => void confirmEditing()}
                              aria-label="Save speaker name"
                            >
                              {saving ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <CheckIcon sx={{ fontSize: 16 }} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Cancel (Esc)">
                          <span>
                            <IconButton
                              size="small"
                              disabled={saving}
                              onClick={cancelEditing}
                              aria-label="Cancel editing speaker name"
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {displayName}
                        </Typography>
                        {onRenameSpeaker && (
                          <Tooltip title="Edit name">
                            <IconButton
                              size="small"
                              onClick={() => startEditing(s)}
                              aria-label={`Edit name for ${displayName}`}
                              sx={{ p: 0.25, color: "text.secondary" }}
                            >
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                    {!s.identifiedName && (
                      <Chip
                        label="unidentified"
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 18 }}
                      />
                    )}
                    {isPrincipal && (
                      <Chip
                        label="You"
                        size="small"
                        color="primary"
                        sx={{ fontSize: "0.65rem", height: 18 }}
                      />
                    )}
                    {s.role && (
                      <Chip
                        label={s.role}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 18 }}
                      />
                    )}
                    {s.sentiment && (
                      <Chip
                        label={s.sentiment.toLowerCase()}
                        size="small"
                        color={SENTIMENT_COLOR[s.sentiment]}
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 18 }}
                      />
                    )}
                  </Stack>
                  {editingLabel === s.label && editError && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      {editError}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    {formatDuration(s.speakingTimeSeconds)} · {s.utteranceCount} utterance
                    {s.utteranceCount === 1 ? "" : "s"}
                    {s.identifiedName ? null : ` · diarized label: ${s.label}`}
                  </Typography>
                  {s.summary && (
                    <Typography
                      variant="body2"
                      sx={{ lineHeight: 1.6, mb: s.keyQuotes?.length ? 1.5 : 0 }}
                    >
                      {s.summary}
                    </Typography>
                  )}
                  {s.keyQuotes && s.keyQuotes.length > 0 && (
                    <Stack spacing={0.75}>
                      {s.keyQuotes.map((q, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "flex-start",
                            pl: 1.5,
                            borderLeft: "3px solid",
                            borderColor: "divider",
                            color: "text.secondary",
                            fontStyle: "italic",
                            fontSize: "0.85rem",
                          }}
                        >
                          <QuoteIcon
                            sx={{ fontSize: 14, mt: 0.4, opacity: 0.6, flexShrink: 0 }}
                          />
                          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                            {q}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default SpeakerInsightsTab;
