export type MermaidDiagramType =
  | "FLOWCHART"
  | "SEQUENCE"
  | "CLASS"
  | "STATE"
  | "ER"
  | "GANTT"
  | "JOURNEY"
  | "MINDMAP"
  | "TIMELINE"
  | "PIE"
  | "QUADRANT"
  | "XYCHART"
  | "GIT"
  | "ARCHITECTURE"
  | "KANBAN"
  | "SANKEY"
  | "BLOCK";

/**
 * Derive the diagram type from the Mermaid source's first declaration so the UI
 * tag always reflects the ACTUAL code. A diagram created as a flowchart but then
 * edited into a sequence diagram (or any "AUTO" diagram whose stored type was
 * never resolved) should show its real type, not the stale stored one.
 *
 * Skips YAML frontmatter (`--- … ---`), `%%` comments and `%%{init}%%`
 * directives before reading the header keyword. Returns null if unrecognised
 * (callers fall back to the stored type).
 */
export const detectMermaidType = (code?: string | null): MermaidDiagramType | null => {
  if (!code) return null;

  let inFrontmatter = false;
  let header = "";
  for (const raw of code.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line === "---") {
      // Toggle YAML frontmatter fences (--- … ---).
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter) continue;
    if (line.startsWith("%%")) continue; // comments + %%{init}%% directives
    header = line.toLowerCase();
    break;
  }
  if (!header) return null;

  const starts = (prefix: string) => header.startsWith(prefix);
  if (starts("flowchart") || starts("graph")) return "FLOWCHART";
  if (starts("sequencediagram")) return "SEQUENCE";
  if (starts("classdiagram")) return "CLASS";
  if (starts("statediagram")) return "STATE";
  if (starts("erdiagram")) return "ER";
  if (starts("gantt")) return "GANTT";
  if (starts("journey")) return "JOURNEY";
  if (starts("mindmap")) return "MINDMAP";
  if (starts("timeline")) return "TIMELINE";
  if (starts("quadrantchart")) return "QUADRANT";
  if (starts("xychart")) return "XYCHART";
  if (starts("pie")) return "PIE";
  if (starts("gitgraph")) return "GIT";
  if (starts("architecture")) return "ARCHITECTURE";
  if (starts("kanban")) return "KANBAN";
  if (starts("sankey")) return "SANKEY";
  if (starts("block")) return "BLOCK";
  return null;
};

export interface MermaidThemeOptions {
  id: string;
  bg: string;
  primary: string;
  secondary: string;
  canvasTextColor: string;
  /**
   * Text color guaranteed to contrast with the background (`getContrastText(bg)`),
   * ignoring any theme-provided `textColor`. Use for text painted directly on the
   * canvas (e.g. architecture-beta labels) where a theme that sets a light
   * `textColor` on a light background would otherwise make text invisible.
   */
  canvasContrastText: string;
  nodeTextColor: string;
  secondaryTextColor: string;
}

/**
 * RESIDUAL theme CSS — only for what Mermaid's `base` themeVariables genuinely
 * can't express. After the 2026-06 migration, all well-supported diagram types
 * (flowchart, sequence, class, state, ER, gantt, pie, notes, quadrant/xychart
 * colours) are themed NATIVELY via themeVariables in MermaidRenderer. What
 * stays here:
 *   1. transparencies — `transparent` is not a hex, so it can't be a themeVariable;
 *   2. beta diagrams with no theme-variable support (sankey nodes, kanban, block,
 *      mindmap, timeline/journey section text, architecture label tspans).
 * If you find yourself adding a rule for a well-supported type, set the
 * themeVariable instead — that's the whole point of the migration.
 */
