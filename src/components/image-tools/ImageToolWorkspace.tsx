"use client";

import Link from "next/link";

import {

ArrowLeftRight,

BadgeCheck,

CheckCircle2,

Crop,

ImageDown,

Info,

Link2,

LockKeyhole,

Maximize2,

RotateCcw,

ShieldCheck,

} from "lucide-react";

import {

useEffect,

useCallback,

useMemo,

useRef,

useState,

type PointerEvent as ReactPointerEvent,

type ReactNode,

} from "react";

import { FileToolView } from "@/components/file-tools/FileToolView";

import { FileDownloadButton } from "@/components/file-tools/FileDownloadButton";

import { FileDropzone } from "@/components/file-tools/FileDropzone";

import { tools } from "@/data/tools";

import { formatBytes } from "@/lib/file-tools/format";

import { createToolFileItems } from "@/lib/file-tools/queue";

import { validateFileSelection } from "@/lib/file-tools/validation";

import { useFileWorkflow } from "@/lib/file-tools/useFileWorkflow";

import {

canvasToBlob,

decodeImage,

drawCroppedImage,

drawResizedImage,

paintCropPreview,

throwIfAborted,

type DecodedImage,

} from "@/lib/image-tools/browser";

import {

IMAGE_MIME_BY_FORMAT,

COMPRESSION_PRESETS,

DEFAULT_COMPRESSION_STRENGTH,

buildImageFileName,

calculateAspectDimensions,

clamp,

compressionPresetForStrength,

compressionStrengthToQuality,

formatDimensions,

imageFormatFromFile,

isSmallerCompressionCandidate,

passportSizeToPixels,

sizeReductionPercent,

sizeSavingsBytes,

validateCanvasDimensions,

} from "@/lib/image-tools/core";

import { recordToolCompletion } from "@/lib/discovery/local-state";

import { FileToolProcessingError } from "@/lib/file-tools/errors";

import type {

FileProcessingContext,

FileProcessingResult,

FileProcessingOutput,

FileProcessor,

FileToolConfig,

FileWorkflowPhase,

} from "@/types/file-tool";

import type {

ImageCrop,

ImageDimensions,

ImageFormat,

PassportPresetId,

PassportSize,

PhysicalUnit,

} from "@/types/image-tool";

import styles from "./ImageTools.module.css";

type ImageToolId =

| "image-compressor"

| "image-resizer"

| "jpg-to-png"

| "png-to-jpg"

| "passport-photo-maker";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const BASE_IMAGE_CONFIG = {

mode: "single",

maxFileSizeBytes: MAX_IMAGE_BYTES,

minFiles: 1,

maxFiles: 1,

duplicatePolicy: "ignore",

rejectEmptyFiles: true,

supportsCancellation: true,

outputMode: "single",

privacyNote: "Your image stays in this browser.",

} as const;

const COMPRESSOR_CONFIG: FileToolConfig = {

...BASE_IMAGE_CONFIG,

id: "image-compressor",

title: "Image Compressor",

description: "Reduce a JPEG, PNG, or WebP locally, then compare the result before downloading.",

uploadLabel: "Drop your image here or browse",

uploadHelperText: "Choose one JPEG, PNG, or WebP image to compress",

processLabel: "Compress image",

downloadLabel: "Download compressed image",

accepted: { extensions: [".jpg", ".jpeg", ".png", ".webp"], mimeTypes: ["image/jpeg", "image/png", "image/webp"], mimeMismatchPolicy: "warn" },

};

const RESIZER_CONFIG: FileToolConfig = {

...BASE_IMAGE_CONFIG,

id: "image-resizer",

title: "Image Resizer",

description: "Set exact pixel dimensions with optional aspect-ratio locking and local export.",

uploadLabel: "Choose an image to resize",

uploadHelperText: "JPEG or PNG · exact pixel controls appear after selection",

processLabel: "Resize image",

downloadLabel: "Download resized image",

accepted: { extensions: [".jpg", ".jpeg", ".png"], mimeTypes: ["image/jpeg", "image/png"], mimeMismatchPolicy: "warn" },

};

const JPG_TO_PNG_CONFIG: FileToolConfig = {

...BASE_IMAGE_CONFIG,

id: "jpg-to-png",

title: "JPG to PNG Converter",

description: "Convert a JPEG into PNG format entirely in your browser.",

uploadLabel: "Drop a JPG here or browse",

uploadHelperText: "Choose one .jpg or .jpeg image",

processLabel: "Convert to PNG",

downloadLabel: "Download PNG",

accepted: { extensions: [".jpg", ".jpeg"], mimeTypes: ["image/jpeg"], mimeMismatchPolicy: "reject" },

};

const PNG_TO_JPG_CONFIG: FileToolConfig = {

...BASE_IMAGE_CONFIG,

id: "png-to-jpg",

title: "PNG to JPG Converter",

description: "Create a compact JPEG and choose how transparent pixels should be flattened.",

uploadLabel: "Drop a PNG here or browse",

uploadHelperText: "Choose one .png image",

processLabel: "Convert to JPG",

downloadLabel: "Download JPG",

accepted: { extensions: [".png"], mimeTypes: ["image/png"], mimeMismatchPolicy: "reject" },

};

const PASSPORT_CONFIG: FileToolConfig = {

...BASE_IMAGE_CONFIG,

id: "passport-photo-maker",

title: "Passport & Visa Photo Maker",

description: "Crop a photo to common document dimensions with a preview that matches the exported image.",

uploadLabel: "Choose a portrait photo",

uploadHelperText: "JPEG or PNG · reposition and zoom after selection",

processLabel: "Create photo",

downloadLabel: "Download photo",

accepted: { extensions: [".jpg", ".jpeg", ".png"], mimeTypes: ["image/jpeg", "image/png"], mimeMismatchPolicy: "warn" },

};

