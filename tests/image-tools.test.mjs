import assert from "node:assert/strict";

import test from "node:test";
import { editResizeDimension, parseResizeDimensions, resizeFormatFromHeader, resizeSettingsKey, scaleResizeDimensions } from "../src/lib/image-tools/resizer.ts";

test("resizer axes always derive from the original ratio without rounding drift", () => {
  const source = { width: 4000, height: 3000 };
  const widthEdit = editResizeDimension(source, { width: "4000", height: "3000" }, "width", "1000", true);
  assert.deepEqual(widthEdit, { width: "1000", height: "750" });
  assert.deepEqual(editResizeDimension(source, widthEdit, "height", "600", true), { width: "800", height: "600" });
  const oddSource = { width: 4033, height: 3025 };
  const rounded = editResizeDimension(oddSource, widthEdit, "width", "333", true);
  assert.deepEqual(editResizeDimension(oddSource, rounded, "height", "3025", true), { width: "4033", height: "3025" });
});

test("unlocked resize keeps the other dimension independent", () => {
  assert.deepEqual(editResizeDimension({ width: 4000, height: 3000 }, { width: "1000", height: "750" }, "height", "1000", false), { width: "1000", height: "1000" });
});

test("resize presets use original dimensions with predictable pixel rounding", () => {
  const source = { width: 4000, height: 3000 };
  assert.deepEqual([.25, .5, .75, 1].map((scale) => scaleResizeDimensions(source, scale)), [
    { width: 1000, height: 750 }, { width: 2000, height: 1500 }, { width: 3000, height: 2250 }, source,
  ]);
  assert.deepEqual(scaleResizeDimensions({ width: 3, height: 1 }, .25), { width: 1, height: 1 });
  assert.deepEqual(scaleResizeDimensions({ width: 4033, height: 3025 }, .5), { width: 2017, height: 1513 });
  assert.throws(() => scaleResizeDimensions(source, NaN), /positive scale/);
});

test("invalid resizer input remains editable and cannot allocate a canvas", () => {
  const original = { width: 4000, height: 3000 };
  for (const value of ["", "0", "-1", "NaN", "Infinity", "2.5", "1e3"]) {
    const fields = editResizeDimension(original, { width: "4000", height: "3000" }, "width", value, true);
    assert.equal(fields.width, value);
    assert.equal(fields.height, "3000");
    assert.throws(() => parseResizeDimensions(fields));
  }
  assert.throws(() => parseResizeDimensions({ width: "12001", height: "1" }), /cannot exceed/);
  assert.throws(() => parseResizeDimensions({ width: "8000", height: "8000" }), /too large/);
  assert.deepEqual(parseResizeDimensions({ width: "1", height: "1" }), { width: 1, height: 1 });
  assert.deepEqual(parseResizeDimensions({ width: "12000", height: "1" }), { width: 12000, height: 1 });
});

test("resizer file signatures accept JPEG and PNG but never WebP disguised as JPG", () => {
  assert.equal(resizeFormatFromHeader(Uint8Array.from([255, 216, 255, 224])), "jpeg");
  assert.equal(resizeFormatFromHeader(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])), "png");
  assert.equal(resizeFormatFromHeader(new TextEncoder().encode("RIFFabcdWEBP")), null);
  assert.equal(resizeFormatFromHeader(new Uint8Array()), null);
});

test("resizer filenames avoid repeated suffixes across format changes", () => {
  assert.equal(buildImageFileName("photo.jpg", "resized", "jpeg"), "photo-resized.jpg");
  assert.equal(buildImageFileName("photo-resized-resized.jpg", "resized", "png"), "photo-resized.png");
  assert.equal(buildImageFileName("logo.png", "resized", "png"), "logo-resized.png");
  assert.equal(buildImageFileName("photo-compressed.jpg", "compressed", "jpeg"), "photo-compressed.jpg");
});

test("result identity tracks output settings and ignores irrelevant PNG quality", () => {
  const size = { width: 1000, height: 750 };
  assert.notEqual(resizeSettingsKey(size, "jpeg", 88), resizeSettingsKey(size, "jpeg", 60));
  assert.notEqual(resizeSettingsKey(size, "jpeg", 88), resizeSettingsKey({ width: 1000, height: 1000 }, "jpeg", 88));
  assert.notEqual(resizeSettingsKey(size, "jpeg", 88), resizeSettingsKey(size, "png", 88));
  assert.equal(resizeSettingsKey(size, "png", 88), resizeSettingsKey(size, "png", 60));
});

