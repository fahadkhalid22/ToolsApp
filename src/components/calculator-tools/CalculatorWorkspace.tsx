"use client";

import { AcademicCalculator } from "./AcademicCalculator";
import { PercentageCalculator } from "./PercentageCalculator";

export type CalculatorToolId = "percentage-calculator" | "gpa-cgpa-calculator";

export function CalculatorWorkspace({ toolId }: { toolId: CalculatorToolId }) {
  return toolId === "percentage-calculator"
    ? <PercentageCalculator />
    : <AcademicCalculator />;
}