function reportStep(

context: FileProcessingContext<unknown>,

fileId: string,

progress: number,

message: string,

) {

context.reportProgress({ fileId, progress, overallProgress: progress, status: progress === 100 ? "completed" : "processing", message });

}

function requireInput(context: FileProcessingContext<unknown>) {

const item = context.files[0];

if (!item) throw new FileToolProcessingError("Choose an image before processing.", { retryable: false });

return item;

}

type ResizeOptions = {

width: number;

height: number;

format: ImageFormat | "original";

quality: number;

background: string;

};

const resizeImage: FileProcessor<ResizeOptions> = async (context) => {

const item = requireInput(context);

const dimensions = validateCanvasDimensions({ width: context.options.width, height: context.options.height });

const outputFormat = context.options.format === "original"

? imageFormatFromFile(item.file) ?? "png"

: context.options.format;

reportStep(context, item.id, 8, "Decoding the source image…");

const decoded = await decodeImage(item.file, context.signal);

try {

reportStep(context, item.id, 45, `Resampling to ${formatDimensions(dimensions)}…`);

const canvas = drawResizedImage(decoded, dimensions, outputFormat, context.options.background);

throwIfAborted(context.signal);

reportStep(context, item.id, 78, "Encoding the resized image…");

const blob = await canvasToBlob(canvas, outputFormat, context.options.quality);

throwIfAborted(context.signal);

reportStep(context, item.id, 100, "Resized image ready.");

return {

outputs: [{

blob,

fileName: buildImageFileName(item.file.name, "resized", outputFormat),

mimeType: IMAGE_MIME_BY_FORMAT[outputFormat],

originalSize: item.file.size,

metrics: [{ label: "Output", value: formatDimensions(dimensions) }],

}],

metrics: [

{ label: "Original", value: formatDimensions({ width: decoded.width, height: decoded.height }) },

{ label: "Resized", value: formatDimensions(dimensions) },

{ label: "File size", value: formatBytes(blob.size) },

],

summary: "The resized image was created locally at the exact dimensions shown.",

};

} finally {

decoded.dispose();

}

};

type ConvertOptions = { format: ImageFormat; quality: number; background: string };

const convertImage: FileProcessor<ConvertOptions> = async (context) => {

const item = requireInput(context);

reportStep(context, item.id, 10, "Decoding the source image…");

const decoded = await decodeImage(item.file, context.signal);

try {

const dimensions = { width: decoded.width, height: decoded.height };

reportStep(context, item.id, 48, `Preparing ${context.options.format === "png" ? "PNG" : context.options.format === "webp" ? "WebP" : "JPG"} pixels…`);

const canvas = drawResizedImage(decoded, dimensions, context.options.format, context.options.background);

throwIfAborted(context.signal);

reportStep(context, item.id, 78, "Encoding the converted image…");

const blob = await canvasToBlob(canvas, context.options.format, context.options.quality);

throwIfAborted(context.signal);

reportStep(context, item.id, 100, "Converted image ready.");

return {

outputs: [{

blob,

fileName: buildImageFileName(item.file.name, "converted", context.options.format),

mimeType: IMAGE_MIME_BY_FORMAT[context.options.format],

originalSize: item.file.size,

metrics: [{ label: "Dimensions", value: formatDimensions(dimensions) }],

}],

metrics: [

{ label: "Format", value: context.options.format === "png" ? "PNG" : context.options.format === "webp" ? "WebP" : "JPG" },

{ label: "Dimensions", value: formatDimensions(dimensions) },

{ label: "Output size", value: formatBytes(blob.size) },

],

summary: `The ${context.options.format === "png" ? "PNG" : context.options.format === "webp" ? "WebP" : "JPG"} was created locally without changing the pixel dimensions.`,

};

} finally {

decoded.dispose();

}

};

type PassportOptions = {

output: ImageDimensions;

crop: ImageCrop;

};

const createPassportPhoto: FileProcessor<PassportOptions> = async (context) => {

const item = requireInput(context);

const output = validateCanvasDimensions(context.options.output);

reportStep(context, item.id, 8, "Decoding the portrait…");

const decoded = await decodeImage(item.file, context.signal);

try {

reportStep(context, item.id, 46, "Applying the visible crop…");

const canvas = drawCroppedImage(decoded, output, context.options.crop, "jpeg", "#ffffff");

throwIfAborted(context.signal);

reportStep(context, item.id, 78, "Encoding the document photo…");

const blob = await canvasToBlob(canvas, "jpeg", 0.92);

throwIfAborted(context.signal);

reportStep(context, item.id, 100, "Photo ready.");

return {

outputs: [{

blob,

fileName: buildImageFileName(item.file.name, "document-photo", "jpeg"),

mimeType: "image/jpeg",

originalSize: item.file.size,

metrics: [{ label: "Output", value: formatDimensions(output) }],

}],

metrics: [

{ label: "Output", value: formatDimensions(output) },

{ label: "Format", value: "JPG" },

{ label: "File size", value: formatBytes(blob.size) },

],

summary: "The downloaded JPG uses the crop and pixel dimensions shown in the editor.",

};

} finally {

decoded.dispose();

}

};

function useImageMetadata(file: File | null | undefined) {

const [metadata, setMetadata] = useState<{ file: File; dimensions: ImageDimensions | null; error: string | null } | null>(null);

useEffect(() => {

let active = true;

if (!file) return;

void decodeImage(file)

.then((decoded) => {

if (active) setMetadata({ file, dimensions: { width: decoded.width, height: decoded.height }, error: null });

decoded.dispose();

})

.catch(() => {

if (active) setMetadata({ file, dimensions: null, error: "Preview unavailable. Processing will show a detailed error if the file cannot be decoded." });

});

return () => { active = false; };

}, [file]);

return file && metadata?.file === file ? metadata : { dimensions: null, error: null };

}

