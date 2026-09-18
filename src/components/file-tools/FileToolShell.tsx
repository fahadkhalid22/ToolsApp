"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useFileWorkflow } from "@/lib/file-tools/useFileWorkflow";
import type { FileProcessingResult, FileProcessor, FileToolCompletionEvent, FileToolConfig } from "@/types/file-tool";

import { FileToolView } from "./FileToolView";

export type FileToolShellProps<TOptions> = {
  config: FileToolConfig;
  processor: FileProcessor<TOptions>;
  options: TOptions;
  optionsPanel?: ReactNode;
  resultInfoSlot?: ReactNode;
  resultPreviewSlot?: ReactNode;
  presentation?: "embedded" | "modal";
  headingLevel?: "h1" | "h2";
  onComplete?: (event: FileToolCompletionEvent) => void;
};

export function FileToolShell<TOptions>({
  config,
  processor,
  options,
  optionsPanel,
  resultInfoSlot,
  resultPreviewSlot,
  presentation,
  headingLevel,
  onComplete,
}: FileToolShellProps<TOptions>) {
  const workflow = useFileWorkflow(config, processor, options);
  const notifiedResultRef = useRef<FileProcessingResult | null>(null);

  useEffect(() => {
    if (!workflow.state.result) {
      notifiedResultRef.current = null;
      return;
    }
    if (workflow.state.result !== notifiedResultRef.current) {
      notifiedResultRef.current = workflow.state.result;
      onComplete?.({
        toolId: config.id,
        completedAt: new Date().toISOString(),
        outputCount: workflow.state.result.outputs.length,
        outputTypes: [...new Set(workflow.state.result.outputs.map(
          (output) => output.mimeType || output.blob.type || "application/octet-stream",
        ))],
      });
    }
  }, [config.id, onComplete, workflow.state.result]);

  return <FileToolView actions={workflow.actions} config={config} headingLevel={headingLevel} optionsPanel={optionsPanel} presentation={presentation} resultInfoSlot={resultInfoSlot} resultPreviewSlot={resultPreviewSlot} state={workflow.state} />;
}
