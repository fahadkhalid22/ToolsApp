import { parseFiniteNumber } from "./numbers.ts";

export const STANDARD_GRADE_SCALE = [
  { grade: "A", points: 4 },
  { grade: "A−", points: 3.7 },
  { grade: "B+", points: 3.3 },
  { grade: "B", points: 3 },
  { grade: "B−", points: 2.7 },
  { grade: "C+", points: 2.3 },
  { grade: "C", points: 2 },
  { grade: "C−", points: 1.7 },
  { grade: "D+", points: 1.3 },
  { grade: "D", points: 1 },
  { grade: "F", points: 0 },
] as const;

export type AcademicScaleMode = "standard" | "custom";

export type CourseInput = {
  id: string;
  name?: string;
  credits: string | number;
  grade?: string;
  gradePoint?: string | number;
};

export type SemesterInput = {
  id: string;
  label?: string;
  gpa: string | number;
  credits: string | number;
};

export type AcademicRowError = {
  credits?: string;
  grade?: string;
  gradePoint?: string;
  gpa?: string;
};

export type AcademicBreakdown = {
  id: string;
  label: string;
  credits: number;
  value: number;
  qualityPoints: number;
};

export type AcademicCalculation = {
  average: number;
  maxScale: number;
  totalCredits: number;
  qualityPoints: number;
  includedCount: number;
  breakdown: AcademicBreakdown[];
};

export type AcademicCalculationResult =
  | { ok: true; result: AcademicCalculation }
  | { ok: false; message?: string; rowErrors: Record<string, AcademicRowError> };

export function getGradePoints(grade: string) {
  return STANDARD_GRADE_SCALE.find((item) => item.grade === grade)?.points ?? null;
}

function validateScale(maxScale: string | number) {
  const parsed = parseFiniteNumber(maxScale);
  return parsed !== null && parsed > 0 && parsed <= 100 ? parsed : null;
}

export function calculateGpa(
  rows: readonly CourseInput[],
  scaleMode: AcademicScaleMode = "standard",
  customMaxScale: string | number = 4,
): AcademicCalculationResult {
  const maxScale = scaleMode === "standard" ? 4 : validateScale(customMaxScale);
  if (maxScale === null) {
    return { ok: false, message: "Enter a maximum scale greater than 0 and no more than 100.", rowErrors: {} };
  }

  const rowErrors: Record<string, AcademicRowError> = {};
  const breakdown: AcademicBreakdown[] = [];

  rows.forEach((row, index) => {
    const hasAnyValue = Boolean(row.name?.trim() || String(row.credits).trim() || row.grade || String(row.gradePoint ?? "").trim());
    if (!hasAnyValue) return;

    const credits = parseFiniteNumber(row.credits);
    const gradePoint = scaleMode === "standard"
      ? getGradePoints(row.grade ?? "")
      : parseFiniteNumber(row.gradePoint ?? "");
    const errors: AcademicRowError = {};

    if (credits === null) errors.credits = "Enter credits for this course.";
    else if (credits <= 0) errors.credits = "Credits must be greater than 0.";

    if (gradePoint === null) {
      if (scaleMode === "standard") errors.grade = "Choose a grade.";
      else errors.gradePoint = "Enter a grade point.";
    } else if (gradePoint < 0 || gradePoint > maxScale) {
      errors.gradePoint = `Grade point must be between 0 and ${maxScale}.`;
    }

    if (Object.keys(errors).length > 0) {
      rowErrors[row.id] = errors;
      return;
    }

    if (credits !== null && gradePoint !== null) {
      breakdown.push({
        id: row.id,
        label: row.name?.trim() || `Course ${index + 1}`,
        credits,
        value: gradePoint,
        qualityPoints: credits * gradePoint,
      });
    }
  });

  if (Object.keys(rowErrors).length > 0) return { ok: false, rowErrors };
  if (breakdown.length === 0) {
    return { ok: false, message: "Add at least one complete course.", rowErrors: {} };
  }

  return buildAcademicResult(breakdown, maxScale);
}

export function calculateCgpa(
  rows: readonly SemesterInput[],
  maxScaleInput: string | number = 4,
): AcademicCalculationResult {
  const maxScale = validateScale(maxScaleInput);
  if (maxScale === null) {
    return { ok: false, message: "Enter a maximum scale greater than 0 and no more than 100.", rowErrors: {} };
  }

  const rowErrors: Record<string, AcademicRowError> = {};
  const breakdown: AcademicBreakdown[] = [];

  rows.forEach((row, index) => {
    const hasAnyValue = Boolean(row.label?.trim() || String(row.gpa).trim() || String(row.credits).trim());
    if (!hasAnyValue) return;

    const gpa = parseFiniteNumber(row.gpa);
    const credits = parseFiniteNumber(row.credits);
    const errors: AcademicRowError = {};

    if (gpa === null) errors.gpa = "Enter the semester GPA.";
    else if (gpa < 0 || gpa > maxScale) errors.gpa = `GPA must be between 0 and ${maxScale}.`;

    if (credits === null) errors.credits = "Enter semester credits.";
    else if (credits <= 0) errors.credits = "Credits must be greater than 0.";

    if (Object.keys(errors).length > 0) {
      rowErrors[row.id] = errors;
      return;
    }

    if (gpa !== null && credits !== null) {
      breakdown.push({
        id: row.id,
        label: row.label?.trim() || `Semester ${index + 1}`,
        credits,
        value: gpa,
        qualityPoints: credits * gpa,
      });
    }
  });

  if (Object.keys(rowErrors).length > 0) return { ok: false, rowErrors };
  if (breakdown.length === 0) {
    return { ok: false, message: "Add at least one complete semester.", rowErrors: {} };
  }

  return buildAcademicResult(breakdown, maxScale);
}

function buildAcademicResult(
  breakdown: AcademicBreakdown[],
  maxScale: number,
): { ok: true; result: AcademicCalculation } {
  const totalCredits = breakdown.reduce((sum, row) => sum + row.credits, 0);
  const qualityPoints = breakdown.reduce((sum, row) => sum + row.qualityPoints, 0);
  return {
    ok: true,
    result: {
      average: qualityPoints / totalCredits,
      maxScale,
      totalCredits,
      qualityPoints,
      includedCount: breakdown.length,
      breakdown,
    },
  };
}

export function addAcademicRow<T>(rows: readonly T[], row: T) {
  return [...rows, row];
}

export function removeAcademicRow<T extends { id: string }>(rows: readonly T[], id: string) {
  return rows.filter((row) => row.id !== id);
}
