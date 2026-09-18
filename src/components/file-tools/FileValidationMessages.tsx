import { AlertCircle, AlertTriangle } from "lucide-react";

import type { FileValidationIssue } from "@/types/file-tool";

import styles from "./FileTool.module.css";

type FileValidationMessagesProps = {
  issues: readonly FileValidationIssue[];
};

export function FileValidationMessages({ issues }: FileValidationMessagesProps) {
  if (!issues.length) return null;
  return (
    <div aria-live="polite" className={styles.validationMessages}>
      {issues.map((issue, index) => {
        const Icon = issue.severity === "error" ? AlertCircle : AlertTriangle;
        return (
          <p className={issue.severity === "error" ? styles.errorMessage : styles.warningMessage} key={`${issue.code}-${issue.fileId ?? "global"}-${index}`}>
            <Icon aria-hidden="true" size={16} />
            <span>{issue.message}</span>
          </p>
        );
      })}
    </div>
  );
}
