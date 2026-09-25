"use client";

import { useId, type ReactNode } from "react";
import { Check, FileCheck2, RotateCcw, Sparkles } from "lucide-react";

import { formatBytes } from "@/lib/file-tools/format";
import type { FileProcessingResult, FileToolConfig } from "@/types/file-tool";

import { FileDownloadButton } from "./FileDownloadButton";
import styles from "./FileTool.module.css";

type FileResultCardProps = {
  config: FileToolConfig;
  result: FileProcessingResult;
  onReset: () => void;
  onEdit?: () => void;
  infoSlot?: ReactNode;
  previewSlot?: ReactNode;
};

export function FileResultCard({ config, result, onReset, onEdit, infoSlot, previewSlot }: FileResultCardProps) {
  const headingId = useId();
  return (
    <section className={styles.resultCard} aria-labelledby={headingId}>
      <span className={styles.successIcon}><Check aria-hidden="true" size={25} /></span>
      <span className={styles.resultEyebrow}>Processing complete</span>
      <h2 className="font-heading" id={headingId}>Your {result.outputs.length === 1 ? "file is" : "files are"} ready</h2>
      <p>{result.summary ?? "The output was prepared locally and is ready to download."}</p>

      {previewSlot ? <div className={styles.resultPreview}>{previewSlot}</div> : null}

      {result.metrics?.length ? (
        <dl className={styles.resultMetrics}>
          {result.metrics.map((metric) => <div key={`${metric.label}-${metric.value}`}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}
        </dl>
      ) : null}

      <div className={styles.outputList}>
        {result.outputs.map((output, index) => (
          <article key={`${output.fileName}-${index}`}>
            <span className={styles.outputIcon}><FileCheck2 aria-hidden="true" size={19} /></span>
            <span className={styles.outputCopy}>
              <strong title={output.fileName}>{output.fileName}</strong>
              <small>
                {(output.mimeType ?? output.blob.type) || "Processed file"} · {formatBytes(output.blob.size)}
                {output.originalSize !== undefined ? ` · original ${formatBytes(output.originalSize)}` : ""}
              </small>
              {output.metrics?.length ? <span>{output.metrics.map((metric) => `${metric.label}: ${metric.value}`).join(" · ")}</span> : null}
            </span>
            <FileDownloadButton label={result.outputs.length === 1 ? config.downloadLabel : `Download ${index + 1}`} output={output} primary={index === 0} />
          </article>
        ))}
      </div>

      <div className={styles.resultActions}>
        {onEdit ? <button onClick={onEdit} type="button">Edit settings</button> : null}
        <button onClick={onReset} type="button"><RotateCcw aria-hidden="true" size={16} /> Process another {config.mode === "single" ? "file" : "batch"}</button>
      </div>

      {infoSlot ? <aside className={styles.resultInfo}><Sparkles aria-hidden="true" size={16} /> <span>{infoSlot}</span></aside> : null}
    </section>
  );
}
