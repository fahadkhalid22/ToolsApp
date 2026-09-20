import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultQrSettings,
  createQrDownloadDescriptor,
  generateQrPng,
  generateQrSvg,
  getQrContentType,
  normalizeQrSettings,
  resolveQrOptions,
  validateQrText,
} from "../src/lib/qr/generator.ts";

test("validateQrText correctly identifies valid and invalid input", () => {
  assert.deepEqual(validateQrText(""), { valid: false, error: "Please enter some text or a URL." });
  assert.deepEqual(validateQrText("   "), { valid: false, error: "Please enter some text or a URL." });
  assert.deepEqual(validateQrText("https://example.com"), { valid: true });
  assert.deepEqual(validateQrText("a".repeat(2001)), { valid: false, error: "Content is too long (max 2000 characters)." });
});

test("generateQrPng returns a data URL for valid text", async () => {
  const png = await generateQrPng("https://example.com");
  assert.ok(png.startsWith("data:image/png;base64,"));
});

test("generateQrSvg returns an SVG string for valid text", async () => {
  const svg = await generateQrSvg("https://example.com");
  assert.ok(svg.includes("<svg"));
  assert.ok(svg.includes("</svg>"));
});

test("QR settings normalize to supported generator options", () => {
  assert.deepEqual(normalizeQrSettings({ width: 1024, margin: 3, errorCorrectionLevel: "H" }), {
    width: 1024,
    margin: 3,
    errorCorrectionLevel: "H",
  });
  assert.deepEqual(normalizeQrSettings({ width: 999, margin: 99, errorCorrectionLevel: "X" }), {
    width: 512,
    margin: 8,
    errorCorrectionLevel: "M",
  });
  assert.deepEqual(resolveQrOptions({ width: 256, color: { dark: "#123456" } }), {
    width: 256,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#123456", light: "#ffffff" },
  });
});

test("QR download descriptors use matching data and deterministic filenames", () => {
  const assets = { png: "data:image/png;base64,fixture", svg: "<svg><path /></svg>" };
  assert.deepEqual(createQrDownloadDescriptor("png", assets), {
    href: assets.png,
    fileName: "toolsapp-qr-code.png",
    mimeType: "image/png",
  });
  const svg = createQrDownloadDescriptor("svg", assets);
  assert.equal(svg.fileName, "toolsapp-qr-code.svg");
  assert.equal(svg.mimeType, "image/svg+xml");
  assert.ok(svg.href.startsWith("data:image/svg+xml;charset=utf-8,"));
});

test("QR defaults provide reset state and content type stays descriptive", () => {
  const changed = createDefaultQrSettings();
  changed.margin = 0;
  assert.deepEqual(createDefaultQrSettings(), { width: 512, margin: 4, errorCorrectionLevel: "M" });
  assert.equal(getQrContentType("https://example.com/path"), "URL");
  assert.equal(getQrContentType("hello@example.com"), "Text");
});
