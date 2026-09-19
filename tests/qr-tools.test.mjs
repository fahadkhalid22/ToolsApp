import assert from "node:assert/strict";
import test from "node:test";
import { generateQrPng, generateQrSvg, validateQrText } from "../src/lib/qr/generator.ts";

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
