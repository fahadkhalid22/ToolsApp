import assert from "node:assert/strict";
import test from "node:test";

import {
  addAcademicRow,
  calculateCgpa,
  calculateGpa,
  removeAcademicRow,
  STANDARD_GRADE_SCALE,
} from "../src/lib/calculators/academic.ts";
import { formatCalculationInput, formatCalculatorNumber, parseFiniteNumber } from "../src/lib/calculators/numbers.ts";
import { calculatePercentage } from "../src/lib/calculators/percentage.ts";

test("standard GPA uses credit weights, optional names, and decimal credits", () => {
  const result = calculateGpa([{ id: "a", credits: 3, grade: "A" }, { id: "b", credits: 4, grade: "B" }, { id: "c", credits: 2, grade: "A" }]);
  assert.equal(result.ok, true);
  assert.equal(result.result.qualityPoints, 32);
  assert.equal(result.result.totalCredits, 9);
  assert.equal(formatCalculatorNumber(result.result.average), "3.56");
  const decimal = calculateGpa([{ id: "a", name: " Math ", credits: 1.5, grade: "A" }, { id: "b", credits: 0.5, grade: "B" }]);
  assert.equal(decimal.result.average, 3.75);
  assert.equal(decimal.result.breakdown[0].label, "Math");
  assert.equal(decimal.result.breakdown[1].label, "Course 2");
});

test("GPA validates missing and nonpositive credits and ignores inactive grade fields", () => {
  for (const credits of ["", 0, -1, "invalid"]) {
    const result = calculateGpa([{ id: "a", credits, grade: "A" }]);
    assert.equal(result.ok, false);
    assert.ok(result.rowErrors.a.credits);
  }
  assert.equal(calculateGpa([{ id: "a", credits: 3 }]).ok, false);
  const result = calculateGpa([{ id: "a", credits: 3, grade: "A" }, { id: "b", credits: "", gradePoint: 2 }]);
  assert.equal(result.ok, true);
  assert.equal(result.result.includedCount, 1);
});

test("academic calculators reject overflowing totals", () => {
  assert.equal(calculateGpa([{ id: "a", credits: 1e308, grade: "A" }]).ok, false);
  assert.equal(calculateCgpa([{ id: "a", credits: 1e308, gpa: 4 }]).ok, false);
  assert.equal(calculateGpa([{ id: "a", credits: 1e308, grade: "F" }, { id: "b", credits: 1e308, grade: "F" }]).ok, false);
});

test("many courses retain weighting and percentage output rounds only for display", () => {
  const rows = Array.from({ length: 50 }, (_, index) => ({ id: String(index), credits: index % 2 ? 1 : 3, grade: index % 2 ? "B" : "A" }));
  const result = calculateGpa(rows);
  assert.equal(result.result.includedCount, 50);
  assert.equal(result.result.totalCredits, 100);
  assert.equal(result.result.average, 3.75);
  const percentage = calculatePercentage("what-percent", { first: 1, second: 3 });
  assert.equal(percentage.result.value, (1 / 3) * 100);
  assert.equal(formatCalculatorNumber(percentage.result.value, 6), "33.333333");
});

test("percentage boundaries, signed changes, overflow, and precise formulas", () => {
  assert.equal(calculatePercentage("percent-of", { first: 20, second: 500 }).result.value, 100);
  assert.equal(calculatePercentage("percent-of", { first: 1e308, second: 1e308 }).ok, false);
  assert.equal(calculatePercentage("change", { first: -100, second: -50 }).result.direction, "neutral");
  assert.equal(calculatePercentage("change", { first: -1e308, second: 1e308 }).result.value, -200);
  assert.equal(calculatePercentage("what-percent", { first: -25, second: 100 }).result.value, -25);
  assert.equal(formatCalculationInput(1e-10), "1e-10");
  assert.equal(formatCalculationInput(1.123456789), "1.123456789");
});

test("number parsing rejects non-decimal and non-finite input without rounding values", () => {
  assert.equal(parseFiniteNumber(" 3.222222 "), 3.222222);
  assert.equal(parseFiniteNumber("1e2"), 100);
  assert.equal(parseFiniteNumber("0x10"), null);
  assert.equal(parseFiniteNumber("Infinity"), null);
  assert.equal(parseFiniteNumber(""), null);
  assert.equal(formatCalculatorNumber(3.222222), "3.22");
});

test("percentage of a value handles ordinary, zero, full, and decimal percentages", () => {
  const twenty = calculatePercentage("percent-of", { first: 20, second: 150 });
  const zero = calculatePercentage("percent-of", { first: 0, second: 999 });
  const full = calculatePercentage("percent-of", { first: 100, second: 7.5 });
  const decimal = calculatePercentage("percent-of", { first: 12.5, second: 80 });
  assert.equal(twenty.ok && twenty.result.value, 30);
  assert.equal(zero.ok && zero.result.value, 0);
  assert.equal(full.ok && full.result.value, 7.5);
  assert.equal(decimal.ok && decimal.result.value, 10);
});

test("what-percent calculation returns 20% and rejects a zero denominator", () => {
  const result = calculatePercentage("what-percent", { first: 30, second: 150 });
  const zeroTotal = calculatePercentage("what-percent", { first: 30, second: 0 });
  assert.equal(result.ok && result.result.value, 20);
  assert.deepEqual(zeroTotal, { ok: false, errors: { second: "The total cannot be zero." } });
});

