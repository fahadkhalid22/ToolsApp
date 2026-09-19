import type {
  ImagePdfOptions,
  PdfPageLayout,
  PdfTextItem,
} from "../../types/pdf-tool";

export const MAX_PDF_FILE_BYTES = 75 * 1024 * 1024;
export const MAX_PDF_BATCH_BYTES = 150 * 1024 * 1024;
export const MAX_PDF_PAGES = 250;
export const MAX_IMAGE_PDF_FILES = 40;

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

const MARGINS = {
  none: 0,
  small: 18,
  standard: 36,
} as const;

export function hasPdfHeader(bytes: Uint8Array) {
  const limit = Math.min(bytes.length, 1024);
  for (let index = 0; index <= limit - 5; index += 1) {
    if (
      bytes[index] === 0x25 &&
      bytes[index + 1] === 0x50 &&
      bytes[index + 2] === 0x44 &&
      bytes[index + 3] === 0x46 &&
      bytes[index + 4] === 0x2d
    ) return true;
  }
  return false;
}

export async function fileHasPdfHeader(file: Blob) {
  return hasPdfHeader(new Uint8Array(await file.slice(0, 1024).arrayBuffer()));
}

export function buildPdfFileName(inputName: string, suffix: string, extension = "pdf") {
  const leaf = inputName.split(/[\\/]/).pop() ?? "document";
  const base = leaf.replace(/\.[^.]+$/, "").trim() || "document";
  const safeBase = base
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .slice(0, 120) || "document";
  const safeSuffix = suffix.replace(/[^a-z0-9-_]/gi, "").replace(/^-+/, "");
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "pdf";
  return `${safeBase}${safeSuffix ? `-${safeSuffix}` : ""}.${safeExtension}`;
}

export function compressionChangePercent(originalSize: number, outputSize: number) {
  if (!Number.isFinite(originalSize) || originalSize <= 0) return 0;
  return Math.round(((originalSize - outputSize) / originalSize) * 100);
}

function orientPage(
  width: number,
  height: number,
  orientation: ImagePdfOptions["orientation"],
  imageWidth: number,
  imageHeight: number,
) {
  const resolved = orientation === "auto"
    ? (imageWidth >= imageHeight ? "landscape" : "portrait")
    : orientation;
  return resolved === "landscape"
    ? { width: Math.max(width, height), height: Math.min(width, height) }
    : { width: Math.min(width, height), height: Math.max(width, height) };
}

export function resolveImagePdfPageLayout(
  imageWidth: number,
  imageHeight: number,
  options: ImagePdfOptions,
): PdfPageLayout {
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
    throw new Error("Image dimensions must be positive numbers.");
  }

  const margin = MARGINS[options.margin];
  const sourcePage = options.pageSize === "auto"
    ? {
        // Browser image pixels are interpreted at the CSS reference resolution of 96 PPI.
        width: Math.max(72, Math.min(14_400, imageWidth * 0.75)),
        height: Math.max(72, Math.min(14_400, imageHeight * 0.75)),
      }
    : PAGE_SIZES[options.pageSize];
  const page = orientPage(sourcePage.width, sourcePage.height, options.orientation, imageWidth, imageHeight);
  const availableWidth = Math.max(1, page.width - margin * 2);
  const availableHeight = Math.max(1, page.height - margin * 2);
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
  const fittedWidth = imageWidth * scale;
  const fittedHeight = imageHeight * scale;

  return {
    pageWidth: page.width,
    pageHeight: page.height,
    imageX: (page.width - fittedWidth) / 2,
    imageY: (page.height - fittedHeight) / 2,
    imageWidth: fittedWidth,
    imageHeight: fittedHeight,
    margin,
  };
}

export function groupPdfTextItems(items: readonly PdfTextItem[]) {
  const visible = items
    .filter((item) => item.text.trim())
    .map((item) => ({ ...item, height: Math.max(1, Math.abs(item.height)) }))
    .sort((left, right) => {
      const tolerance = Math.max(2, Math.min(left.height, right.height) * 0.45);
      return Math.abs(left.y - right.y) <= tolerance ? left.x - right.x : right.y - left.y;
    });

  const lines: Array<{ y: number; height: number; items: PdfTextItem[] }> = [];
  for (const item of visible) {
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= Math.max(2, candidate.height * 0.45));
    if (line) {
      line.items.push(item);
      line.y = (line.y + item.y) / 2;
      line.height = Math.max(line.height, item.height);
    } else {
      lines.push({ y: item.y, height: item.height, items: [item] });
    }
  }

  return lines
    .sort((left, right) => right.y - left.y)
    .map((line) => {
      const ordered = line.items.sort((left, right) => left.x - right.x);
      let output = "";
      let previous: PdfTextItem | undefined;
      for (const item of ordered) {
        const gap = previous ? item.x - (previous.x + previous.width) : 0;
        if (previous && gap > Math.max(1.5, previous.height * 0.12) && !output.endsWith(" ")) output += " ";
        output += item.text;
        previous = item;
      }
      return output.replace(/\s+/g, " ").trim();
    })
    .filter(Boolean);
}
