"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  Minimize2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { downloadFileOutput } from "@/lib/file-tools/download";
import { formatJson, minifyJson, validateJson, type JsonTransformResult } from "@/lib/json/validator";

import styles from "./DeveloperTools.module.css";

const SAMPLE_JSON = `{
  "appName": "ToolsApp",
  "version": "1.0.0",
  "features": [
    "Text Tools",
    "QR Generator",
    "JSON Formatter"
  ],
  "settings": {
    "theme": "Sunset Orange",
    "offlineSupport": true
  }
}`;

type Status = {
  tone: "success" | "error" | "neutral";
  message: string;
};

type CodeEditorProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  readOnly?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
};

function CodeEditor({ id, label, value, placeholder, readOnly = false, invalid = false, onChange }: CodeEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(1, value.split(/\r\n|\r|\n/).length);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange?.(event.target.value);
  }

  return (
    <section className={styles.editorCard} aria-labelledby={`${id}-title`}>
      <div className={styles.editorHeader}>
        <h2 className={styles.editorTitle} id={`${id}-title`}>{label}</h2>
        <span>{lineCount.toLocaleString()} {lineCount === 1 ? "line" : "lines"}</span>
      </div>
      <div className={styles.editorBody}>
        <div aria-hidden="true" className={styles.lineNumbers} ref={gutterRef}>
          {Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}
        </div>
        <textarea
          aria-invalid={invalid}
          aria-label={label}
          className={styles.textarea}
          onChange={handleChange}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck="false"
          value={value}
          wrap="off"
        />
      </div>
    </section>
  );
}

function statusFromFailure(result: Extract<JsonTransformResult, { success: false }>): Status {
  const location = result.line && result.column ? `Line ${result.line}, column ${result.column}. ` : "";
  return { tone: "error", message: `${location}${result.error}` };
}

export function JsonFormatterWorkspace() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [copied, setCopied] = useState(false);

  function requireInput() {
    if (input.trim()) return true;
    setStatus({ tone: "neutral", message: "Paste or type JSON to begin." });
    setOutput("");
    return false;
  }

  function handleFormat() {
    if (!requireInput()) return;
    const result = formatJson(input);
    if (result.success) {
      setOutput(result.result);
      setStatus({ tone: "success", message: "Valid JSON — formatted with 2-space indentation." });
      recordToolCompletion("json-formatter-validator");
    } else {
      setStatus(statusFromFailure(result));
      setOutput("");
    }
  }

  function handleMinify() {
    if (!requireInput()) return;
    const result = minifyJson(input);
    if (result.success) {
      setOutput(result.result);
      setStatus({ tone: "success", message: "Valid JSON — minified without changing its data." });
      recordToolCompletion("json-formatter-validator");
    } else {
      setStatus(statusFromFailure(result));
      setOutput("");
    }
  }

  function handleValidate() {
    if (!requireInput()) return;
    const result = validateJson(input);
    if (result.valid) {
      setStatus({ tone: "success", message: "Valid standard JSON syntax." });
      recordToolCompletion("json-formatter-validator");
    } else {
      setStatus({
        tone: "error",
        message: `${result.line && result.column ? `Line ${result.line}, column ${result.column}. ` : ""}${result.error}`,
      });
    }
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setStatus({ tone: "success", message: "Output copied to the clipboard." });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus({ tone: "error", message: "Copy failed. Select the output and copy it manually." });
    }
  }

  function handleDownload() {
    if (!output) return;
    try {
      downloadFileOutput({
        blob: new Blob([output], { type: "application/json;charset=utf-8" }),
        fileName: "formatted.json",
      });
      setStatus({ tone: "success", message: "JSON download started." });
    } catch {
      setStatus({ tone: "error", message: "Download failed. Copy the output and save it manually." });
    }
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setStatus(null);
    setCopied(false);
  }

  function handleSample() {
    setInput(SAMPLE_JSON);
    setOutput("");
    setStatus(null);
    setCopied(false);
  }

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}>
        <span className={styles.eyebrow}>Developer Tools</span>
        <h1 className={styles.title}>JSON Formatter &amp; Validator</h1>
        <p className={styles.description}>
          Validate, pretty-print, and minify strict JSON locally. Your data never leaves this page.
        </p>
      </header>

      <div className={styles.toolbar} aria-label="JSON actions">
        <div className={styles.primaryActions}>
          <button className={styles.primaryBtn} onClick={handleFormat} type="button">
            <FileCode2 aria-hidden="true" size={16} />
            <span>Format</span>
          </button>
          <button className={styles.secondaryBtn} onClick={handleMinify} type="button">
            <Minimize2 aria-hidden="true" size={16} />
            <span>Minify</span>
          </button>
          <button className={styles.secondaryBtn} onClick={handleValidate} type="button">
            <CheckCircle2 aria-hidden="true" size={16} />
            <span>Validate</span>
          </button>
        </div>
        <div className={styles.utilityActions}>
          <button className={styles.secondaryBtn} onClick={handleSample} type="button">
            <Sparkles aria-hidden="true" size={16} />
            <span>Sample</span>
          </button>
          <button className={styles.secondaryBtn} disabled={!input && !output} onClick={handleClear} type="button">
            <RotateCcw aria-hidden="true" size={16} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {status ? (
        <div
          aria-live="polite"
          className={`${styles.statusBanner} ${status.tone === "success" ? styles.statusValid : status.tone === "error" ? styles.statusInvalid : styles.statusNeutral}`}
          role={status.tone === "error" ? "alert" : "status"}
        >
          {status.tone === "success" ? <CheckCircle2 aria-hidden="true" size={18} /> : status.tone === "error" ? <XCircle aria-hidden="true" size={18} /> : <FileCode2 aria-hidden="true" size={18} />}
          <span>{status.message}</span>
        </div>
      ) : (
        <div className={styles.strictNote}>
          Strict JSON only: comments, trailing commas, single quotes, and JavaScript object syntax are rejected.
        </div>
      )}

      <div className={styles.editorGrid}>
        <CodeEditor
          id="json-input"
          invalid={status?.tone === "error"}
          label="Input JSON"
          onChange={(value) => {
            setInput(value);
            setOutput("");
            setStatus(null);
            setCopied(false);
          }}
          placeholder={'Paste JSON here, for example: {"ready": true}'}
          value={input}
        />

        <section className={styles.outputColumn}>
          <div className={styles.outputActions}>
            <span>Formatted / minified output</span>
            <div>
              <button className={styles.compactBtn} disabled={!output} onClick={handleCopy} type="button">
                {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button className={styles.compactBtn} disabled={!output} onClick={handleDownload} type="button">
                <Download aria-hidden="true" size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
          <CodeEditor
            id="json-output"
            label="Output JSON"
            placeholder="Formatted or minified output will appear here…"
            readOnly
            value={output}
          />
        </section>
      </div>
    </main>
  );
}
