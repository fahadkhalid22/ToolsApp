import { AlertCircle, Ban, CircleAlert } from "lucide-react";

import type { FileWorkflowState } from "@/types/file-tool";

import styles from "./FileTool.module.css";

export function FileWorkflowNotice({ state }: { state: FileWorkflowState }) {
  if (state.phase === "cancelled") {
    return (
      <div className={styles.cancelledNotice} role="status">
        <Ban aria-hidden="true" size={18} />
        <span><strong>Processing cancelled</strong><small>{state.statusMessage}</small></span>
      </div>
    );
  }
  if (state.phase !== "error" || state.error?.kind === "validation") return null;
  const Icon = state.error?.kind === "capability" ? CircleAlert : AlertCircle;
  return (
    <div className={styles.processingError} role="alert">
      <Icon aria-hidden="true" size={18} />
      <span><strong>We couldn’t finish processing</strong><small>{state.error?.message ?? "Start over and try again."}</small></span>
    </div>
  );
}
