import { search, SafeSearchType } from "duck-duck-scrape";
import { webScraperService } from "./webScraperService";
import { logger } from "../utils/logger";

/**
 * Read-only web tools for the assistant: search the open web and read a page.
 *
 * Both are safe (no side effects, no writes), so the assistant runs them
 * without a confirmation card. They give a mobile-first user the two things the
 * meeting corpus can't: what's happening OUT THERE, and the content of a link
 * they were sent. Reuses `duck-duck-scrape` and `webScraperService` (Readability),
 * both already dependencies.
 */

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

/** Searches the open web. Returns a short, ranked list for the model to cite. */
export const searchWeb = async (query: string, limit = 6): Promise<WebSearchResult[]> => {
  try {
    const res = await search(query, { safeSearch: SafeSearchType.MODERATE });
    if (res.noResults) return [];
    return res.results.slice(0, limit).map((r) => ({
      title: r.title,
      url: r.url,
      // Descriptions carry <b> highlight tags — strip them for clean text.
      snippet: (r.description || "").replace(/<\/?b>/g, ""),
    }));
  } catch (err) {
    logger.warn("[assistant-web] search failed", err);
    return [];
  }
};

export interface WebPage {
  url: string;
  title: string;
  /** Extracted readable text, capped so it can't blow up the prompt. */
  content: string;
}

/** How much page text to hand the model — enough to reason over, not the world. */
const MAX_PAGE_CHARS = 12_000;

/**
 * Fetches a URL and returns its readable text so the model can answer about it
 * IN THIS conversation. This is the pragmatic "expand context via a website":
 * the page informs the current answer without being permanently stored.
 */
export const fetchWebPage = async (url: string): Promise<WebPage | null> => {
  // Only http(s) — never let the model coax a file:// or internal-scheme fetch.
  if (!/^https?:\/\//i.test(url)) {
    logger.warn(`[assistant-web] refused non-http url: ${url.slice(0, 80)}`);
    return null;
  }

  try {
    const page = await webScraperService.scrapeUrl(url);
    if (!page || !page.content?.trim()) return null;
    return {
      url: page.url,
      title: page.title,
      content: page.content.slice(0, MAX_PAGE_CHARS),
    };
  } catch (err) {
    logger.warn(`[assistant-web] fetch failed for ${url.slice(0, 80)}`, err);
    return null;
  }
};
