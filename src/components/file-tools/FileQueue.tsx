"use client";

import { ArrowDown, ArrowUp, Check, File, RotateCcw, Trash2, XCircle } from "lucide-react";

import { formatBytes, getFileExtension } from "@/lib/file-tools/format";
import type { FileWorkflowPhase, ToolFileItem } from "@/types/file-tool";

import styles from "./FileTool.module.css";

type FileQueueProps = {
  files: readonly ToolFileItem[];
  phase: FileWorkflowPhase;
  allowReordering?: boolean;
  onRemove: (fileId: string) => void;
  onMove: (fileId: string, direction: "up" | "down") => void;
  onRetry?: () => void;
};

function statusLabel(file: ToolFileItem) {
  if (file.status === "completed") return "Completed";
  if (file.status === "failed") return "Needs attention";
  if (file.status === "cancelled") return "Cancelled";
  if (file.status === "processing") return file.progress === null ? "Processing…" : `${file.progress}% complete`;
  return "Ready";
}

export function FileQueue({
  files,
  phase,
  allowReordering = false,
  onRemove,
  onMove,
  onRetry,
}: FileQueueProps) {
  if (!files.length) return null;
  const editable = phase !== "processing" && phase !== "success" && phase !== "validating";

  return (
    <section className={styles.queue} aria-labelledby="selected-files-heading">
      <header className={styles.queueHeader}>
        <div>
          <span>Selected files</span>
          <h3 className="font-heading" id="selected-files-heading">{files.length} {files.length === 1 ? "file" : "files"}</h3>
        </div>
        <small>{files.reduce((sum, item) => sum + item.file.size, 0) ? formatBytes(files.reduce((sum, item) => sum + item.file.size, 0)) : "0 B"} total</small>
      </header>
      <ol className={styles.queueList}>
        {files.map((item, index) => {
          const failed = item.status === "failed";
          const complete = item.status === "completed";
          return (
            <li className={`${styles.fileRow} ${failed ? styles.fileRowError : ""} ${complete ? styles.fileRowComplete : ""}`} key={item.id}>
              <span className={styles.fileIcon} aria-hidden="true">
                {complete ? <Check size={18} /> : failed ? <XCircle size={18} /> : <File size={18} />}
              </span>
              <span className={styles.fileDetails}>
                <strong title={item.file.name}>{item.file.name}</strong>
                <small>{getFileExtension(item.file.name).replace(".", "").toUpperCase() || "FILE"} · {formatBytes(item.file.size)} · {statusLabel(item)}</small>
                {item.status === "processing" ? (
                  item.progress === null ? (
                    <span aria-label={`${item.file.name} processing`} className={styles.indeterminateProgress} role="progressbar"><i /></span>
                  ) : (
                    <progress aria-label={`${item.file.name} processing progress`} max="100" value={item.progress}>{item.progress}%</progress>
                  )
                ) : complete ? <progress aria-label={`${item.file.name} completed`} max="100" value="100">100%</progress> : null}
                {item.issues[0] ? <span className={styles.inlineIssue}>{item.issues[0].message}</span> : null}
              </span>
              <span className={styles.fileActions}>
                {allowReordering && editable ? (
                  <>
                    <button aria-label={`Move ${item.file.name} up`} disabled={index === 0} onClick={() => onMove(item.id, "up")} type="button"><ArrowUp aria-hidden="true" size={15} /></button>
                    <button aria-label={`Move ${item.file.name} down`} disabled={index === files.length - 1} onClick={() => onMove(item.id, "down")} type="button"><ArrowDown aria-hidden="true" size={15} /></button>
                  </>
                ) : null}
                {failed && onRetry && phase === "error" ? (
                  <button aria-label={`Retry processing ${item.file.name}`} onClick={onRetry} type="button"><RotateCcw aria-hidden="true" size={15} /></button>
                ) : null}
                {editable ? (
                  <button aria-label={`Remove ${item.file.name}`} onClick={() => onRemove(item.id)} type="button"><Trash2 aria-hidden="true" size={15} /></button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
