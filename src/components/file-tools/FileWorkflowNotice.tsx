import { AlertCircle, Ban, CircleAlert, Info } from "lucide-react";

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
  if (state.error?.kind === "no-change") {
    return (
      <div className={styles.noChangeNotice} role="status">
        <Info aria-hidden="true" size={18} />
        <span><strong>Already optimized</strong><small>{state.error.message}</small></span>
      </div>
    );
  }
  const Icon = state.error?.kind === "capability" ? CircleAlert : AlertCircle;
  return (
    <div className={styles.processingError} role="alert">
      <Icon aria-hidden="true" size={18} />
      <span><strong>We couldn’t finish processing</strong><small>{state.error?.message ?? "Start over and try again."}</small></span>
    </div>
  );
}
