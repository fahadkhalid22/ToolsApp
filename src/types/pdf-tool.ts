export type PdfCompressionMode = "preserve" | "balanced" | "strong";

export type PdfPageSize = "auto" | "a4" | "letter";
export type PdfOrientation = "auto" | "portrait" | "landscape";
export type PdfMargin = "none" | "small" | "standard";

export type ImagePdfOptions = {
  pageSize: PdfPageSize;
  orientation: PdfOrientation;
  margin: PdfMargin;
};

export type PdfPageLayout = {
  pageWidth: number;
  pageHeight: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
  margin: number;
};

export type PdfTextItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEol?: boolean;
};

export type ExtractedPdfPage = {
  pageNumber: number;
  lines: readonly string[];
};
