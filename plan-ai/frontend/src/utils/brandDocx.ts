import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Header,
  AlignmentType,
  LevelFormat,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

/**
 * Generates branded Microsoft Word (.docx) files from a Brand Theme, using the
 * STANDARD Word style ids (Title, Subtitle, Heading1..4, Normal) so the result
 * opens in Google Docs with its native styles already wired to the company's
 * fonts, colours and logo. Two entry points:
 *   - downloadThemeTemplateDocx: an (almost) empty template to keep in Drive.
 *   - exportThemedDocx: a real document (markdown content) in the brand style.
 *
 * Heading colours are DERIVED from the primary (H1 = primary, H2/H3 progressively
 * lighter) so a single brand colour yields a coherent heading hierarchy — the
 * same shade logic used elsewhere in the app.
 */

export interface BrandDocxTheme {
  name?: string | null;
  primaryColor?: string | null;
  textColor?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  logoUrl?: string | null;
}

// ── colour helpers ──────────────────────────────────────────────────────────
/** Strip a leading '#' — docx wants bare hex. Falls back to a safe value. */
const bare = (hex: string | null | undefined, fallback: string): string => {
  const h = (hex ?? "").replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : fallback;
};
/** Blend two bare-hex colours → bare hex. */
const mix = (a: string, b: string, t: number): string => {
  const rgb = (h: string) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`;
};

/** Perceived-light test (bare hex). The .docx page is white paper, so any colour
 *  that's too light on white must be darkened or it renders invisible. */
const isLightOnWhite = (h: string): boolean => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
};

/** points → half-points (docx unit). */
const hp = (pt: number) => Math.round(pt * 2);

const GREY = "666666";

interface ResolvedStyle {
  primary: string;
  h1: string;
  h2: string;
  h3: string;
  ink: string;
  headingFont: string;
  bodyFont: string;
}

const resolveStyle = (theme: BrandDocxTheme): ResolvedStyle => {
  // The .docx page is ALWAYS white paper, but app themes are often designed for
  // a dark UI background — their textColor is white/light. Used verbatim it
  // renders invisible (the reported bug: body text white in Google Docs/Pages).
  // Guard: light colours are darkened for paper, never trusted blindly.
  const rawPrimary = bare(theme.primaryColor, "1a357c");
  const primary = isLightOnWhite(rawPrimary) ? mix(rawPrimary, "000000", 0.45) : rawPrimary;
  const rawInk = bare(theme.textColor, "1a1a1a");
  const ink = isLightOnWhite(rawInk) ? "1a1a1a" : rawInk;
  return {
    primary,
    h1: primary,
    h2: mix(primary, "ffffff", 0.15),
    h3: mix(primary, "ffffff", 0.32),
    ink,
    headingFont: theme.headingFont?.trim() || "Inter",
    bodyFont: theme.bodyFont?.trim() || "Inter",
  };
};

const NUMBERING_REF = "brand-ol";

const buildStyles = (s: ResolvedStyle) => ({
  default: {
    document: { run: { font: s.bodyFont, size: hp(10.5), color: s.ink } },
  },
  paragraphStyles: [
    {
      // Google Docs IGNORES w:docDefaults on import, so body text needs its colour
      // on an EXPLICIT Normal style — without it, imported body text renders with
      // Docs' own default (which came out white/invisible). Other viewers honour
      // docDefaults; this belt-and-suspenders keeps every viewer consistent.
      id: "Normal",
      name: "Normal",
      run: { font: s.bodyFont, size: hp(10.5), color: s.ink },
    },
    {
      id: "Title",
      name: "Title",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { font: s.headingFont, size: hp(26), color: s.primary, bold: true },
      paragraph: { spacing: { after: 80 } },
    },
    {
      id: "Subtitle",
      name: "Subtitle",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { font: s.bodyFont, size: hp(15), color: GREY },
      paragraph: { spacing: { after: 240 } },
    },
    {
      id: "Heading1",
      name: "Heading 1",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { font: s.headingFont, size: hp(20), color: s.h1, bold: true },
      paragraph: { spacing: { before: 320, after: 120 } },
    },
    {
      id: "Heading2",
      name: "Heading 2",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { font: s.headingFont, size: hp(16), color: s.h2, bold: true },
      paragraph: { spacing: { before: 260, after: 100 } },
    },
    {
      id: "Heading3",
      name: "Heading 3",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { font: s.headingFont, size: hp(14), color: s.h3, bold: true },
      paragraph: { spacing: { before: 220, after: 80 } },
    },
    {
      id: "Heading4",
      name: "Heading 4",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { font: s.headingFont, size: hp(12), color: GREY, bold: false },
      paragraph: { spacing: { before: 180, after: 60 } },
    },
    {
      id: "Heading5",
      name: "Heading 5",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { font: s.headingFont, size: hp(11), color: GREY, bold: false },
      paragraph: { spacing: { before: 160, after: 40 } },
    },
    {
      id: "Heading6",
      name: "Heading 6",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { font: s.headingFont, size: hp(11), color: GREY, bold: false, italics: true },
      paragraph: { spacing: { before: 160, after: 40 } },
    },
  ],
});

const numberingConfig = () => ({
  config: [
    {
      reference: NUMBERING_REF,
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 480, hanging: 260 } } },
        },
      ],
    },
  ],
});

// ── logo image ──────────────────────────────────────────────────────────────
type ImgType = "png" | "jpg" | "gif" | "bmp";
const imgTypeFor = (url: string, contentType: string | null): ImgType | null => {
  const ct = (contentType || "").toLowerCase();
  const u = url.toLowerCase();
  if (ct.includes("png") || u.endsWith(".png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg") || u.endsWith(".jpg") || u.endsWith(".jpeg"))
    return "jpg";
  if (ct.includes("gif") || u.endsWith(".gif")) return "gif";
  if (ct.includes("bmp") || u.endsWith(".bmp")) return "bmp";
  // SVG (and unknown) are not embeddable via ImageRun without a raster fallback.
  return null;
};

interface LogoData {
  data: ArrayBuffer;
  type: ImgType;
}

/**
 * Rasterize any browser-decodable image blob (SVG, webp, …) to PNG bytes via
 * canvas. Browser-only; returns null in non-DOM environments or on failure.
 * This is what lets an SVG logo (the common case for website-imported themes)
 * still appear in the .docx header — ImageRun cannot embed SVG directly.
 */
const rasterizeToPng = async (blob: Blob): Promise<ArrayBuffer | null> => {
  if (typeof document === "undefined") return null;
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = url;
    });
    // SVGs without intrinsic size report 0×0 — fall back to a square canvas.
    const w = img.naturalWidth || 240;
    const h = img.naturalHeight || 240;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    return png ? await png.arrayBuffer() : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Fetch the logo as raster bytes. Directly-embeddable formats (png/jpg/gif/bmp)
 * pass through; anything else the browser can decode (svg, webp) is rasterized
 * to PNG. Returns null only on hard failures (CORS, 404, undecodable).
 */
const fetchLogo = async (logoUrl?: string | null): Promise<LogoData | null> => {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const type = imgTypeFor(logoUrl, res.headers.get("content-type"));
    if (type) return { data: await res.arrayBuffer(), type };
    const png = await rasterizeToPng(await res.blob());
    return png ? { data: png, type: "png" } : null;
  } catch {
    return null;
  }
};

const buildHeader = (theme: BrandDocxTheme, s: ResolvedStyle, logo: LogoData | null) => {
  const name = (theme.name || "").trim();
  if (!name && !logo) return undefined;

  // NO tab stops here: Google Docs ignores a right tab in headers (name+logo
  // collapse together on the left) while Pages honours it (split to the sides)
  // — inconsistent. A plain RIGHT-aligned paragraph with name + logo side by
  // side renders identically everywhere, and matches the classic brand-template
  // look (name and logo together at the top right).
  const children: (TextRun | ImageRun)[] = [];
  if (name) {
    children.push(
      new TextRun({
        text: name,
        bold: true,
        font: s.headingFont,
        size: hp(11),
        color: s.primary,
        // Inline images sit ON the baseline, so plain text renders visibly lower
        // than the 40px logo beside it. Raising the name ~9pt centres it against
        // the logo's height. No logo → no raise.
        position: logo ? "9pt" : undefined,
      }),
    );
  }
  if (logo) {
    if (name) children.push(new TextRun({ text: "  ", font: s.bodyFont }));
    children.push(
      new ImageRun({
        type: logo.type,
        data: logo.data,
        transformation: { width: 40, height: 40 },
      }),
    );
  }

  return {
    default: new Header({
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children })],
    }),
  };
};

// ── minimal, safe markdown → docx paragraphs ────────────────────────────────
/**
 * Inline parser: **bold**, *italic* / _italic_, `code`. Order matters.
 * `color` (bare hex) is applied to every run when given — pass it for BODY text
 * (so Google Docs, which drops docDefaults, still shows it) and OMIT it for
 * headings (so they keep their heading-style colour instead of being overridden).
 */
const inlineRuns = (text: string, font: string, color?: string): TextRun[] => {
  const runs: TextRun[] = [];
  // Split on the three inline markers, keeping delimiters via capture groups.
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (t: string, opts: { bold?: boolean; italics?: boolean; code?: boolean } = {}) => {
    if (!t) return;
    runs.push(
      new TextRun({
        text: t,
        bold: opts.bold,
        italics: opts.italics,
        font: opts.code ? "Consolas" : font,
        color,
      }),
    );
  };
  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**") || tok.startsWith("__")) push(tok.slice(2, -2), { bold: true });
    else if (tok.startsWith("`")) push(tok.slice(1, -1), { code: true });
    else push(tok.slice(1, -1), { italics: true });
    last = m.index + tok.length;
  }
  push(text.slice(last));
  return runs.length ? runs : [new TextRun({ text: "", font, color })];
};

