import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { parse } from "parse5";
import * as cheerio from "cheerio";
import { logger } from "./logger";

/**
 * Sanitizes LLM-authored HTML before it is stored or served.
 *
 * THREAT MODEL — read this before relaxing anything here.
 *
 * The HTML is written by a model, from a message typed by an anonymous stranger
 * on Telegram, and is then served from OUR domain. Any script that survives runs
 * on the same origin as the logged-in application: it can read `localStorage`,
 * call the API with the viewer's session, and rewrite the page. That is stored
 * XSS, and the prospect's brief is the injection vector.
 *
 * Defence is layered, because no single layer should be load-bearing:
 *   1. This sanitizer strips scripts, event handlers and external references.
 *   2. The public route serves it with a restrictive CSP.
 *   3. The viewer renders it inside a fully-sandboxed <iframe> — no scripts, no
 *      same-origin — so anything that slips through has no origin to abuse.
 *
 * `dompurify` and `jsdom` are already dependencies; nothing new is introduced.
 */

/** Prototypes are single screens. Anything larger is a runaway generation. */
const MAX_HTML_BYTES = 400_000;

/**
 * Tags a static prototype legitimately needs. Everything else is dropped.
 * `style` is allowed because the prototype ships its own CSS inline — that is
 * what makes it self-contained and free of external requests.
 */
const ALLOWED_TAGS = [
  "html",
  "head",
  "body",
  "style",
  "title",
  "meta",
  "div",
  "span",
  "section",
  "header",
  "footer",
  "main",
  "nav",
  "aside",
  "article",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "a",
  "button",
  "label",
  "input",
  "select",
  "option",
  "textarea",
  "form",
  "img",
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "g",
  "text",
  "strong",
  "em",
  "b",
  "i",
  "small",
  "code",
  "pre",
  "blockquote",
  "figure",
  "figcaption",
];

const ALLOWED_ATTR = [
  "class",
  "id",
  "style",
  "title",
  "alt",
  "role",
  "type",
  "placeholder",
  "value",
  "checked",
  "disabled",
  "readonly",
  "name",
  "for",
  "colspan",
  "rowspan",
  "width",
  "height",
  "viewBox",
  "fill",
  "stroke",
  "stroke-width",
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "rx",
  "ry",
  "transform",
  "text-anchor",
  "font-size",
  "font-family",
  "font-weight",
  "opacity",
  "charset",
  // `href` enables in-page navigation between screens (`href="#pantalla2"`), the
  // pure-CSS `:target` flow that lets a prototype have several screens with no
  // JavaScript. It is constrained to fragments only by ALLOWED_URI_REGEXP below.
  "href",
  // The screen label our tab bar reads. Explicitly allowed because
  // ALLOW_DATA_ATTR is off, which would otherwise strip every data-* attribute.
  "data-title",
];

/**
 * `href` is restricted to page-internal fragments. This is what makes a
 * multi-screen `:target` flow possible while keeping every external URL out —
 * a remote `href` would leak the viewer's IP and let the page phone home.
 * Anything not matching (https:, //, javascript:, data:) is dropped by DOMPurify.
 */
const FRAGMENT_ONLY_URI = /^#[A-Za-z0-9_-]*$/;

/**
 * Remote references would leak the viewer's IP to third parties and let a
 * generated page phone home. A prototype must be entirely self-contained. `href`
 * is deliberately excluded here (fragments are legal); the rest stay flagged.
 */
