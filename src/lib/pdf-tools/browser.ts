"use client";

import { FileToolProcessingError } from "../file-tools/errors";
import { canvasToBlob, createImageCanvas, decodeImage, throwIfAborted } from "../image-tools/browser";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { ToolFileItem } from "../../types/file-tool";
import type {
  ExtractedPdfPage,
  ImagePdfOptions,
  PdfCompressionMode,
  PdfTextItem,
} from "../../types/pdf-tool";
import {
  MAX_PDF_PAGES,
  buildPdfFileName,
  fileHasPdfHeader,
  groupPdfTextItems,
  resolveImagePdfPageLayout,
} from "./core";

type ProgressReporter = (progress: number, message: string, fileId?: string) => void;

type PdfJs = typeof import("pdfjs-dist");

let pdfJsPromise: Promise<PdfJs> | null = null;

async function getPdfJs() {
  pdfJsPromise ??= import("pdfjs-dist").then((pdfJs) => {
    if (!pdfJs.GlobalWorkerOptions.workerSrc) {
      pdfJs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
    }
    return pdfJs;
  });
  return pdfJsPromise;
}

function friendlyPdfError(error: unknown): FileToolProcessingError {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (name === "PasswordException" || message.includes("password") || message.includes("encrypted")) {
    return new FileToolProcessingError(
      "Password-protected or encrypted PDFs are not supported. Remove the password locally, then try again.",
      { retryable: false },
    );
  }
  if (name === "InvalidPDFException" || message.includes("invalid pdf") || message.includes("malformed")) {
    return new FileToolProcessingError(
      "This PDF appears damaged or malformed and could not be read safely.",
      { retryable: false },
    );
  }
  return error instanceof FileToolProcessingError
    ? error
    : new FileToolProcessingError("This PDF could not be processed in the browser. Try another valid PDF.");
}

export async function readPdfFile(file: File) {
  if (!(await fileHasPdfHeader(file))) {
    throw new FileToolProcessingError(
      "The selected file does not contain a valid PDF header. Renaming a file to .pdf does not convert it.",
      { retryable: false },
    );
  }
  return new Uint8Array(await file.arrayBuffer());
}

async function withPdfDocument<T>(
  bytes: Uint8Array,
  signal: AbortSignal | undefined,
  action: (document: PDFDocumentProxy) => Promise<T>,
) {
  throwIfAborted(signal);
  const pdfJs = await getPdfJs();
  const loadingTask = pdfJs.getDocument({
    data: bytes.slice(),
    enableXfa: false,
    stopAtErrors: true,
    useSystemFonts: true,
  });
  const abort = () => { void loadingTask.destroy(); };
  signal?.addEventListener("abort", abort, { once: true });
  let document: PDFDocumentProxy | null = null;
  try {
    document = await loadingTask.promise;
    throwIfAborted(signal);
    if (document.numPages > MAX_PDF_PAGES) {
      throw new FileToolProcessingError(
        `This PDF has ${document.numPages.toLocaleString()} pages. The browser limit is ${MAX_PDF_PAGES.toLocaleString()} pages per document.`,
        { retryable: false },
      );
    }
    return await action(document);
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Processing was cancelled.", "AbortError");
    throw friendlyPdfError(error);
  } finally {
    signal?.removeEventListener("abort", abort);
    if (document) await document.cleanup().catch(() => undefined);
    await loadingTask.destroy().catch(() => undefined);
  }
}

export async function inspectPdf(file: File, signal?: AbortSignal) {
  const bytes = await readPdfFile(file);
  return withPdfDocument(bytes, signal, async (document) => ({
    bytes,
    pageCount: document.numPages,
  }));
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement, quality: number) {
  const blob = await canvasToBlob(canvas, "jpeg", quality);
  return new Uint8Array(await blob.arrayBuffer());
}

async function rasterCompressPdf(
  bytes: Uint8Array,
  mode: Exclude<PdfCompressionMode, "preserve">,
  signal: AbortSignal,
  report: ProgressReporter,
  fileId: string,
) {
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const output = await PDFDocument.create();
  const preset = mode === "strong"
    ? { scale: 1, quality: 0.58 }
    : { scale: 1.35, quality: 0.74 };

  const pageCount = await withPdfDocument(bytes, signal, async (document) => {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      throwIfAborted(signal);
      report(
        12 + Math.round(((pageNumber - 1) / document.numPages) * 76),
        `Rendering page ${pageNumber} of ${document.numPages}…`,
        fileId,
      );
      const sourcePage = await document.getPage(pageNumber);
      const viewport = sourcePage.getViewport({ scale: preset.scale });
      const { canvas, context } = createImageCanvas({
        width: Math.max(1, Math.round(viewport.width)),
        height: Math.max(1, Math.round(viewport.height)),
      });
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      try {
        await sourcePage.render({ canvas, canvasContext: context, viewport }).promise;
        throwIfAborted(signal);
        const jpeg = await canvasToJpegBytes(canvas, preset.quality);
        const embedded = await output.embedJpg(jpeg);
        const page = output.addPage([viewport.width / preset.scale, viewport.height / preset.scale]);
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight(),
        });
      } finally {
        sourcePage.cleanup();
        canvas.width = 0;
        canvas.height = 0;
      }
    }
    return document.numPages;
  });

  report(92, "Writing the compressed PDF…", fileId);
  return { bytes: await output.save({ useObjectStreams: true }), pageCount };
}