import {

buildImageFileName,

COMPRESSION_PRESETS,

calculateAspectDimensions,

calculateCoverCrop,

compressionPresetForStrength,

compressionStrengthToQuality,

imageFormatFromFile,

isSmallerCompressionCandidate,

normalizeCompressionStrength,

passportSizeToPixels,

physicalToPixels,

sizeReductionPercent,

sizeSavingsBytes,

validateCanvasDimensions,

} from "../src/lib/image-tools/core.ts";

// ===========================================

// A. Format detection tests (JPEG, PNG, WebP)

// ===========================================

test("JPEG MIME type is detected", () => {

assert.equal(imageFormatFromFile({ name: "photo.jpg", type: "image/jpeg" }), "jpeg");

assert.equal(imageFormatFromFile({ name: "photo.jpeg", type: "image/jpeg" }), "jpeg");

assert.equal(imageFormatFromFile({ name: "photo.JPG", type: "image/jpeg" }), "jpeg");

});

test("PNG MIME type is detected", () => {

assert.equal(imageFormatFromFile({ name: "photo.png", type: "image/png" }), "png");

assert.equal(imageFormatFromFile({ name: "PHOTO.PNG", type: "image/png" }), "png");

});

test("WebP MIME type is detected", () => {

assert.equal(imageFormatFromFile({ name: "photo.webp", type: "image/webp" }), "webp");

assert.equal(imageFormatFromFile({ name: "photo.WEBP", type: "image/webp" }), "webp");

});

test("extension fallback detects JPEG", () => {

assert.equal(imageFormatFromFile({ name: "portrait.jpeg", type: "" }), "jpeg");

assert.equal(imageFormatFromFile({ name: "portrait.JPEG", type: "" }), "jpeg");

});

test("extension fallback detects PNG", () => {

assert.equal(imageFormatFromFile({ name: "portrait.png", type: "" }), "png");

});

test("extension fallback detects WebP", () => {

assert.equal(imageFormatFromFile({ name: "portrait.webp", type: "" }), "webp");

assert.equal(imageFormatFromFile({ name: "portrait.WEBP", type: "" }), "webp");

});

test("MIME takes precedence over extension when MIME is recognized", () => {

// If MIME is image/jpeg, we return jpeg even if extension is .webp

assert.equal(imageFormatFromFile({ name: "test.webp", type: "image/jpeg" }), "jpeg");

// If MIME is image/png, we return png even if extension is .webp

assert.equal(imageFormatFromFile({ name: "test.webp", type: "image/png" }), "png");

// If MIME is image/webp, we return webp even if extension is .jpg

assert.equal(imageFormatFromFile({ name: "test.jpg", type: "image/webp" }), "webp");

});

test("unsupported format returns null", () => {

assert.equal(imageFormatFromFile({ name: "portrait.gif", type: "image/gif" }), null);

});

// ===========================================

// B. Filename generation tests

// ===========================================

test("image formats and output filenames are deterministic", () => {

assert.equal(imageFormatFromFile({ name: "portrait.jpeg", type: "" }), "jpeg");

assert.equal(imageFormatFromFile({ name: "portrait.bin", type: "image/png" }), "png");

assert.equal(imageFormatFromFile({ name: "portrait.webp", type: "image/webp" }), "webp");

assert.equal(buildImageFileName("folder\\my: photo.JPEG", "compressed", "jpeg"), "my- photo-compressed.jpg");

assert.equal(buildImageFileName(".png", "converted", "png"), "image-converted.png");

assert.equal(buildImageFileName("portrait.webp", "compressed", "webp"), "portrait-compressed.webp");

assert.equal(buildImageFileName("portrait-compressed.jpg", "compressed", "jpeg"), "portrait-compressed.jpg");

assert.equal(buildImageFileName("portrait-compressed-compressed.png", "compressed", "png"), "portrait-compressed.png");

});

test("compression strength is bounded and maps to intentional encoder quality", () => {

assert.equal(normalizeCompressionStrength(-5), 10);

assert.equal(normalizeCompressionStrength(91), 80);

assert.equal(normalizeCompressionStrength(Number.NaN), 50);

assert.equal(compressionStrengthToQuality(10), 0.92);

assert.equal(compressionStrengthToQuality(50), 0.74);

assert.equal(compressionStrengthToQuality(80), 0.54);

assert.ok(compressionStrengthToQuality(20) > compressionStrengthToQuality(70));

});

test("compression presets expose the required labels and synchronize by strength", () => {

assert.deepEqual(COMPRESSION_PRESETS.map((preset) => preset.label), ["High Quality", "Balanced", "Smaller File"]);

assert.equal(COMPRESSION_PRESETS.find((preset) => preset.recommended)?.id, "balanced");

assert.equal(compressionPresetForStrength(50)?.label, "Balanced");

assert.equal(compressionPresetForStrength(51), null);

});