export const injectMermaidThemeStyles = (svg: string, options: MermaidThemeOptions): string => {
  const { id, bg, primary, secondary, canvasTextColor, canvasContrastText, nodeTextColor } =
    options;

  return svg.replace(
    /(<svg[^>]*>)/i,
    `$1<style>
      /* ── Transparencies (cannot be hex themeVariables) ── */
      #${id} .quadrant { fill: transparent !important; }
      #${id} [class*="xychart-bg"] { fill: transparent !important; }

      /* ── Architecture (beta): service/group label tspans carry no colour
         class and inherit the root SVG fill, so they vanish on some backgrounds.
         No theme variable exists for them — force the canvas-contrast colour.
         Never fill .node-bkg (it's the transparent group box; filling it hides icons). */
      #${id} .architecture-services text,
      #${id} .architecture-services .text-inner-tspan,
      #${id} .architecture-services .text-outer-tspan,
      #${id} .architecture-groups text,
      #${id} .architecture-groups .text-inner-tspan,
      #${id} .architecture-groups .text-outer-tspan {
        fill: ${canvasContrastText} !important;
        color: ${canvasContrastText} !important;
      }

      /* ── Sankey (beta): only linkColor has config; node fill + text have no theme support. ── */
      #${id} .sankey-link { fill: ${primary} !important; fill-opacity: 0.3 !important; stroke: none !important; }
      #${id} .sankey-node rect { fill: ${primary} !important; stroke: ${secondary} !important; }
      #${id} .sankey-node text { fill: ${canvasTextColor} !important; color: ${canvasTextColor} !important; }

      /* ── Mindmap (beta): no theme variables for node/edge colours. ── */
      #${id} .mindmap-node rect, #${id} .mindmap-bg { fill: ${primary} !important; stroke: ${secondary} !important; }
      #${id} .mindmap-node text, #${id} .mindmap-node tspan, #${id} .mindmap-node foreignObject div { fill: ${nodeTextColor} !important; color: ${nodeTextColor} !important; }
      #${id} .mindmap-edges path { stroke: ${secondary} !important; stroke-width: 2px !important; }

      /* ── Kanban & Block (beta): no theme variables. ── */
      #${id} .kanban-card, #${id} .block-node, #${id} .kanban-item { fill: ${primary} !important; stroke: ${secondary} !important; }
      #${id} .kanban-card text, #${id} .kanban-card .label, #${id} .kanban-item text, #${id} .block-node text { fill: ${nodeTextColor} !important; color: ${nodeTextColor} !important; }
      #${id} .kanban-column, #${id} .kanban-board { fill: ${bg} !important; stroke: ${secondary} !important; stroke-opacity: 0.3 !important; }

      /* ── Timeline & Journey: section text contrast (section fills come from the
         palette via cScale/fillType, but their label colour needs forcing). ── */
      #${id} .journey-section text { fill: ${canvasTextColor} !important; color: ${canvasTextColor} !important; }
      #${id} .event text, #${id} .time text, #${id} .section-title, #${id} .section-title text { fill: ${canvasTextColor} !important; color: ${canvasTextColor} !important; stroke: none !important; }
      #${id} .task-line { stroke: ${secondary} !important; stroke-width: 2px !important; }
    </style>`,
  );
};

/**
 * A Gantt task whose start and end dates are IDENTICAL has zero duration, so
 * Mermaid draws a zero-WIDTH (invisible) bar — only the floating label survives.
 * AI "milestone chronologies" emit these constantly (`:done, 2026-06-05,
 * 2026-06-05`), producing a chart that reads as mostly-blank with unreadable
 * orphan labels. Rewrite each same-day task to a real `milestone` so it renders
 * as a visible diamond at that date.
 *
 * Only same-day date PAIRS are touched. Real-duration tasks (different dates),
 * `after`-dependencies, duration tasks (`5d`/`2w`) and non-task lines
 * (section/title/dateFormat) all pass through untouched — verified against the
 * live renderer before shipping.
 */
export const normalizeGanttMilestones = (chart: string): string =>
  chart
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => {
      // group 1: indent + task name + ":"  |  optional status/id prefix (skipped)
      // groups 2,3: the two ISO dates. Convert only when they're equal.
      const m = line.match(
        /^(\s*[^:\n]+:)\s*(?:[a-zA-Z, ]*?,\s*)?(\d{4}-\d{2}-\d{2})\s*,\s*(\d{4}-\d{2}-\d{2})\s*$/,
      );
      return m && m[2] === m[3] ? `${m[1]} milestone, ${m[2]}, 0d` : line;
    })
    .join("\n");

/**
 * Auto-patches common AI generation syntax errors in Mermaid charts.
 *
 * Wraps node labels that contain delimiter-breaking characters in double quotes
 * (e.g. `R[Traveler Portal (Web/Native)]` -> `R["Traveler Portal (Web/Native)"]`)
 * without ever splitting the surrounding node-shape delimiters.
 *
 * Crucially, this recognises COMPOUND shapes — circle `((…))`, stadium `([…])`,
 * cylinder `[(…)]`, subroutine `[[…]]`, hexagon `{{…}}` — and the rhombus `{…}`.
 * The previous implementation only knew about `[…]` and `(…)`, so a perfectly
 * valid `E((Endpoint Platforms))` was mangled into `E("(Endpoint Platforms"))`,
 * crashing the renderer. A single ordered tokenizer pass (compound delimiters
 * first) consumes each node as one unit and prevents that corruption.
 */