const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

const buildTable = (rows: string[][], s: ResolvedStyle): Table => {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "dddddd" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (cells, r) =>
        new TableRow({
          children: cells.map(
            (cell) =>
              new TableCell({
                shading: r === 0 ? { fill: "f4f4f4" } : undefined,
                margins: { top: 40, bottom: 40, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    children: inlineRuns(cell, s.bodyFont, s.ink),
                    style: "Normal",
                  }),
                ],
              }),
          ),
        }),
    ),
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
  });
};

/** Convert markdown text into docx block children (paragraphs, lists, tables). */
const markdownToChildren = (markdown: string, s: ResolvedStyle): (Paragraph | Table)[] => {
  const out: (Paragraph | Table)[] = [];
  const lines = markdown.replace(/\r/g, "").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Table: a header row followed by a separator row.
    if (trimmed.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const rows: string[][] = [splitRow(trimmed)];
      i += 2; // skip header + separator
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--; // step back; outer loop will ++
      out.push(buildTable(rows, s));
      continue;
    }

    // Headings (levels 1-6 → Word Heading1..6 styles)
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(
        new Paragraph({ children: inlineRuns(h[2], s.headingFont), style: `Heading${level}` }),
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      out.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "e0e0e0", space: 1 } },
          spacing: { before: 120, after: 120 },
          children: [],
        }),
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      out.push(
        new Paragraph({
          children: inlineRuns(trimmed.replace(/^>\s?/, ""), s.bodyFont, s.ink),
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: s.primary, space: 8 } },
          indent: { left: 240 },
          spacing: { before: 60, after: 60 },
        }),
      );
      continue;
    }

    // Unordered list
    const ul = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ul) {
      out.push(
        new Paragraph({ children: inlineRuns(ul[1], s.bodyFont, s.ink), bullet: { level: 0 } }),
      );
      continue;
    }

    // Ordered list
    const ol = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (ol) {
      out.push(
        new Paragraph({
          children: inlineRuns(ol[1], s.bodyFont, s.ink),
          numbering: { reference: NUMBERING_REF, level: 0 },
        }),
      );
      continue;
    }

    // Plain paragraph
    out.push(new Paragraph({ children: inlineRuns(trimmed, s.bodyFont, s.ink), style: "Normal" }));
  }

  return out;
};

