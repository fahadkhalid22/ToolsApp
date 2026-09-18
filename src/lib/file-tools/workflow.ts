import type {
  FileWorkflowEvent,
  FileWorkflowState,
  ToolFileItem,
} from "../../types/file-tool";

export const initialFileWorkflowState: FileWorkflowState = {
  phase: "idle",
  files: [],
  issues: [],
  result: null,
  error: null,
  overallProgress: null,
  statusMessage: "Choose files to begin.",
};

function clampProgress(progress: number | undefined) {
  if (progress === undefined || !Number.isFinite(progress)) return null;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

function updateFileProgress(
  files: readonly ToolFileItem[],
  fileId: string | undefined,
  progress: FileWorkflowEvent & { type: "PROCESS_PROGRESS" },
) {
  if (!fileId) return files;
  return files.map((item) => {
    if (item.id !== fileId) return item;
    const nextProgress = clampProgress(progress.progress.progress);
    const status = progress.progress.status ?? (nextProgress === 100 ? "completed" : "processing");
    return { ...item, progress: nextProgress, status };
  });
}

function resumablePhase(state: FileWorkflowState) {
  return state.phase === "idle" || state.phase === "ready" || state.phase === "error" || state.phase === "cancelled"
    ? state.phase
    : "idle";
}

export function fileWorkflowReducer(
  state: FileWorkflowState,
  event: FileWorkflowEvent,
): FileWorkflowState {
  switch (event.type) {
    case "DRAG_STARTED":
      if (["processing", "success", "validating"].includes(state.phase)) return state;
      return { ...state, phase: "dragging", resumePhase: resumablePhase(state), statusMessage: "Drop files to add them." };
    case "DRAG_ENDED":
      if (state.phase !== "dragging") return state;
      return { ...state, phase: state.resumePhase ?? (state.files.length ? "ready" : "idle"), resumePhase: undefined };
    case "VALIDATION_STARTED":
      return {
        ...state,
        phase: "validating",
        files: event.files,
        issues: [],
        result: null,
        error: null,
        overallProgress: null,
        statusMessage: "Checking selected files…",
      };
    case "VALIDATION_FINISHED": {
      const invalid = event.issues.some((issue) => issue.severity === "error");
      return {
        ...state,
        phase: invalid ? "error" : "ready",
        files: event.files,
        issues: event.issues,
        error: invalid ? { kind: "validation", message: "Some files need attention before processing.", retryable: false } : null,
        statusMessage: invalid
          ? "Review the file issues below."
          : `${event.files.length} ${event.files.length === 1 ? "file" : "files"} ready.`,
      };
    }
    case "FILES_REORDERED":
      if (!["ready", "error", "cancelled"].includes(state.phase)) return state;
      return { ...state, files: event.files };
    case "PROCESS_STARTED":
      if (
        !["ready", "error", "cancelled"].includes(state.phase) ||
        !state.files.length ||
        state.error?.kind === "validation"
      ) return state;
      return {
        ...state,
        phase: "processing",
        files: state.files.map((file) => ({ ...file, status: "processing", progress: null })),
        error: null,
        result: null,
        overallProgress: null,
        statusMessage: "Processing files…",
      };
    case "PROCESS_PROGRESS":
      if (state.phase !== "processing") return state;
      return {
        ...state,
        files: updateFileProgress(state.files, event.progress.fileId, event),
        overallProgress: event.progress.overallProgress === undefined
          ? state.overallProgress
          : clampProgress(event.progress.overallProgress),
        statusMessage: event.progress.message ?? state.statusMessage,
      };
    case "PROCESS_SUCCEEDED":
      if (state.phase !== "processing") return state;
      return {
        ...state,
        phase: "success",
        files: state.files.map((file) => ({ ...file, status: "completed", progress: 100 })),
        result: event.result,
        error: null,
        overallProgress: 100,
        statusMessage: "Your files are ready.",
      };
    case "PROCESS_FAILED":
      if (state.phase !== "processing") return state;
      return {
        ...state,
        phase: "error",
        files: state.files.map((file) => file.status === "completed" ? file : { ...file, status: "failed" }),
        error: event.error,
        overallProgress: null,
        statusMessage: event.error.message,
      };
    case "PROCESS_CANCELLED":
      if (state.phase !== "processing") return state;
      return {
        ...state,
        phase: "cancelled",
        files: state.files.map((file) => file.status === "completed" ? file : { ...file, status: "cancelled" }),
        error: null,
        overallProgress: null,
        statusMessage: "Processing was cancelled. Your original files were not changed.",
      };
    case "RESET":
      return initialFileWorkflowState;
    default:
      return state;
  }
}
