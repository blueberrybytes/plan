import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, CircularProgress, Stack, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../store/slices/app/appSlice";
import { useGetProjectQuery, useGenerateProjectDigestMutation } from "../../store/apis/projectApi";

interface ProjectDigestBannerProps {
  projectId: string;
}

interface DigestMeta {
  digestDocId?: string;
  digestGeneratedAt?: string;
  digestMeetingCount?: number;
}

/**
 * The Project Digest surfaced at the TOP of a project, above the tabs.
 *
 * It used to live as a card inside the Meetings tab, which meant the single
 * most valuable artifact in a project — a living synthesis of every meeting —
 * was two clicks deep and nobody knew it existed or that it self-updates.
 * This banner is deliberately compact: one line of value, one primary action.
 */
const ProjectDigestBanner: React.FC<ProjectDigestBannerProps> = ({ projectId }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { data: projectData } = useGetProjectQuery(projectId, { skip: !projectId });
  const [generateDigest, { isLoading: isGenerating }] = useGenerateProjectDigestMutation();

  const meta = (projectData?.data?.metadata as DigestMeta | null) ?? {};
  const { digestDocId, digestGeneratedAt, digestMeetingCount } = meta;

  const handleGenerate = async () => {
    try {
      await generateDigest(projectId).unwrap();
      dispatch(
        setToastMessage({
          severity: "success",
          message: t("meetings.digest.success", "Digest updated."),
        }),
      );
    } catch {
      dispatch(
        setToastMessage({
          severity: "error",
          message: t("meetings.digest.error", "Couldn't update the digest."),
        }),
      );
    }
  };

  const updatedLabel = digestGeneratedAt
    ? new Date(digestGeneratedAt).toLocaleDateString(i18n.language, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        borderColor: "primary.main",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <AutoAwesomeIcon color="primary" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {t("meetings.digest.title", "Project Digest")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {digestDocId
              ? t(
                  "meetings.digest.bannerReady",
                  "Everything decided, pending and at risk across this project's meetings.",
                )
              : t(
                  "meetings.digest.bannerEmpty",
                  "Generate a living synthesis of every meeting: decisions, open action items and next steps.",
                )}
          </Typography>
          {updatedLabel && (
            <Typography variant="caption" color="text.secondary">
              {t("meetings.digest.updatedAt", "Updated {{date}}", { date: updatedLabel })}
              {typeof digestMeetingCount === "number"
                ? ` · ${t("meetings.digest.meetingCount", "{{count}} meetings", {
                    count: digestMeetingCount,
                  })}`
                : ""}
              {` · ${t("meetings.digest.autoUpdates", "updates automatically after each meeting")}`}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {digestDocId && (
            <Button variant="contained" component={RouterLink} to={`/docs/view/${digestDocId}`}>
              {t("meetings.digest.view", "View digest")}
            </Button>
          )}
          <Button
            variant={digestDocId ? "outlined" : "contained"}
            onClick={handleGenerate}
            disabled={isGenerating}
            startIcon={
              isGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />
            }
          >
            {digestDocId
              ? t("meetings.digest.regenerate", "Update digest")
              : t("meetings.digest.generate", "Generate digest")}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

export default ProjectDigestBanner;
