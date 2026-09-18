import type { FileWorkflowErrorKind } from "../../types/file-tool";

/** An expected processor failure with copy that is safe to show to the user. */
export class FileToolProcessingError extends Error {
  readonly kind: Exclude<FileWorkflowErrorKind, "validation" | "unexpected">;
  readonly retryable: boolean;

  constructor(
    message: string,
    options?: {
      kind?: Exclude<FileWorkflowErrorKind, "validation" | "unexpected">;
      retryable?: boolean;
    },
  ) {
    super(message);
    this.name = "FileToolProcessingError";
    this.kind = options?.kind ?? "processing";
    this.retryable = options?.retryable ?? true;
  }
}
