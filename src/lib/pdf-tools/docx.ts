import type { ExtractedPdfPage } from "../../types/pdf-tool.ts";

export async function createDocxFromExtractedPages(
  pages: readonly ExtractedPdfPage[],
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw new DOMException("Processing was cancelled.", "AbortError");
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const children = pages.flatMap((page, pageIndex) => {
    const lines = page.lines.length ? page.lines : [""];
    return lines.map((line, lineIndex) => new Paragraph({
      pageBreakBefore: pageIndex > 0 && lineIndex === 0,
      children: [new TextRun(line)],
      spacing: { after: line ? 100 : 0 },
    }));
  });
  const document = new Document({
    creator: "ToolsApp",
    description: "Locally extracted PDF text",
    sections: [{ children }],
  });
  const blob = await Packer.toBlob(document);
  if (signal?.aborted) throw new DOMException("Processing was cancelled.", "AbortError");
  return blob;
}