// NOT global. A `/g` regex carries `lastIndex` between calls, so using the same
// object for `.test()` and then `.replace()` makes the second call start
// mid-string and silently miss matches — in a security filter, that is a hole.
const EXTERNAL_REF = /\b(?:src|xlink:href|action|formaction|background|poster)\s*=/i;
// `["'\s]*` is ONE quantifier, not two `\s*` split by an optional char. The old
// `\s*['"]?\s*` was ambiguous: on `url(` + a long whitespace run the engine
// tried every split point before failing — O(n²), a synchronous stall that
// freezes the whole event loop (measured 64k chars → ~4.8s). This form is linear.
const HAS_CSS_REMOTE = /url\(["'\s]*(?:https?:)?\/\//i;
const HAS_CSS_IMPORT = /@import\b/i;

// Replacements match the WHOLE construct, not just its scheme: rewriting
// `url('https://evil.com/x.png')` to `url(` would leave `evil.com/x.png')`
// behind as a relative URL and corrupt the stylesheet.
const CSS_REMOTE_DECL = /url\(["'\s]*(?:https?:)?\/\/[^)]*\)/gi;
const CSS_IMPORT_DECL = /@import[^;]*;?/gi;

export interface SanitizeResult {
  html: string;
  /** What was removed, for logging. Never shown to the prospect. */
  removed: string[];
  /** HTML parse errors found before sanitizing. */
  syntaxErrors: string[];
}

/**
 * The closest thing HTML has to a compile step.
 *
 * HTML never fails to "compile" — the spec REQUIRES parsers to recover from
 * anything, so a browser silently repairs a missing `</div>` and moves on. That
 * recovery is what makes broken output dangerous: nothing complains, but the
 * page renders wrong, and a stray unclosed tag can swallow every element after
 * it — a prototype that looks fine to the generator and empty to the prospect.
 *
 * `parse5` reports the spec-level errors a browser silently swallows, which
 * gives us a real syntax check to gate the generation on.
 *
 * Codes are things like `missing-end-tag`, `unexpected-character-in-attribute-name`,
 * `duplicate-attribute`.
 */
export const findHtmlSyntaxErrors = (html: string, limit = 25): string[] => {
  const errors: string[] = [];
  try {
    parse(html, {
      sourceCodeLocationInfo: false,
      onParseError: (err) => {
        if (errors.length < limit) errors.push(`${err.code} (línea ${err.startLine})`);
      },
    });
  } catch (err) {
    // parse5 throwing at all would be remarkable; treat it as fatally malformed.
    errors.push(`parser-crash: ${err instanceof Error ? err.message : String(err)}`);
  }
  return errors;
};

/**
 * Errors that DESTROY content, as opposed to merely being untidy.
 *
 * Note what is deliberately NOT here: an unclosed `<div>` or `<p>`. The HTML
 * spec defines implied end tags, so parse5 reports no error and no content is
 * lost — flagging it would reject perfectly good prototypes.
 *
 * The `eof-in-*` family is the dangerous one. Verified against parse5 8.0:
 *
 *   <style>body{}<div><h1>Comandas</h1>   → eof-in-element-that-can-contain-only-text
 *                                           visible text: ""   ← page swallowed
 *   <div class="card><h1>Comandas</h1>    → eof-in-tag
 *                                           visible text: ""   ← page swallowed
 *
 * Both render as a blank page. `duplicate-attribute` and `missing-doctype` are
 * excluded on purpose: they render fine and would only cause needless retries.
 */
const STRUCTURAL_ERROR = /eof-in-|abrupt-|unexpected-character-in-attribute/;

export const hasStructuralErrors = (errors: string[]): boolean =>
  errors.some((code) => STRUCTURAL_ERROR.test(code));

/**
 * Returns sanitized HTML, or null when nothing usable survives.
 *
 * Deliberately conservative: for a sales prototype, dropping a questionable
 * element costs a bit of polish, while letting one through costs a session.
 */
export const sanitizePrototypeHtml = (raw: string): SanitizeResult | null => {
  if (!raw?.trim()) return null;

  const removed: string[] = [];

  // Models like to wrap output in a markdown fence even when told not to.
  let html = raw
    .trim()
    .replace(/^```(?:html)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "");

  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    logger.warn(`[prototype] html over size cap (${Buffer.byteLength(html, "utf8")}B)`);
    return null;
  }

  // Checked on the RAW output: sanitizing rewrites the markup, so errors found
  // afterwards would be ours, not the model's.
  const syntaxErrors = findHtmlSyntaxErrors(html);
  if (syntaxErrors.length) {
    logger.warn(
      `[prototype] ${syntaxErrors.length} error(es) de sintaxis: ${syntaxErrors.slice(0, 5).join(", ")}`,
    );
  }

  if (EXTERNAL_REF.test(html)) removed.push("external-refs");
  if (HAS_CSS_REMOTE.test(html) || HAS_CSS_IMPORT.test(html)) removed.push("remote-css");

  // Strip remote CSS before DOMPurify: DOMPurify does not parse the contents of
  // a <style> block, so a `url(https://…)` or `@import` inside one would survive.
  html = html.replace(CSS_REMOTE_DECL, "none").replace(CSS_IMPORT_DECL, "");

  const window = new JSDOM("").window;
  const purify = createDOMPurify(window as unknown as Window & typeof globalThis);

  const clean = purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Only page-internal fragment links survive. `href="#screen2"` (the CSS
    // `:target` flow) passes; `https:`, `//`, `javascript:` and `data:` do not.
    ALLOWED_URI_REGEXP: FRAGMENT_ONLY_URI,
    WHOLE_DOCUMENT: true,
    // Belt and braces: these are already absent from ALLOWED_TAGS, but naming
    // them makes the intent explicit to anyone editing the list above.
    FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "base", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "srcdoc", "formaction"],
    // data-* attributes are inert (no execution, no requests) and we need
    // `data-title` to survive for the tab bar. DOMPurify strips ALL data-*
    // when this is false, even ones named in ALLOWED_ATTR.
    ALLOW_DATA_ATTR: true,
  });

  if (purify.removed.length) removed.push(`dompurify:${purify.removed.length}`);

  const text = clean.replace(/<[^>]*>/g, "").trim();
  // A document with markup but no words is a failed generation, not a prototype.
  if (!clean.trim() || text.length < 20) {
    logger.warn("[prototype] nothing usable survived sanitization");
    return null;
  }

  return { html: clean, removed, syntaxErrors };
};

/**
 * Wraps sanitized fragment HTML into a complete, responsive document.
 * Applied after sanitization so the wrapper itself can never be tampered with.
 */
export const wrapPrototypeDocument = (bodyHtml: string, title: string): string => {
  const safeTitle = title.replace(/[<>&"]/g, "");
  // This CSP is the REAL backstop for outbound requests, not the CSS regexes
  // above. Those are textual and cannot see through CSS's own escape layer
  // (`\75rl(...)`, `url(https:\2f\2f...)`), so a remote `url()` can survive
  // sanitization. `default-src 'none'` blocks every subresource — image, font,
  // stylesheet fetch — at render time regardless of what escaped, turning any
  // surviving beacon into a blocked request. `style-src 'unsafe-inline'` is
  // required because the prototype ships its CSS in an inline <style>; `img-src`
  // and `font-src data:` allow only self-contained data URIs.
  const csp =
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
</head>
<body>
${bodyHtml}
</body>
</html>`;
};

const esc = (s: string) => s.replace(/[<>&"]/g, "");

/**
 * Assembles the final prototype from the model's SCREENS, adding navigation we
 * generate ourselves.
 *
 * The model is asked for polished single screens (`<section class="berry-screen"
 * data-title="…">`) and NO navigation — because wiring `:target`/href flows is
 * exactly what it got wrong, leaving most buttons dead. Here we build a
 * DETERMINISTIC tab bar with the pure-CSS radio (`:checked`) technique: one
 * hidden radio per screen, a label per tab, and CSS that shows the screen whose
 * radio is checked. Toggling a radio is native browser behaviour — no
 * JavaScript, so it runs inside the fully-sandboxed iframe — and because WE
 * generate the wiring it can never point at a screen that doesn't exist.
 *
 * Also collapses the double document (sanitization runs WHOLE_DOCUMENT and
 * returns a full <html>; we lift out styles + screens and emit one clean doc).
 */
export interface PhoneChrome {
  /** Shown when a screen fails to extract. */
  emptyLabel: string;
}

export const finalizePrototypeHtml = (
  sanitizedHtml: string,
  title: string,
  chrome: PhoneChrome = { emptyLabel: "Screen" },
): string => {
  const $ = cheerio.load(sanitizedHtml);

  const styles = $("style")
    .map((_, el) => $(el).html() ?? "")
    .get()
    .join("\n");

  // The model's screens. Fall back to the whole body as a single screen if it
  // ignored the convention, so we always render something.
  let screens = $(".berry-screen")
    .map((i, el) => ({
      title: $(el).attr("data-title")?.trim() || `${chrome.emptyLabel} ${i + 1}`,
      html: $.html(el),
    }))
    .get();

  if (!screens.length) {
    screens = [{ title: chrome.emptyLabel, html: `<section>${$("body").html() ?? ""}</section>` }];
  }

  // Strip any stray navigation the model added despite instructions — with our
  // tabs it is redundant, and a leftover href="#x" could still dead-end.
  const stripped = screens.map((s) =>
    s.html
      .replace(/\shref="[^"]*"/gi, "")
      .replace(/class="berry-screen"/gi, 'class="berry-screen"'),
  );

  const radios = screens
    .map(
      (_, i) =>
        `<input type="radio" name="berry-nav" id="berry-scr-${i}"${i === 0 ? " checked" : ""} class="berry-radio">`,
    )
    .join("\n");

  const tabs = screens
    .map((s, i) => `<label for="berry-scr-${i}" class="berry-tab">${esc(s.title)}</label>`)
    .join("\n");

  const stage = stripped
    .map((html, i) => `<div class="berry-frame" data-idx="${i}">${html}</div>`)
    .join("\n");

  // Per-screen visibility rules: show the frame whose radio is checked, and
  // highlight its tab. Generated deterministically so navigation always works.
  const navRules = screens
    .map(
      (_, i) =>
        `#berry-scr-${i}:checked ~ .berry-stage .berry-frame[data-idx="${i}"]{display:block}\n` +
        `#berry-scr-${i}:checked ~ .berry-tabs .berry-tab:nth-of-type(${i + 1}){background:rgba(0,0,0,0.06);font-weight:600}`,
    )
    .join("\n");

  const shellCss = `
.berry-shell{max-width:420px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.berry-radio{position:absolute;left:-9999px}
.berry-tabs{display:flex;gap:6px;padding:10px 12px;overflow-x:auto;border-bottom:1px solid rgba(0,0,0,0.08)}
.berry-tab{flex:0 0 auto;padding:6px 14px;border-radius:999px;font-size:13px;cursor:pointer;white-space:nowrap;background:rgba(0,0,0,0.03);user-select:none}
.berry-stage{position:relative}
.berry-frame{display:none}
.berry-phone{border:10px solid #111;border-radius:36px;overflow:hidden;margin:16px auto;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.25)}
.berry-phone .berry-frame{height:720px;overflow-y:auto}
${navRules}`;

  const csp =
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${styles}
${shellCss}</style>
</head>
<body>
<div class="berry-shell">
${radios}
<div class="berry-tabs">
${tabs}
</div>
<div class="berry-stage berry-phone">
${stage}
</div>
</div>
</body>
</html>`;
};
