import type {
  FileToolConfig,
  FileValidationIssue,
  ToolFileItem,
} from "../../types/file-tool";
import { formatAcceptedExtensions, formatBytes, getFileExtension } from "./format.ts";
import { fileFingerprint } from "./queue.ts";

export type FileValidationResult = {
  files: readonly ToolFileItem[];
  issues: readonly FileValidationIssue[];
  valid: boolean;
};

function matchesMimeType(type: string, accepted: readonly string[]) {
  const normalized = type.toLowerCase();
  return accepted.some((rule) => {
    const lowerRule = rule.toLowerCase();
    return lowerRule.endsWith("/*")
      ? normalized.startsWith(lowerRule.slice(0, -1))
      : normalized === lowerRule;
  });
}

function isMeaningfulMime(type: string) {
  return Boolean(type) && type.toLowerCase() !== "application/octet-stream";
}

function issue(
  code: FileValidationIssue["code"],
  severity: FileValidationIssue["severity"],
  message: string,
  file?: ToolFileItem,
): FileValidationIssue {
  return {
    code,
    severity,
    message,
    fileId: file?.id,
    fileName: file?.file.name,
  };
}

function normalizeExtension(extension: string) {
  const normalized = extension.trim().toLowerCase();
  return normalized.startsWith(".") ? normalized : `.${normalized}`;
}

export async function validateFileSelection(
  selectedFiles: readonly ToolFileItem[],
  config: FileToolConfig,
): Promise<FileValidationResult> {
  const issues: FileValidationIssue[] = [];
  const duplicatePolicy = config.duplicatePolicy ?? "reject";
  const seen = new Set<string>();
  const files = selectedFiles.filter((item) => {
    const fingerprint = fileFingerprint(item.file);
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      return true;
    }
    if (duplicatePolicy === "allow") return true;
    issues.push(issue(
      "duplicate-file",
      duplicatePolicy === "ignore" ? "warning" : "error",
      `${item.file.name} is already in the queue. Choose a different file or remove the duplicate.`,
      item,
    ));
    return duplicatePolicy !== "ignore";
  });

  const minFiles = config.minFiles ?? 1;
  const maxFiles = config.mode === "single" ? 1 : (config.maxFiles ?? Number.POSITIVE_INFINITY);
  if (files.length < minFiles) {
    issues.push(issue(
      "too-few-files",
      "error",
      `Choose at least ${minFiles} ${minFiles === 1 ? "file" : "files"} to continue.`,
    ));
  }
  if (files.length > maxFiles) {
    issues.push(issue(
      "too-many-files",
      "error",
      `Choose no more than ${maxFiles} ${maxFiles === 1 ? "file" : "files"} at a time.`,
    ));
  }

  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0);
  if (config.maxTotalSizeBytes && totalSize > config.maxTotalSizeBytes) {
    issues.push(issue(
      "batch-too-large",
      "error",
      `This batch is ${formatBytes(totalSize)}; the current limit is ${formatBytes(config.maxTotalSizeBytes)}.`,
    ));
  }

  const acceptedExtensions = config.accepted.extensions.map(normalizeExtension);
  const acceptedLabel = formatAcceptedExtensions(acceptedExtensions);
  for (const item of files) {
    const file = item.file;
    const extension = getFileExtension(file.name);
    if ((config.rejectEmptyFiles ?? true) && file.size === 0) {
      issues.push(issue(
        "empty-file",
        "error",
        `${file.name} is empty. Choose a file that contains data.`,
        item,
      ));
    }
    if (!acceptedExtensions.includes(extension)) {
      issues.push(issue(
        "unsupported-extension",
        "error",
        `${file.name} is not supported. Choose ${acceptedLabel}.`,
        item,
      ));
    }
    if (file.size > config.maxFileSizeBytes) {
      issues.push(issue(
        "file-too-large",
        "error",
        `${file.name} is ${formatBytes(file.size)}; this tool currently allows up to ${formatBytes(config.maxFileSizeBytes)} per file.`,
        item,
      ));
    }

    const mimeTypes = config.accepted.mimeTypes ?? [];
    if (
      mimeTypes.length &&
      isMeaningfulMime(file.type) &&
      !matchesMimeType(file.type, mimeTypes) &&
      config.accepted.mimeMismatchPolicy !== "ignore"
    ) {
      const rejection = config.accepted.mimeMismatchPolicy === "reject";
      issues.push(issue(
        "mime-mismatch",
        rejection ? "error" : "warning",
        `${file.name} reports the type ${file.type}, which does not match the accepted formats. Browser file types are advisory; verify the file before continuing.`,
        item,
      ));
    }
  }

  const context = { files, config };
  for (const item of files) {
    for (const validator of config.customValidators ?? []) {
      try {
        const customResult = await validator(item, context);
        if (customResult) {
          const customIssues = Array.isArray(customResult) ? customResult : [customResult];
          issues.push(...customIssues.map((customIssue) => ({
            ...customIssue,
            fileId: customIssue.fileId ?? item.id,
            fileName: customIssue.fileName ?? item.file.name,
          })));
        }
      } catch {
        issues.push(issue(
          "validation-unavailable",
          "error",
          `Validation could not be completed for ${item.file.name}. Remove the file and try again.`,
          item,
        ));
      }
    }
  }

  const validatedFiles = files.map<ToolFileItem>((item, order) => {
    const fileIssues = issues.filter((candidate) => candidate.fileId === item.id);
    return {
      ...item,
      order,
      issues: fileIssues,
      status: fileIssues.some((candidate) => candidate.severity === "error") ? "failed" : "valid",
    };
  });

  return {
    files: validatedFiles,
    issues,
    valid: !issues.some((candidate) => candidate.severity === "error"),
  };
}