export const repairMermaidSyntax = (chart: string): string => {
  // The repairs below target FLOWCHART/graph node + edge syntax (A[label],
  // A((label)), -->|label|). Other diagram types have their own grammar, and
  // running the flowchart repair on them CORRUPTS valid syntax — e.g. an
  // xychart's `x-axis ["Jan", "Feb"]` array gets its quotes escaped to
  // `["Jan&quot;, …]`, crashing the parser (reported 2026-06-15). Only repair
  // flowcharts; pass known non-flowchart types through untouched. Unknown
  // (null) types keep the old behaviour to avoid regressing edge cases.
  const detectedType = detectMermaidType(chart);
  // Gantt has its own grammar — the flowchart label repairs below would corrupt
  // it. It gets one targeted fix instead: collapse zero-duration tasks into
  // visible milestones (the #1 reason AI Gantts render mostly-blank).
  if (detectedType === "GANTT") return normalizeGanttMilestones(chart);
  if (detectedType && detectedType !== "FLOWCHART") return chart;

  // Chars that break an UNQUOTED node label and therefore force quoting.
  // `"` belongs here: Mermaid's lexer treats a quote inside a bare label as the
  // start of a STR token and dies expecting the shape's closing delimiter (e.g.
  // `B{AI Agent "Berry"}` → "expecting DIAMOND_STOP, got STR"). Step 0 above only
  // covers labels whose quote sits immediately after the bracket, so without this
  // the mid-label case reaches the parser unrepaired.
  const FORBIDDEN_IN_LABEL = /[(){}&%/\-:#;"]/;

  // ─── Step 0: escape inner quotes inside already-quoted node labels ───────────
  // The AI sometimes emits:  A["label with "quoted" word"]
  // Mermaid's parser sees the second `"` as closing the label → STR token crash.
  // Fix: replace any `"` that sits INSIDE a quoted label with `&quot;`.
  // Strategy: find every bracketed shape that opens with `["`, `{["`, etc. and
  // scan forward character-by-character to find inner quotes that are NOT the
  // closing quote of the whole label.
  chart = chart.replace(
    // Match: opening bracket(s) + opening quote  →  capture everything until newline
    /((?:\[|\{|\()+)"([^"\n]*"[^"\n]*)"/g,
    (_match, brackets: string, inner: string) => {
      // `inner` is everything between the outer quotes (may contain more `"`).
      // Escape each `"` inside to &quot; so Mermaid won't treat them as delimiters.
      const escaped = inner.replace(/"/g, "&quot;");
      return `${brackets}"${escaped}"`;
    },
  );

  const quoteInner = (open: string, inner: string, close: string): string => {
    const trimmed = inner.trim();
    if (!trimmed) return `${open}${inner}${close}`;
    // Already quoted — leave as-is (inner quotes already escaped above).
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return `${open}${inner}${close}`;
    if (FORBIDDEN_IN_LABEL.test(trimmed)) {
      // Mermaid has no escape for a literal `"` inside a quoted label; downgrade to `'`.
      return `${open}"${trimmed.replace(/"/g, "'")}"${close}`;
    }
    return `${open}${inner}${close}`;
  };

  // Ordered alternation: compound (two-char) delimiters MUST come before the
  // single-char ones so `[(`, `[[`, `((`, `([`, `{{` are matched as a whole.
  const NODE_SHAPE =
    /([A-Za-z0-9_]+)(\[\([^\]]*?\)\]|\[\[[^\]]*?\]\]|\(\([^)]*?\)\)|\(\[[^\]]*?\]\)|\{\{[^}]*?\}\}|\[[^\][]*?\]|\{[^{}]*?\}|\([^()]*?\))/g;
  const DELIMITERS: [string, string][] = [
    ["[(", ")]"], // cylinder
    ["[[", "]]"], // subroutine
    ["((", "))"], // circle
    ["([", "])"], // stadium
    ["{{", "}}"], // hexagon
    ["[", "]"], // rectangle
    ["{", "}"], // rhombus / decision
    ["(", ")"], // rounded
  ];

  let safeChart = chart.replace(NODE_SHAPE, (match, id: string, shape: string) => {
    const pair = DELIMITERS.find(([open]) => shape.startsWith(open));
    if (!pair) return match;
    const [open, close] = pair;
    const inner = shape.slice(open.length, shape.length - close.length);
    return id + quoteInner(open, inner, close);
  });

  // Edge labels `-->|label|`: only quote when they carry delimiter-breaking
  // characters that genuinely crash the parser (parens/braces/ampersand/hash,
  // plus a bare `"` for the same STR-token reason as node labels above).
  // Colons, plus signs and slashes render fine in edge labels, so leave those.
  safeChart = safeChart.replace(/\|([^|\n]+)\|/g, (match, text: string) => {
    const trimmed = text.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return match;
    if (/[(){}&#"]/.test(trimmed)) {
      return `|"${trimmed.replace(/"/g, "'")}"|`;
    }
    return match;
  });

  return safeChart;
};
