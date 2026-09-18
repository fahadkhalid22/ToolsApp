"use client";

import { LoaderCircle, RotateCcw, Square, WandSparkles } from "lucide-react";

import type { FileToolActions, FileToolConfig, FileWorkflowState } from "@/types/file-tool";

import styles from "./FileTool.module.css";

type FileToolActionsProps = {
  config: FileToolConfig;
  state: FileWorkflowState;
  actions: Pick<FileToolActions, "process" | "retry" | "cancel" | "reset">;
};

export function FileToolActionsBar({ config, state, actions }: FileToolActionsProps) {
  const processing = state.phase === "processing";
  const retryable = state.phase === "cancelled" || (state.phase === "error" && state.error?.retryable);
  const canProcess = state.phase === "ready";

  return (
    <div className={styles.workflowActions}>
      <button className={styles.secondaryAction} disabled={state.phase === "idle" || processing} onClick={actions.reset} type="button">
        <RotateCcw aria-hidden="true" size={16} /> Start over
      </button>
      {processing && config.supportsCancellation ? (
        <button className={styles.cancelAction} onClick={actions.cancel} type="button"><Square aria-hidden="true" size={14} /> Cancel processing</button>
      ) : (
        <button
          className={styles.primaryAction}
          disabled={!canProcess && !retryable}
          onClick={retryable ? actions.retry : actions.process}
          type="button"
        >
          {processing ? <LoaderCircle aria-hidden="true" className={styles.spin} size={17} /> : retryable ? <RotateCcw aria-hidden="true" size={16} /> : <WandSparkles aria-hidden="true" size={16} />}
          {processing ? "Processing…" : retryable ? "Retry" : config.processLabel}
        </button>
      )}
    </div>
  );
}
