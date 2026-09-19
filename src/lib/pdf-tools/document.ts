import { PDFDocument } from "@cantoo/pdf-lib";

import type { ImagePdfOptions } from "../../types/pdf-tool";
import { resolveImagePdfPageLayout } from "./core.ts";

export async function rewritePdf(bytes: Uint8Array) {
  const document = await PDFDocument.load(bytes, { ignoreEncryption: false });
  document.setTitle("");
  document.setAuthor("");
  document.setSubject("");
  document.setKeywords([]);
  document.setProducer("ToolsApp local PDF processor");
  document.setCreator("ToolsApp");
  return {
    bytes: await document.save({ useObjectStreams: true }),
    pageCount: document.getPageCount(),
  };
}

export async function mergePdfBytes(inputs: readonly Uint8Array[]) {
  const output = await PDFDocument.create();
  const pagesPerDocument: number[] = [];
  for (const input of inputs) {
    const source = await PDFDocument.load(input, { ignoreEncryption: false });
    const sourcePages = source.getPages();
    pagesPerDocument.push(sourcePages.length);
    const copied = await output.copyPages(source, sourcePages.map((_, index) => index));
    copied.forEach((page) => output.addPage(page));
  }
  return {
    bytes: await output.save({ useObjectStreams: true }),
    pageCount: output.getPageCount(),
    pagesPerDocument,
  };
}

export type EncodedImageForPdf = {
  bytes: Uint8Array;
  width: number;
  height: number;
};

export async function imagesToPdfBytes(
  images: readonly EncodedImageForPdf[],
  options: ImagePdfOptions,
) {
  const document = await PDFDocument.create();
  const layouts = [];
  for (const image of images) {
    const layout = resolveImagePdfPageLayout(image.width, image.height, options);
    const embedded = await document.embedJpg(image.bytes);
    const page = document.addPage([layout.pageWidth, layout.pageHeight]);
    page.drawImage(embedded, {
      x: layout.imageX,
      y: layout.imageY,
      width: layout.imageWidth,
      height: layout.imageHeight,
    });
    layouts.push(layout);
  }
  return {
    bytes: await document.save({ useObjectStreams: true }),
    pageCount: document.getPageCount(),
    layouts,
  };
}
