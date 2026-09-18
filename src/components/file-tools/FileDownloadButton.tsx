"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { downloadFileOutput } from "@/lib/file-tools/download";
import type { FileProcessingOutput } from "@/types/file-tool";

import styles from "./FileTool.module.css";

type FileDownloadButtonProps = {
  output: FileProcessingOutput;
  label: string;
  primary?: boolean;
};

export function FileDownloadButton({ output, label, primary = false }: FileDownloadButtonProps) {
  const [error, setError] = useState("");

  return (
    <span className={styles.downloadControl}>
      <button
        className={primary ? styles.downloadPrimary : styles.downloadSecondary}
        onClick={() => {
          try {
            downloadFileOutput(output);
            setError("");
          } catch {
            setError("Download could not start. Try again or use a current browser.");
          }
        }}
        type="button"
      >
        <Download aria-hidden="true" size={16} /> {label}
      </button>
      {error ? <small role="alert">{error}</small> : null}
    </span>
  );
}
