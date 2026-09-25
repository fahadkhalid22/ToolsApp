"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Link2, Unlink2, RotateCcw } from "lucide-react";
import { FileDropzone } from "@/components/file-tools/FileDropzone";
import { FileDownloadButton } from "@/components/file-tools/FileDownloadButton";
import { formatBytes } from "@/lib/file-tools/format";
import { createToolFileItems } from "@/lib/file-tools/queue";
import { validateFileSelection } from "@/lib/file-tools/validation";
import { recordToolCompletion } from "@/lib/discovery/local-state";
import { canvasToBlob, decodeImage, drawResizedImage, type DecodedImage } from "@/lib/image-tools/browser";
import { buildImageFileName, formatDimensions, IMAGE_MIME_BY_FORMAT, MAX_CANVAS_DIMENSION } from "@/lib/image-tools/core";
import {
  editResizeDimension, parseResizeDimensions, resizeFormatFromHeader,
  resizeSettingsKey, RESIZE_SCALES, scaleResizeDimensions, type ResizeFields, type ResizeFormat,
} from "@/lib/image-tools/resizer";
import type { FileProcessingOutput, FileToolConfig } from "@/types/file-tool";
import type { ImageDimensions } from "@/types/image-tool";
import styles from "./ImageResizer.module.css";

const RESIZER_CONFIG: FileToolConfig = {
  id: "image-resizer", title: "Image Resizer", mode: "single",
  description: "Resize JPEG and PNG images locally.",
  uploadLabel: "Choose an image to resize",
  uploadHelperText: "Drop a JPEG or PNG here, or browse your files.",
  processLabel: "Resize image", downloadLabel: "Download resized image",
  privacyNote: "Your image stays in this browser.",
  accepted: { extensions: [".jpg", ".jpeg", ".png"], mimeTypes: ["image/jpeg", "image/png"], mimeMismatchPolicy: "reject" },
  maxFileSizeBytes: 25 * 1024 * 1024, maxFiles: 1, rejectEmptyFiles: true,
};

type Source = { file: File; dimensions: ImageDimensions; format: ResizeFormat };
type Result = { output: FileProcessingOutput; dimensions: ImageDimensions; format: ResizeFormat; key: string };
type Phase = "idle" | "reading" | "ready" | "processing";

