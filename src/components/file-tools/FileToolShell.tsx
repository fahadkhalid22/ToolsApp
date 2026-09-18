"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useFileWorkflow } from "@/lib/file-tools/useFileWorkflow";
import type { FileProcessingResult, FileProcessor, FileToolConfig } from "@/types/file-tool";

import { FileToolView } from "./FileToolView";

export type FileToolShellProps<TOptions> = {
  config: FileToolConfig;
  processor: FileProcessor<TOptions>;
  options: TOptions;
  optionsPanel?: ReactNode;
  resultInfoSlot?: ReactNode;
  presentation?: "embedded" | "modal";
  headingLevel?: "h1" | "h2";
  onComplete?: (result: FileProcessingResult) => void;
};

export function FileToolShell<TOptions>({
  config,
  processor,
  options,
  optionsPanel,
  resultInfoSlot,
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
      onComplete?.(workflow.state.result);
    }
  }, [onComplete, workflow.state.result]);

  return <FileToolView actions={workflow.actions} config={config} headingLevel={headingLevel} optionsPanel={optionsPanel} presentation={presentation} resultInfoSlot={resultInfoSlot} state={workflow.state} />;
}
