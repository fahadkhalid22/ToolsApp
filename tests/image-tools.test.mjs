import assert from "node:assert/strict";
import test from "node:test";

import {
  buildImageFileName,
  calculateAspectDimensions,
  calculateCoverCrop,
  imageFormatFromFile,
  passportSizeToPixels,
  physicalToPixels,
  sizeReductionPercent,
  validateCanvasDimensions,
} from "../src/lib/image-tools/core.ts";

test("image formats and output filenames are deterministic", () => {
  assert.equal(imageFormatFromFile({ name: "portrait.jpeg", type: "" }), "jpeg");
  assert.equal(imageFormatFromFile({ name: "portrait.bin", type: "image/png" }), "png");
  assert.equal(imageFormatFromFile({ name: "portrait.webp", type: "image/webp" }), null);
  assert.equal(buildImageFileName("folder\\my: photo.JPEG", "compressed", "jpeg"), "my- photo-compressed.jpg");
  assert.equal(buildImageFileName(".png", "converted", "png"), "image-converted.png");
});

test("aspect-ratio resizing uses the edited axis", () => {
  const source = { width: 4000, height: 3000 };
  assert.deepEqual(calculateAspectDimensions(source, { width: 1000 }, true), { width: 1000, height: 750 });
  assert.deepEqual(calculateAspectDimensions(source, { height: 600 }, true), { width: 800, height: 600 });
  assert.deepEqual(calculateAspectDimensions(source, { width: 1000, height: 1000 }, false), { width: 1000, height: 1000 });
});

test("physical photo math rounds millimetres and inches at the selected DPI", () => {
  assert.equal(physicalToPixels(35, "mm", 300), 413);
  assert.equal(physicalToPixels(2, "in", 300), 600);
  assert.deepEqual(passportSizeToPixels({ width: 35, height: 45, unit: "mm" }, 300), { width: 413, height: 531 });
});

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

test("canvas limits reject unsafe outputs", () => {
  assert.deepEqual(validateCanvasDimensions({ width: 1200.4, height: 800.2 }), { width: 1200, height: 800 });
  assert.throws(() => validateCanvasDimensions({ width: 0, height: 100 }), /at least 1 pixel/);
  assert.throws(() => validateCanvasDimensions({ width: 12001, height: 100 }), /cannot exceed/);
  assert.throws(() => validateCanvasDimensions({ width: 8000, height: 8000 }), /too large/);
});

test("size reduction can truthfully report growth", () => {
  assert.equal(sizeReductionPercent(1000, 400), 60);
  assert.equal(sizeReductionPercent(1000, 1200), -20);
});
