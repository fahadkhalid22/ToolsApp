import assert from "node:assert/strict";
import test from "node:test";
import { formatJson, minifyJson, validateJson } from "../src/lib/json/validator.ts";

test("validateJson identifies valid and invalid JSON correctly", () => {
  const valid = validateJson('{"name": "ToolsApp", "active": true}');
  assert.equal(valid.valid, true);

  const empty = validateJson("");
  assert.equal(empty.valid, false);

  const invalid = validateJson('{"name": "ToolsApp",}'); // trailing comma
  assert.equal(invalid.valid, false);
});

test("formatJson pretty prints JSON with default 2-space indentation", () => {
  const input = '{"a":1,"b":[2,3]}';
  const result = formatJson(input);
  assert.equal(result.success, true);
  assert.equal(result.result, '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
});

test("minifyJson produces single-line compact JSON", () => {
  const input = '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}';
  const result = minifyJson(input);
  assert.equal(result.success, true);
  assert.equal(result.result, '{"a":1,"b":[2,3]}');
});
