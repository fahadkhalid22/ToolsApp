import { formatCalculationInput, parseFiniteNumber } from "./numbers.ts";

export type PercentageMode = "percent-of" | "what-percent" | "change";

export type PercentageInput = {
  first: string | number;
  second: string | number;
};

export type PercentageCalculation = {
  mode: PercentageMode;
  value: number;
  formula: string;
  direction: "increase" | "decrease" | "unchanged" | "neutral";
  visualPercent: number;
};

export type PercentageCalculationResult =
  | { ok: true; result: PercentageCalculation }
  | { ok: false; errors: Partial<Record<"first" | "second", string>> };

function parseInputs(input: PercentageInput) {
  const first = parseFiniteNumber(input.first);
  const second = parseFiniteNumber(input.second);
  const errors: Partial<Record<"first" | "second", string>> = {};
  if (first === null) errors.first = "Enter a valid number.";
  if (second === null) errors.second = "Enter a valid number.";
  return { first, second, errors };
}

export function calculatePercentage(
  mode: PercentageMode,
  input: PercentageInput,
): PercentageCalculationResult {
  const { first, second, errors } = parseInputs(input);
  if (Object.keys(errors).length > 0 || first === null || second === null) {
    return { ok: false, errors };
  }

  if (mode === "what-percent" && second === 0) {
    return { ok: false, errors: { second: "The total cannot be zero." } };
  }

  if (mode === "change" && first === 0) {
    return { ok: false, errors: { first: "The original value cannot be zero." } };
  }

  let value: number;
  let formula: string;
  let direction: PercentageCalculation["direction"] = "neutral";

  if (mode === "percent-of") {
    value = (first / 100) * second;
    formula = `(${formatCalculationInput(first)} ÷ 100) × ${formatCalculationInput(second)}`;
  } else if (mode === "what-percent") {
    value = (first / second) * 100;
    formula = `(${formatCalculationInput(first)} ÷ ${formatCalculationInput(second)}) × 100`;
  } else {
    value = ((second - first) / first) * 100;
    direction = value > 0 ? "increase" : value < 0 ? "decrease" : "unchanged";
    formula = `((${formatCalculationInput(second)} − ${formatCalculationInput(first)}) ÷ ${formatCalculationInput(first)}) × 100`;
  }

  return {
    ok: true,
    result: {
      mode,
      value,
      formula,
      direction,
      visualPercent: Math.min(Math.abs(value), 100),
    },
  };
}
