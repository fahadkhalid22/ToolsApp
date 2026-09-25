import type { ImageDimensions } from "../../types/image-tool";
import { calculateAspectDimensions, validateCanvasDimensions } from "./core.ts";

export type ResizeFormat = "jpeg" | "png";
export type ResizeFields = { width: string; height: string };
export const RESIZE_SCALES = [0.25, 0.5, 0.75, 1] as const;

export function resizeFormatFromHeader(bytes: Uint8Array): ResizeFormat | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  return png.every((byte, index) => bytes[index] === byte) ? "png" : null;
}

export function resizeDimensionError(value: string, label: string) {
  if (!value.trim()) return `Enter a ${label.toLowerCase()} in pixels.`;
  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) return `${label} must be a whole number of pixels.`;
  if (number < 1) return `${label} must be at least 1 px.`;
  if (!/^\d+$/.test(value)) return `${label} must be a whole number of pixels.`;
  return null;
}

export function parseResizeDimensions(fields: ResizeFields): ImageDimensions {
  const error = resizeDimensionError(fields.width, "Width") ?? resizeDimensionError(fields.height, "Height");
  if (error) throw new Error(error);
  return validateCanvasDimensions({ width: Number(fields.width), height: Number(fields.height) });
}

export function editResizeDimension(source: ImageDimensions, fields: ResizeFields, axis: keyof ResizeFields, value: string, locked: boolean): ResizeFields {
  const next = { ...fields, [axis]: value };
  if (!locked || resizeDimensionError(value, axis)) return next;
  const dimensions = calculateAspectDimensions(source, { [axis]: Number(value) }, true);
  return { width: String(dimensions.width), height: String(dimensions.height) };
}

export function scaleResizeDimensions(source: ImageDimensions, scale: number): ImageDimensions {
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("Choose a positive scale.");
  return validateCanvasDimensions({ width: Math.max(1, Math.round(source.width * scale)), height: Math.max(1, Math.round(source.height * scale)) });
}

export function resizeSettingsKey(dimensions: ImageDimensions, format: ResizeFormat, quality: number) {
  return `${dimensions.width}x${dimensions.height}:${format}:${format === "jpeg" ? quality : "lossless"}`;
}
