"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, QrCode, RefreshCw, RotateCcw } from "lucide-react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { downloadFileOutput } from "@/lib/file-tools/download";
import {
  createDefaultQrSettings,
  createQrDownloadOutput,
  generateQrPng,
  generateQrSvg,
  getQrContentType,
  normalizeQrSettings,
  QR_ERROR_CORRECTION_LEVELS,
  QR_EXPORT_SIZES,
  type QrDownloadFormat,
  type QrErrorCorrectionLevel,
  type QrExportSize,
  type QrSettings,
  validateQrText,
} from "@/lib/qr/generator";

import styles from "./UtilityTools.module.css";

type GeneratedQr = {
  png: string;
  svg: string;
  content: string;
  settings: QrSettings;
};

function truncateContent(value: string) {
  return value.length > 96 ? `${value.slice(0, 93)}…` : value;
}

export function QrGeneratorWorkspace() {
  const [text, setText] = useState("");
  const [settings, setSettings] = useState<QrSettings>(createDefaultQrSettings);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedQr | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationVersion = useRef(0);

  function invalidatePreview() {
    generationVersion.current += 1;
    setGenerated(null);
    setError(null);
    setIsGenerating(false);
  }

  function updateSettings(next: Partial<QrSettings>) {
    setSettings((current) => normalizeQrSettings({ ...current, ...next }));
    invalidatePreview();
  }

  async function handleGenerate() {
    const validation = validateQrText(text);
    if (!validation.valid) {
      setError(validation.error || "Invalid input.");
      setGenerated(null);
      return;
    }

    const normalizedSettings = normalizeQrSettings(settings);
    const requestVersion = ++generationVersion.current;
    setError(null);
    setIsGenerating(true);
    try {
      const [png, svg] = await Promise.all([
        generateQrPng(text, normalizedSettings),
        generateQrSvg(text, normalizedSettings),
      ]);
      if (requestVersion === generationVersion.current) {
        setGenerated({ png, svg, content: text, settings: normalizedSettings });
        recordToolCompletion("qr-code-generator");
      }
    } catch {
      if (requestVersion === generationVersion.current) {
        setGenerated(null);
        setError("This content could not be encoded. Shorten it or try a lower error-correction level.");
      }
    } finally {
      if (requestVersion === generationVersion.current) setIsGenerating(false);
    }
  }

  function handleDownload(format: QrDownloadFormat) {
    if (!generated) return;

    try {
      downloadFileOutput(createQrDownloadOutput(format, generated));
      setError(null);
    } catch {
      setError("The download could not start. Try generating the QR code again.");
    }
  }

  function handleReset() {
    generationVersion.current += 1;
    setText("");
    setSettings(createDefaultQrSettings());
    setGenerated(null);
    setError(null);
    setIsGenerating(false);
  }

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}>
        <span className={styles.eyebrow}>Utilities</span>
        <h1 className={styles.title}>QR Code Generator</h1>
        <p className={styles.description}>
          Turn text or a link into a QR code, then download it as a PNG or SVG.
        </p>
      </header>

      <div className={styles.workspace}>
        <section className={styles.inputCard} aria-labelledby="qr-configuration-title">
          <div className={styles.cardHeadingRow}>
            <div>
              <h2 className={styles.inputTitle} id="qr-configuration-title">Enter your content</h2>
              <p className={styles.sectionDescription}>Add the exact text or link you want people to open.</p>
            </div>
            {(text || generated) ? (
              <button className={styles.resetBtn} onClick={handleReset} type="button">
                <RotateCcw aria-hidden="true" size={15} /> Reset
              </button>
            ) : null}
          </div>

          <label className={styles.label} htmlFor="qr-content">Content (URL or text)</label>
          <textarea
            aria-describedby={error ? "qr-content-help qr-error" : "qr-content-help"}
            aria-invalid={Boolean(error)}
            className={styles.textarea}
            id="qr-content"
            maxLength={2000}
            onChange={(event) => {
              setText(event.target.value);
              invalidatePreview();
            }}
            placeholder="https://example.com"
            rows={5}
            value={text}
          />
          <div className={styles.inputMeta} id="qr-content-help">
            <span>Plain text and web links are encoded entirely on this device.</span>
            <span>{text.length} / 2,000</span>
          </div>

          <fieldset className={styles.settingsGroup}>
            <legend>Output settings</legend>
            <div className={styles.settingsGrid}>
              <label className={styles.fieldLabel} htmlFor="qr-size">
                <span>Image size</span>
                <select
                  className={styles.select}
                  id="qr-size"
                  onChange={(event) => updateSettings({ width: Number(event.target.value) as QrExportSize })}
                  value={settings.width}
                >
                  {QR_EXPORT_SIZES.map((size) => <option key={size} value={size}>{size} × {size} px</option>)}
                </select>
              </label>

              <label className={styles.fieldLabel} htmlFor="qr-error-correction">
                <span>Error correction</span>
                <select
                  className={styles.select}
                  id="qr-error-correction"
                  onChange={(event) => updateSettings({ errorCorrectionLevel: event.target.value as QrErrorCorrectionLevel })}
                  value={settings.errorCorrectionLevel}
                >
                  {QR_ERROR_CORRECTION_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>
            </div>

            <label className={styles.rangeField} htmlFor="qr-margin">
              <span>White border</span>
              <strong>{settings.margin} modules</strong>
            </label>
            <input
              aria-valuetext={`${settings.margin} modules`}
              className={styles.range}
              id="qr-margin"
              max="8"
              min="0"
              onChange={(event) => updateSettings({ margin: Number(event.target.value) })}
              step="1"
              type="range"
              value={settings.margin}
            />
          </fieldset>

          {error ? <p className={styles.errorMessage} id="qr-error" role="alert">{error}</p> : null}

          <button className={styles.submitBtn} disabled={isGenerating} onClick={handleGenerate} type="button">
            {isGenerating ? <RefreshCw aria-hidden="true" className={styles.spinner} size={18} /> : <QrCode aria-hidden="true" size={18} />}
            {isGenerating ? "Generating…" : generated ? "Update QR code" : "Generate QR code"}
          </button>
        </section>

        <section aria-labelledby="qr-preview-title" aria-live="polite" className={styles.previewCard}>
          <div className={styles.previewHeading}>
            <div>
              <h2 className={styles.inputTitle} id="qr-preview-title">Preview</h2>
              <p className={styles.sectionDescription}>{generated ? "Your QR code is ready to use." : "Your generated code will appear here."}</p>
            </div>
            {generated ? <span className={styles.readyBadge}><CheckCircle2 aria-hidden="true" size={15} /> Ready</span> : null}
          </div>

          <div aria-busy={isGenerating} className={generated ? styles.qrContainer : styles.qrPlaceholder}>
            {generated ? (
              // The library returns a local data URL, not user-authored markup.
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Generated QR code containing ${getQrContentType(generated.content).toLowerCase()} content`} src={generated.png} />
            ) : (
              <span><QrCode aria-hidden="true" size={36} />Enter content and select Generate QR code</span>
            )}
          </div>

          {generated ? (
            <>
              <dl className={styles.summaryList}>
                <div><dt>Type</dt><dd>{getQrContentType(generated.content)}</dd></div>
                <div><dt>Dimensions</dt><dd>{generated.settings.width} × {generated.settings.width} px</dd></div>
                <div><dt>Error correction</dt><dd>{generated.settings.errorCorrectionLevel}</dd></div>
                <div><dt>Margin</dt><dd>{generated.settings.margin} modules</dd></div>
                <div className={styles.summaryContent}><dt>Encoded value</dt><dd title={generated.content}>{truncateContent(generated.content)}</dd></div>
              </dl>
              <div className={styles.downloadActions}>
                <button className={styles.downloadBtn} onClick={() => handleDownload("png")} type="button">
                  <Download aria-hidden="true" size={16} /> Download PNG
                </button>
                <button className={styles.downloadBtn} onClick={() => handleDownload("svg")} type="button">
                  <Download aria-hidden="true" size={16} /> Download SVG
                </button>
              </div>
            </>
          ) : (
            <p className={styles.previewHelp}>PNG and SVG downloads will be available after generation.</p>
          )}
        </section>
      </div>
    </main>
  );
}
