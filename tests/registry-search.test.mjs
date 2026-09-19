import assert from "node:assert/strict";
import test from "node:test";

import { toolCategories } from "../src/data/categories.ts";
import { tools } from "../src/data/tools.ts";
import { normalizeSearchValue, searchTools } from "../src/lib/discovery/search.ts";
import { addHistoryEntry, dismissNotification, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, removeHistoryEntry, toggleFavoriteIds } from "../src/lib/discovery/state.ts";

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
  assert.equal(searchTools(tools, "gpa")[0]?.name, "GPA & CGPA Calculator");
  assert.equal(searchTools(tools, "json")[0]?.name, "JSON Formatter & Validator");
  assert.equal(searchTools(tools, "passport")[0]?.name, "Passport & Visa Photo Maker");
  assert.equal(searchTools(tools, "qr")[0]?.name, "QR Code Generator");
  assert.ok(searchTools(tools, "jpg png").length >= 3);
  assert.deepEqual(searchTools(tools, "no such tool"), []);
});

test("Part 07 calculators are available through their required search aliases", () => {
  const percentage = tools.find((tool) => tool.id === "percentage-calculator");
  const academic = tools.find((tool) => tool.id === "gpa-cgpa-calculator");
  assert.equal(percentage?.availability, "available");
  assert.equal(percentage?.futurePhase, undefined);
  assert.equal(academic?.availability, "available");
  assert.equal(academic?.futurePhase, undefined);
  assert.equal(searchTools(tools, "percent decrease")[0]?.id, "percentage-calculator");
  assert.equal(searchTools(tools, "grade point average")[0]?.id, "gpa-cgpa-calculator");
  assert.equal(searchTools(tools, "semester gpa")[0]?.id, "gpa-cgpa-calculator");
});

test("favorites toggle without creating duplicates", () => {
  assert.deepEqual(toggleFavoriteIds([], "image-compressor"), ["image-compressor"]);
  assert.deepEqual(toggleFavoriteIds(["image-compressor"], "image-compressor"), []);
});

test("history stays newest-first, suppresses rapid duplicates, caps, and clears", () => {
  const first = { id: "1", toolId: "image-compressor", timestamp: "2026-09-18T10:00:00.000Z", status: "opened" };
  const duplicate = { ...first, id: "2", timestamp: "2026-09-18T10:00:01.000Z" };
  const second = { id: "3", toolId: "merge-pdf", timestamp: "2026-09-18T10:01:00.000Z", status: "opened" };
  assert.deepEqual(addHistoryEntry([first], duplicate), [first]);
  const completed = { ...duplicate, id: "completed", status: "completed" };
  assert.deepEqual(addHistoryEntry([first], completed), [completed, first]);
  assert.deepEqual(addHistoryEntry([first], second, 2), [second, first]);
  assert.deepEqual(removeHistoryEntry([second, first], second.id), [first]);
});

test("notification read, mark-all, dismiss, and unread count are deterministic", () => {
  const initial = { readIds: [], dismissedIds: [] };
  const oneRead = markNotificationRead(initial, "one");
  assert.equal(getUnreadNotificationCount(oneRead, ["one", "two"]), 1);
  const allRead = markAllNotificationsRead(oneRead, ["one", "two"]);
  assert.equal(getUnreadNotificationCount(allRead, ["one", "two"]), 0);
  assert.deepEqual(dismissNotification(initial, "one").dismissedIds, ["one"]);
});
