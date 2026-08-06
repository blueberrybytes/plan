import React from "react";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Paper,
  Button,
  Menu,
  MenuItem,
  useTheme,
  Select,
  FormControlLabel,
  Switch,
  Stack,
} from "@mui/material";
import { getContrastRatio } from "@mui/material/styles";
import { Download as DownloadIcon } from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { exportMarkdownToDocx } from "../utils/docxExport";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MarkdownRenderer from "../components/common/MarkdownRenderer";
import { useGetPublicDocQuery } from "../store/apis/docApi";

const PublicDocView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const muiTheme = useTheme();

  const isFullWidth = searchParams.get("fullWidth") === "true";
  const textSize = searchParams.get("textSize") || "md";
  const {
    data: doc,
    isLoading,
    isError,
  } = useGetPublicDocQuery(id ?? "", {
    refetchOnMountOrArgChange: true,
  });
  const [exportAnchor, setExportAnchor] = React.useState<null | HTMLElement>(null);

  const handleExportPdf = () => {
    setExportAnchor(null);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportMarkdown = () => {
    setExportAnchor(null);
    if (!doc) return;
    const blob = new Blob([doc.content || ""], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = async () => {
    setExportAnchor(null);
    if (!doc) return;
    // Pass the doc's brand theme so the .docx opens on-brand in Google Docs.
    await exportMarkdownToDocx(doc.title, doc.content || "", doc.theme);
  };

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (isError || !doc)
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h5" color="text.secondary">
          {t("docs.view.notFound")}
        </Typography>
      </Box>
    );

  const theme = doc.theme;

  const markdownBg = theme?.backgroundColor || muiTheme.palette.background.paper;
  let text = theme?.textColor || muiTheme.palette.text.primary;

  if (getContrastRatio(text, markdownBg) < 3) {
    text = muiTheme.palette.getContrastText(markdownBg);
  }

  let primary = theme?.primaryColor || muiTheme.palette.primary.main;
  let headerColor = primary;
  if (getContrastRatio(headerColor, markdownBg) < 3) {
    headerColor = text;
  }

  let accent = theme?.secondaryColor || muiTheme.palette.secondary.main;
  if (getContrastRatio(accent, markdownBg) < 3) {
    accent = text;
  }

  let strongColor = theme?.primaryColor || "inherit";
  if (strongColor !== "inherit" && getContrastRatio(strongColor, markdownBg) < 3) {
    strongColor = text;
  }

  const scaleMultiplier = textSize === "sm" ? 0.85 : textSize === "lg" ? 1.15 : 1;

  const markdownSxStyles = {
    color: text,
    fontSize: `${scaleMultiplier}rem`,
    fontFamily: theme?.bodyFont ?? "inherit",
    "& h1": {
      fontSize: `${2.5 * scaleMultiplier}rem`,
      fontFamily: theme?.headingFont ?? "inherit",
      color: `${headerColor} !important`,
    },
    "& h2": {
      fontSize: `${2 * scaleMultiplier}rem`,
      fontFamily: theme?.headingFont ?? "inherit",
      color: `${headerColor} !important`,
      borderBottom: `2px solid ${accent === text ? text : accent + "40"}`,
      pb: 1,
      mb: 2,
    },
    "& h3, & h4, & h5, & h6": {
      fontFamily: theme?.headingFont ?? "inherit",
      color: `${accent} !important`,
    },
    "& a": {
      color: accent,
      textDecoration: "none",
      borderBottom: `1px dotted ${accent}`,
    },
    "& strong": { color: `${strongColor} !important` },
    "& table": { borderCollapse: "collapse", width: "100%", my: 3 },
    "& th": {
      border: "1px solid",
      borderColor: theme?.secondaryColor ?? "rgba(0,0,0,0.1)",
      backgroundColor: theme?.secondaryColor ? `${theme.secondaryColor}15` : "rgba(0,0,0,0.04)",
      color: strongColor,
      p: 1.5,
      textAlign: "left",
    },
    "& td": {
      border: "1px solid",
      borderColor: theme?.secondaryColor ? `${theme.secondaryColor}40` : "rgba(0,0,0,0.1)",
      p: 1.5,
    },
    "& blockquote": {
      borderLeft: `4px solid ${theme?.secondaryColor ?? "#4361EE"}`,
      backgroundColor: theme?.secondaryColor ? `${theme.secondaryColor}0A` : "rgba(0,0,0,0.02)",
      py: 1,
      pr: 2,
      pl: 3,
      my: 3,
      fontStyle: "italic",
    },
    "& code": {
      bgcolor: "rgba(0,0,0,0.06)",
      px: 0.5,
      borderRadius: 1,
      fontFamily: "monospace",
    },
    "& pre": {
      overflowX: "auto",
      maxWidth: "100%",
      p: 2,
    },
  };

  return (
    <Box
      sx={() => {
        return {
          minHeight: "100vh",
          bgcolor: markdownBg,
          color: "text.primary",
        };
      }}
    >
      <Helmet>
        <title>{`${doc.title} | Plan AI`}</title>
        <meta name="description" content={`View document: ${doc.title}`} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`${doc.title} | Plan AI`} />
        <meta property="og:description" content={`Read document: ${doc.title}`} />
        <meta
          property="og:image"
          content={
            theme?.logoUrl || "https://plan-ai.blueberrybytes.com/logos/android-chrome-512x512.png"
          }
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={`${doc.title} | Plan AI`} />
        <meta name="twitter:description" content={`Read document: ${doc.title}`} />
        <meta
          name="twitter:image"
          content={
            theme?.logoUrl || "https://plan-ai.blueberrybytes.com/logos/android-chrome-512x512.png"
          }
        />
      </Helmet>
      <style>{`
        @media print {
          html, body { height: auto !important; overflow: visible !important; }
          body * { visibility: hidden; }
          #pdf-content, #pdf-content * { visibility: visible; }
          #pdf-content { position: static !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 20px !important; }
          .no-print { display: none !important; }
          pre, code, blockquote, img, svg, table, tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          h1, h2, h3 { page-break-after: avoid !important; break-after: avoid !important; }
          #pdf-content, #pdf-content * { overflow: visible !important; }
        }
      `}</style>
      {/* Header bar */}
      <Box
        className="no-print"
        sx={{
          py: { xs: 2, md: 3 },
          px: { xs: 2, md: 4 },
          background: "transparent",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={(muiTheme) => {
              const bgHeader = theme?.backgroundColor || muiTheme.palette.background.paper;
              let textHeader = theme?.textColor || muiTheme.palette.text.primary;

              if (getContrastRatio(textHeader, bgHeader) < 3) {
                textHeader = muiTheme.palette.getContrastText(bgHeader);
              }

              return { color: textHeader, opacity: 0.7 };
            }}
          >
            Plan AI
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 3 }}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <FormControlLabel
            control={
              <Switch
                checked={isFullWidth}
                onChange={(e) =>
                  setSearchParams((prev) => {
                    prev.set("fullWidth", String(e.target.checked));
                    return prev;
                  })
                }
                color="secondary"
                size="small"
              />
            }
            label={
              <Typography
                variant="body2"
                sx={(muiTheme) => {
                  const bgHeader = theme?.backgroundColor || muiTheme.palette.background.paper;
                  let textHeader = theme?.textColor || muiTheme.palette.text.primary;

                  if (getContrastRatio(textHeader, bgHeader) < 3) {
                    textHeader = muiTheme.palette.getContrastText(bgHeader);
                  }
                  return { color: textHeader, display: { xs: "none", sm: "block" } };
                }}
              >
                {t("docs.view.options.fullWidth", "Full Width")}
              </Typography>
            }
          />
          <Select
            size="small"
            value={textSize}
            onChange={(e) =>
              setSearchParams((prev) => {
                prev.set("textSize", e.target.value);
                return prev;
              })
            }
            sx={(muiTheme) => {
              const bgHeader = theme?.backgroundColor || muiTheme.palette.background.paper;
              let textHeader = theme?.textColor || muiTheme.palette.text.primary;

              if (getContrastRatio(textHeader, bgHeader) < 3) {
                textHeader = muiTheme.palette.getContrastText(bgHeader);
              }
              return {
                color: textHeader,
                borderColor: `${textHeader}50`,
                "& .MuiSvgIcon-root": { color: textHeader },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: `${textHeader}50` },
              };
            }}
          >
            <MenuItem value="sm">{t("docs.view.options.sizeSmall", "Small text")}</MenuItem>
            <MenuItem value="md">{t("docs.view.options.sizeMedium", "Medium text")}</MenuItem>
            <MenuItem value="lg">{t("docs.view.options.sizeLarge", "Large text")}</MenuItem>
          </Select>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            sx={{ textTransform: "none", mr: 2 }}
          >
            {t("docs.view.export")}
          </Button>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
          >
            <MenuItem onClick={handleExportPdf}>{t("docs.view.exportPdf")}</MenuItem>
            <MenuItem onClick={handleExportMarkdown}>{t("docs.view.exportMarkdown")}</MenuItem>
            <MenuItem onClick={handleExportDocx}>{t("docs.view.exportGdoc")}</MenuItem>
          </Menu>
        </Stack>
      </Box>

      <Box
        id="pdf-content"
        sx={{
          maxWidth: isFullWidth ? "100%" : 860,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: 5,
          position: "relative",
        }}
      >
        {/* Document Header */}
        <Box sx={{ mb: 5, pt: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 3,
              mb: 1.5,
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontFamily: theme?.headingFont ?? "inherit",
                color: theme ? headerColor : text,
                flex: 1,
                minWidth: 0,
                lineHeight: 1.2,
                fontSize: { xs: "2rem", md: `${Math.min(3, 2.5 * scaleMultiplier)}rem` },
                letterSpacing: "-0.02em",
              }}
            >
              {doc.title}
            </Typography>
            {theme?.logoUrl && (
              <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                <img
                  src={theme.logoUrl}
                  alt="Brand Logo"
                  style={{
                    height: 40,
                    maxWidth: 140,
                    objectFit: "contain",
                    opacity: 0.85,
                  }}
                  crossOrigin="anonymous"
                />
              </Box>
            )}
          </Box>
          {/* Subtle accent underline */}
          <Box
            sx={{
              height: 3,
              borderRadius: 2,
              background: theme
                ? `linear-gradient(90deg, ${primary}, ${accent}60, transparent)`
                : `linear-gradient(90deg, ${primary}80, transparent)`,
              maxWidth: 300,
            }}
          />
        </Box>

        {/* Document Body */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 4 },
            bgcolor: "transparent",
            borderRadius: 2,
          }}
        >
          <Box sx={markdownSxStyles}>
            <MarkdownRenderer
              content={doc.content}
              theme={theme}
              sx={{ ...markdownSxStyles, p: 0 }}
            />
          </Box>
        </Paper>

        <Divider sx={{ my: 4 }} />
        <Typography variant="caption" color="text.disabled">
          {t("docs.view.sharedVia")} · {new Date(doc.updatedAt).toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default PublicDocView;
