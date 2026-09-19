const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

export function parseFiniteNumber(value: string | number): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = value.trim();
  if (!normalized || !DECIMAL_PATTERN.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeNegativeZero(value: number) {
  return Object.is(value, -0) ? 0 : value;
}

export function formatCalculatorNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    useGrouping: true,
  }).format(normalizeNegativeZero(value));
}

export function formatCalculationInput(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8,
    useGrouping: false,
  }).format(normalizeNegativeZero(value));
}
