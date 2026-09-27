import assert from "node:assert/strict";
import test from "node:test";
import { formatJson, MAX_JSON_LENGTH, minifyJson, validateJson } from "../src/lib/json/validator.ts";

test("JSON rejects unsafe numbers instead of silently changing data", () => {
  for (const input of ['{"id":9007199254740993}', '{"n":1e400}']) {
    assert.equal(formatJson(input).success, false);
    assert.equal(minifyJson(input).success, false);
  }
  assert.equal(minifyJson('{"id":"9007199254740993"}').result, '{"id":"9007199254740993"}');
});

test("JSON limits huge documents and handles deep nesting without throwing", () => {
  assert.equal(validateJson(' '.repeat(MAX_JSON_LENGTH) + '{}').valid, false);
  const deep = '['.repeat(20_000) + '0' + ']'.repeat(20_000);
  assert.doesNotThrow(() => formatJson(deep));
  assert.equal(formatJson(deep).success, false);
  const input = JSON.stringify(Array.from({ length: 10_000 }, (_, id) => ({ id, value: "hello" })));
  const formatted = formatJson(input);
  assert.equal(formatted.success, true);
  assert.deepEqual(JSON.parse(formatted.result), JSON.parse(input));
});

test("JSON rejects missing brackets, quotes, malformed structures and locates EOF", () => {
  for (const input of ['{"a":1', "{'a':1}", '{"a":,}', '[1,]']) {
    assert.equal(formatJson(input).success, false);
  }
  const eof = validateJson('{\n "a":');
  assert.equal(eof.valid, false);
  assert.equal(eof.line, 2);
});

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
