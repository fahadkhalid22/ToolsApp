"use client";

import { useId, useRef, type ClipboardEvent, type DragEvent } from "react";
import { FileUp, FolderOpen, ShieldCheck } from "lucide-react";

import { formatAcceptedExtensions, formatBytes } from "@/lib/file-tools/format";
import type { FileToolConfig, FileWorkflowPhase } from "@/types/file-tool";

import styles from "./FileTool.module.css";

type FileDropzoneProps = {
  config: FileToolConfig;
  phase: FileWorkflowPhase;
  onFiles: (files: readonly File[]) => void;
  onDraggingChange: (active: boolean) => void;
  disabled?: boolean;
};

export function FileDropzone({
  config,
  phase,
  onFiles,
  onDraggingChange,
  disabled = false,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const helperId = `${inputId}-helper`;
  const accept = [...config.accepted.extensions, ...(config.accepted.mimeTypes ?? [])].join(",");
  const acceptedLabel = formatAcceptedExtensions(config.accepted.extensions);

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    dragDepthRef.current += 1;
    onDraggingChange(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (!dragDepthRef.current) onDraggingChange(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepthRef.current = 0;
    onDraggingChange(false);
    if (!disabled && event.dataTransfer.files.length) {
      onFiles(Array.from(event.dataTransfer.files));
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    if (disabled || !event.clipboardData.files.length) return;
    event.preventDefault();
    onFiles(Array.from(event.clipboardData.files));
  }

  return (
    <div
      aria-describedby={helperId}
      aria-disabled={disabled}
      className={`${styles.dropzone} ${phase === "dragging" ? styles.dropzoneActive : ""} ${disabled ? styles.dropzoneDisabled : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={disabled ? -1 : 0}
    >
      <input
        accept={accept}
        aria-label={config.mode === "multiple" ? "Choose files to process" : "Choose a file to process"}
        className={styles.hiddenInput}
        disabled={disabled}
        id={inputId}
        multiple={config.mode === "multiple"}
        onChange={(event) => {
          if (event.target.files?.length) onFiles(Array.from(event.target.files));
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <span className={styles.uploadIcon} aria-hidden="true"><FileUp size={25} /></span>
      <div className={styles.dropzoneCopy}>
        <strong>{phase === "dragging" ? "Drop files to add them" : config.uploadLabel}</strong>
        <span id={helperId}>{config.uploadHelperText}</span>
        <small>{acceptedLabel} · up to {formatBytes(config.maxFileSizeBytes)} per file</small>
      </div>
      <button disabled={disabled} onClick={() => inputRef.current?.click()} type="button">
        <FolderOpen aria-hidden="true" size={16} />
        Browse {config.mode === "multiple" ? "files" : "file"}
      </button>
      <span className={styles.pasteHint}>Or focus this area and paste a file</span>
      {config.privacyNote ? (
        <span className={styles.privacyNote}><ShieldCheck aria-hidden="true" size={14} /> {config.privacyNote}</span>
      ) : null}
    </div>
  );
}
