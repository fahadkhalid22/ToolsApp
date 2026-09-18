import { useId } from "react";
import { LoaderCircle } from "lucide-react";

import type { FileWorkflowState } from "@/types/file-tool";

import styles from "./FileTool.module.css";

type ProcessingProgressProps = {
  state: FileWorkflowState;
};

export function ProcessingProgress({ state }: ProcessingProgressProps) {
  const headingId = useId();
  if (state.phase !== "processing") return null;
  const completed = state.files.filter((file) => file.status === "completed").length;

  return (
    <section className={styles.processingSummary} aria-labelledby={headingId}>
      <span className={styles.processingIcon}><LoaderCircle aria-hidden="true" size={19} /></span>
      <span className={styles.processingCopy}>
        <strong id={headingId}>Processing locally</strong>
        <span aria-live="polite">{state.statusMessage}</span>
        <small>{completed} of {state.files.length} completed</small>
      </span>
      <span className={styles.overallProgress}>
        {state.overallProgress === null ? (
          <span aria-label="Overall processing progress is indeterminate" className={styles.indeterminateProgress} role="progressbar"><i /></span>
        ) : (
          <progress aria-label="Overall processing progress" max="100" value={state.overallProgress}>{state.overallProgress}%</progress>
        )}
        <small>{state.overallProgress === null ? "Working…" : `${state.overallProgress}%`}</small>
      </span>
    </section>
  );
}
