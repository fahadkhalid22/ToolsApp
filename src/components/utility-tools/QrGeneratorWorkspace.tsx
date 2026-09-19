"use client";

import { useState } from "react";
import { Download, QrCode, RefreshCw } from "lucide-react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { generateQrPng, generateQrSvg, validateQrText } from "@/lib/qr/generator";

import styles from "./UtilityTools.module.css";

export function QrGeneratorWorkspace() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    const validation = validateQrText(text);
    if (!validation.valid) {
      setError(validation.error || "Invalid input");
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const png = await generateQrPng(text);
      setGenerated(png);
      recordToolCompletion("qr-code-generator");
    } catch {
      setError("Failed to generate QR code.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload(type: "png" | "svg") {
    if (!generated) return;
    try {
      const url = type === "png" ? generated : await generateQrSvg(text);
      const link = document.createElement("a");
      link.href = type === "png" ? url : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(url)}`;
      link.download = `qrcode.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setError("Failed to download.");
    }
  }

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}>
        <span className={styles.eyebrow}>Utilities</span>
        <h1 className={styles.title}>QR Code Generator</h1>
        <p className={styles.description}>
          Convert URLs or plain text into a shareable QR code in seconds.
        </p>
      </header>

      <div className={styles.workspace}>
        <section className={styles.inputCard}>
          <h2 className={styles.inputTitle}>Configuration</h2>
          <label className={styles.label} htmlFor="qr-content">Content (URL or Text)</label>
          <textarea
            id="qr-content"
            className={styles.textarea}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder="https://example.com"
            rows={5}
          />
          {error && <p style={{ color: "var(--color-error, #ef4444)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}
          <button className={styles.submitBtn} onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <QrCode size={18} />}
            {generated ? "Regenerate" : "Generate"}
          </button>
        </section>

        <section className={styles.previewCard}>
          <h2 className={styles.inputTitle}>QR Preview</h2>
          <div className={generated ? styles.qrContainer : styles.qrPlaceholder}>
            {generated ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={generated} alt="Generated QR code" style={{ maxWidth: "100%", height: "auto" }} />
            ) : "Preview will appear here"}
          </div>
          {generated && (
            <div className={styles.downloadActions}>
              <button className={styles.downloadBtn} onClick={() => handleDownload("png")}>
                <Download size={16} /> PNG
              </button>
              <button className={styles.downloadBtn} onClick={() => handleDownload("svg")}>
                <Download size={16} /> SVG
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
