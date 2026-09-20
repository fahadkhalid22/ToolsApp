export type JsonValidationResult =
  | { valid: true; parsed: unknown }
  | { valid: false; error: string; line?: number; column?: number };

export type JsonTransformResult =
  | { success: true; result: string }
  | { success: false; result: ""; error: string; line?: number; column?: number };

function getErrorLocation(input: string, message: string) {
  const explicitLocation = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (explicitLocation) {
    return { line: Number(explicitLocation[1]), column: Number(explicitLocation[2]) };
  }

  const positionMatch = message.match(/(?:at position|position)\s+(\d+)/i);
  if (!positionMatch) return {};

  const position = Number(positionMatch[1]);
  const lines = input.slice(0, position).split(/\r\n|\r|\n/);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

export function validateJson(input: string): JsonValidationResult {
  if (!input || input.trim() === "") {
    return { valid: false, error: "JSON input is empty." };
  }

  try {
    const parsed = JSON.parse(input);
    return { valid: true, parsed };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid JSON format.";

    return { valid: false, error: message, ...getErrorLocation(input, message) };
  }
}

export function formatJson(input: string, indent: number = 2): JsonTransformResult {
  const validation = validateJson(input);
  if (!validation.valid) {
    return { success: false, result: "", error: validation.error, line: validation.line, column: validation.column };
  }
  return { success: true, result: JSON.stringify(validation.parsed, null, indent) };
}

export function minifyJson(input: string): JsonTransformResult {
  const validation = validateJson(input);
  if (!validation.valid) {
    return { success: false, result: "", error: validation.error, line: validation.line, column: validation.column };
  }
  return { success: true, result: JSON.stringify(validation.parsed) };
}
