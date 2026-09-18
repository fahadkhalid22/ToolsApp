import type {
  ImageCrop,
  ImageDimensions,
  ImageFormat,
  PassportSize,
  PhysicalUnit,
  SourceCrop,
} from "../../types/image-tool";

export const IMAGE_MIME_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
};

export const IMAGE_EXTENSION_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: "jpg",
  png: "png",
};

export const MAX_CANVAS_DIMENSION = 12_000;
export const MAX_CANVAS_PIXELS = 40_000_000;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function imageFormatFromFile(file: Pick<File, "name" | "type">): ImageFormat | null {
  const mime = file.type.toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpeg";
  if (mime === "image/png") return "png";
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") return "jpeg";
  if (extension === "png") return "png";
  return null;
}

export function buildImageFileName(
  inputName: string,
  suffix: string,
  format: ImageFormat,
) {
  const leaf = inputName.split(/[\\/]/).pop() ?? "image";
  const base = leaf.replace(/\.[^.]+$/, "").trim() || "image";
  const safeBase = base
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .slice(0, 120) || "image";
  const safeSuffix = suffix.replace(/[^a-z0-9-_]/gi, "").replace(/^-+/, "");
  return `${safeBase}${safeSuffix ? `-${safeSuffix}` : ""}.${IMAGE_EXTENSION_BY_FORMAT[format]}`;
}

export function calculateAspectDimensions(
  source: ImageDimensions,
  requested: Partial<ImageDimensions>,
  lockAspectRatio = true,
): ImageDimensions {
  if (!Number.isFinite(source.width) || !Number.isFinite(source.height) || source.width <= 0 || source.height <= 0) {
    throw new Error("Source dimensions must be positive numbers.");
  }

  const requestedWidth = requested.width && requested.width > 0 ? Math.round(requested.width) : undefined;
  const requestedHeight = requested.height && requested.height > 0 ? Math.round(requested.height) : undefined;
  if (!requestedWidth && !requestedHeight) return { width: Math.round(source.width), height: Math.round(source.height) };

  if (!lockAspectRatio) {
    return {
      width: requestedWidth ?? Math.round(source.width),
      height: requestedHeight ?? Math.round(source.height),
    };
  }

  const ratio = source.width / source.height;
  if (requestedWidth) {
    return { width: requestedWidth, height: Math.max(1, Math.round(requestedWidth / ratio)) };
  }
  const height = requestedHeight ?? Math.round(source.height);
  return { width: Math.max(1, Math.round(height * ratio)), height };
}

export function physicalToPixels(value: number, unit: PhysicalUnit, dpi: number) {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(dpi) || dpi <= 0) {
    throw new Error("Physical size and DPI must be positive numbers.");
  }
  return Math.max(1, Math.round((unit === "mm" ? value / 25.4 : value) * dpi));
}

export function passportSizeToPixels(size: PassportSize, dpi: number): ImageDimensions {
  return {
    width: physicalToPixels(size.width, size.unit, dpi),
    height: physicalToPixels(size.height, size.unit, dpi),
  };
}

export function validateCanvasDimensions(dimensions: ImageDimensions) {
  const width = Math.round(dimensions.width);
  const height = Math.round(dimensions.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error("Output width and height must be at least 1 pixel.");
  }
  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
    throw new Error(`Output dimensions cannot exceed ${MAX_CANVAS_DIMENSION.toLocaleString()} pixels per side.`);
  }
  if (width * height > MAX_CANVAS_PIXELS) {
    throw new Error("The requested output is too large for reliable in-browser processing.");
  }
  return { width, height };
}

export function calculateCoverCrop(
  source: ImageDimensions,
  output: ImageDimensions,
  crop: ImageCrop,
): SourceCrop {
  const safeSource = validateCanvasDimensions(source);
  const safeOutput = validateCanvasDimensions(output);
  const zoom = clamp(Number.isFinite(crop.zoom) ? crop.zoom : 1, 1, 4);
  const outputRatio = safeOutput.width / safeOutput.height;
  const sourceRatio = safeSource.width / safeSource.height;

  let coverWidth: number;
  let coverHeight: number;
  if (sourceRatio > outputRatio) {
    coverHeight = safeSource.height;
    coverWidth = coverHeight * outputRatio;
  } else {
    coverWidth = safeSource.width;
    coverHeight = coverWidth / outputRatio;
  }

  const sourceWidth = coverWidth / zoom;
  const sourceHeight = coverHeight / zoom;
  const maxShiftX = (safeSource.width - sourceWidth) / 2;
  const maxShiftY = (safeSource.height - sourceHeight) / 2;

  return {
    sourceX: clamp(
      (safeSource.width - sourceWidth) / 2 + clamp(crop.offsetX, -1, 1) * maxShiftX,
      0,
      safeSource.width - sourceWidth,
    ),
    sourceY: clamp(
      (safeSource.height - sourceHeight) / 2 + clamp(crop.offsetY, -1, 1) * maxShiftY,
      0,
      safeSource.height - sourceHeight,
    ),
    sourceWidth,
    sourceHeight,
  };
}

export function formatDimensions(dimensions: ImageDimensions) {
  return `${Math.round(dimensions.width).toLocaleString()} × ${Math.round(dimensions.height).toLocaleString()} px`;
}

export function sizeReductionPercent(originalSize: number, outputSize: number) {
  if (!Number.isFinite(originalSize) || originalSize <= 0) return 0;
  return Math.round(((originalSize - outputSize) / originalSize) * 100);
}
