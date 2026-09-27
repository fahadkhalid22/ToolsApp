export type JsonValidationResult =
  | { valid: true; parsed: unknown }
  | { valid: false; error: string; line?: number; column?: number };

export type JsonTransformResult =
  | { success: true; result: string }
  | { success: false; result: ""; error: string; line?: number; column?: number };

export const MAX_JSON_LENGTH = 1_000_000;

function getErrorLocation(input: string, message: string) {
  const explicitLocation = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (explicitLocation) {
    return { line: Number(explicitLocation[1]), column: Number(explicitLocation[2]) };
  }

  const positionMatch = message.match(/(?:at position|position)\s+(\d+)/i);
  if (!positionMatch) {
    if (/unexpected end|end of JSON/i.test(message)) {
      const lines = input.split(/\r\n|\r|\n/);
      return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
    }
    return {};
  }

  const position = Number(positionMatch[1]);
  const lines = input.slice(0, position).split(/\r\n|\r|\n/);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

export function validateJson(input: string): JsonValidationResult {
  if (!input || input.trim() === "") {
    return { valid: false, error: "JSON input is empty." };
  }
  if (input.length > MAX_JSON_LENGTH) {
    return { valid: false, error: "JSON exceeds the 1,000,000-character limit. Use a smaller document." };
  }

  try {
    const parsed = JSON.parse(input, (_key, value: unknown) => {
      if (typeof value === "number" && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) {
        throw new Error("A number exceeds JavaScript's safe numeric range. Encode large identifiers as strings to preserve their digits.");
      }
      return value;
    });
    return { valid: true, parsed };
  } catch (err: unknown) {
    const message = err instanceof RangeError ? "JSON is too deeply nested to process. Reduce its nesting depth." : err instanceof Error ? err.message : "Invalid JSON format.";

    return { valid: false, error: message, ...getErrorLocation(input, message) };
  }
}

export function formatJson(input: string, indent: number = 2): JsonTransformResult {
  const validation = validateJson(input);
  if (!validation.valid) {
    return { success: false, result: "", error: validation.error, line: validation.line, column: validation.column };
  }
  try {
    return { success: true, result: JSON.stringify(validation.parsed, null, indent) };
  } catch {
    return { success: false, result: "", error: "JSON is too deeply nested to format. Reduce its nesting depth." };
  }
}

export function minifyJson(input: string): JsonTransformResult {
  const validation = validateJson(input);
  if (!validation.valid) {
    return { success: false, result: "", error: validation.error, line: validation.line, column: validation.column };
  }
  try {
    return { success: true, result: JSON.stringify(validation.parsed) };
  } catch {
    return { success: false, result: "", error: "JSON is too deeply nested to minify. Reduce its nesting depth." };
  }
}
