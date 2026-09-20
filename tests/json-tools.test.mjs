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

test("validateJson accepts arrays, nested data, escaped characters, and Unicode", () => {
  const input = '[{"nested":{"message":"line\\nnext","city":"Zürich","emoji":"🙂"}},null,42]';
  const validation = validateJson(input);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.parsed, [
    { nested: { message: "line\nnext", city: "Zürich", emoji: "🙂" } },
    null,
    42,
  ]);
});

test("validateJson rejects JavaScript object syntax and reports location when available", () => {
  const singleQuoted = validateJson("{'name': 'ToolsApp'}");
  assert.equal(singleQuoted.valid, false);

  const trailingComma = validateJson('{\n  "name": "ToolsApp",\n}');
  assert.equal(trailingComma.valid, false);
  if (trailingComma.line !== undefined) {
    assert.equal(trailingComma.line, 3);
    assert.ok(trailingComma.column >= 1);
  }
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

test("format and minify preserve data semantics through whitespace-heavy input", () => {
  const input = '  {  "value" : [ true, false, null ], "escaped": "a\\tb" }  ';
  const formatted = formatJson(input);
  const minified = minifyJson(input);
  assert.equal(formatted.success, true);
  assert.equal(minified.success, true);
  assert.deepEqual(JSON.parse(formatted.result), JSON.parse(input));
  assert.deepEqual(JSON.parse(minified.result), JSON.parse(input));
});

test("JSON transforms propagate strict validation failures", () => {
  const invalid = '{"value": 1,}';
  const formatted = formatJson(invalid);
  const minified = minifyJson(invalid);
  assert.equal(formatted.success, false);
  assert.equal(minified.success, false);
  assert.equal(formatted.result, "");
  assert.equal(minified.result, "");
});
