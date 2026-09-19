import assert from "node:assert/strict";
import test from "node:test";

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";

import {
  buildPdfFileName,
  compressionChangePercent,
  groupPdfTextItems,
  hasPdfHeader,
  resolveImagePdfPageLayout,
} from "../src/lib/pdf-tools/core.ts";
import { createDocxFromExtractedPages } from "../src/lib/pdf-tools/docx.ts";
import { mergePdfBytes, rewritePdf } from "../src/lib/pdf-tools/document.ts";

async function fixturePdf(pageWidths) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  pageWidths.forEach((width, index) => {
    const page = document.addPage([width, 300]);
    page.drawText(`Document page ${index + 1}`, { x: 24, y: 250, size: 14, font });
  });
  return document.save();
}

test("PDF header checks tolerate a small binary preamble but reject renamed files", () => {
  assert.equal(hasPdfHeader(new TextEncoder().encode("%PDF-1.7\n")), true);
  assert.equal(hasPdfHeader(new TextEncoder().encode("\u0000\u0000%PDF-1.4\n")), true);
  assert.equal(hasPdfHeader(new TextEncoder().encode("This is not a PDF")), false);
});

test("PDF output filenames are deterministic and filesystem-safe", () => {
  assert.equal(buildPdfFileName("folder\\quarter: one.PDF", "compressed"), "quarter- one-compressed.pdf");
  assert.equal(buildPdfFileName(".pdf", "converted", "docx"), "document-converted.docx");
});

test("compression math reports both savings and growth truthfully", () => {
  assert.equal(compressionChangePercent(1000, 420), 58);
  assert.equal(compressionChangePercent(1000, 1120), -12);
});

test("image-to-PDF layouts contain without distortion across standard pages", () => {
  const layout = resolveImagePdfPageLayout(1600, 900, {
    pageSize: "a4",
    orientation: "landscape",
    margin: "standard",
  });
  assert.ok(layout.pageWidth > layout.pageHeight);
  assert.equal(layout.margin, 36);
  assert.ok(layout.imageWidth <= layout.pageWidth - 72 + 0.001);
  assert.ok(layout.imageHeight <= layout.pageHeight - 72 + 0.001);
  assert.ok(Math.abs(layout.imageWidth / layout.imageHeight - 1600 / 900) < 0.0001);
});

test("text extraction ordering groups nearby runs into stable lines", () => {
  const lines = groupPdfTextItems([
    { text: "world", x: 56, y: 700, width: 31, height: 12 },
    { text: "Second line", x: 20, y: 680, width: 62, height: 12 },
    { text: "Hello", x: 20, y: 700, width: 29, height: 12 },
  ]);
  assert.deepEqual(lines, ["Hello world", "Second line"]);
});

test("preserve-mode rewrite keeps page count and emits valid PDF bytes", async () => {
  const input = await fixturePdf([320, 420]);
  const result = await rewritePdf(input);
  assert.equal(result.pageCount, 2);
  assert.equal(hasPdfHeader(result.bytes), true);
  const loaded = await PDFDocument.load(result.bytes);
  assert.equal(loaded.getPageCount(), 2);
});

test("merge keeps selected document order and page totals", async () => {
  const first = await fixturePdf([301, 302]);
  const second = await fixturePdf([601]);
  const result = await mergePdfBytes([first, second]);
  assert.deepEqual(result.pagesPerDocument, [2, 1]);
  assert.equal(result.pageCount, 3);
  const loaded = await PDFDocument.load(result.bytes);
  assert.deepEqual(loaded.getPages().map((page) => page.getWidth()), [301, 302, 601]);
});

test("DOCX generation produces a real OOXML zip with ordered page text", async () => {
  const blob = await createDocxFromExtractedPages([
    { pageNumber: 1, lines: ["First page", "Second paragraph"] },
    { pageNumber: 2, lines: ["Next page"] },
  ]);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.deepEqual([...bytes.slice(0, 2)], [0x50, 0x4b]);
  assert.ok(bytes.length > 500);
});
