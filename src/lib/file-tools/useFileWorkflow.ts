"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import type {
  FileProcessor,
  FileToolActions,
  FileToolConfig,
  FileWorkflowError,
  ToolFileItem,
} from "@/types/file-tool";

import {
  mergeFileSelection,
  removeFileFromQueue,
  reorderFileQueue,
} from "./queue";
import { FileToolProcessingError } from "./errors";
import { validateFileSelection } from "./validation";
import { fileWorkflowReducer, initialFileWorkflowState } from "./workflow";

function processorError(error: unknown): FileWorkflowError {
  if (error instanceof FileToolProcessingError && error.message.trim()) {
    return {
      kind: error.kind,
      message: error.message.slice(0, 240),
      retryable: error.retryable,
    };
  }
  return {
    kind: "unexpected",
    message: "Something unexpected interrupted processing. Try again or start over.",
    retryable: true,
  };
}

export function useFileWorkflow<TOptions>(
  config: FileToolConfig,
  processor: FileProcessor<TOptions>,
  options: TOptions,
) {
  const [state, dispatch] = useReducer(fileWorkflowReducer, initialFileWorkflowState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRunRef = useRef(0);
  const validationRunRef = useRef(0);

  const validate = useCallback(async (files: readonly ToolFileItem[]) => {
    const run = ++validationRunRef.current;
    if (!files.length) {
      dispatch({ type: "RESET" });
      return;
    }
    dispatch({ type: "VALIDATION_STARTED", files });
    const result = await validateFileSelection(files, config);
    if (run !== validationRunRef.current) return;
    dispatch({ type: "VALIDATION_FINISHED", files: result.files, issues: result.issues });
  }, [config]);

  const selectFiles = useCallback(async (files: readonly File[]) => {
    if (!files.length || state.phase === "processing") return;
    const next = mergeFileSelection(state.files, files, config);
    await validate(next);
  }, [config, state.files, state.phase, validate]);

  const removeFile = useCallback(async (fileId: string) => {
    if (state.phase === "processing") return;
    const next = removeFileFromQueue(state.files, fileId);
    await validate(next);
  }, [state.files, state.phase, validate]);

  const moveFile = useCallback((fileId: string, direction: "up" | "down") => {
    if (!config.allowReordering) return;
    dispatch({ type: "FILES_REORDERED", files: reorderFileQueue(state.files, fileId, direction) });
  }, [config.allowReordering, state.files]);

  const setDragging = useCallback((active: boolean) => {
    dispatch({ type: active ? "DRAG_STARTED" : "DRAG_ENDED" });
  }, []);

  const process = useCallback(async () => {
    if (abortControllerRef.current || !state.files.length) return;
    if (state.phase !== "ready" && !(state.phase === "error" && state.error?.retryable) && state.phase !== "cancelled") return;
    if (typeof AbortController === "undefined") {
      dispatch({ type: "PROCESS_STARTED" });
      dispatch({
        type: "PROCESS_FAILED",
        error: {
          kind: "capability",
          message: "This browser cannot safely start the file processor. Try a current browser.",
          retryable: false,
        },
      });
      return;
    }

    const controller = new AbortController();
    const run = ++activeRunRef.current;
    abortControllerRef.current = controller;
    dispatch({ type: "PROCESS_STARTED" });
    try {
      const result = await processor({
        files: state.files,
        options,
        signal: controller.signal,
        reportProgress: (progress) => {
          if (activeRunRef.current === run && !controller.signal.aborted) {
            dispatch({ type: "PROCESS_PROGRESS", progress });
          }
        },
      });
      if (controller.signal.aborted || activeRunRef.current !== run) return;
      if (!result.outputs.length) {
        throw new FileToolProcessingError("Processing finished without a downloadable output. Try again.");
      }
      dispatch({ type: "PROCESS_SUCCEEDED", result });
    } catch (error) {
      if (controller.signal.aborted) {
        dispatch({ type: "PROCESS_CANCELLED" });
      } else {
        dispatch({ type: "PROCESS_FAILED", error: processorError(error) });
      }
    } finally {
      if (activeRunRef.current === run) abortControllerRef.current = null;
    }
  }, [options, processor, state.error?.retryable, state.files, state.phase]);

  const cancel = useCallback(() => {
    if (!config.supportsCancellation) return;
    abortControllerRef.current?.abort();
    activeRunRef.current += 1;
    abortControllerRef.current = null;
    dispatch({ type: "PROCESS_CANCELLED" });
  }, [config.supportsCancellation]);

  const reset = useCallback(() => {
    validationRunRef.current += 1;
    activeRunRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => () => {
    validationRunRef.current += 1;
    activeRunRef.current += 1;
    abortControllerRef.current?.abort();
  }, []);

  const actions: FileToolActions = {
    selectFiles,
    removeFile,
    moveFile,
    setDragging,
    process,
    retry: process,
    cancel,
    reset,
  };

  return { state, actions };
}