function LocalPreview({ blob, alt }: { blob: Blob; alt: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    const image = imageRef.current;
    if (image) image.src = url;
    return () => {
      image?.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [blob]);
  // Browser-local Blob previews cannot use the server image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={imageRef} alt={alt} />;
}

export function ImageResizer() {
  const [source, setSource] = useState<Source | null>(null);
  const [fields, setFields] = useState<ResizeFields>({ width: "", height: "" });
  const [locked, setLocked] = useState(true);
  const [formatChoice, setFormatChoice] = useState<ResizeFormat | "original">("original");
  const [quality, setQuality] = useState(88);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Choose an image to begin.");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [editingResult, setEditingResult] = useState(false);
  const decodedRef = useRef<DecodedImage | null>(null);
  const generationRef = useRef(0);
  const processingRef = useRef(false);
  const settingsRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => {
    generationRef.current += 1;
    decodedRef.current?.dispose();
    decodedRef.current = null;
  }, []);

  function reset() {
    generationRef.current += 1;
    processingRef.current = false;
    decodedRef.current?.dispose();
    decodedRef.current = null;
    setSource(null);
    setResult(null);
    setFields({ width: "", height: "" });
    setLocked(true);
    setFormatChoice("original");
    setQuality(88);
    setError("");
    setPhase("idle");
    setStatus("Choose an image to begin.");
  }

  async function selectFiles(files: readonly File[]) {
    if (!files.length) return;
    const generation = ++generationRef.current;
    processingRef.current = false;
    decodedRef.current?.dispose();
    decodedRef.current = null;
    setSource(null);
    setResult(null);
    setError("");
    setPhase("reading");
    setStatus("Reading image…");
    try {
      const validation = await validateFileSelection(createToolFileItems(files), RESIZER_CONFIG);
      if (!validation.valid) throw new Error(validation.issues.find((issue) => issue.severity === "error")?.message ?? "Choose one JPEG or PNG image.");
      const file = validation.files[0].file;
      const format = resizeFormatFromHeader(new Uint8Array(await file.slice(0, 8).arrayBuffer()));
      if (!format) throw new Error("Choose a JPEG or PNG image. Other formats cannot be resized here.");
      // Dispose a late decode explicitly, including when selection or navigation interrupts it.
      let decoded: DecodedImage;
      try {
        decoded = await decodeImage(file);
      } catch {
        throw new Error("This image could not be decoded. Try a valid JPEG or PNG that is not corrupted.");
      }
      if (generation !== generationRef.current) {
        decoded.dispose();
        return;
      }
      decodedRef.current = decoded;
      const dimensions = { width: decoded.width, height: decoded.height };
      setSource({ file, dimensions, format });
      setFields({ width: String(dimensions.width), height: String(dimensions.height) });
      setLocked(true);
      setFormatChoice("original");
      setQuality(88);
      setPhase("ready");
      setStatus("Choose dimensions, then resize your image.");
    } catch (cause) {
      if (generation !== generationRef.current) return;
      setPhase("idle");
      setStatus("The image could not be loaded.");
      setError(cause instanceof Error ? cause.message : "Choose another JPEG or PNG and try again.");
    }
  }

  let dimensions: ImageDimensions | null = null;
  let dimensionsError = "";
  if (source) {
    try { dimensions = parseResizeDimensions(fields); }
    catch (cause) { dimensionsError = cause instanceof Error ? cause.message : "Check the dimensions."; }
  }
  const outputFormat = formatChoice === "original" ? source?.format ?? "jpeg" : formatChoice;
  const key = dimensions ? resizeSettingsKey(dimensions, outputFormat, quality) : null;
  const stale = !!result && result.key !== key;
  const busy = phase === "reading" || phase === "processing";
  const currentResult = !!result && !stale && !busy;
  const upscaling = !!source && !!dimensions && (dimensions.width > source.dimensions.width || dimensions.height > source.dimensions.height);

  function edit(axis: keyof ResizeFields, value: string) {
    if (!source) return;
    setFields(editResizeDimension(source.dimensions, fields, axis, value, locked));
    setError("");
  }

  function applyScale(scale: number) {
    if (!source) return;
    try {
      const next = scaleResizeDimensions(source.dimensions, scale);
      setFields({ width: String(next.width), height: String(next.height) });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This scale is too large.");
    }
  }

  async function resizeImage() {
    const decoded = decodedRef.current;
    if (!source || !decoded || !dimensions || !key || processingRef.current) return;
    processingRef.current = true;
    const generation = ++generationRef.current;
    setPhase("processing");
    setStatus("Resizing locally…");
    setError("");
    // Release the previous output before allocating the next canvas.
    setResult(null);
    let canvas: HTMLCanvasElement | null = null;
    try {
      canvas = drawResizedImage(decoded, dimensions, outputFormat, "#ffffff");
      setStatus(outputFormat === "jpeg" ? "Encoding JPG…" : "Encoding PNG…");
      const blob = await canvasToBlob(canvas, outputFormat, outputFormat === "jpeg" ? quality / 100 : undefined);
      if (generation !== generationRef.current) return;
      if (blob.type !== IMAGE_MIME_BY_FORMAT[outputFormat]) throw new Error("This browser could not export the selected format. Try a current browser.");
      setResult({
        output: { blob, fileName: buildImageFileName(source.file.name, "resized", outputFormat), mimeType: blob.type, originalSize: source.file.size },
        dimensions, format: outputFormat, key,
      });
      setStatus("Resized image ready.");
      setEditingResult(false);
      requestAnimationFrame(() => resultHeadingRef.current?.focus());
      recordToolCompletion("image-resizer");
    } catch (cause) {
      if (generation !== generationRef.current) return;
      setError(cause instanceof Error ? cause.message : "Resizing failed. Try smaller dimensions or another image.");
      setStatus("The image could not be resized.");
    } finally {
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      if (generation === generationRef.current) {
        processingRef.current = false;
        setPhase("ready");
      }
    }
  }

  function cancel() {
    generationRef.current += 1;
    processingRef.current = false;
    setPhase(source ? "ready" : "idle");
    setStatus("Resizing cancelled. Your original image is unchanged.");
  }

  return (
    <article className={styles.panel} data-tool-id="image-resizer">
      <header className={styles.header}>
        <div><h1>Image Resizer</h1><p>Set exact dimensions for your JPEG or PNG. Preview the result before downloading.</p></div>
      </header>

      {!source ? <FileDropzone config={RESIZER_CONFIG} disabled={phase === "reading"} phase={dragging ? "dragging" : "idle"} onDraggingChange={setDragging} onFiles={selectFiles} /> : (
        <>
          <div className={styles.editor} hidden={currentResult && !editingResult}>
            <section className={styles.source} aria-labelledby="resize-source-title">
              <div className={styles.sectionHeading}><h2 id="resize-source-title">Original image</h2><button className={styles.secondary} onClick={reset} type="button"><RotateCcw aria-hidden="true" size={15} /> Change image</button></div>
              <div className={styles.preview}><LocalPreview blob={source.file} alt="Original image" /></div>
              <strong className={styles.filename} title={source.file.name}>{source.file.name}</strong>
              <dl className={styles.sourceDetails}>
                <div><dt>Dimensions</dt><dd>{formatDimensions(source.dimensions)}</dd></div>
                <div><dt>File size</dt><dd>{formatBytes(source.file.size)}</dd></div>
                <div><dt>Format</dt><dd>{source.format === "jpeg" ? "JPEG" : "PNG"}</dd></div>
              </dl>
            </section>

            <section className={styles.settings} aria-labelledby="resize-settings-title">
              <h2 id="resize-settings-title" ref={settingsRef} tabIndex={-1}>Resize settings</h2>
              <fieldset disabled={busy}>
                <legend className="sr-only">Dimensions and output format</legend>
                <div className={styles.dimensions}>
                  <label htmlFor="resize-width">Width (px)<input id="resize-width" type="number" inputMode="numeric" min="1" max={MAX_CANVAS_DIMENSION} step="1" value={fields.width} onChange={(event) => edit("width", event.target.value)} aria-invalid={!!dimensionsError} aria-describedby={dimensionsError ? "resize-dimension-error" : undefined} /></label>
                  <button className={styles.lock} aria-label={locked ? "Unlock aspect ratio" : "Lock aspect ratio"} aria-pressed={locked} aria-describedby="resize-lock-description" type="button" onClick={() => {
                    if (!locked) setFields(editResizeDimension(source.dimensions, fields, "width", fields.width, true));
                    setLocked(!locked);
                  }}>{locked ? <Link2 aria-hidden="true" size={19} /> : <Unlink2 aria-hidden="true" size={19} />}</button>
                  <label htmlFor="resize-height">Height (px)<input id="resize-height" type="number" inputMode="numeric" min="1" max={MAX_CANVAS_DIMENSION} step="1" value={fields.height} onChange={(event) => edit("height", event.target.value)} aria-invalid={!!dimensionsError} aria-describedby={dimensionsError ? "resize-dimension-error" : undefined} /></label>
                </div>
                <p className={styles.hint} id="resize-lock-description">{locked ? "Aspect ratio locked to the original image." : "Aspect ratio unlocked. The image may be stretched."}</p>
                {dimensionsError ? <p className={styles.error} id="resize-dimension-error" role="alert">{dimensionsError}</p> : null}
                <div className={styles.presets} role="group" aria-label="Scale from original dimensions">
                  {RESIZE_SCALES.map((scale) => <button key={scale} type="button" aria-pressed={!!dimensions && dimensions.width === Math.max(1, Math.round(source.dimensions.width * scale)) && dimensions.height === Math.max(1, Math.round(source.dimensions.height * scale))} onClick={() => applyScale(scale)}>{scale === 1 ? "Original" : `${scale * 100}%`}</button>)}
                </div>
                <label className={styles.format} htmlFor="resize-format">Output format<select id="resize-format" value={formatChoice} onChange={(event) => setFormatChoice(event.target.value as ResizeFormat | "original")}><option value="original">Keep original</option><option value="jpeg">JPG</option><option value="png">PNG</option></select></label>
                {outputFormat === "jpeg" ? <label className={styles.quality} htmlFor="resize-quality"><span>JPEG quality<output>{quality}%</output></span><input id="resize-quality" aria-label="JPEG quality" type="range" min="40" max="95" step="1" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /><small>Higher quality generally creates larger files.</small></label> : <p className={styles.hint}>PNG preserves existing transparency and uses lossless encoding.</p>}
                {source.format === "png" && outputFormat === "jpeg" ? <p className={styles.warning}>Transparent pixels will use a white background in JPG output.</p> : null}
                {upscaling ? <p className={styles.warning}>Upscaling increases pixel dimensions but cannot restore missing detail.</p> : null}
              </fieldset>
              <div className={styles.summary} aria-live="polite"><span>Output dimensions</span><strong>{dimensions ? `${formatDimensions(source.dimensions)} → ${formatDimensions(dimensions)}` : "Enter valid dimensions to continue."}</strong></div>
              <div className={styles.actions}>
                {phase === "processing" ? <button type="button" className={styles.secondary} onClick={cancel}>Cancel resizing</button> : <button type="button" className={currentResult ? styles.secondary : styles.primary} disabled={!dimensions || busy} onClick={resizeImage}>Resize image</button>}
              </div>
            </section>
          </div>
          {result ? <section className={styles.result} aria-labelledby="resize-result-title">
            <div className={styles.sectionHeading}><h2 id="resize-result-title" ref={resultHeadingRef} tabIndex={-1}><CheckCircle2 aria-hidden="true" size={19} /> {stale ? "Previous result" : "Your resized image is ready"}</h2><div className={styles.resultActions}><button type="button" className={styles.secondary} onClick={() => { setEditingResult(true); requestAnimationFrame(() => settingsRef.current?.focus()); }}>Edit settings</button><button type="button" className={styles.secondary} onClick={reset}>Change image</button></div></div>
            {stale ? <p className={styles.warning} role="status">Settings changed — resize again to update the result.</p> : null}
            <div className={styles.comparison}>
              <figure><figcaption><strong>Original</strong><span>{formatDimensions(source.dimensions)} · {formatBytes(source.file.size)}</span></figcaption><div className={styles.preview}><LocalPreview blob={source.file} alt="Original comparison" /></div></figure>
              <figure><figcaption><strong>Resized</strong><span>{formatDimensions(result.dimensions)} · {formatBytes(result.output.blob.size)}</span></figcaption><div className={styles.preview}><LocalPreview blob={result.output.blob} alt="Resized comparison" /></div></figure>
            </div>
            <dl className={styles.metrics}>
              <div><dt>Original dimensions</dt><dd>{formatDimensions(source.dimensions)}</dd></div>
              <div><dt>New dimensions</dt><dd>{formatDimensions(result.dimensions)}</dd></div>
              <div><dt>Original file size</dt><dd>{formatBytes(source.file.size)}</dd></div>
              <div><dt>Output file size</dt><dd>{formatBytes(result.output.blob.size)}</dd></div>
              <div><dt>Output format</dt><dd>{result.format === "jpeg" ? "JPEG" : "PNG"}</dd></div>
            </dl>
            <div className={styles.download}><strong className={styles.filename}>{result.output.fileName}</strong>{!stale ? <FileDownloadButton key={result.key} output={result.output} label="Download resized image" primary /> : <span>Resize again to download the updated image.</span>}</div>
          </section> : null}
        </>
      )}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <footer className={styles.status} role="status" aria-live="polite">{busy ? <span className={styles.spinner} aria-hidden="true" /> : null}{stale ? "Settings changed — resize again to update the result." : status}</footer>
    </article>
  );
}
