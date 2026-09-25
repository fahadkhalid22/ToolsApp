"use client";

import { FileToolProcessingError } from "../file-tools/errors";
import type { ImageCrop, ImageDimensions, ImageFormat } from "../../types/image-tool";
import {
  IMAGE_MIME_BY_FORMAT,
  calculateCoverCrop,
  validateCanvasDimensions,
} from "./core";

export type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

function assertBrowserImageSupport() {
  if (typeof document === "undefined") {
    throw new FileToolProcessingError("Image processing needs a modern browser with Canvas support.", { kind: "capability", retryable: false });
  }
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Processing was cancelled.", "AbortError");
}

export async function decodeImage(file: File, signal?: AbortSignal): Promise<DecodedImage> {
  assertBrowserImageSupport();
  throwIfAborted(signal);

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      throwIfAborted(signal);
      if (!bitmap.width || !bitmap.height) throw new Error("Empty image dimensions");
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) throw error;
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    throwIfAborted(signal);
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("Empty image dimensions");
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) throw error;
    throw new FileToolProcessingError(
      "This image could not be decoded. Try a valid JPEG, PNG, or WebP file that is not corrupted.",
      { kind: "processing", retryable: false },
    );
  }
}

export function createImageCanvas(dimensions: ImageDimensions) {
  assertBrowserImageSupport();
  const { width, height } = validateCanvasDimensions(dimensions);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    throw new FileToolProcessingError("Canvas rendering is unavailable in this browser.", { kind: "capability", retryable: false });
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return { canvas, context };
}

export function drawResizedImage(
  decoded: DecodedImage,
  output: ImageDimensions,
  format: ImageFormat,
  background = "#ffffff",
) {
  const { canvas, context } = createImageCanvas(output);
  if (format === "jpeg") {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function drawCroppedImage(
  decoded: DecodedImage,
  output: ImageDimensions,
  crop: ImageCrop,
  format: ImageFormat,
  background = "#ffffff",
) {
  const { canvas, context } = createImageCanvas(output);
  if (format === "jpeg") {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const sourceCrop = calculateCoverCrop(
    { width: decoded.width, height: decoded.height },
    output,
    crop,
  );
  context.drawImage(
    decoded.source,
    sourceCrop.sourceX,
    sourceCrop.sourceY,
    sourceCrop.sourceWidth,
    sourceCrop.sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

function validateWebPCanvasSupported(blob: Blob) {
  return blob.type === "image/webp";
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new FileToolProcessingError("The browser could not encode the processed image.", { kind: "processing", retryable: true }));
          return;
        }

        if (format === "webp" && !validateWebPCanvasSupported(blob)) {
          reject(new FileToolProcessingError(
            "Your browser does not support WebP canvas encoding. JPEG or PNG compression is available instead.",
            { kind: "capability", retryable: false },
          ));
          return;
        }

        resolve(blob);
      },
      IMAGE_MIME_BY_FORMAT[format],
      format === "jpeg" || format === "webp" ? quality : undefined,
    );
  });
}

export function paintCropPreview(
  canvas: HTMLCanvasElement,
  decoded: DecodedImage,
  outputRatio: number,
  crop: ImageCrop,
) {
  const cssWidth = Math.max(240, Math.round(canvas.clientWidth || 360));
  const cssHeight = Math.max(180, Math.round(cssWidth / outputRatio));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssWidth * pixelRatio);
  canvas.height = Math.round(cssHeight * pixelRatio);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const sourceCrop = calculateCoverCrop(
    { width: decoded.width, height: decoded.height },
    { width: canvas.width, height: canvas.height },
    crop,
  );
  context.drawImage(
    decoded.source,
    sourceCrop.sourceX,
    sourceCrop.sourceY,
    sourceCrop.sourceWidth,
    sourceCrop.sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
}