// ── document assembly ───────────────────────────────────────────────────────
const SAMPLE_TEMPLATE_MD = `Subtitle
# Heading 1
This is body text. Replace it with your own — the Title, Heading (1–6) and Normal styles are already wired to your brand. Paste your Markdown-exported content here, or write directly.
## Heading 2
Body text under a second-level heading.
### Heading 3
Body text under a third-level heading.
#### Heading 4
##### Heading 5
###### Heading 6`;

interface BuildArgs {
  theme: BrandDocxTheme;
  title?: string;
  /** Markdown body. When omitted, a short style-showcase template is used. */
  markdown?: string;
  logo: LogoData | null;
}

const buildDocument = ({ theme, title, markdown, logo }: BuildArgs): Document => {
  const s = resolveStyle(theme);
  const children: (Paragraph | Table)[] = [];

  if (title && title.trim()) {
    children.push(new Paragraph({ text: title.trim(), style: "Title" }));
  }
  if (markdown && markdown.trim()) {
    children.push(...markdownToChildren(markdown, s));
  } else {
    // Template mode: showcase the styles so the user sees exactly what they get.
    if (!title) children.push(new Paragraph({ text: theme.name || "Title", style: "Title" }));
    children.push(...markdownToChildren(SAMPLE_TEMPLATE_MD, s));
  }

  const headers = buildHeader(theme, s, logo);

  return new Document({
    creator: "Plan AI",
    title: title?.trim() || `${theme.name || "Brand"} — Template`,
    styles: buildStyles(s),
    numbering: numberingConfig(),
    sections: [
      {
        // Default top margin (1") leaves the doc Title crowding the header
        // (header sits at ~0.5"). 1.25" gives the brand header room to breathe.
        properties: { page: { margin: { top: 1800 } } },
        ...(headers ? { headers } : {}),
        children,
      },
    ],
  });
};

