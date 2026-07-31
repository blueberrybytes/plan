/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Box, Typography, IconButton, useTheme, Button } from "@mui/material";
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Download,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { injectMermaidThemeStyles, repairMermaidSyntax } from "../../utils/mermaidUtils";

interface MermaidRendererProps {
  chart: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  } | null;
  onFixDiagram?: (errorMessage?: string) => void;
  isFixing?: boolean;
  onErrorStateChange?: (hasError: boolean, errorMessage?: string) => void;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  chart,
  theme,
  onFixDiagram,
  isFixing,
  onErrorStateChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const muiTheme = useTheme();

  // Smart background-aware text color inversion (fixes unreadable dark themes)
  const bg = theme?.backgroundColor || muiTheme.palette.background.paper;
  const primary = theme?.primaryColor || muiTheme.palette.primary.main;
  const secondary = theme?.secondaryColor || muiTheme.palette.secondary.main;

  // Compute text colors mathematically to guarantee readability against their respective backgrounds
  const canvasTextColor = theme?.textColor || muiTheme.palette.getContrastText(bg);
  // Always-readable-against-background color, ignoring any theme textColor override.
  // Needed for text painted directly on the canvas (architecture-beta labels): a
  // theme with a light textColor on a light background would otherwise hide them.
  const canvasContrastText = muiTheme.palette.getContrastText(bg);
  const nodeTextColor = muiTheme.palette.getContrastText(primary);
  const secondaryTextColor = muiTheme.palette.getContrastText(secondary);

  const isDark = muiTheme.palette.getContrastText(bg) === "#fff";

  // Generate a derived palette for charts to ensure variety
  const generatePalette = (p: string, s: string) => {
    // To ensure pie charts and multi-line charts always have distinct, high-contrast slices/lines,
    // we lead with the primary brand color, followed by curated vibrant colors, and mix in secondary.
    return [
      p,
      "#f59e0b", // Amber
      "#10b981", // Emerald
      s, // Brand Secondary
      "#8b5cf6", // Violet
      "#ef4444", // Red
      "#0ea5e9", // Sky
      "#f43f5e", // Rose
      "#84cc16", // Lime
      "#d946ef", // Fuchsia
    ];
  };
  const palette = React.useMemo(() => generatePalette(primary, secondary), [primary, secondary]);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      // Define ID outside try block so we can locate orphaned error SVGs in finally
      const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;

      try {
        setHasError(false);
        setErrorMessage("");
        if (onErrorStateChange) onErrorStateChange(false);

        // Mermaid's theme engine ONLY honours hex colours (named colours and
        // rgba() are silently ignored). MUI's getContrastText returns "#fff"
        // or "rgba(0,0,0,0.87)", so coerce the contrast-derived colours to hex
        // — otherwise the native `base` theme drops them. `transparent` also
        // isn't a hex, so the few genuine transparencies stay in the residual
        // CSS (injectMermaidThemeStyles), not here.
        const hx = (c: string, darkText = "#1a1a1a") =>
          /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : darkText;
        const bgHex = hx(bg, isDark ? "#0b0d11" : "#ffffff");
        const primHex = hx(primary, "#3b82f6");
        const secHex = hx(secondary, "#64748b");
        const txt = hx(canvasTextColor); // canvas / label text over the background
        const nodeTxt = hx(nodeTextColor); // text painted ON primary-filled nodes
        const secTxt = hx(secondaryTextColor); // text on secondary fills (notes)
        // Repeating colour scales (pie/git/cScale wrap the 10-colour palette).
        const scale = (prefix: string, n: number, from = 0) =>
          Object.fromEntries(
            Array.from({ length: n }, (_, i) => [
              `${prefix}${from + i}`,
              palette[i % palette.length],
            ]),
          );
        const constScale = (prefix: string, n: number, value: string, from = 0) =>
          Object.fromEntries(Array.from({ length: n }, (_, i) => [`${prefix}${from + i}`, value]));

        // Blend two hex colours → hex. Mermaid ignores rgb()/rgba() (see hx above),
        // so MUI's lighten/darken — which return rgb() — are unusable here; this keeps
        // everything hex. Used to derive an on-brand Gantt palette that stays legible
        // whatever the brand's secondary colour happens to be.
        const mix = (a: string, b: string, t: number): string => {
          const rgb = (h: string) => {
            const s = h.replace("#", "");
            const v = s.length === 3 ? s.replace(/./g, "$&$&") : s;
            return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
          };
          const [r1, g1, b1] = rgb(a);
          const [r2, g2, b2] = rgb(b);
          const ch = (x: number, y: number) =>
            Math.round(x + (y - x) * t)
              .toString(16)
              .padStart(2, "0");
          return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`;
        };
        // On-brand Gantt tints, derived from primary / background / ink — NEVER from
        // the brand secondary. A light secondary was washing "done" tasks, grid lines
        // and borders to near-invisibility, which read as "the red theme isn't applied".
        const ganttDoneBkg = mix(primHex, bgHex, isDark ? 0.5 : 0.42); // lighter brand tint = "past"
        const ganttDoneBorder = mix(primHex, bgHex, 0.3);
        const ganttActiveBorder = mix(primHex, isDark ? "#ffffff" : "#000000", 0.28);
        const ganttBand = mix(primHex, bgHex, isDark ? 0.14 : 0.05); // faint section banding
        const ganttGrid = mix(txt, bgHex, 0.78); // always-visible faint grid
        const ganttCrit = "#f59e0b"; // amber — must read apart from brand red

        // theme: 'base' is the ONLY customizable theme — themeVariables apply
        // fully here (they were largely ignored on default/dark before, which
        // is why everything was force-painted via injected CSS). darkMode drives
        // the engine's derived-colour maths.
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          darkMode: isDark,
          fontFamily: '"Inter", "Roboto", sans-serif',
          themeVariables: {
            darkMode: isDark,
            background: bgHex,
            fontFamily: '"Inter", "Roboto", sans-serif',
            fontSize: "14px",

            // ── Core (flowchart/state/class nodes, edges, clusters, text) ──
            primaryColor: primHex,
            primaryTextColor: nodeTxt,
            primaryBorderColor: secHex,
            secondaryColor: secHex,
            secondaryBorderColor: secHex,
            secondaryTextColor: secTxt,
            tertiaryColor: bgHex,
            tertiaryBorderColor: secHex,
            tertiaryTextColor: txt,
            mainBkg: primHex,
            nodeBkg: primHex,
            nodeBorder: secHex,
            nodeTextColor: nodeTxt,
            clusterBkg: bgHex,
            clusterBorder: secHex,
            lineColor: secHex,
            defaultLinkColor: secHex,
            arrowheadColor: secHex,
            textColor: txt,
            titleColor: txt,
            edgeLabelBackground: bgHex,
            labelBackgroundColor: bgHex,
            noteBkgColor: secHex,
            noteTextColor: secTxt,
            noteBorderColor: primHex,
            classText: nodeTxt,

            // ── Sequence ──
            actorBkg: primHex,
            actorBorder: secHex,
            actorTextColor: nodeTxt,
            actorLineColor: secHex,
            signalColor: secHex,
            signalTextColor: txt,
            labelBoxBkgColor: bgHex,
            labelBoxBorderColor: secHex,
            labelTextColor: txt,
            loopTextColor: txt,
            activationBkgColor: primHex,
            activationBorderColor: secHex,
            sequenceNumberColor: nodeTxt,

            // ── State ──
            stateBkg: primHex,
            stateLabelColor: nodeTxt,
            labelColor: nodeTxt,
            altBackground: bgHex,
            compositeBackground: bgHex,
            compositeBorder: secHex,
            compositeTitleBackground: bgHex,
            transitionColor: secHex,
            transitionLabelColor: txt,
            specialStateColor: secHex,

            // ── ER (boxes also via the er.{fill,stroke} config below) ──
            attributeBackgroundColorOdd: primHex,
            attributeBackgroundColorEven: primHex,
            relationColor: secHex,
            relationLabelBackground: bgHex,
            relationLabelColor: txt,

            // ── Gantt (tints derived above, NOT from the brand secondary, so a
            //     light secondary can't wash "done" tasks / grid / borders out —
            //     the reported "red theme isn't applied" bug) ──
            sectionBkgColor: ganttBand,
            sectionBkgColor2: bgHex,
            altSectionBkgColor: bgHex,
            taskBkgColor: primHex,
            taskBorderColor: ganttActiveBorder,
            taskTextColor: nodeTxt,
            taskTextLightColor: txt,
            taskTextDarkColor: txt,
            taskTextOutsideColor: txt,
            activeTaskBkgColor: primHex,
            activeTaskBorderColor: ganttActiveBorder,
            doneTaskBkgColor: ganttDoneBkg,
            doneTaskBorderColor: ganttDoneBorder,
            critBkgColor: ganttCrit,
            critBorderColor: mix(ganttCrit, "#000000", 0.2),
            gridColor: ganttGrid,
            todayLineColor: primHex,

            // ── Quadrant (the transparent square fill stays in residual CSS) ──
            quadrantPointFill: primHex,
            quadrantPointTextFill: txt,
            quadrantTitleFill: txt,
            quadrantXAxisTextFill: txt,
            quadrantYAxisTextFill: txt,
            quadrantInternalBorderStrokeFill: secHex,
            quadrantExternalBorderStrokeFill: secHex,

            // ── Architecture (label text contrast stays in residual CSS) ──
            archEdgeColor: secHex,
            archEdgeArrowColor: secHex,
            archGroupBorderColor: secHex,

            // ── Pie ──
            ...scale("pie", 12, 1),
            pieTitleTextSize: "16px",
            pieTitleTextColor: txt,
            pieSectionTextSize: "12px",
            pieSectionTextColor: txt,
            pieLegendTextSize: "14px",
            pieLegendTextColor: txt,
            pieStrokeColor: bgHex,
            pieStrokeWidth: "2px",
            pieOuterStrokeWidth: "2px",
            pieOuterStrokeColor: bgHex,
            pieOpacity: "0.85",

            // ── Journey / Timeline / Mindmap colour scales ──
            ...scale("fillType", 8),
            ...scale("cScale", 12),
            ...constScale("cScaleLabel", 12, txt),

            // ── Git graph ──
            ...scale("git", 8),
            ...constScale("gitBranchLabel", 8, txt),
            commitLabelColor: txt,
            commitLabelBackground: bgHex,

            // ── XYChart (object — colours live here, geometry in xyChart config) ──
            xyChart: {
              backgroundColor: "transparent",
              titleColor: txt,
              dataLabelColor: txt,
              xAxisLabelColor: txt,
              xAxisTitleColor: txt,
              xAxisTickColor: secHex,
              xAxisLineColor: secHex,
              yAxisLabelColor: txt,
              yAxisTitleColor: txt,
              yAxisTickColor: secHex,
              yAxisLineColor: secHex,
              plotColorPalette: palette.join(", "),
            } as any,
          },
          flowchart: { htmlLabels: true, useMaxWidth: true },
          sequence: { wrap: true, showSequenceNumbers: false },
          // Gantt geometry: bigger bars + labels so a long chronology stays legible,
          // and fit to the container width (the default 11px text rendered tiny).
          gantt: {
            useMaxWidth: true,
            fontSize: 14,
            sectionFontSize: 14,
            barHeight: 24,
            barGap: 6,
            topPadding: 48,
            leftPadding: 96,
            gridLineStartPadding: 32,
          },
          // Per-diagram colour config (these colours are NOT themeVariables).
          er: { fill: primHex, stroke: secHex } as any,
          sankey: { linkColor: primHex } as any,
          securityLevel: "loose",
          logLevel: 5,
          suppressErrorRendering: true,
        });

        // Pre-validate syntax so mermaid doesn't successfully render an error SVG
        const safeChart = repairMermaidSyntax(chart);
        await mermaid.parse(safeChart, { suppressErrors: true });

        const { svg } = await mermaid.render(id, safeChart);

        if (isMounted) {
          // Wrap with theme styles for complex diagrams (Gantt, Class, Sequence)
          // while preserving intrinsic node colors for Flowcharts.
          const themedSvg = injectMermaidThemeStyles(svg, {
            id,
            bg,
            primary,
            secondary,
            canvasTextColor,
            canvasContrastText,
            nodeTextColor,
            secondaryTextColor,
          });
          setSvgContent(themedSvg);
        }
      } catch (err: any) {
        console.error("Mermaid parsing error:", err);
        const errMsg = err?.message || String(err);
        if (isMounted) {
          setHasError(true);
          setErrorMessage(errMsg);
          if (onErrorStateChange) onErrorStateChange(true, errMsg);
        }
      } finally {
        // Mermaid is notorious for injecting huge error SVG bomb graphics directly to the bottom
        // of the document <body> when parsing fails mid-stream. Physically obliterate them!
        const orphan1 = document.getElementById(id);
        const orphan2 = document.getElementById(`d-${id}`);
        if (orphan1) orphan1.remove();
        if (orphan2) orphan2.remove();
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [
    chart,
    bg,
    primary,
    secondary,
    canvasTextColor,
    canvasContrastText,
    nodeTextColor,
    secondaryTextColor,
    onErrorStateChange,
    isDark,
    palette,
  ]);

  const handleDownloadSvg = () => {
    if (!svgContent) return;

    // Fix common XML/SVG malformations introduced by Mermaid HTML labels
    let safeSvg = svgContent;
    // Fix unclosed break tags
    safeSvg = safeSvg.replace(/<br>/gi, "<br/>");
    // Fix unescaped ampersands that aren't already valid XML entities
    safeSvg = safeSvg.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, "&amp;");
    // Ensure xmlns is present for standalone SVG viewing
    if (!safeSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      safeSvg = safeSvg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    }

    const blob = new Blob([safeSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diagram-${Math.random().toString(36).substr(2, 6)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (hasError) {
    return (
      <Box
        sx={{
          p: 3,
          border: "1px solid",
          borderColor: "error.main",
          borderRadius: 1,
          my: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        <Typography
          color="error.dark"
          variant="body2"
          sx={{ fontFamily: "monospace", fontWeight: "bold" }}
        >
          [Mermaid Diagram Error]: Parsing crashed. Please check syntax constraints.
        </Typography>

        {onFixDiagram && (
          <Button
            variant="contained"
            color="warning"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => onFixDiagram(errorMessage)}
            disabled={isFixing}
            size="small"
          >
            {isFixing ? "AI is fixing..." : "Fix Diagram with AI"}
          </Button>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: "monospace", display: "block", mt: 1, whiteSpace: "pre-wrap" }}
        >
          {errorMessage || "Invalid diagram syntax."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "400px",
        position: "relative",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={8}
        centerOnInit
        wheel={{ step: 0.1 }}
        panning={{ velocityDisabled: false }}
        doubleClick={{ mode: "reset" }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                zIndex: 10,
                display: "flex",
                gap: 1,
                bgcolor: "background.paper",
                p: 0.5,
                borderRadius: 2,
                boxShadow: 1,
              }}
            >
              <IconButton size="small" onClick={() => zoomIn()}>
                <ZoomIn fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => zoomOut()}>
                <ZoomOut fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => resetTransform()}>
                <CenterFocusStrong fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadSvg();
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Box>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%", minHeight: "400px" }}
              contentStyle={{
                width: "100%",
                height: "100%",
                minHeight: "400px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                ref={containerRef}
                className="mermaid-canvas"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  bgcolor: bg,
                  borderRadius: 2,
                  p: 4,
                  "& svg": {
                    display: "block",
                    minWidth: "300px",
                    minHeight: "300px",
                  },
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </Box>
  );
};

export default MermaidRenderer;