function useCompletionHistory(toolId: string, result: FileProcessingResult | null) {

const recordedRef = useRef<FileProcessingResult | null>(null);

useEffect(() => {

if (!result) {

recordedRef.current = null;

return;

}

if (recordedRef.current !== result) {

recordedRef.current = result;

recordToolCompletion(toolId);

}

}, [result, toolId]);

}

function ResultImage({ result, alt }: { result: FileProcessingResult | null; alt: string }) {

const output = result?.outputs[0];

return output ? <BlobImage alt={alt} blob={output.blob} key={`${output.fileName}-${output.blob.size}`} /> : null;

}

function BlobImage({ blob, alt }: { blob: Blob; alt: string }) {

const [url, setUrl] = useState("");

useEffect(() => {

const nextUrl = URL.createObjectURL(blob);

const update = window.setTimeout(() => setUrl(nextUrl), 0);

return () => {

window.clearTimeout(update);

URL.revokeObjectURL(nextUrl);

};

}, [blob]);

// The source is a transient local object URL, so Next image optimization is neither available nor useful.
// eslint-disable-next-line @next/next/no-img-element
return url ? <img alt={alt} src={url} /> : null;

}

function SourcePreview({ file, dimensions, error }: { file: File; dimensions: ImageDimensions | null; error: string | null }) {

return (

<section className={styles.sourceCard} aria-label="Source image preview">

<div className={styles.sourceImage}><BlobImage alt="Selected source" blob={file} key={`${file.name}-${file.size}-${file.lastModified}`} /></div>

<div>

<span className={styles.panelEyebrow}>Source</span>

<strong title={file.name}>{file.name}</strong>

<small>{dimensions ? formatDimensions(dimensions) : error ?? "Reading dimensions…"} · {formatBytes(file.size)}</small>

</div>

</section>

);

}

function OptionsSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {

return (

<div className={styles.optionSection}>

<h3>{icon}{title}</h3>

{children}

</div>

);

}

function QualityControl({ value, onChange, label = "Quality" }: { value: number; onChange: (value: number) => void; label?: string }) {

return (

<label className={styles.rangeField}>

<span><strong>{label}</strong><output>{Math.round(value * 100)}%</output></span>

<input aria-label={`${label} percentage`} max="0.95" min="0.4" onChange={(event) => onChange(Number(event.target.value))} step="0.01" type="range" value={value} />

<small>Lower values usually create smaller files; results vary by image.</small>

</label>

);

}

function ConverterTabs({ active }: { active: "jpg-to-png" | "png-to-jpg" }) {

return (

<nav aria-label="Image conversion direction" className={styles.converterTabs}>

<Link aria-current={active === "jpg-to-png" ? "page" : undefined} className={active === "jpg-to-png" ? styles.converterTabActive : ""} href="/tools/jpg-to-png-converter">JPG → PNG</Link>

<Link aria-current={active === "png-to-jpg" ? "page" : undefined} className={active === "png-to-jpg" ? styles.converterTabActive : ""} href="/tools/png-to-jpg-converter">PNG → JPG</Link>

</nav>

);

}

function ImageToolNav({ active }: { active: ImageToolId }) {

const imageTools = tools.filter((tool) => tool.categoryId === "image");

return (

<div className={styles.toolNavWrap}>

<div className={styles.contextCopy}>

<span><ShieldCheck aria-hidden="true" size={14} /> Private by design</span>

<p>Images are processed locally in your browser and are not uploaded.</p>

</div>

<nav aria-label="Image tools" className={styles.toolNav}>

{imageTools.map((tool) => (

<Link aria-current={tool.id === active ? "page" : undefined} className={tool.id === active ? styles.toolNavActive : ""} href={tool.route} key={tool.id}>{tool.name.replace(" Converter", "")}</Link>

))}

</nav>

</div>

);

}

function ToolPageFrame({ active, children }: { active: ImageToolId; children: ReactNode }) {

return (

<main className={styles.main} id="main-content">

<ImageToolNav active={active} />

{children}

<aside className={styles.privacyStrip}>

<LockKeyhole aria-hidden="true" size={18} />

<span><strong>Local processing</strong><small>No source image or generated file is sent to a server. Closing the page clears in-memory results.</small></span>

</aside>

</main>

);

}

type CompressorStatus =
  | "idle"
  | "decoding"
  | "compressing"
  | "updating"
  | "success"
  | "no-improvement"
  | "error";

type CompressorOutcome =
  | { kind: "success"; output: FileProcessingOutput; strength: number }
  | { kind: "no-improvement"; candidateSize: number; strength: number };

const COMPRESSOR_CACHE_LIMIT = 5;

function compressionFormatLabel(format: ImageFormat) {
  return format === "jpeg" ? "JPEG" : format.toUpperCase();
}

