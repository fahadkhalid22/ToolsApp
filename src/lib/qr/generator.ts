import QRCode from "qrcode";

export type QrOptions = {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  margin?: number;
  scale?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
};

export const QR_EXPORT_SIZES = [256, 512, 1024] as const;
export const QR_ERROR_CORRECTION_LEVELS = ["L", "M", "Q", "H"] as const;
export const QR_MARGIN_MIN = 0;
export const QR_MARGIN_MAX = 8;

export type QrExportSize = (typeof QR_EXPORT_SIZES)[number];
export type QrErrorCorrectionLevel = (typeof QR_ERROR_CORRECTION_LEVELS)[number];

export type QrSettings = {
  width: QrExportSize;
  margin: number;
  errorCorrectionLevel: QrErrorCorrectionLevel;
};

export type QrDownloadFormat = "png" | "svg";

export const DEFAULT_QR_OPTIONS: QrOptions = {
  errorCorrectionLevel: "M",
  margin: 4,
  width: 512,
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
};

export const DEFAULT_QR_SETTINGS: Readonly<QrSettings> = {
  width: 512,
  margin: 4,
  errorCorrectionLevel: "M",
};

export function createDefaultQrSettings(): QrSettings {
  return { ...DEFAULT_QR_SETTINGS };
}

export function normalizeQrSettings(settings?: Partial<QrSettings>): QrSettings {
  const requestedWidth = settings?.width;
  const width = QR_EXPORT_SIZES.includes(requestedWidth as QrExportSize)
    ? requestedWidth as QrExportSize
    : DEFAULT_QR_SETTINGS.width;
  const requestedLevel = settings?.errorCorrectionLevel;
  const errorCorrectionLevel = QR_ERROR_CORRECTION_LEVELS.includes(requestedLevel as QrErrorCorrectionLevel)
    ? requestedLevel as QrErrorCorrectionLevel
    : DEFAULT_QR_SETTINGS.errorCorrectionLevel;
  const requestedMargin = Number.isFinite(settings?.margin) ? Math.round(settings?.margin ?? DEFAULT_QR_SETTINGS.margin) : DEFAULT_QR_SETTINGS.margin;
  const margin = Math.min(QR_MARGIN_MAX, Math.max(QR_MARGIN_MIN, requestedMargin));

  return { width, margin, errorCorrectionLevel };
}

export function resolveQrOptions(options?: QrOptions): QrOptions {
  return {
    ...DEFAULT_QR_OPTIONS,
    ...options,
    color: {
      ...DEFAULT_QR_OPTIONS.color,
      ...options?.color,
    },
  };
}

export async function generateQrPng(text: string, options?: QrOptions): Promise<string> {
  if (!text) throw new Error("Text is required for QR generation.");
  return QRCode.toDataURL(text, resolveQrOptions(options));
}

export async function generateQrSvg(text: string, options?: QrOptions): Promise<string> {
  if (!text) throw new Error("Text is required for QR generation.");
  return QRCode.toString(text, { ...resolveQrOptions(options), type: "svg" });
}

export function getQrContentType(text: string): "URL" | "Text" {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? "URL" : "Text";
  } catch {
    return "Text";
  }
}

export function createQrDownloadDescriptor(
  format: QrDownloadFormat,
  assets: { png: string; svg: string },
) {
  if (format === "png") {
    return {
      href: assets.png,
      fileName: "toolsapp-qr-code.png",
      mimeType: "image/png",
    } as const;
  }

  return {
    href: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(assets.svg)}`,
    fileName: "toolsapp-qr-code.svg",
    mimeType: "image/svg+xml",
  } as const;
}

export function createQrDownloadOutput(
  format: QrDownloadFormat,
  assets: { png: string; svg: string },
) {
  const descriptor = createQrDownloadDescriptor(format, assets);
  if (format === "svg") {
    return {
      blob: new Blob([assets.svg], { type: descriptor.mimeType }),
      fileName: descriptor.fileName,
    };
  }

  const prefix = "data:image/png;base64,";
  if (!assets.png.startsWith(prefix)) throw new Error("The PNG asset is invalid.");
  const bytes = Uint8Array.from(atob(assets.png.slice(prefix.length)), (character) => character.charCodeAt(0));
  return {
    blob: new Blob([bytes], { type: descriptor.mimeType }),
    fileName: descriptor.fileName,
  };
}

export function validateQrText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim() === "") {
    return { valid: false, error: "Please enter some text or a URL." };
  }
  if (text.length > 2000) {
    return { valid: false, error: "Content is too long (max 2000 characters)." };
  }
  return { valid: true };
}
