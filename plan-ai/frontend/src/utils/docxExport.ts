import { convertMarkdownToDocx } from "@mohtasham/md-to-docx";
import { saveAs } from "file-saver";
import { exportThemedDocx, type BrandDocxTheme } from "./brandDocx";

/**
 * Export markdown as a .docx. When a Brand Theme is supplied (and carries real
 * styling — a primary colour, heading font or logo), the document is rendered
 * ON-BRAND via `exportThemedDocx` (Title + themed headings/body + logo header),
 * so it opens in Google Docs already in the company's style. Without a theme it
 * falls back to the library's plain conversion — existing behaviour, unchanged.
 */
export async function exportMarkdownToDocx(
  title: string,
  markdown: string,
  theme?: BrandDocxTheme | null,
) {
  if (theme && (theme.primaryColor || theme.headingFont || theme.logoUrl)) {
    await exportThemedDocx(theme, title, markdown);
    return;
  }

  // Prepend the title as an H1 heading so it appears prominently in the document
  const content = `# ${title}\n\n${markdown}`;

  // Use the library to accurately parse all markdown features (tables, lists, bold, etc)
  const blob = await convertMarkdownToDocx(content);
  saveAs(blob, `${title}.docx`);
}
