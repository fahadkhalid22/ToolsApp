"use client";

import { useState } from "react";
import { Check, CheckCircle2, Copy, FileCode2, Minimize2, Trash2, XCircle } from "lucide-react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { formatJson, minifyJson, validateJson } from "@/lib/json/validator";

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

export function JsonFormatterWorkspace() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleFormat() {
    if (!input.trim()) {
      setStatus({ valid: false, message: "Input is empty." });
      setOutput("");
      return;
    }
    const res = formatJson(input);
    if (res.success) {
      setOutput(res.result);
      setStatus({ valid: true, message: "Valid JSON formatted successfully!" });
      recordToolCompletion("json-formatter-validator");
    } else {
      setStatus({ valid: false, message: res.error || "Invalid JSON" });
      setOutput("");
    }
  }

  function handleMinify() {
    if (!input.trim()) {
      setStatus({ valid: false, message: "Input is empty." });
      setOutput("");
      return;
    }
    const res = minifyJson(input);
    if (res.success) {
      setOutput(res.result);
      setStatus({ valid: true, message: "Valid JSON minified successfully!" });
      recordToolCompletion("json-formatter-validator");
    } else {
      setStatus({ valid: false, message: res.error || "Invalid JSON" });
      setOutput("");
    }
  }

  function handleValidate() {
    if (!input.trim()) {
      setStatus({ valid: false, message: "Input is empty." });
      return;
    }
    const res = validateJson(input);
    if (res.valid) {
      setStatus({ valid: true, message: "Valid JSON syntax!" });
      recordToolCompletion("json-formatter-validator");
    } else {
      setStatus({ valid: false, message: res.error });
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setStatus(null);
  }

  function handleSample() {
    setInput(SAMPLE_JSON);
    setStatus(null);
  }

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}>
        <span className={styles.eyebrow}>Developer Tools</span>
        <h1 className={styles.title}>JSON Formatter &amp; Validator</h1>
        <p className={styles.description}>
          Validate, format, and minify JSON data with instantaneous parse feedback.
        </p>
      </header>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button type="button" className={styles.primaryBtn} onClick={handleFormat}>
          <FileCode2 size={16} />
          <span>Format / Pretty Print</span>
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={handleMinify}>
          <Minimize2 size={16} />
          <span>Minify</span>
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={handleValidate}>
          <CheckCircle2 size={16} />
          <span>Validate</span>
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={handleSample}>
          <span>Sample</span>
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={handleClear}>
          <Trash2 size={16} />
          <span>Clear</span>
        </button>
      </div>

      {status && (
        <div className={`${styles.statusBanner} ${status.valid ? styles.statusValid : styles.statusInvalid}`}>
          {status.valid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Editor Grid */}
      <div className={styles.editorGrid} style={{ marginTop: "1rem" }}>
        <section className={styles.editorCard}>
          <div className={styles.editorHeader}>
            <span className={styles.editorTitle}>Input JSON</span>
          </div>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setStatus(null);
            }}
            placeholder="Paste raw or unformatted JSON here..."
            spellCheck="false"
          />
        </section>

        <section className={styles.editorCard}>
          <div className={styles.editorHeader}>
            <span className={styles.editorTitle}>Formatted / Minified Output</span>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleCopy}
              disabled={!output}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <textarea
            className={styles.textarea}
            value={output}
            readOnly
            placeholder="Result will appear here..."
            spellCheck="false"
          />
        </section>
      </div>
    </main>
  );
}