export async function compressPdf(
  item: ToolFileItem,
  mode: PdfCompressionMode,
  signal: AbortSignal,
  report: ProgressReporter,
) {
  report(4, "Checking the PDF structure…", item.id);
  const input = await readPdfFile(item.file);
  if (mode === "preserve") {
    const inspected = await withPdfDocument(input, signal, async (document) => document.numPages);
    report(38, "Rewriting PDF objects and cleaning document metadata…", item.id);
    try {
      const { rewritePdf } = await import("./document");
      const result = await rewritePdf(input);
      throwIfAborted(signal);
      report(100, "Structure-preserving PDF ready.", item.id);
      return { ...result, pageCount: inspected };
    } catch (error) {
      throw friendlyPdfError(error);
    }
  }
  const result = await rasterCompressPdf(input, mode, signal, report, item.id);
  throwIfAborted(signal);
  report(100, "Visually compressed PDF ready.", item.id);
  return result;
}

export async function mergePdfFiles(
  items: readonly ToolFileItem[],
  signal: AbortSignal,
  report: ProgressReporter,
) {
  const inputs: Uint8Array[] = [];
  const pageCounts: number[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    throwIfAborted(signal);
    report(
      5 + Math.round((index / items.length) * 48),
      `Checking ${item.file.name} (${index + 1} of ${items.length})…`,
      item.id,
    );
    const inspected = await inspectPdf(item.file, signal);
    inputs.push(inspected.bytes);
    pageCounts.push(inspected.pageCount);
  }
  report(62, "Copying pages in the selected order…");
  try {
    const { mergePdfBytes } = await import("./document");
    const result = await mergePdfBytes(inputs);
    throwIfAborted(signal);
    report(100, "Merged PDF ready.");
    return { ...result, pageCounts };
  } catch (error) {
    throw friendlyPdfError(error);
  }
}

export async function createPdfFromImages(
  items: readonly ToolFileItem[],
  options: ImagePdfOptions,
  signal: AbortSignal,
  report: ProgressReporter,
) {
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const output = await PDFDocument.create();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    throwIfAborted(signal);
    report(
      5 + Math.round((index / items.length) * 82),
      `Preparing image ${index + 1} of ${items.length}…`,
      item.id,
    );
    const decoded = await decodeImage(item.file, signal);
    const { canvas, context } = createImageCanvas({ width: decoded.width, height: decoded.height });
    try {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);
      const jpeg = await canvasToJpegBytes(canvas, 0.92);
      const embedded = await output.embedJpg(jpeg);
      const layout = resolveImagePdfPageLayout(decoded.width, decoded.height, options);
      const page = output.addPage([layout.pageWidth, layout.pageHeight]);
      page.drawImage(embedded, {
        x: layout.imageX,
        y: layout.imageY,
        width: layout.imageWidth,
        height: layout.imageHeight,
      });
    } finally {
      decoded.dispose();
      canvas.width = 0;
      canvas.height = 0;
    }
  }
  report(92, "Writing the PDF…");
  const bytes = await output.save({ useObjectStreams: true });
  throwIfAborted(signal);
  report(100, "Image PDF ready.");
  return { bytes, pageCount: output.getPageCount() };
}

export async function extractPdfText(
  item: ToolFileItem,
  signal: AbortSignal,
  report: ProgressReporter,
) {
  const bytes = await readPdfFile(item.file);
  return withPdfDocument(bytes, signal, async (document) => {
    const pages: ExtractedPdfPage[] = [];
    let characterCount = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      throwIfAborted(signal);
      report(
        8 + Math.round(((pageNumber - 1) / document.numPages) * 72),
        `Extracting text from page ${pageNumber} of ${document.numPages}…`,
        item.id,
      );
      const page = await document.getPage(pageNumber);
      try {
        const content = await page.getTextContent({ disableNormalization: false });
        const items: PdfTextItem[] = content.items.flatMap((candidate): PdfTextItem[] => {
          if (!("str" in candidate) || !candidate.str.trim()) return [];
          const textItem = candidate as {
            str: string;
            transform: number[];
            width: number;
            height: number;
            hasEOL?: boolean;
          };
          return [{
            text: textItem.str,
            x: textItem.transform[4],
            y: textItem.transform[5],
            width: textItem.width,
            height: textItem.height,
            hasEol: textItem.hasEOL,
          }];
        });
        const lines = groupPdfTextItems(items);
        characterCount += lines.reduce((total, line) => total + line.length, 0);
        pages.push({ pageNumber, lines });
      } finally {
        page.cleanup();
      }
    }
    if (characterCount === 0) {
      throw new FileToolProcessingError(
        "No selectable text was found. Scanned or image-only PDFs need OCR, which this local converter does not perform.",
        { retryable: false },
      );
    }
    return { pages, pageCount: document.numPages, characterCount };
  });
}

export async function createDocxFromExtractedPages(
  pages: readonly ExtractedPdfPage[],
  signal?: AbortSignal,
) {
  const docx = await import("./docx");
  return docx.createDocxFromExtractedPages(pages, signal);
}

export function defaultMergedPdfName(items: readonly ToolFileItem[]) {
  return buildPdfFileName(items[0]?.file.name ?? "documents", "merged");
}
