"use client";

import type { ReactNode } from "react";
import { LockKeyhole, Sparkles } from "lucide-react";

import type { FileToolActions, FileToolConfig, FileWorkflowState } from "@/types/file-tool";

import { FileDropzone } from "./FileDropzone";
import { FileQueue } from "./FileQueue";
import { FileResultCard } from "./FileResultCard";
import { FileToolActionsBar } from "./FileToolActions";
import styles from "./FileTool.module.css";
import { FileValidationMessages } from "./FileValidationMessages";
import { FileWorkflowNotice } from "./FileWorkflowNotice";
import { FileWorkflowSteps } from "./FileWorkflowSteps";
import { ProcessingProgress } from "./ProcessingProgress";

export type FileToolViewProps = {
  config: FileToolConfig;
  state: FileWorkflowState;
  actions: FileToolActions;
  optionsPanel?: ReactNode;
  resultInfoSlot?: ReactNode;
  resultPreviewSlot?: ReactNode;
  presentation?: "embedded" | "modal";
  headingLevel?: "h1" | "h2";
};

export function FileToolView({
  config,
  state,
  actions,
  optionsPanel,
  resultInfoSlot,
  resultPreviewSlot,
  presentation = "embedded",
  headingLevel = "h1",
}: FileToolViewProps) {
  const hasFiles = state.files.length > 0;
  const Heading = headingLevel;

  return (
    <article className={`${styles.toolPanel} ${presentation === "modal" ? styles.modalPanel : ""}`} data-tool-id={config.id}>
      <header className={styles.toolHeader}>
        <span className={styles.toolHeaderIcon}><Sparkles aria-hidden="true" size={19} /></span>
        <span>
          <span className={styles.toolEyebrow}>Local file workflow</span>
          <Heading className="font-heading">{config.title}</Heading>
          <p>{config.description}</p>
        </span>
        <span className={styles.localBadge}><LockKeyhole aria-hidden="true" size={13} /> Local</span>
      </header>

      <div className={styles.stepBar}><FileWorkflowSteps phase={state.phase} /></div>

      {state.phase === "success" && state.result ? (
        <FileResultCard config={config} infoSlot={resultInfoSlot} onReset={actions.reset} previewSlot={resultPreviewSlot} result={state.result} />
      ) : (
        <>
          <div className={`${styles.workflowGrid} ${hasFiles ? styles.workflowGridPopulated : ""}`}>
            <FileDropzone
              config={config}
              disabled={state.phase === "processing" || state.phase === "validating"}
              onDraggingChange={actions.setDragging}
              onFiles={actions.selectFiles}
              phase={state.phase}
            />
            {hasFiles ? (
              <div className={styles.queueColumn}>
                <ProcessingProgress state={state} />
                <FileQueue
                  allowReordering={config.allowReordering}
                  files={state.files}
                  onMove={actions.moveFile}
                  onRemove={actions.removeFile}
                  phase={state.phase}
                />
                <FileValidationMessages issues={state.issues.filter((issue) => !issue.fileId)} />
                {optionsPanel && state.phase !== "processing" ? <section className={styles.optionsPanel}>{optionsPanel}</section> : null}
              </div>
            ) : null}
          </div>
          <FileWorkflowNotice state={state} />
          <FileToolActionsBar actions={actions} config={config} state={state} />
        </>
      )}

      <footer className={styles.statusFooter}>
        <span aria-live="polite">{state.statusMessage}</span>
        <span>No file contents are stored by this workflow.</span>
      </footer>
    </article>
  );
}