test("percentage change reports increase, decrease, unchanged, and undefined original", () => {
  const increase = calculatePercentage("change", { first: 100, second: 125 });
  const decrease = calculatePercentage("change", { first: 200, second: 150 });
  const same = calculatePercentage("change", { first: 42, second: 42 });
  const undefinedChange = calculatePercentage("change", { first: 0, second: 12 });
  assert.equal(increase.ok && increase.result.value, 25);
  assert.equal(increase.ok && increase.result.direction, "increase");
  assert.equal(decrease.ok && decrease.result.value, -25);
  assert.equal(decrease.ok && decrease.result.direction, "decrease");
  assert.equal(same.ok && same.result.direction, "unchanged");
  assert.deepEqual(undefinedChange, { ok: false, errors: { first: "The original value cannot be zero." } });
});

test("percentage calculation rejects invalid text and keeps above-100 visuals bounded", () => {
  const invalid = calculatePercentage("percent-of", { first: "hello", second: "" });
  const above = calculatePercentage("what-percent", { first: 240, second: 100 });
  assert.deepEqual(invalid, {
    ok: false,
    errors: { first: "Enter a valid number.", second: "Enter a valid number." },
  });
  assert.equal(above.ok && above.result.value, 240);
  assert.equal(above.ok && above.result.visualPercent, 100);
});

test("the standard grade scale exposes the documented 4.0 mapping", () => {
  assert.deepEqual(STANDARD_GRADE_SCALE.map(({ grade, points }) => [grade, points]), [
    ["A", 4], ["A−", 3.7], ["B+", 3.3], ["B", 3], ["B−", 2.7],
    ["C+", 2.3], ["C", 2], ["C−", 1.7], ["D+", 1.3], ["D", 1], ["F", 0],
  ]);
});

test("GPA uses credit-weighted quality points and retains internal precision", () => {
  const result = calculateGpa([
    { id: "1", name: "One", credits: 3, gradePoint: 4 },
    { id: "2", name: "Two", credits: 4, gradePoint: 3 },
    { id: "3", name: "Three", credits: 2, gradePoint: 2.5 },
  ], "custom", 4);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.result.qualityPoints, 29);
  assert.equal(result.result.totalCredits, 9);
  assert.equal(result.result.average, 29 / 9);
  assert.equal(formatCalculatorNumber(result.result.average), "3.22");
});

test("standard GPA calculates a perfect 4.0 and counts F-grade credits", () => {
  const perfect = calculateGpa([{ id: "1", credits: 3, grade: "A" }]);
  const withFailure = calculateGpa([
    { id: "1", credits: 3, grade: "A" },
    { id: "2", credits: 1, grade: "F" },
  ]);
  assert.equal(perfect.ok && perfect.result.average, 4);
  assert.equal(withFailure.ok && withFailure.result.totalCredits, 4);
  assert.equal(withFailure.ok && withFailure.result.average, 3);
});

test("CGPA requires semester credits and matches the weighted known answer", () => {
  const result = calculateCgpa([
    { id: "1", label: "Fall", gpa: 3.5, credits: 15 },
    { id: "2", label: "Spring", gpa: 3.2, credits: 18 },
  ], 4);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(Math.abs(result.result.qualityPoints - 110.1) < 1e-10);
  assert.equal(result.result.totalCredits, 33);
  assert.ok(Math.abs(result.result.average - (110.1 / 33)) < 1e-10);
  assert.equal(formatCalculatorNumber(result.result.average), "3.34");
});

test("academic calculators validate partial, out-of-range, zero-credit, and empty rows", () => {
  const partial = calculateGpa([{ id: "partial", name: "Math", credits: "", grade: "A" }]);
  const overScale = calculateGpa([{ id: "high", credits: 3, gradePoint: 4.1 }], "custom", 4);
  const zeroCredits = calculateCgpa([{ id: "zero", label: "Fall", gpa: 3.4, credits: 0 }], 4);
  const empty = calculateCgpa([], 4);
  assert.equal(partial.ok || partial.rowErrors.partial.credits, "Enter credits for this course.");
  assert.equal(overScale.ok || overScale.rowErrors.high.gradePoint, "Grade point must be between 0 and 4.");
  assert.equal(zeroCredits.ok || zeroCredits.rowErrors.zero.credits, "Credits must be greater than 0.");
  assert.equal(empty.ok || empty.message, "Add at least one complete semester.");
});

test("custom academic scales accept valid values and reject invalid maximums", () => {
  const valid = calculateGpa([{ id: "1", credits: 2, gradePoint: 8.5 }], "custom", 10);
  const invalidScale = calculateCgpa([{ id: "1", gpa: 3, credits: 2 }], 0);
  assert.equal(valid.ok && valid.result.average, 8.5);
  assert.equal(invalidScale.ok || invalidScale.message, "Enter a maximum scale greater than 0 and no more than 100.");
});

test("academic row add and remove utilities safely allow an empty collection", () => {
  const row = { id: "1", credits: "", grade: "" };
  assert.deepEqual(addAcademicRow([], row), [row]);
  assert.deepEqual(removeAcademicRow([row], "1"), []);
  assert.deepEqual(removeAcademicRow([], "missing"), []);
});