// ===========================================

// C. Compression candidate acceptance tests

// ===========================================

test("smaller candidate is accepted", () => {

assert.equal(isSmallerCompressionCandidate(1000, 400), true);

assert.equal(isSmallerCompressionCandidate(528 * 1024, 400 * 1024), true); // 528KB -> 400KB

});

test("equal candidate is rejected", () => {

assert.equal(isSmallerCompressionCandidate(1000, 1000), false);

assert.equal(isSmallerCompressionCandidate(528 * 1024, 528 * 1024), false);

});

test("larger candidate is rejected", () => {

assert.equal(isSmallerCompressionCandidate(1000, 1200), false);

// Historic PNG inflation regression: 528KB -> 1.5MB must be rejected

const original = 528 * 1024;

const inflated = 1.5 * 1024 * 1024;

assert.equal(isSmallerCompressionCandidate(original, inflated), false);

});

test("size reduction calculation is correct", () => {

// Smaller candidate

assert.equal(sizeReductionPercent(1000, 400), 60);

// Equal candidate

assert.equal(sizeReductionPercent(1000, 1000), 0);

// Larger candidate (must return 0, not negative)

assert.equal(sizeReductionPercent(1000, 1200), 0);

assert.equal(sizeSavingsBytes(1000, 400), 600);

assert.equal(sizeSavingsBytes(1000, 1000), 0);

assert.equal(sizeSavingsBytes(1000, 1200), 0);

// Historic regression

assert.equal(sizeReductionPercent(528 * 1024, 1.5 * 1024 * 1024), 0);

// Reduction cannot be negative

const negativeCheck = sizeReductionPercent(528 * 1024, 1.5 * 1024 * 1024);

assert.ok(negativeCheck >= 0, "Reduction should never be negative");

});

test("zero or invalid size handling", () => {

assert.equal(isSmallerCompressionCandidate(0, -1), false); // zero original

assert.equal(isSmallerCompressionCandidate(-1, -2), false); // negative original

assert.equal(isSmallerCompressionCandidate(100, -1), false); // negative candidate

assert.equal(sizeReductionPercent(0, 0), 0); // zero sizes

assert.equal(sizeReductionPercent(-100, -200), 0); // negative sizes

});

// ===========================================

// D. Aspect ratio tests

// ===========================================

test("aspect-ratio resizing uses the edited axis", () => {

const source = { width: 4000, height: 3000 };

assert.deepEqual(calculateAspectDimensions(source, { width: 1000 }, true), { width: 1000, height: 750 });

assert.deepEqual(calculateAspectDimensions(source, { height: 600 }, true), { width: 800, height: 600 });

assert.deepEqual(calculateAspectDimensions(source, { width: 1000, height: 1000 }, false), { width: 1000, height: 1000 });

});

// ===========================================

// E. Physical size and passport tests

// ===========================================

test("physical photo math rounds millimetres and inches at the selected DPI", () => {

assert.equal(physicalToPixels(35, "mm", 300), 413);

assert.equal(physicalToPixels(2, "in", 300), 600);

assert.deepEqual(passportSizeToPixels({ width: 35, height: 45, unit: "mm" }, 300), { width: 413, height: 531 });

});

// ===========================================

// F. Cover crop tests

// ===========================================

test("cover crop is centered, bounded, and responds to zoom and offsets", () => {

const centered = calculateCoverCrop(

{ width: 1200, height: 800 },

{ width: 600, height: 600 },

{ zoom: 1, offsetX: 0, offsetY: 0 },

);

assert.deepEqual(centered, { sourceX: 200, sourceY: 0, sourceWidth: 800, sourceHeight: 800 });

const moved = calculateCoverCrop(

{ width: 1200, height: 800 },

{ width: 600, height: 600 },

{ zoom: 2, offsetX: 1, offsetY: -1 },

);

assert.equal(moved.sourceX + moved.sourceWidth <= 1200, true);

assert.equal(moved.sourceY >= 0, true);

assert.equal(moved.sourceWidth, 400);

});

// ===========================================

// G. Canvas validation tests

// ===========================================

test("canvas limits reject unsafe outputs", () => {

assert.deepEqual(validateCanvasDimensions({ width: 1200.4, height: 800.2 }), { width: 1200, height: 800 });

assert.throws(() => validateCanvasDimensions({ width: 0, height: 100 }), /at least 1 pixel/);

assert.throws(() => validateCanvasDimensions({ width: 12001, height: 100 }), /cannot exceed/);

assert.throws(() => validateCanvasDimensions({ width: 8000, height: 8000 }), /too large/);

});
