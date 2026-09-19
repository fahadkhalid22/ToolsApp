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

export const DEFAULT_QR_OPTIONS: QrOptions = {
  errorCorrectionLevel: "M",
  margin: 4,
  width: 512,
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
};

export async function generateQrPng(text: string, options?: QrOptions): Promise<string> {
  if (!text) throw new Error("Text is required for QR generation.");
  return QRCode.toDataURL(text, { ...DEFAULT_QR_OPTIONS, ...options });
}

export async function generateQrSvg(text: string, options?: QrOptions): Promise<string> {
  if (!text) throw new Error("Text is required for QR generation.");
  return QRCode.toString(text, { ...DEFAULT_QR_OPTIONS, ...options, type: "svg" });
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