const safeFileName = (name: string) =>
  (name || "document").replace(/[\\/:*?"<>|]+/g, "").trim() || "document";

/**
 * [Feature A] Download an (almost) empty branded .docx TEMPLATE. Keep it in
 * Google Drive / Docs as the company's reusable theme.
 */
export const downloadThemeTemplateDocx = async (theme: BrandDocxTheme): Promise<void> => {
  const logo = await fetchLogo(theme.logoUrl);
  const doc = buildDocument({ theme, logo });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${safeFileName(theme.name || "Brand")} — Theme Template.docx`);
};

/**
 * [Feature B] Export real markdown content as a branded .docx (Title + themed
 * headings/body + logo header), so a Plan AI doc opens in Google Docs already
 * on-brand — no copy/paste-into-a-template step.
 */
export const exportThemedDocx = async (
  theme: BrandDocxTheme,
  title: string,
  markdown: string,
): Promise<void> => {
  const logo = await fetchLogo(theme.logoUrl);
  const doc = buildDocument({ theme, title, markdown, logo });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${safeFileName(title)}.docx`);
};

// Exported for unit/headless verification (node can call Packer.toBuffer on it).
export const __buildBrandDocumentForTest = (args: {
  theme: BrandDocxTheme;
  title?: string;
  markdown?: string;
  logo?: { data: ArrayBuffer; type: "png" | "jpg" | "gif" | "bmp" } | null;
}): Document =>
  buildDocument({
    theme: args.theme,
    title: args.title,
    markdown: args.markdown,
    logo: args.logo ?? null,
  });
