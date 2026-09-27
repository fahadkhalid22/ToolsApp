"use client";

import Link from "next/link";
import {
  FileCheck2,
  FileDown,
  FileText,
  Files,
  Image as ImageIcon,
  Info,
  LayoutTemplate,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { FileToolView } from "@/components/file-tools/FileToolView";
import { tools } from "@/data/tools";
import { recordToolCompletion } from "@/lib/discovery/local-state";
import { formatBytes, getFileExtension } from "@/lib/file-tools/format";
import { FileToolProcessingError } from "@/lib/file-tools/errors";
import { useFileWorkflow } from "@/lib/file-tools/useFileWorkflow";
import {
  compressPdf,
  createPdfFromImages,
  createDocxFromExtractedPages,
  extractPdfText,
  defaultMergedPdfName,
  inspectPdf,
  mergePdfFiles,
} from "@/lib/pdf-tools/browser";
import {
  MAX_PDF_BATCH_BYTES,
  MAX_PDF_FILE_BYTES,
  buildPdfFileName,
  compressionChangePercent,
  fileHasPdfHeader,
  fileHasSupportedImageHeader,
  isSmallerPdf,
} from "@/lib/pdf-tools/core";
import type {
  FileProcessingResult,
  FileProcessor,
  FileToolConfig,
  FileValidator,
} from "@/types/file-tool";
import type { PdfCompressionMode } from "@/types/pdf-tool";
import type { ImagePdfOptions, PdfMargin, PdfOrientation, PdfPageSize } from "@/types/pdf-tool";

import type { PdfToolId } from "./PdfToolPage";
import styles from "./PdfTools.module.css";

const pdfHeaderValidator: FileValidator = async (item) => {
  try {
    if (await fileHasPdfHeader(item.file)) return null;
  } catch {
    return {
      code: "validation-unavailable",
      severity: "error",
      message: "This file could not be read by the browser.",
    };
  }
  return {
    code: "custom-validation",
    severity: "error",
    message: "This file does not contain a valid PDF header.",
  };
};

const imageHeaderValidator: FileValidator = async (item) => {
  try {
    if (await fileHasSupportedImageHeader(item.file, getFileExtension(item.file.name))) return null;
  } catch {
    return { code: "validation-unavailable", severity: "error", message: "This image could not be read by the browser." };
  }
  return { code: "custom-validation", severity: "error", message: "This file does not contain a valid JPG or PNG header." };
};

const PDF_BASE_CONFIG = {
  mode: "single",
  maxFileSizeBytes: MAX_PDF_FILE_BYTES,
  maxTotalSizeBytes: MAX_PDF_FILE_BYTES,
  minFiles: 1,
  maxFiles: 1,
  rejectEmptyFiles: true,
  duplicatePolicy: "ignore",
  supportsCancellation: true,
  outputMode: "single",
  privacyNote: "Your document stays in this browser.",
  accepted: {
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    mimeMismatchPolicy: "warn",
  },
  customValidators: [pdfHeaderValidator],
} as const;

const COMPRESSOR_CONFIG: FileToolConfig = {
  ...PDF_BASE_CONFIG,
  id: "pdf-compressor",
  title: "PDF Compressor",
  description: "Reduce file size with a structure-preserving rewrite or visual compression.",
  uploadLabel: "Drop your PDF here or browse",
  uploadHelperText: "One PDF · up to 75 MB · maximum 250 pages",
  processLabel: "Compress PDF",
  downloadLabel: "Download compressed PDF",
};

const MERGE_CONFIG: FileToolConfig = {
  ...PDF_BASE_CONFIG,
  id: "merge-pdf",
  mode: "multiple",
  title: "Merge PDF",
  description: "Combine two or more PDFs in the order you choose.",
  uploadLabel: "Drop PDFs here or browse",
  uploadHelperText: "2–12 PDFs · 250 pages each · 750 pages total · 150 MB total",
  processLabel: "Merge PDFs",
  downloadLabel: "Download merged PDF",
  minFiles: 2,
  maxFiles: 12,
  maxTotalSizeBytes: MAX_PDF_BATCH_BYTES,
  duplicatePolicy: "allow",
  allowReordering: true,
};

const IMAGES_TO_PDF_CONFIG: FileToolConfig = {
  ...PDF_BASE_CONFIG,
  id: "images-to-pdf",
  mode: "multiple",
  title: "JPG / PNG to PDF",
  description: "Arrange your images and choose page settings to create one PDF.",
  uploadLabel: "Drop JPG or PNG images here",
  uploadHelperText: "1–40 images · mixed JPG/PNG supported · up to 150 MB total",
  processLabel: "Create PDF",
  downloadLabel: "Download image PDF",
  accepted: {
    extensions: [".jpg", ".jpeg", ".png"],
    mimeTypes: ["image/jpeg", "image/png"],
    mimeMismatchPolicy: "reject",
  },
  customValidators: [imageHeaderValidator],
  minFiles: 1,
  maxFiles: 40,
  maxTotalSizeBytes: MAX_PDF_BATCH_BYTES,
  duplicatePolicy: "reject",
  allowReordering: true,
};

const PDF_TO_WORD_CONFIG: FileToolConfig = {
  ...PDF_BASE_CONFIG,
  id: "pdf-to-word",
  title: "PDF to Word",
  description: "Turn selectable PDF text into an editable Word document.",
  uploadLabel: "Drop your PDF here or browse",
  uploadHelperText: "Text-based PDF · up to 75 MB · no OCR for scanned pages",
  processLabel: "Convert to Word",
  downloadLabel: "Download Word document",
};

const pdfPageCountCache = new WeakMap<File, Promise<number>>();

function cachedPdfPageCount(file: File) {
  let pending = pdfPageCountCache.get(file);
  if (!pending) {
    pending = inspectPdf(file).then((result) => result.pageCount);
    pdfPageCountCache.set(file, pending);
  }
  return pending;
}

function bytesToBlob(bytes: Uint8Array, type: string) {
  const copy = bytes.slice();
  return new Blob([copy.buffer], { type });
}

type CompressionOptions = { mode: PdfCompressionMode };

const compressPdfProcessor: FileProcessor<CompressionOptions> = async (context) => {
  const item = context.files[0];
  if (!item) throw new Error("Choose a PDF before processing.");
  const result = await compressPdf(
    item,
    context.options.mode,
    context.signal,
    (progress, message, fileId) => context.reportProgress({
      fileId,
      progress,
      overallProgress: progress,
      status: progress === 100 ? "completed" : "processing",
      message,
    }),
  );
  const blob = bytesToBlob(result.bytes, "application/pdf");
  if (!isSmallerPdf(item.file.size, blob.size)) {
    throw new FileToolProcessingError("No smaller valid PDF was found with this mode. Your original file is unchanged. Try another mode if you want to compare results.", { kind: "no-change", retryable: true });
  }
  const change = compressionChangePercent(item.file.size, blob.size);
  const savedBytes = item.file.size - blob.size;
  const modeLabel = context.options.mode === "preserve"
    ? "Structure-preserving"
    : context.options.mode === "balanced"
      ? "Balanced visual"
      : "Strong visual";
  return {
    outputs: [{
      blob,
      fileName: buildPdfFileName(item.file.name, "compressed"),
      mimeType: "application/pdf",
      originalSize: item.file.size,
      metrics: [
        { label: "Pages", value: result.pageCount.toLocaleString() },
        { label: "Mode", value: modeLabel },
      ],
    }],
    metrics: [
      { label: "Original", value: formatBytes(item.file.size) },
      { label: "Output", value: formatBytes(blob.size) },
      { label: "Saved", value: `${formatBytes(savedBytes)} (${change}%)` },
    ],
    summary: `${formatBytes(savedBytes)} saved (${change}% of the original size).`,
  };
};

const mergePdfProcessor: FileProcessor<Record<string, never>> = async (context) => {
  const result = await mergePdfFiles(
    context.files,
    context.signal,
    (progress, message, fileId) => context.reportProgress({
      fileId,
      progress,
      overallProgress: progress,
      status: progress === 100 ? "completed" : "processing",
      message,
    }),
  );
  const blob = bytesToBlob(result.bytes, "application/pdf");
  const inputBytes = context.files.reduce((total, item) => total + item.file.size, 0);
  return {
    outputs: [{
      blob,
      fileName: defaultMergedPdfName(context.files),
      mimeType: "application/pdf",
      originalSize: inputBytes,
      metrics: [
        { label: "Documents", value: context.files.length.toLocaleString() },
        { label: "Pages", value: result.pageCount.toLocaleString() },
      ],
    }],
    metrics: [
      { label: "PDFs combined", value: context.files.length.toLocaleString() },
      { label: "Total pages", value: result.pageCount.toLocaleString() },
      { label: "Output size", value: formatBytes(blob.size) },
    ],
    summary: `${context.files.length} PDFs were combined into ${result.pageCount} pages in the exact queue order shown.`,
  };
};

const imagesToPdfProcessor: FileProcessor<ImagePdfOptions> = async (context) => {
  const result = await createPdfFromImages(
    context.files,
    context.options,
    context.signal,
    (progress, message, fileId) => context.reportProgress({
      fileId,
      progress,
      overallProgress: progress,
      status: progress === 100 ? "completed" : "processing",
      message,
    }),
  );
  const blob = bytesToBlob(result.bytes, "application/pdf");
  const originalSize = context.files.reduce((total, item) => total + item.file.size, 0);
  const pageSizeLabel = context.options.pageSize === "auto"
    ? "Auto per image"
    : context.options.pageSize.toUpperCase();
  return {
    outputs: [{
      blob,
      fileName: buildPdfFileName(context.files[0]?.file.name ?? "images", "images"),
      mimeType: "application/pdf",
      originalSize,
      metrics: [
        { label: "Pages", value: result.pageCount.toLocaleString() },
        { label: "Page size", value: pageSizeLabel },
      ],
    }],
    metrics: [
      { label: "Images", value: context.files.length.toLocaleString() },
      { label: "PDF pages", value: result.pageCount.toLocaleString() },
      { label: "Output size", value: formatBytes(blob.size) },
    ],
    summary: `${context.files.length} ${context.files.length === 1 ? "image was" : "images were"} placed on ${result.pageCount} PDF ${result.pageCount === 1 ? "page" : "pages"} in queue order.`,
  };
};

const pdfToWordProcessor: FileProcessor<Record<string, never>> = async (context) => {
  const item = context.files[0];
  if (!item) throw new Error("Choose a PDF before processing.");
  const report = (progress: number, message: string, fileId?: string) => context.reportProgress({
    fileId,
    progress,
    overallProgress: progress,
    status: progress === 100 ? "completed" : "processing",
    message,
  });
  const extracted = await extractPdfText(item, context.signal, report);
  report(86, "Building the editable Word document…", item.id);
  const blob = await createDocxFromExtractedPages(extracted.pages, context.signal);
  report(100, "Word document ready.", item.id);
  return {
    outputs: [{
      blob,
      fileName: buildPdfFileName(item.file.name, "converted", "docx"),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      originalSize: item.file.size,
      metrics: [
        { label: "Source pages", value: extracted.pageCount.toLocaleString() },
        { label: "Text characters", value: extracted.characterCount.toLocaleString() },
      ],
    }],
    metrics: [
      { label: "Pages read", value: extracted.pageCount.toLocaleString() },
      { label: "Characters", value: extracted.characterCount.toLocaleString() },
      { label: "DOCX size", value: formatBytes(blob.size) },
    ],
    summary: `Selectable text from ${extracted.pageCount} PDF ${extracted.pageCount === 1 ? "page" : "pages"} was written to an editable Word document in page order.`,
  };
};

function useCompletionHistory(toolId: string, result: FileProcessingResult | null) {
  const recordedRef = useRef<FileProcessingResult | null>(null);
  useEffect(() => {
    if (!result) {
      recordedRef.current = null;
      return;
    }
    if (recordedRef.current !== result) {
      recordedRef.current = result;
      recordToolCompletion(toolId);
    }
  }, [result, toolId]);
}

function usePdfMetadata(file: File | null | undefined) {
  const [metadata, setMetadata] = useState<{
    file: File;
    pageCount: number | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    if (!file) return;
    const controller = new AbortController();
    void inspectPdf(file, controller.signal)
      .then((result) => setMetadata({ file, pageCount: result.pageCount, error: null }))
      .catch(() => {
        if (!controller.signal.aborted) {
          setMetadata({ file, pageCount: null, error: "Page count unavailable. Processing will provide a detailed error." });
        }
      });
    return () => controller.abort();
  }, [file]);
  return file && metadata?.file === file ? metadata : { pageCount: null, error: null };
}

