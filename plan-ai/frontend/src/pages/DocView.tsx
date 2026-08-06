/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Tooltip,
  CircularProgress,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  useTheme,
  Tabs,
  Tab,
} from "@mui/material";
import { getContrastRatio } from "@mui/material/styles";
import {
  ArrowBack as ArrowBackIcon,
  Language as LanguageIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Autorenew as AutorenewIcon,
  PictureAsPdf as PdfIcon,
  Description as DocxIcon,
  Code as MdIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MarkdownRenderer from "../components/common/MarkdownRenderer";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { exportMarkdownToDocx } from "../utils/docxExport";
import SidebarLayout from "../components/layout/SidebarLayout";
import {
  useGetDocQuery,
  useUpdateDocMutation,
  useFixDocMermaidMutation,
  docApi,
} from "../store/apis/docApi";
import type { DocDocumentResponse } from "../store/apis/docApi";
import { useGetBrandThemesQuery } from "../store/apis/brandThemeApi";
import { useDispatch } from "react-redux";
import { splitMarkdownIntoChunks, MarkdownChunk } from "../utils/markdownParser";
import HybridChunkEditor from "../components/docs/HybridChunkEditor";
import TiptapEditor from "../components/docs/TiptapEditor";

const AUTOSAVE_DELAY = 800;

const DocView: React.FC = () => {
  const muiTheme = useTheme();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  const [pollingInterval, setPollingInterval] = useState<number | undefined>(undefined);
  const {
    data: doc,
    isLoading,
    refetch,
  } = useGetDocQuery(id ?? "", {
    pollingInterval,
    skip: !id,
  });
  const [updateDoc, { isLoading: isSaving }] = useUpdateDocMutation();
  const [fixDocMermaid, { isLoading: isFixing }] = useFixDocMermaidMutation();

  const { data: themes = [] } = useGetBrandThemesQuery();
  const dispatch = useDispatch<any>();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [saved, setSaved] = useState(false);

  // Start polling when status is GENERATING
  useEffect(() => {
    if (doc?.status === "GENERATING") {
      setPollingInterval(3000);
    } else {
      setPollingInterval(undefined);
    }
  }, [doc?.status]);

  const handleThemeChange = async (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value as string;
    if (!id) return;

    try {
      if (selectedValue === "") {
        dispatch(
          docApi.util.updateQueryData("getDoc", id, (draft) => {
            draft.themeId = null;
            draft.theme = null;
          }) as any,
        );
        await updateDoc({ id, data: { themeId: null } }).unwrap();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return;
      }

      // Check if it's an existing theme ID
      const existingTheme = themes.find((t) => t.id === selectedValue);
      if (existingTheme) {
        // Optimistically apply the full theme object immediately so styles change without waiting!
        dispatch(
          docApi.util.updateQueryData("getDoc", id, (draft) => {
            draft.themeId = existingTheme.id;
            draft.theme = existingTheme;
          }) as any,
        );
        await updateDoc({ id, data: { themeId: existingTheme.id } }).unwrap();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return;
      }
    } catch (err) {
      console.error("Failed to update doc theme", err);
      alert("Failed to update the theme. Please try again.");
    }
  };

  useEffect(() => {
    if (doc && !isEditMode) {
      setContent(doc.content ?? "");
      setTitle(doc.title ?? "");
    }
  }, [doc?.id, doc?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(
    async (newContent: string, newTitle: string) => {
      if (!id) return;
      await updateDoc({ id, data: { content: newContent, title: newTitle } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [id, updateDoc],
  );

  const handleChunkSave = (chunk: MarkdownChunk, newRawText: string) => {
    let prefix = content.substring(0, chunk.startIndex);
    let suffix = content.substring(chunk.endIndex);

    if (newRawText.trim() === "") {
      prefix = prefix.trimEnd();
      suffix = suffix.trimStart();
      const newContent = prefix + (prefix && suffix ? "\n\n" : "") + suffix;
      setContent(newContent);
    } else {
      const newContent = prefix + newRawText + suffix;
      setContent(newContent);
    }
    // Let the auto-save mechanism handle the actual saving
  };

  const handleFixDiagram = async (brokenChart: string) => {
    try {
      const { fixedCode } = await fixDocMermaid({ brokenCode: brokenChart }).unwrap();

      let newContent = content.replace(brokenChart, fixedCode);

      if (newContent === content) {
        // Fallback: ReactMarkdown normalization can cause exact replace to fail. Find block loosely.
        const blockRegex = /```(?:mermaid)?\s*([\s\S]*?)```/g;
        let match;
        const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
        while ((match = blockRegex.exec(content)) !== null) {
          if (normalize(match[1]) === normalize(brokenChart)) {
            newContent =
              content.substring(0, match.index) +
              "```mermaid\n" +
              fixedCode +
              "\n```" +
              content.substring(match.index + match[0].length);
            break;
          }
        }
      }

      setContent(newContent);
      save(newContent, title);
    } catch (e) {
      console.error("Failed to fix diagram", e);
      alert(t("docs.view.fixFailed", "Failed to fix diagram. Please try again."));
    }
  };

  const prevContent = useRef(content);
  const prevTitle = useRef(title);

  useEffect(() => {
    if (!isEditMode) {
      prevContent.current = content;
      prevTitle.current = title;
      return;
    }

    if (content === prevContent.current && title === prevTitle.current) {
      return; // No real changes
    }

    const timer = setTimeout(() => {
      save(content, title);
      prevContent.current = content;
      prevTitle.current = title;
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [content, title, isEditMode, save]);

  const handleOpenPublicLink = async () => {
    if (!id) return;
    // Open the tab immediately to avoid popup blockers (must happen in sync user-gesture context)
    const win = window.open("", "_blank");
    if (!doc?.isPublic) {
      await updateDoc({ id, data: { isPublic: true } });
    }
    if (win) win.location.href = `/doc/public/${id}`;
  };

  const handleExportPdf = () => {
    setExportAnchor(null);
    window.print();
  };

  const handleExportMarkdown = () => {
    setExportAnchor(null);
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = async () => {
    setExportAnchor(null);
    if (!doc) return;
    // Pass the doc's brand theme so the .docx opens on-brand in Google Docs.
    const brandTheme = (doc as DocDocumentResponse & { theme?: Record<string, string> | null })
      .theme;
    await exportMarkdownToDocx(title, content, brandTheme);
  };

  const theme = (
    doc as (DocDocumentResponse & { theme?: Record<string, string> | null }) | undefined
  )?.theme;

  const bg = theme?.backgroundColor || muiTheme.palette.background.paper;
  let text = theme?.textColor || muiTheme.palette.text.primary;

  if (getContrastRatio(text, bg) < 3) {
    text = muiTheme.palette.getContrastText(bg);
  }

  let primary = theme?.primaryColor || muiTheme.palette.primary.main;
  let headerColor = primary;
  if (getContrastRatio(headerColor, bg) < 3) {
    headerColor = text;
  }

  let accent = theme?.secondaryColor || muiTheme.palette.secondary.main;
  if (getContrastRatio(accent, bg) < 3) {
    accent = text;
  }

  let strongColor = theme?.primaryColor || "inherit";
  if (strongColor !== "inherit" && getContrastRatio(strongColor, bg) < 3) {
    strongColor = text;
  }

  const markdownSxStyles = {
    color: text,
    bgcolor: bg,
    borderRadius: 2,
    p: { xs: 2, md: 4 },
    fontFamily: theme?.bodyFont ?? "inherit",
    "& h1": {
      fontFamily: theme?.headingFont ?? "inherit",
      color: `${headerColor} !important`,
    },
    "& h2": {
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
      borderRadius: "0 8px 8px 0",
      opacity: 0.9,
      fontStyle: "italic",
    },
    "& code": {
      color: theme?.secondaryColor ?? "inherit",
      backgroundColor: theme?.primaryColor ? `${theme.primaryColor}0A` : "rgba(0,0,0,0.04)",
      px: 1,
      py: 0.5,
      borderRadius: 1,
      fontFamily: "monospace",
      fontSize: "0.9em",
    },
  };

  if (isLoading)
    return (
      <SidebarLayout>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      </SidebarLayout>
    );

  return (
    <SidebarLayout>
      <style>{`
        @media print {
          /* Reset all ancestor containers that clip content */
          html, body { height: auto !important; overflow: visible !important; }
          body * { visibility: hidden; }
          #pdf-content, #pdf-content * { visibility: visible; }
          #pdf-content { position: static !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 20px !important; }
          .no-print { display: none !important; }
          /* Let long elements break across pages instead of clipping */
          pre, code, blockquote, img, svg, table, tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          h1, h2, h3 { page-break-after: avoid !important; break-after: avoid !important; }
          /* Release height/overflow locks from SidebarLayout ancestors */
          #pdf-content, #pdf-content * { overflow: visible !important; }
        }
      `}</style>
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          width: "100%",
          maxWidth: isEditMode ? "100%" : 1200,
          mx: "auto",
          transition: "max-width 0.3s ease",
        }}
      >
        {/* Toolbar */}
        <Box
          className="no-print"
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, flexWrap: "wrap" }}
        >
          <IconButton onClick={() => navigate("/docs")}>
            <ArrowBackIcon />
          </IconButton>
          {doc?.status === "GENERATING" && (
            <Chip
              icon={<AutorenewIcon />}
              label={t("docs.view.generating")}
              color="warning"
              size="small"
              onClick={() => refetch()}
            />
          )}
          <Box sx={{ flexGrow: 1 }} />

          <FormControl size="small" sx={{ minWidth: 150, m: 0 }}>
            <InputLabel>{t("docs.view.themeSelect.label")}</InputLabel>
            <Select
              value={doc?.themeId || ""}
              label={t("docs.view.themeSelect.label")}
              onChange={handleThemeChange}
              disabled={isSaving}
            >
              <MenuItem value="">Default / No Theme</MenuItem>
              {themes.length === 0 ? (
                <MenuItem disabled value="none">
                  <em>{t("docThemes.empty")}</em>
                </MenuItem>
              ) : (
                themes.map((theme) => (
                  <MenuItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {isSaving && <CircularProgress size={16} />}
          {saved && (
            <Chip icon={<CheckIcon />} label={t("docs.view.saved")} color="success" size="small" />
          )}
          <Button
            variant={isEditMode ? "contained" : "outlined"}
            size="small"
            onClick={() => setIsEditMode((m) => !m)}
          >
            {isEditMode ? t("docs.view.previewMode") : t("docs.view.editMode")}
          </Button>
          <Tooltip title={t("docs.view.publicUrl")}>
            <IconButton onClick={handleOpenPublicLink} sx={{ color: primary }}>
              <LanguageIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("docs.view.export")}>
            <IconButton onClick={(e) => setExportAnchor(e.currentTarget)} sx={{ color: primary }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
          >
            <MenuItem onClick={handleExportPdf}>
              <ListItemIcon>
                <PdfIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t("docs.view.exportPdf")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleExportMarkdown}>
              <ListItemIcon>
                <MdIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t("docs.view.exportMarkdown")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleExportDocx}>
              <ListItemIcon>
                <DocxIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t("docs.view.exportGdoc")}</ListItemText>
            </MenuItem>
          </Menu>
        </Box>

        <Box id="pdf-content" sx={{ position: "relative" }}>
          {/* Document Header */}
          {isEditMode ? (
            <>
              {theme?.logoUrl && (
                <Box sx={{ mb: 1, display: "flex", justifyContent: "flex-end" }}>
                  <img
                    src={theme.logoUrl}
                    alt="Brand Logo"
                    style={{ height: 40, objectFit: "contain" }}
                  />
                </Box>
              )}
              <TextField
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="standard"
                fullWidth
                inputProps={{ style: { fontSize: 28, fontWeight: 700 } }}
                sx={{ mb: 2 }}
              />
              <Divider sx={{ mb: 3 }} />
            </>
          ) : (
            <Box
              sx={{
                mb: 4,
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: theme ? bg : "transparent",
                border: theme ? `1px solid ${accent}20` : "none",
              }}
            >
              {/* Accent gradient bar */}
              {theme && (
                <Box
                  sx={{
                    height: 4,
                    background: `linear-gradient(90deg, ${primary}, ${accent})`,
                  }}
                />
              )}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 3,
                  px: { xs: 3, md: 4 },
                  py: { xs: 2.5, md: 3 },
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    fontFamily: theme?.headingFont ?? "inherit",
                    color: theme ? headerColor : "text.primary",
                    flex: 1,
                    minWidth: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </Typography>
                {theme?.logoUrl && (
                  <Box sx={{ flexShrink: 0 }}>
                    <img
                      src={theme.logoUrl}
                      alt="Brand Logo"
                      style={{
                        height: 44,
                        maxWidth: 160,
                        objectFit: "contain",
                        opacity: 0.9,
                      }}
                    />
                  </Box>
                )}
              </Box>
              {!theme && <Divider />}
            </Box>
          )}

          {/* Content */}
          <Box>
            {isEditMode ? (
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 2, md: 4 },
                  alignItems: "stretch",
                  minHeight: "60vh",
                  flexDirection: "row",
                }}
              >
                {/* Left Pane (Tabs & Editor) */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    overflow: "hidden",
                  }}
                >
                  <Tabs
                    value={sidebarTab}
                    onChange={(_, nv) => setSidebarTab(nv)}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: "divider" }}
                  >
                    <Tab label="Rich Text" />
                    <Tab label="Block Editor" />
                    <Tab label="Code" />
                  </Tabs>

                  {sidebarTab === 1 && (
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        bgcolor: markdownSxStyles.bgcolor,
                      }}
                    >
                      {splitMarkdownIntoChunks(content).map((chunk) => {
                        const { bgcolor, borderRadius, ...chunkMarkdownStyle } = markdownSxStyles;
                        return (
                          <HybridChunkEditor
                            key={chunk.id}
                            chunk={chunk}
                            theme={theme}
                            onSave={handleChunkSave}
                            markdownStyle={chunkMarkdownStyle}
                          />
                        );
                      })}
                    </Box>
                  )}

                  {sidebarTab === 0 && (
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <TiptapEditor
                        content={content}
                        onSave={(newMarkdown) => {
                          setContent(newMarkdown);
                        }}
                      />
                    </Box>
                  )}

                  {sidebarTab === 2 && (
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <TextField
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        multiline
                        fullWidth
                        minRows={30}
                        variant="outlined"
                        sx={{
                          height: "100%",
                          "& .MuiInputBase-root": {
                            height: "100%",
                            alignItems: "flex-start",
                            fontFamily: "monospace",
                            fontSize: "0.95rem",
                            border: "none",
                            borderRadius: 0,
                          },
                          "& fieldset": { border: "none" },
                        }}
                      />
                    </Box>
                  )}
                </Box>
                {/* Live Preview Pane */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: markdownSxStyles.bgcolor,
                    borderRadius: markdownSxStyles.borderRadius,
                    p: markdownSxStyles.p,
                  }}
                >
                  <Typography
                    variant="overline"
                    color={text}
                    sx={{
                      display: "block",
                      mb: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      pb: 1,
                    }}
                  >
                    Live Preview
                  </Typography>
                  <MarkdownRenderer
                    content={content}
                    theme={theme}
                    sx={{ ...markdownSxStyles, p: 0 }}
                    onFixDiagram={handleFixDiagram}
                    isFixing={isFixing}
                  />
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  bgcolor: markdownSxStyles.bgcolor,
                  borderRadius: markdownSxStyles.borderRadius,
                  p: markdownSxStyles.p,
                  position: "relative",
                  minHeight: "50vh",
                }}
              >
                {doc?.status === "GENERATING" && (!content || content.length < 50) ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      pt: 4,
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <CircularProgress
                      size={48}
                      sx={{ color: theme?.primaryColor || "primary.main", mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ animation: "pulse 1.5s infinite" }}
                    >
                      {t("docs.view.writingContent", "Writing your document...")}
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {t(
                        "docs.view.writingSubtitle",
                        "AI is structuring and drafting content. This usually takes 15-30 seconds.",
                      )}
                    </Typography>
                  </Box>
                ) : (
                  <MarkdownRenderer
                    content={content}
                    theme={theme}
                    sx={{ ...markdownSxStyles, p: 0 }}
                    onFixDiagram={handleFixDiagram}
                    isFixing={isFixing}
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </SidebarLayout>
  );
};

export default DocView;
