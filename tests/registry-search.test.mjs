import assert from "node:assert/strict";
import test from "node:test";

import { toolCategories } from "../src/data/categories.ts";
import { tools } from "../src/data/tools.ts";
import { normalizeSearchValue, searchTools } from "../src/lib/discovery/search.ts";

test("registry contains the expected fifteen unique tools", () => {
  assert.equal(tools.length, 15);
  assert.equal(new Set(tools.map((tool) => tool.id)).size, tools.length);
  assert.equal(new Set(tools.map((tool) => tool.slug)).size, tools.length);
});

test("every tool maps to a known category and route", () => {
  const categoryIds = new Set(toolCategories.map((category) => category.id));
  for (const tool of tools) {
    assert.ok(categoryIds.has(tool.categoryId), `${tool.name} has a valid category`);
    assert.equal(tool.route, `/tools/${tool.slug}`);
  }
});

test("search normalization tolerates separators and spacing", () => {
  assert.equal(normalizeSearchValue("  JPG/PNG → PDF  "), "jpg png pdf");
});

test("search returns expected ranked matches", () => {
  assert.deepEqual(
    searchTools(tools, "compress").map((tool) => tool.name),
    ["Image Compressor", "PDF Compressor"],
  );
  assert.equal(searchTools(tools, "gpa")[0]?.name, "GPA / CGPA Calculator");
  assert.equal(searchTools(tools, "json")[0]?.name, "JSON Formatter & Validator");
  assert.equal(searchTools(tools, "passport")[0]?.name, "Passport & Visa Photo Maker");
  assert.equal(searchTools(tools, "qr")[0]?.name, "QR Code Generator");
  assert.ok(searchTools(tools, "jpg png").length >= 3);
  assert.deepEqual(searchTools(tools, "no such tool"), []);
});