function usePdfQueueMetadata(files: readonly { id: string; file: File }[]) {
  const [metadata, setMetadata] = useState<Record<string, { pageCount: number | null; error: boolean }>>({});
  useEffect(() => {
    if (!files.length) return;
    let active = true;
    void Promise.all(files.map(async (item) => {
      try {
        const pageCount = await cachedPdfPageCount(item.file);
        return [item.id, { pageCount, error: false }] as const;
      } catch {
        return [item.id, { pageCount: null, error: true }] as const;
      }
    })).then((entries) => {
      if (active) setMetadata(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, [files]);
  return files.length ? metadata : {};
}

function PdfToolNav({ active }: { active: PdfToolId }) {
  const pdfTools = tools.filter((tool) => tool.categoryId === "pdf");
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !link) return;
    const revealActive = () => {
      nav.scrollLeft += link.getBoundingClientRect().left - nav.getBoundingClientRect().left - 4;
    };
    revealActive();
    const observer = new ResizeObserver(revealActive);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active]);
  return (
    <div className={styles.toolNavWrap}>
      <nav aria-label="PDF tools" className={styles.toolNav} ref={navRef}>
        {pdfTools.map((tool) => (
          <Link
            aria-current={tool.id === active ? "page" : undefined}
            className={tool.id === active ? styles.toolNavActive : ""}
            href={tool.route}
            key={tool.id}
          >
            {tool.name.replace(" Converter", "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function ToolPageFrame({
  active,
  children,
}: {
  active: PdfToolId;
  children: ReactNode;
}) {
  return (
    <main className={styles.main} id="main-content">
      <PdfToolNav active={active} />
      {children}
      <p className={styles.privacyStrip}><ShieldCheck aria-hidden="true" size={14} /> Files stay in your browser. Your originals are unchanged.</p>
    </main>
  );
}

function CompressionModeCard({
  active,
  description,
  label,
  onClick,
  note,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
  note: string;
}) {
  return (
    <button aria-pressed={active} className={styles.modeCard} onClick={onClick} type="button">
      <strong>{label}</strong>
      <small>{description}</small>
      <em>{note}</em>
    </button>
  );
}

function CompressorTool() {
  const [mode, setMode] = useState<PdfCompressionMode>("preserve");
  const workflow = useFileWorkflow(COMPRESSOR_CONFIG, compressPdfProcessor, { mode });
  const file = workflow.state.files[0]?.file;
  const metadata = usePdfMetadata(file);
  useCompletionHistory(COMPRESSOR_CONFIG.id, workflow.state.result);
  return (
    <ToolPageFrame
      active="pdf-compressor"
    >
      <FileToolView
        variant="pdf"
        allowEditing
        actions={workflow.actions}
        config={COMPRESSOR_CONFIG}
        optionsPanel={file ? (
          <>
            <section className={styles.fileFacts} aria-label="Selected PDF details">
              <span><b>{metadata.pageCount?.toLocaleString() ?? "…"}</b><small>{metadata.error ?? "Pages"}</small></span>
              <span><b>{formatBytes(file.size)}</b><small>Original size</small></span>
              <span><b>PDF</b><small>Detected format</small></span>
            </section>
            <section className={styles.optionSection} aria-labelledby="compression-mode-title">
              <h3 className="font-heading" id="compression-mode-title"><FileDown aria-hidden="true" size={17} /> Compression mode</h3>
              <div className={styles.modeGrid}>
                <CompressionModeCard
                  active={mode === "preserve"}
                  description="Rewrites PDF objects and cleans metadata while keeping selectable text, links, forms, and vectors."
                  label="Preserve structure"
                  note="May save little or can grow"
                  onClick={() => setMode("preserve")}
                />
                <CompressionModeCard
                  active={mode === "balanced"}
                  description="Renders each page at a controlled resolution and rebuilds it from JPEG images."
                  label="Balanced visual"
                  note="Flattens page content"
                  onClick={() => setMode("balanced")}
                />
                <CompressionModeCard
                  active={mode === "strong"}
                  description="Uses a lower render resolution and image quality for smaller visual PDFs."
                  label="Strong visual"
                  note="More visible quality loss"
                  onClick={() => setMode("strong")}
                />
              </div>
              {mode !== "preserve" ? (
                <p className={styles.warningLine}>
                  <Info aria-hidden="true" size={16} />
                  Visual compression permanently flattens selectable text, links, forms, annotations, and vector artwork into page images.
                </p>
              ) : null}
            </section>
          </>
        ) : undefined}
        resultInfoSlot={mode === "preserve"
          ? "Structure-preserving compression does not promise savings; the measured output size is shown above."
          : "Visual compression flattens every page and can reduce text sharpness. Keep the original for archival use."}
        state={workflow.state}
      />
    </ToolPageFrame>
  );
}

function MergeTool() {
  const workflow = useFileWorkflow(MERGE_CONFIG, mergePdfProcessor, {});
  const metadata = usePdfQueueMetadata(workflow.state.files);
  const knownPages = workflow.state.files.reduce(
    (total, item) => total + (metadata[item.id]?.pageCount ?? 0),
    0,
  );
  const pendingCount = workflow.state.files.filter((item) => metadata[item.id]?.pageCount === undefined).length;
  useCompletionHistory(MERGE_CONFIG.id, workflow.state.result);
  return (
    <ToolPageFrame
      active="merge-pdf"
    >
      <FileToolView
        variant="pdf"
        allowEditing
        actions={workflow.actions}
        config={MERGE_CONFIG}
        optionsPanel={workflow.state.files.length ? (
          <>
            <section className={styles.mergeSummary} aria-label="Merge summary">
              <span><Files aria-hidden="true" size={18} /><b>{workflow.state.files.length}</b><small>PDFs selected</small></span>
              <span><FileCheck2 aria-hidden="true" size={18} /><b>{pendingCount ? "…" : knownPages.toLocaleString()}</b><small>Pages in output</small></span>
            </section>
            <section className={styles.optionSection} aria-labelledby="merge-order-title">
              <h3 className="font-heading" id="merge-order-title"><Layers3 aria-hidden="true" size={17} /> Page order</h3>
              <p className={styles.infoLine}><Info aria-hidden="true" size={16} /> Use the arrow buttons beside each file to change its position. All pages from each PDF stay together.</p>
            </section>
          </>
        ) : undefined}
        resultInfoSlot="Merging copies pages as-is. It does not compress, edit, sign, or remove encryption from the source documents."
        state={workflow.state}
      />
    </ToolPageFrame>
  );
}

function ImageThumbnail({ file, alt }: { file: File; alt: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    const update = window.setTimeout(() => setUrl(nextUrl), 0);
    return () => {
      window.clearTimeout(update);
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);
  // The image is a transient local object URL and is never sent through Next image optimization.
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img alt={alt} src={url} /> : null;
}

function ImageQueuePreview({ files }: { files: readonly { id: string; file: File }[] }) {
  return (
    <section className={styles.imagePreviewSection} aria-labelledby="image-preview-title">
      <header><span id="image-preview-title">Page preview</span><small>One image per page · queue order</small></header>
      <ol className={styles.imagePreviewList}>
        {files.map((item, index) => (
          <li key={item.id}>
            <b>{index + 1}</b>
            <span><ImageThumbnail alt={`Preview of ${item.file.name}`} file={item.file} /></span>
            <small title={item.file.name}>{item.file.name}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SegmentedOptions<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly { label: string; value: T }[];
  value: T;
}) {
  return (
    <fieldset className={styles.segmentedField}>
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button aria-pressed={value === option.value} key={option.value} onClick={() => onChange(option.value)} type="button">
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ImagesToPdfTool() {
  const [pageSize, setPageSize] = useState<PdfPageSize>("auto");
  const [orientation, setOrientation] = useState<PdfOrientation>("auto");
  const [margin, setMargin] = useState<PdfMargin>("small");
  const workflow = useFileWorkflow(IMAGES_TO_PDF_CONFIG, imagesToPdfProcessor, { pageSize, orientation, margin });
  useCompletionHistory(IMAGES_TO_PDF_CONFIG.id, workflow.state.result);
  return (
    <ToolPageFrame
      active="images-to-pdf"
    >
      <FileToolView
        variant="pdf"
        allowEditing
        actions={workflow.actions}
        config={IMAGES_TO_PDF_CONFIG}
        optionsPanel={workflow.state.files.length ? (
          <>
            <ImageQueuePreview files={workflow.state.files} />
            <section className={styles.optionSection} aria-labelledby="page-settings-title">
              <h3 className="font-heading" id="page-settings-title"><LayoutTemplate aria-hidden="true" size={17} /> Page settings</h3>
              <div className={styles.pageSettingsGrid}>
                <SegmentedOptions<PdfPageSize>
                  label="Page size"
                  onChange={setPageSize}
                  options={[{ label: "Auto", value: "auto" }, { label: "A4", value: "a4" }, { label: "Letter", value: "letter" }]}
                  value={pageSize}
                />
                <SegmentedOptions<PdfOrientation>
                  label="Orientation"
                  onChange={setOrientation}
                  options={[{ label: "Auto", value: "auto" }, { label: "Portrait", value: "portrait" }, { label: "Landscape", value: "landscape" }]}
                  value={orientation}
                />
                <SegmentedOptions<PdfMargin>
                  label="Margins"
                  onChange={setMargin}
                  options={[{ label: "None", value: "none" }, { label: "Small", value: "small" }, { label: "Standard", value: "standard" }]}
                  value={margin}
                />
              </div>
              <p className={styles.infoLine}><ImageIcon aria-hidden="true" size={16} /> Images are centered and contained without stretching. Transparent PNG pixels are flattened onto white, and all pages are encoded as JPEG-backed PDF pages.</p>
            </section>
          </>
        ) : undefined}
        resultInfoSlot="The PDF contains one flattened image per page. It does not preserve PNG transparency or original image metadata."
        state={workflow.state}
      />
    </ToolPageFrame>
  );
}

function PdfToWordTool() {
  const workflow = useFileWorkflow(PDF_TO_WORD_CONFIG, pdfToWordProcessor, {});
  const file = workflow.state.files[0]?.file;
  const metadata = usePdfMetadata(file);
  useCompletionHistory(PDF_TO_WORD_CONFIG.id, workflow.state.result);
  return (
    <ToolPageFrame
      active="pdf-to-word"
    >
      <FileToolView
        variant="pdf"
        allowEditing
        actions={workflow.actions}
        config={PDF_TO_WORD_CONFIG}
        optionsPanel={file ? (
          <>
            <section className={styles.fileFacts} aria-label="Selected PDF details">
              <span><b>{metadata.pageCount?.toLocaleString() ?? "…"}</b><small>{metadata.error ?? "Pages"}</small></span>
              <span><b>{formatBytes(file.size)}</b><small>Source size</small></span>
              <span><b>DOCX</b><small>Output format</small></span>
            </section>
            <section className={styles.optionSection} aria-labelledby="word-conversion-title">
              <h3 className="font-heading" id="word-conversion-title"><FileText aria-hidden="true" size={17} /> Text-first Word conversion</h3>
              <div className={styles.disclosureGrid}>
                <span><FileCheck2 aria-hidden="true" size={17} /><b>Preserved</b><small>Page order, page breaks, simple lines, and paragraphs</small></span>
                <span><Info aria-hidden="true" size={17} /><b>Best effort</b><small>Fonts, columns, tables, spacing, and complex visual layout</small></span>
                <span><ImageIcon aria-hidden="true" size={17} /><b>Not included</b><small>OCR for scans, image-only pages, and embedded PDF artwork</small></span>
              </div>
              <p className={styles.warningLine}><Info aria-hidden="true" size={16} /> Complex PDFs can lose columns, tables, exact typography, headers, footers, and visual positioning. A scanned PDF with no selectable text will stop with an error instead of creating an empty DOCX.</p>
            </section>
          </>
        ) : undefined}
        resultInfoSlot="This is a best-effort editable-text conversion, not a pixel-perfect layout recreation. Review the DOCX before relying on it."
        state={workflow.state}
      />
    </ToolPageFrame>
  );
}

export function PdfToolWorkspace({ toolId }: { toolId: PdfToolId }) {
  if (toolId === "pdf-compressor") return <CompressorTool />;
  if (toolId === "merge-pdf") return <MergeTool />;
  if (toolId === "images-to-pdf") return <ImagesToPdfTool />;
  if (toolId === "pdf-to-word") return <PdfToWordTool />;
  return null;
}
