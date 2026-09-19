export type JsonValidationResult =
  | { valid: true; parsed: unknown }
  | { valid: false; error: string; line?: number; column?: number };

export function validateJson(input: string): JsonValidationResult {
  if (!input || input.trim() === "") {
    return { valid: false, error: "JSON input is empty." };
  }

  try {
    const parsed = JSON.parse(input);
    return { valid: true, parsed };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid JSON format.";

    // Try to extract line/column from SyntaxError message if available
    let line: number | undefined;
    let column: number | undefined;

    const match = message.match(/at position (\d+)/i) || message.match(/line (\d+) column (\d+)/i);
    if (match) {
      if (match.length === 3) {
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
      } else if (match[1]) {
        const position = parseInt(match[1], 10);
        // Calculate line and column from position
        const lines = input.substring(0, position).split("\n");
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }
    }

    return { valid: false, error: message, line, column };
  }
}

export function formatJson(input: string, indent: number = 2): { success: boolean; result: string; error?: string } {
  const validation = validateJson(input);
  if (!validation.valid) {
    return { success: false, result: "", error: validation.error };
  }
  return { success: true, result: JSON.stringify(validation.parsed, null, indent) };
}

export function minifyJson(input: string): { success: boolean; result: string; error?: string } {
  const validation = validateJson(input);
  if (!validation.valid) {
    return { success: false, result: "", error: validation.error };
  }
  return { success: true, result: JSON.stringify(validation.parsed) };
}
