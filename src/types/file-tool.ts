export type FileWorkflowPhase =
  | "idle"
  | "dragging"
  | "validating"
  | "ready"
  | "processing"
  | "success"
  | "error"
  | "cancelled";

export type FileToolMode = "single" | "multiple";
export type DuplicateFilePolicy = "allow" | "ignore" | "reject";
export type MimeMismatchPolicy = "ignore" | "warn" | "reject";
export type FileIssueSeverity = "warning" | "error";
export type FileItemStatus =
  | "queued"
  | "valid"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type AcceptedFileRule = {
  extensions: readonly string[];
  mimeTypes?: readonly string[];
  mimeMismatchPolicy?: MimeMismatchPolicy;
};

export type FileValidationIssueCode =
  | "empty-file"
  | "too-few-files"
  | "too-many-files"
  | "file-too-large"
  | "batch-too-large"
  | "unsupported-extension"
  | "mime-mismatch"
  | "duplicate-file"
  | "custom-validation"
  | "validation-unavailable";

export type FileValidationIssue = {
  code: FileValidationIssueCode;
  severity: FileIssueSeverity;
  message: string;
  fileId?: string;
  fileName?: string;
};

export type ToolFileItem = {
  id: string;
  file: File;
  order: number;
  status: FileItemStatus;
  progress: number | null;
  issues: readonly FileValidationIssue[];
};

export type FileValidatorContext = {
  files: readonly ToolFileItem[];
  config: FileToolConfig;
};

export type FileValidator = (
  file: ToolFileItem,
  context: FileValidatorContext,
) => FileValidationIssue | readonly FileValidationIssue[] | null | Promise<FileValidationIssue | readonly FileValidationIssue[] | null>;

export type FileToolConfig = {
  id: string;
  mode: FileToolMode;
  title: string;
  description: string;
  uploadLabel: string;
  uploadHelperText: string;
  processLabel: string;
  downloadLabel: string;
  privacyNote?: string;
  accepted: AcceptedFileRule;
  maxFileSizeBytes: number;
  maxTotalSizeBytes?: number;
  minFiles?: number;
  maxFiles?: number;
  rejectEmptyFiles?: boolean;
  duplicatePolicy?: DuplicateFilePolicy;
  allowReordering?: boolean;
  outputMode?: "single" | "multiple";
  customValidators?: readonly FileValidator[];
};

export type FileProcessingProgress = {
  fileId?: string;
  progress?: number;
  overallProgress?: number;
  status?: FileItemStatus;
  message?: string;
};

export type FileProcessingMetric = {
  label: string;
  value: string;
};

export type FileProcessingOutput = {
  blob: Blob;
  fileName: string;
  mimeType?: string;
  originalSize?: number;
  metrics?: readonly FileProcessingMetric[];
};

export type FileProcessingResult = {
  outputs: readonly FileProcessingOutput[];
  summary?: string;
  metrics?: readonly FileProcessingMetric[];
};

export type FileProcessingContext<TOptions = unknown> = {
  files: readonly ToolFileItem[];
  options: TOptions;
  signal: AbortSignal;
  reportProgress: (progress: FileProcessingProgress) => void;
};

export type FileProcessor<TOptions = unknown> = (
  context: FileProcessingContext<TOptions>,
) => Promise<FileProcessingResult>;

export type FileWorkflowErrorKind =
  | "validation"
  | "processing"
  | "capability"
  | "unexpected";

export type FileWorkflowError = {
  kind: FileWorkflowErrorKind;
  message: string;
  retryable: boolean;
  fileId?: string;
};

export type FileWorkflowState = {
  phase: FileWorkflowPhase;
  resumePhase?: Exclude<FileWorkflowPhase, "dragging" | "processing" | "success">;
  files: readonly ToolFileItem[];
  issues: readonly FileValidationIssue[];
  result: FileProcessingResult | null;
  error: FileWorkflowError | null;
  overallProgress: number | null;
  statusMessage: string;
};

export type FileWorkflowEvent =
  | { type: "DRAG_STARTED" }
  | { type: "DRAG_ENDED" }
  | { type: "VALIDATION_STARTED"; files: readonly ToolFileItem[] }
  | { type: "VALIDATION_FINISHED"; files: readonly ToolFileItem[]; issues: readonly FileValidationIssue[] }
  | { type: "FILES_REORDERED"; files: readonly ToolFileItem[] }
  | { type: "PROCESS_STARTED" }
  | { type: "PROCESS_PROGRESS"; progress: FileProcessingProgress }
  | { type: "PROCESS_SUCCEEDED"; result: FileProcessingResult }
  | { type: "PROCESS_FAILED"; error: FileWorkflowError }
  | { type: "PROCESS_CANCELLED" }
  | { type: "RESET" };

export type FileToolActions = {
  selectFiles: (files: readonly File[]) => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  moveFile: (fileId: string, direction: "up" | "down") => void;
  setDragging: (active: boolean) => void;
  process: () => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

export type FileToolDefinition<TOptions = unknown> = {
  config: FileToolConfig;
  initialOptions: TOptions;
  processor: FileProcessor<TOptions>;
};