function CompressorTool() {
  const [source, setSource] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat | null>(null);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [strength, setStrength] = useState(DEFAULT_COMPRESSION_STRENGTH);
  const [appliedStrength, setAppliedStrength] = useState<number | null>(null);
  const [status, setStatus] = useState<CompressorStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("Choose an image to begin.");
  const [selectionError, setSelectionError] = useState("");
  const [selectionNotice, setSelectionNotice] = useState("");
  const [outcome, setOutcome] = useState<CompressorOutcome | null>(null);
  const [dragging, setDragging] = useState(false);

  const sourceRef = useRef<File | null>(null);
  const formatRef = useRef<ImageFormat | null>(null);
  const decodedRef = useRef<DecodedImage | null>(null);
  const cacheRef = useRef(new Map<number, CompressorOutcome>());
  const activeControllerRef = useRef<AbortController | null>(null);
  const operationRef = useRef(0);
  const skipDebounceRef = useRef<number | null>(null);
  const recordedSourceRef = useRef<File | null>(null);

  const runCompression = useCallback(async (requestedStrength: number) => {
    const input = sourceRef.current;
    const inputFormat = formatRef.current;
    const decoded = decodedRef.current;
    if (!input || !inputFormat || !decoded) return;

    const cacheKey = inputFormat === "png" ? 0 : requestedStrength;
    const operation = ++operationRef.current;
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      cacheRef.current.delete(cacheKey);
      cacheRef.current.set(cacheKey, cached);
      setOutcome(cached);
      setAppliedStrength(cached.strength);
      setStatus(cached.kind === "success" ? "success" : "no-improvement");
      setStatusMessage(cached.kind === "success" ? "Cached result ready." : "The original is already smaller.");
      return;
    }

    setStatus((current) => current === "success" || current === "no-improvement" || current === "updating" ? "updating" : "compressing");
    setStatusMessage(cacheRef.current.size ? "Updating preview…" : "Compressing from the original image…");
    setSelectionError("");

    try {
      throwIfAborted(controller.signal);
      const canvas = drawResizedImage(
        decoded,
        { width: decoded.width, height: decoded.height },
        inputFormat,
      );
      const quality = inputFormat === "png" ? undefined : compressionStrengthToQuality(requestedStrength);
      const blob = await canvasToBlob(canvas, inputFormat, quality);
      throwIfAborted(controller.signal);
      if (operation !== operationRef.current) return;

      const nextOutcome: CompressorOutcome = isSmallerCompressionCandidate(input.size, blob.size)
        ? {
            kind: "success",
            output: {
              blob,
              fileName: buildImageFileName(input.name, "compressed", inputFormat),
              mimeType: IMAGE_MIME_BY_FORMAT[inputFormat],
              originalSize: input.size,
            },
            strength: requestedStrength,
          }
        : { kind: "no-improvement", candidateSize: blob.size, strength: requestedStrength };

      if (cacheRef.current.size >= COMPRESSOR_CACHE_LIMIT) {
        const oldestKey = cacheRef.current.keys().next().value;
        if (oldestKey !== undefined) cacheRef.current.delete(oldestKey);
      }
      cacheRef.current.set(cacheKey, nextOutcome);
      setOutcome(nextOutcome);
      setAppliedStrength(requestedStrength);
      setStatus(nextOutcome.kind === "success" ? "success" : "no-improvement");
      setStatusMessage(nextOutcome.kind === "success" ? "Compressed image ready." : "Already optimized — the original is smaller.");
      if (nextOutcome.kind === "success" && recordedSourceRef.current !== input) {
        recordedSourceRef.current = input;
        recordToolCompletion(COMPRESSOR_CONFIG.id);
      }
    } catch (error) {
      if (controller.signal.aborted || operation !== operationRef.current) return;
      setStatus("error");
      setStatusMessage("Compression could not be completed.");
      setSelectionError(error instanceof Error ? error.message : "Compression failed. Try a different image.");
    }
  }, []);

  const reset = useCallback(() => {
    operationRef.current += 1;
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    decodedRef.current?.dispose();
    decodedRef.current = null;
    sourceRef.current = null;
    formatRef.current = null;
    cacheRef.current.clear();
    recordedSourceRef.current = null;
    setSource(null);
    setFormat(null);
    setDimensions(null);
    setStrength(DEFAULT_COMPRESSION_STRENGTH);
    setAppliedStrength(null);
    setOutcome(null);
    setSelectionError("");
    setSelectionNotice("");
    setStatus("idle");
    setStatusMessage("Choose an image to begin.");
  }, []);

  const selectFiles = useCallback(async (files: readonly File[]) => {
    if (!files.length) return;
    const validation = await validateFileSelection(createToolFileItems(files.slice(0, 1)), COMPRESSOR_CONFIG);
    const nextFile = validation.files[0]?.file;
    if (!validation.valid || !nextFile) {
      setSelectionError(validation.issues.find((issue) => issue.severity === "error")?.message ?? "Choose a valid image.");
      return;
    }

    const nextFormat = imageFormatFromFile(nextFile);
    if (!nextFormat) {
      setSelectionError("Choose a valid JPEG, PNG, or WebP image.");
      return;
    }

    operationRef.current += 1;
    activeControllerRef.current?.abort();
    decodedRef.current?.dispose();
    decodedRef.current = null;
    cacheRef.current.clear();
    recordedSourceRef.current = null;
    sourceRef.current = nextFile;
    formatRef.current = nextFormat;
    setSource(nextFile);
    setFormat(nextFormat);
    setDimensions(null);
    skipDebounceRef.current = DEFAULT_COMPRESSION_STRENGTH;
    setStrength(DEFAULT_COMPRESSION_STRENGTH);
    setAppliedStrength(null);
    setOutcome(null);
    setSelectionError("");
    setSelectionNotice(validation.issues.find((issue) => issue.severity === "warning")?.message ?? "");
    setStatus("decoding");
    setStatusMessage("Reading image dimensions…");

    const operation = ++operationRef.current;
    const controller = new AbortController();
    activeControllerRef.current = controller;
    try {
      const decoded = await decodeImage(nextFile, controller.signal);
      if (controller.signal.aborted || operation !== operationRef.current) {
        decoded.dispose();
        return;
      }
      decodedRef.current = decoded;
      setDimensions({ width: decoded.width, height: decoded.height });
      await runCompression(DEFAULT_COMPRESSION_STRENGTH);
    } catch (error) {
      if (controller.signal.aborted || operation !== operationRef.current) return;
      setStatus("error");
      setStatusMessage("The image could not be read.");
      setSelectionError(error instanceof Error ? error.message : "Choose another image and try again.");
    }
  }, [runCompression]);

  useEffect(() => () => {
    operationRef.current += 1;
    activeControllerRef.current?.abort();
    decodedRef.current?.dispose();
    cacheRef.current.clear();
  }, []);

  useEffect(() => {
    const lossy = format === "jpeg" || format === "webp";
    if (!source || !lossy || !decodedRef.current || strength === appliedStrength) return;
    if (skipDebounceRef.current === strength) {
      skipDebounceRef.current = null;
      return;
    }
    const timer = window.setTimeout(() => void runCompression(strength), 300);
    return () => window.clearTimeout(timer);
  }, [appliedStrength, format, runCompression, source, strength]);

  const chooseStrength = (nextStrength: number) => {
    operationRef.current += 1;
    activeControllerRef.current?.abort();
    setStrength(nextStrength);
    setStatus("updating");
    setStatusMessage("Updating preview…");
  };

  const applyPreset = (nextStrength: number) => {
    operationRef.current += 1;
    activeControllerRef.current?.abort();
    skipDebounceRef.current = nextStrength;
    setStrength(nextStrength);
    setStatus("updating");
    setStatusMessage("Updating preview…");
    void runCompression(nextStrength);
  };

  const lossy = format === "jpeg" || format === "webp";
  const activePreset = compressionPresetForStrength(strength);
  const successfulOutput = outcome?.kind === "success" ? outcome.output : null;
  const outputSize = successfulOutput?.blob.size ?? source?.size ?? 0;
  const savedBytes = source ? sizeSavingsBytes(source.size, outputSize) : 0;
  const savedPercent = source ? sizeReductionPercent(source.size, outputSize) : 0;
  const busy = status === "decoding" || status === "compressing" || status === "updating";
  const dropPhase: FileWorkflowPhase = dragging ? "dragging" : selectionError ? "error" : "idle";

  return (
    <ToolPageFrame active="image-compressor">
      <article className={styles.compressorPanel} data-tool-id={COMPRESSOR_CONFIG.id}>
        <header className={styles.compressorHeader}>
          <span className={styles.compressorHeaderIcon}><ImageDown aria-hidden="true" size={20} /></span>
          <span>
            <span className={styles.panelEyebrow}>Private, in-browser compression</span>
            <h1 className="font-heading">Image Compressor</h1>
            <p>Compress JPEG, PNG, and WebP files while preserving their format and dimensions.</p>
          </span>
          <span className={styles.localPill}><LockKeyhole aria-hidden="true" size={13} /> Local</span>
        </header>

        <ol className={styles.compressorSteps} aria-label="Compression workflow">
          <li className={source ? styles.stageComplete : styles.stageActive}><span>1</span><strong>Source</strong></li>
          <li className={source && !successfulOutput ? styles.stageActive : successfulOutput ? styles.stageComplete : ""}><span>2</span><strong>Controls</strong></li>
          <li className={status === "success" || status === "no-improvement" ? styles.stageActive : ""}><span>3</span><strong>Result</strong></li>
        </ol>

        <section className={styles.compressorStage} aria-labelledby="compressor-source-title">
          <div className={styles.stageHeading}>
            <span><small>Stage 1</small><h2 id="compressor-source-title">Source image</h2></span>
            {source ? <button className={styles.neutralButton} disabled={busy} onClick={reset} type="button"><RotateCcw aria-hidden="true" size={15} /> Choose another image</button> : null}
          </div>
          {source ? (
            <SourcePreview dimensions={dimensions} error={selectionError || null} file={source} />
          ) : (
            <FileDropzone
              config={COMPRESSOR_CONFIG}
              onDraggingChange={setDragging}
              onFiles={selectFiles}
              phase={dropPhase}
            />
          )}
          {selectionError ? <p className={styles.compressorError} role="alert">{selectionError}</p> : null}
          {selectionNotice ? <p className={styles.compressorNotice}>{selectionNotice}</p> : null}
        </section>

        <section className={`${styles.compressorStage} ${!source ? styles.stageDisabled : ""}`} aria-labelledby="compressor-controls-title">
          <div className={styles.stageHeading}>
            <span><small>Stage 2</small><h2 id="compressor-controls-title">Compression controls</h2></span>
            {lossy ? <output aria-live="polite" className={styles.strengthOutput}>{strength}<small>/ 80 strength</small></output> : null}
          </div>
          {!source ? <p className={styles.stagePlaceholder}>Choose an image to reveal format-aware controls.</p> : null}
          {source && format === "png" ? (
            <p className={styles.pngGuidance}><Info aria-hidden="true" size={17} /><span><strong>Lossless PNG optimization</strong>PNG files are re-encoded conservatively without a quality slider. If the browser cannot make the file smaller, the original is kept.</span></p>
          ) : null}
          {source && lossy ? (
            <>
              <div className={styles.compressorPresets} aria-label="Compression presets">
                {COMPRESSION_PRESETS.map((preset) => (
                  <button
                    aria-pressed={activePreset?.id === preset.id}
                    disabled={status === "decoding"}
                    key={preset.id}
                    onClick={() => applyPreset(preset.strength)}
                    type="button"
                  >
                    <strong>{preset.label}</strong>
                    <small>{preset.recommended ? "Recommended" : preset.id === "high-quality" ? "Lighter compression" : "More compression"}</small>
                  </button>
                ))}
              </div>
              <label className={styles.compressorRange}>
                <span><strong>Compression strength</strong><small>Higher strength usually creates a smaller file.</small></span>
                <input
                  aria-label="Compression strength"
                  disabled={status === "decoding"}
                  max="80"
                  min="10"
                  onChange={(event) => chooseStrength(Number(event.target.value))}
                  step="1"
                  type="range"
                  value={strength}
                />
                <span className={styles.rangeEnds}><small>Higher quality</small><small>Smaller file</small></span>
              </label>
            </>
          ) : null}
        </section>

        <section className={`${styles.compressorStage} ${!source ? styles.stageDisabled : ""}`} aria-labelledby="compressor-result-title">
          <div className={styles.stageHeading}>
            <span><small>Stage 3</small><h2 id="compressor-result-title">Result</h2></span>
            <span className={`${styles.resultStatus} ${status === "success" ? styles.resultStatusSuccess : ""}`} aria-live="polite">
              {busy ? <span className={styles.statusSpinner} aria-hidden="true" /> : status === "success" ? <CheckCircle2 aria-hidden="true" size={15} /> : null}
              {statusMessage}
            </span>
          </div>

          {!source ? <p className={styles.stagePlaceholder}>Your before-and-after preview will appear here automatically.</p> : null}
          {source && dimensions ? (
            <div className={styles.comparisonGrid}>
              <figure>
                <figcaption><span>Before</span><strong>{formatBytes(source.size)}</strong></figcaption>
                <div className={styles.comparisonImage}><BlobImage alt="Original image preview" blob={source} /></div>
              </figure>
              <figure>
                <figcaption><span>{successfulOutput ? "After" : status === "no-improvement" ? "Original kept" : "Preview"}</span><strong>{successfulOutput ? formatBytes(successfulOutput.blob.size) : status === "no-improvement" ? formatBytes(source.size) : "Processing…"}</strong></figcaption>
                <div className={styles.comparisonImage}>
                  {successfulOutput ? <BlobImage alt="Compressed image preview" blob={successfulOutput.blob} /> : status === "no-improvement" ? <BlobImage alt="Original image retained" blob={source} /> : <span className={styles.previewPending}>{busy ? "Encoding from the original…" : "Waiting for a result"}</span>}
                </div>
              </figure>
            </div>
          ) : null}

          {source && dimensions && (status === "success" || status === "no-improvement") ? (
            <>
              {status === "no-improvement" ? (
                <div className={styles.noImprovement}>
                  <BadgeCheck aria-hidden="true" size={19} />
                  <span><strong>Already optimized</strong><small>The candidate was {formatBytes(outcome?.kind === "no-improvement" ? outcome.candidateSize : source.size)} and was not smaller than the original, so no download was created.</small></span>
                </div>
              ) : null}
              <dl className={styles.compressorMetrics}>
                <div><dt>Original size</dt><dd>{formatBytes(source.size)}</dd></div>
                <div><dt>Compressed size</dt><dd>{formatBytes(outputSize)}</dd></div>
                <div><dt>Bytes saved</dt><dd>{formatBytes(savedBytes)}</dd></div>
                <div><dt>Saved</dt><dd>{savedPercent}%</dd></div>
                <div><dt>Format</dt><dd>{format ? compressionFormatLabel(format) : "—"}</dd></div>
                <div><dt>Dimensions</dt><dd>{formatDimensions(dimensions)}</dd></div>
                {lossy ? <div><dt>Strength</dt><dd>{appliedStrength} {compressionPresetForStrength(appliedStrength ?? strength)?.label ? `· ${compressionPresetForStrength(appliedStrength ?? strength)?.label}` : "· Custom"}</dd></div> : null}
              </dl>
              {successfulOutput ? (
                <div className={styles.compressorDownload}>
                  <span><strong>{successfulOutput.fileName}</strong><small>The original file remains unchanged.</small></span>
                  <FileDownloadButton label="Download compressed image" output={successfulOutput} primary />
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </article>
    </ToolPageFrame>
  );
}

function ResizerTool() {

const [width, setWidth] = useState(1200);

const [height, setHeight] = useState(800);

const [lockAspect, setLockAspect] = useState(true);

const [formatChoice, setFormatChoice] = useState<"original" | ImageFormat>("original");

const [quality, setQuality] = useState(0.88);

const workflow = useFileWorkflow(RESIZER_CONFIG, resizeImage, {

width,

height,

format: formatChoice,

quality,

background: "#ffffff",

});

const file = workflow.state.files[0]?.file;

const metadata = useImageMetadata(file);

const initializedFileRef = useRef<File | null>(null);

useCompletionHistory(RESIZER_CONFIG.id, workflow.state.result);

useEffect(() => {

if (!file || !metadata.dimensions || initializedFileRef.current === file) return;

initializedFileRef.current = file;

setWidth(metadata.dimensions.width);

setHeight(metadata.dimensions.height);

setFormatChoice("original");

}, [file, metadata.dimensions]);

const updateWidth = (next: number) => {

setWidth(next);

if (lockAspect && metadata.dimensions && next > 0) setHeight(calculateAspectDimensions(metadata.dimensions, { width: next }, true).height);

};

const updateHeight = (next: number) => {

setHeight(next);

if (lockAspect && metadata.dimensions && next > 0) setWidth(calculateAspectDimensions(metadata.dimensions, { height: next }, true).width);

};

const applyScale = (scale: number) => {

if (!metadata.dimensions) return;

setWidth(Math.max(1, Math.round(metadata.dimensions.width * scale)));

setHeight(Math.max(1, Math.round(metadata.dimensions.height * scale)));

};

const outputFormat = formatChoice === "original" ? (file ? imageFormatFromFile(file) : null) : formatChoice;

const isUpscaling = !!metadata.dimensions && (width > metadata.dimensions.width || height > metadata.dimensions.height);

return (

<ToolPageFrame active="image-resizer">

<FileToolView

actions={workflow.actions}

config={RESIZER_CONFIG}

optionsPanel={file ? <>

<SourcePreview dimensions={metadata.dimensions} error={metadata.error} file={file} />

<OptionsSection icon={<Maximize2 aria-hidden="true" size={16} />} title="Resize settings">

<div className={styles.dimensionGrid}>

<label><span>Width (px)</span><input max="12000" min="1" onChange={(event) => updateWidth(Number(event.target.value))} type="number" value={width} /></label>

<button aria-label={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"} aria-pressed={lockAspect} className={styles.lockButton} onClick={() => setLockAspect((current) => !current)} type="button"><Link2 aria-hidden="true" size={16} /></button>

<label><span>Height (px)</span><input max="12000" min="1" onChange={(event) => updateHeight(Number(event.target.value))} type="number" value={height} /></label>

</div>

<div className={styles.presetButtons}>

<button onClick={() => applyScale(.25)} type="button">25%</button>

<button onClick={() => applyScale(.5)} type="button">50%</button>

<button onClick={() => applyScale(.75)} type="button">75%</button>

<button onClick={() => applyScale(1)} type="button">Original</button>

</div>

{isUpscaling ? <p className={styles.warningLine}><Info aria-hidden="true" size={15} /> Upscaling adds pixels but cannot restore missing detail.</p> : null}

<div className={styles.fieldRow}>

<label><span>Output format</span><select onChange={(event) => setFormatChoice(event.target.value as "original" | ImageFormat)} value={formatChoice}><option value="original">Keep original</option><option value="jpeg">JPG</option><option value="png">PNG</option></select></label>

</div>

{outputFormat === "jpeg" ? <QualityControl onChange={setQuality} value={quality} /> : null}

</OptionsSection>

</> : undefined}

resultInfoSlot="JPEG output uses a white background if the source contains transparent pixels."

resultPreviewSlot={<ResultImage alt="Resized result preview" result={workflow.state.result} />}

state={workflow.state}

/>

</ToolPageFrame>

);

}

function ConverterTool({ direction }: { direction: "jpg-to-png" | "png-to-jpg" }) {

const isPngOutput = direction === "jpg-to-png";

const config = isPngOutput ? JPG_TO_PNG_CONFIG : PNG_TO_JPG_CONFIG;

const [quality, setQuality] = useState(0.9);

const [background, setBackground] = useState("#ffffff");

const options = useMemo<ConvertOptions>(() => ({ format: isPngOutput ? "png" : "jpeg", quality, background }), [background, isPngOutput, quality]);

const workflow = useFileWorkflow(config, convertImage, options);

const file = workflow.state.files[0]?.file;

const metadata = useImageMetadata(file);

useCompletionHistory(config.id, workflow.state.result);

return (

<ToolPageFrame active={direction}>

<ConverterTabs active={direction} />

<FileToolView

actions={workflow.actions}

config={config}

optionsPanel={file ? <>

<SourcePreview dimensions={metadata.dimensions} error={metadata.error} file={file} />

<OptionsSection icon={<ArrowLeftRight aria-hidden="true" size={16} />} title={`Convert to ${isPngOutput ? "PNG" : "JPG"}`}>

{isPngOutput ? (

<p className={styles.infoLine}><Info aria-hidden="true" size={15} /> PNG supports transparency, but converting a JPG cannot recreate transparency that is not in the source.</p>

) : (

<>

<QualityControl label="JPG quality" onChange={setQuality} value={quality} />

<label className={styles.colorField}><span>Transparent pixel background</span><span><input aria-label="JPG background color" onChange={(event) => setBackground(event.target.value)} type="color" value={background} /><code>{background.toUpperCase()}</code></span></label>

</>

)}

<div className={styles.formatSummary}><span>{isPngOutput ? "JPG" : "PNG"}</span><ArrowLeftRight aria-hidden="true" size={18} /><strong>{isPngOutput ? "PNG" : "JPG"}</strong></div>

</OptionsSection>

</> : undefined}

resultInfoSlot={isPngOutput ? "Format conversion does not add transparency or increase source resolution." : "Transparent PNG pixels are flattened onto the selected solid background."}

resultPreviewSlot={<ResultImage alt="Converted image preview" result={workflow.state.result} />}

state={workflow.state}

/>

</ToolPageFrame>

);

}

const PASSPORT_PRESETS: Record<Exclude<PassportPresetId, "custom">, PassportSize> = {

"35x45": { width: 35, height: 45, unit: "mm" },

"2x2": { width: 2, height: 2, unit: "in" },

};

function PassportCropPreview({ file, output, crop, onCropChange }: { file: File; output: ImageDimensions; crop: ImageCrop; onCropChange: (crop: ImageCrop) => void }) {

const canvasRef = useRef<HTMLCanvasElement>(null);

const decodedRef = useRef<DecodedImage | null>(null);

const [ready, setReady] = useState(0);

const dragRef = useRef<{ x: number; y: number; crop: ImageCrop } | null>(null);

useEffect(() => {

let active = true;

void decodeImage(file).then((decoded) => {

if (!active) {

decoded.dispose();

return;

}

decodedRef.current?.dispose();

decodedRef.current = decoded;

setReady((value) => value + 1);

}).catch(() => undefined);

return () => {

active = false;

decodedRef.current?.dispose();

decodedRef.current = null;

};

}, [file]);

useEffect(() => {

const canvas = canvasRef.current;

const decoded = decodedRef.current;

if (canvas && decoded) paintCropPreview(canvas, decoded, output.width / output.height, crop);

}, [crop, output.height, output.width, ready]);

const startDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {

event.currentTarget.setPointerCapture(event.pointerId);

dragRef.current = { x: event.clientX, y: event.clientY, crop };

};

const moveDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {

const start = dragRef.current;

const canvas = canvasRef.current;

if (!start || !canvas) return;

const rect = canvas.getBoundingClientRect();

onCropChange({

...crop,

offsetX: clamp(start.crop.offsetX - ((event.clientX - start.x) * 2) / rect.width, -1, 1),

offsetY: clamp(start.crop.offsetY - ((event.clientY - start.y) * 2) / rect.height, -1, 1),

});

};

const stopDrag = () => { dragRef.current = null; };

return (

<div className={styles.cropPreview}>

<canvas
        aria-label="Document photo crop preview. Drag to reposition."
        onPointerCancel={stopDrag}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        ref={canvasRef}
        role="img"
      />

<span aria-hidden="true" className={styles.faceGuide} />

<span className={styles.dragHint}>Drag photo to reposition</span>

</div>

);

}

function PassportTool() {

const [preset, setPreset] = useState<PassportPresetId>("35x45");

const [customUnit, setCustomUnit] = useState<PhysicalUnit>("mm");

const [customWidth, setCustomWidth] = useState(35);

const [customHeight, setCustomHeight] = useState(45);

const [dpi, setDpi] = useState(300);

const [crop, setCrop] = useState<ImageCrop>({ zoom: 1, offsetX: 0, offsetY: 0 });

const physicalSize = useMemo<PassportSize>(() => preset === "custom"

? { width: Math.max(.1, customWidth || .1), height: Math.max(.1, customHeight || .1), unit: customUnit }

: PASSPORT_PRESETS[preset], [customHeight, customUnit, customWidth, preset]);

const output = useMemo(() => passportSizeToPixels(physicalSize, dpi), [dpi, physicalSize]);

const workflow = useFileWorkflow(PASSPORT_CONFIG, createPassportPhoto, { output, crop });

const file = workflow.state.files[0]?.file;

const metadata = useImageMetadata(file);

const activeFileRef = useRef<File | null>(null);

useCompletionHistory(PASSPORT_CONFIG.id, workflow.state.result);

useEffect(() => {

if (!file || activeFileRef.current === file) return;

activeFileRef.current = file;

setCrop({ zoom: 1, offsetX: 0, offsetY: 0 });

}, [file]);

return (

<ToolPageFrame active="passport-photo-maker">

<FileToolView

actions={workflow.actions}

config={PASSPORT_CONFIG}

optionsPanel={file ? <>

<SourcePreview dimensions={metadata.dimensions} error={metadata.error} file={file} />

<div className={styles.passportEditor}>

<OptionsSection icon={<BadgeCheck aria-hidden="true" size={16} />} title="Photo size">

<div className={styles.presetButtons}>

<button aria-pressed={preset === "35x45"} onClick={() => setPreset("35x45")} type="button">35 × 45 mm</button>

<button aria-pressed={preset === "2x2"} onClick={() => setPreset("2x2")} type="button">2 × 2 in</button>

<button aria-pressed={preset === "custom"} onClick={() => setPreset("custom")} type="button">Custom</button>

</div>

{preset === "custom" ? <div className={styles.customSizeGrid}>

<label><span>Width</span><input min="1" onChange={(event) => setCustomWidth(Number(event.target.value))} step="0.1" type="number" value={customWidth} /></label>

<label><span>Height</span><input min="1" onChange={(event) => setCustomHeight(Number(event.target.value))} step="0.1" type="number" value={customHeight} /></label>

<label><span>Unit</span><select onChange={(event) => setCustomUnit(event.target.value as PhysicalUnit)} value={customUnit}><option value="mm">mm</option><option value="in">inches</option></select></label>

</div> : null}

<div className={styles.fieldRow}><label><span>Pixel calculation</span><select onChange={(event) => setDpi(Number(event.target.value))} value={dpi}><option value="150">150 DPI</option><option value="300">300 DPI</option><option value="600">600 DPI</option></select></label></div>

<p className={styles.outputMath}>{physicalSize.width} × {physicalSize.height} {physicalSize.unit} at {dpi} DPI → <strong>{formatDimensions(output)}</strong></p>

</OptionsSection>

<OptionsSection icon={<Crop aria-hidden="true" size={16} />} title="Crop & position">

<PassportCropPreview crop={crop} file={file} onCropChange={setCrop} output={output} />

<label className={styles.rangeField}><span><strong>Zoom</strong><output>{Math.round(crop.zoom * 100)}%</output></span><input aria-label="Photo zoom" max="4" min="1" onChange={(event) => setCrop((current) => ({ ...current, zoom: Number(event.target.value) }))} step="0.01" type="range" value={crop.zoom} /></label>

<button className={styles.resetCrop} onClick={() => setCrop({ zoom: 1, offsetX: 0, offsetY: 0 })} type="button"><RotateCcw aria-hidden="true" size={14} /> Reset crop</button>

</OptionsSection>

</div>

<p className={styles.requirementsNote}><Info aria-hidden="true" size={16} /><span><strong>Verify the official requirements for your application.</strong> These are generic size presets, not country-specific compliance guarantees. The JPG contains the calculated pixels; it does not claim embedded DPI metadata, biometric approval, background removal, or official acceptance.</span></p>

</> : undefined}

resultInfoSlot="Verify dimensions, background, head position, expression, recency, and print requirements with the issuing authority before submitting."

resultPreviewSlot={<ResultImage alt="Document photo result preview" result={workflow.state.result} />}

state={workflow.state}

/>

</ToolPageFrame>

);

}

export function ImageToolWorkspace({ toolId }: { toolId: ImageToolId }) {

switch (toolId) {

case "image-compressor": return <CompressorTool />;

case "image-resizer": return <ResizerTool />;

case "jpg-to-png": return <ConverterTool direction="jpg-to-png" />;

case "png-to-jpg": return <ConverterTool direction="png-to-jpg" />;

case "passport-photo-maker": return <PassportTool />;

}

}
