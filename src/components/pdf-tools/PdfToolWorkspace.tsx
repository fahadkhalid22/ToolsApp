"use client";

import Link from "next/link";
import {
  FileCheck2,
  FileDown,
  Gauge,
  Info,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { FileToolView } from "@/components/file-tools/FileToolView";
import { tools } from "@/data/tools";
import { recordToolCompletion } from "@/lib/discovery/local-state";
import { formatBytes } from "@/lib/file-tools/format";
import { useFileWorkflow } from "@/lib/file-tools/useFileWorkflow";
import { compressPdf, inspectPdf } from "@/lib/pdf-tools/browser";
import {
  MAX_PDF_FILE_BYTES,
  buildPdfFileName,
  compressionChangePercent,
  fileHasPdfHeader,
} from "@/lib/pdf-tools/core";
import type {
  FileProcessingResult,
  FileProcessor,
  FileToolConfig,
  FileValidator,
} from "@/types/file-tool";
import type { PdfCompressionMode } from "@/types/pdf-tool";

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
  title: "Compress PDF — Reduce File Size Instantly",
  description: "Choose a structure-preserving rewrite or a stronger visual compression mode, all processed locally.",
  uploadLabel: "Drop your PDF here or browse",
  uploadHelperText: "One PDF · up to 75 MB · maximum 250 pages",
  processLabel: "Compress PDF",
  downloadLabel: "Download compressed PDF",
};

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
  const change = compressionChangePercent(item.file.size, blob.size);
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
      {
        label: change >= 0 ? "Saved" : "Change",
        value: change >= 0 ? `${change}% smaller` : `${Math.abs(change)}% larger`,
      },
    ],
    summary: change > 0
      ? `The output is ${change}% smaller than the original.`
      : change === 0
        ? "The output is the same size as the original. No savings are claimed."
        : `The output is ${Math.abs(change)}% larger. Keep the original if file size is your priority.`,
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

function PdfToolNav({ active }: { active: PdfToolId }) {
  const pdfTools = tools.filter((tool) => tool.categoryId === "pdf");
  return (
    <div className={styles.toolNavWrap}>
      <div className={styles.contextCopy}>
        <span><ShieldCheck aria-hidden="true" size={14} /> Private by design</span>
        <p>PDF contents are processed locally and are never uploaded to ToolsApp.</p>
      </div>
      <nav aria-label="PDF tools" className={styles.toolNav}>
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

function HowItWorks({ steps }: { steps: readonly { title: string; copy: string }[] }) {
  return (
    <section className={styles.howItWorks} aria-labelledby="how-it-works-title">
      <span>Simple local workflow</span>
      <h2 className="font-heading" id="how-it-works-title">How it works</h2>
      <div>
        {steps.map((step, index) => (
          <article key={step.title}>
            <b>{index + 1}</b>
            <h3 className="font-heading">{step.title}</h3>
            <p>{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrustGrid() {
  return (
    <aside className={styles.trustGrid} aria-label="PDF processing guarantees">
      <span><LockKeyhole aria-hidden="true" size={18} /><b>Browser-local</b><small>No document upload</small></span>
      <span><FileCheck2 aria-hidden="true" size={18} /><b>Original untouched</b><small>Download a new file</small></span>
      <span><Gauge aria-hidden="true" size={18} /><b>Real progress</b><small>Based on actual stages</small></span>
      <span><Sparkles aria-hidden="true" size={18} /><b>No watermark</b><small>Clean generated output</small></span>
    </aside>
  );
}

function ToolPageFrame({
  active,
  children,
  steps,
}: {
  active: PdfToolId;
  children: ReactNode;
  steps: readonly { title: string; copy: string }[];
}) {
  return (
    <main className={styles.main} id="main-content">
      <PdfToolNav active={active} />
      {children}
      <HowItWorks steps={steps} />
      <TrustGrid />
    </main>
  );
}

function CompressionModeCard({
  active,
  description,
  icon,
  label,
  onClick,
  note,
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  note: string;
}) {
  return (
    <button aria-pressed={active} className={styles.modeCard} onClick={onClick} type="button">
      <span>{icon}</span>
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
      steps={[
        { title: "Choose a PDF", copy: "The browser validates the file header and page count." },
        { title: "Pick a mode", copy: "Preserve structure or flatten pages for stronger visual compression." },
        { title: "Download", copy: "Review the measured size change before saving the new PDF." },
      ]}
    >
      <FileToolView
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
                  icon={<FileCheck2 aria-hidden="true" size={18} />}
                  label="Preserve structure"
                  note="May save little or can grow"
                  onClick={() => setMode("preserve")}
                />
                <CompressionModeCard
                  active={mode === "balanced"}
                  description="Renders each page at a controlled resolution and rebuilds it from JPEG images."
                  icon={<Layers3 aria-hidden="true" size={18} />}
                  label="Balanced visual"
                  note="Flattens page content"
                  onClick={() => setMode("balanced")}
                />
                <CompressionModeCard
                  active={mode === "strong"}
                  description="Uses a lower render resolution and image quality for smaller visual PDFs."
                  icon={<Gauge aria-hidden="true" size={18} />}
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

export function PdfToolWorkspace({ toolId }: { toolId: PdfToolId }) {
  if (toolId === "pdf-compressor") return <CompressorTool />;
  return null;
}
