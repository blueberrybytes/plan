import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  DescriptionOutlined as WordIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SidebarLayout from "../components/layout/SidebarLayout";
import SlideRenderer from "../components/slides/SlideRenderer";
import { SLIDE_TYPES } from "../components/slides/slideTypes";
import { useGetBrandThemesQuery, useDeleteBrandThemeMutation } from "../store/apis/brandThemeApi";
import { downloadThemeTemplateDocx } from "../utils/brandDocx";

const BrandThemes: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    data: themes = [],
    isLoading,
    refetch,
    isFetching,
  } = useGetBrandThemesQuery(undefined, { refetchOnFocus: true });
  const [deleteTheme] = useDeleteBrandThemeMutation();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Feature A: download a theme as a branded Word (.docx) template, ready to keep
  // in Google Docs — the Title/Heading/Normal styles + logo come from the theme.
  const handleDownloadTemplate = async (tmpl: (typeof themes)[number]) => {
    setDownloadingId(tmpl.id);
    try {
      await downloadThemeTemplateDocx({
        name: tmpl.name,
        primaryColor: tmpl.primaryColor,
        secondaryColor: tmpl.secondaryColor,
        textColor: tmpl.textColor,
        headingFont: tmpl.headingFont,
        bodyFont: tmpl.bodyFont,
        logoUrl: tmpl.logoUrl,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this brand theme?")) {
      await deleteTheme(id);
    }
  };

  return (
    <SidebarLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            {t("slides.actions.back")}
          </Button>
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              {t("slides.themes.title")}
            </Typography>
            <IconButton onClick={() => refetch()} disabled={isLoading || isFetching} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/brand-themes/create")}
          >
            {t("slides.themes.create")}
          </Button>
        </Box>

        {isLoading ? (
          <Typography color="text.secondary">{t("slides.themes.loading")}</Typography>
        ) : themes.length === 0 ? (
          <Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">{t("slides.themes.empty")}</Typography>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {themes.map((tmpl) => {
              const brandColors = {
                primary: tmpl.primaryColor || "#6366f1",
                secondary: tmpl.secondaryColor || "#a78bfa",
                background: tmpl.backgroundColor || "#0f172a",
                backgroundStyle:
                  (tmpl.backgroundStyle as "solid" | "gradient" | "mesh" | "minimal" | undefined) ||
                  "solid",
                cardStyle: (tmpl.cardStyle as "flat" | "glass" | "outline" | undefined) || "flat",
                logoUrl: tmpl.logoUrl || null,
              };
              return (
                <Card key={tmpl.id} variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Box
                        onClick={() => navigate(`/brand-themes/${tmpl.id}/edit`)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          cursor: "pointer",
                          "&:hover .theme-name": { textDecoration: "underline" },
                        }}
                      >
                        <Typography className="theme-name" variant="h6" fontWeight={700}>
                          {tmpl.name}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              bgcolor: brandColors.primary,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              bgcolor: brandColors.secondary,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                        </Box>
                        {tmpl.headingFont && (
                          <Chip label={tmpl.headingFont} size="small" variant="outlined" />
                        )}
                        {tmpl.bodyFont && tmpl.bodyFont !== tmpl.headingFont && (
                          <Chip label={tmpl.bodyFont} size="small" variant="outlined" />
                        )}
                      </Box>
                      <Box>
                        <Tooltip
                          title={t("slides.themes.downloadDocx", "Download as Word template")}
                        >
                          <span>
                            <IconButton
                              onClick={() => handleDownloadTemplate(tmpl)}
                              size="small"
                              sx={{ mr: 1 }}
                              disabled={downloadingId === tmpl.id}
                            >
                              {downloadingId === tmpl.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <WordIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={t("slides.themes.editTooltip", "Edit theme")}>
                          <IconButton
                            onClick={() => navigate(`/brand-themes/${tmpl.id}/edit`)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          onClick={() => handleDelete(tmpl.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Slide previews for this theme */}
                    <Grid container spacing={2}>
                      {SLIDE_TYPES.map((st) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={st.key}>
                          <Box sx={{ transform: "scale(1)", transformOrigin: "top left" }}>
                            <SlideRenderer
                              key={st.key}
                              typeKey={st.key}
                              data={st.sampleData}
                              brandColors={brandColors}
                              scale={0.28}
                              animate={true}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            {t(`slides.slideTypes.${st.key}`, st.name)}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </SidebarLayout>
  );
};

export default BrandThemes;
