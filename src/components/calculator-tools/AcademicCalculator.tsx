"use client";

import { BookOpen, Clipboard, GraduationCap, Info, Plus, RefreshCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type CSSProperties, type FormEvent } from "react";

import {
  addAcademicRow,
  calculateCgpa,
  calculateGpa,
  removeAcademicRow,
  STANDARD_GRADE_SCALE,
  type AcademicCalculation,
  type AcademicRowError,
  type AcademicScaleMode,
  type CourseInput,
  type SemesterInput,
} from "@/lib/calculators/academic";
import { formatCalculatorNumber } from "@/lib/calculators/numbers";
import { recordToolCompletion } from "@/lib/discovery/local-state";

import { CalculatorCard, CalculatorFooter, CalculatorHeader, ResultPlaceholder } from "./CalculatorShared";
import styles from "./CalculatorTools.module.css";

type AcademicMode = "gpa" | "cgpa";
type CourseField = "name" | "credits" | "grade" | "gradePoint";
type SemesterField = "label" | "gpa" | "credits";

const INITIAL_COURSES: CourseInput[] = [
  { id: "course-1", name: "", credits: "", grade: "", gradePoint: "" },
  { id: "course-2", name: "", credits: "", grade: "", gradePoint: "" },
  { id: "course-3", name: "", credits: "", grade: "", gradePoint: "" },
];

const INITIAL_SEMESTERS: SemesterInput[] = [
  { id: "semester-1", label: "", gpa: "", credits: "" },
  { id: "semester-2", label: "", gpa: "", credits: "" },
];

export function AcademicCalculator() {
  const [mode, setMode] = useState<AcademicMode>("gpa");
  const [scaleMode, setScaleMode] = useState<AcademicScaleMode>("standard");
  const [gpaScale, setGpaScale] = useState("4");
  const [cgpaScale, setCgpaScale] = useState("4");
  const [courses, setCourses] = useState<CourseInput[]>(INITIAL_COURSES);
  const [semesters, setSemesters] = useState<SemesterInput[]>(INITIAL_SEMESTERS);
  const [result, setResult] = useState<AcademicCalculation | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, AcademicRowError>>({});
  const [formError, setFormError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const nextId = useRef(4);

  function clearResult() {
    setResult(null);
    setRowErrors({});
    setFormError("");
    setCopyStatus("");
  }

  function selectMode(nextMode: AcademicMode) {
    setMode(nextMode);
    clearResult();
  }

  function selectScaleMode(nextMode: AcademicScaleMode) {
    setScaleMode(nextMode);
    clearResult();
  }

  function updateCourse(id: string, field: CourseField, value: string) {
    setCourses((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
    setRowErrors((current) => ({ ...current, [id]: { ...current[id], [field]: undefined } }));
    setResult(null);
    setFormError("");
    setCopyStatus("");
  }

  function updateSemester(id: string, field: SemesterField, value: string) {
    setSemesters((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
    setRowErrors((current) => ({ ...current, [id]: { ...current[id], [field]: undefined } }));
    setResult(null);
    setFormError("");
    setCopyStatus("");
  }

  function addCourse() {
    const id = `course-${nextId.current++}`;
    setCourses((current) => addAcademicRow(current, { id, name: "", credits: "", grade: "", gradePoint: "" }));
    clearResult();
  }

  function addSemester() {
    const id = `semester-${nextId.current++}`;
    setSemesters((current) => addAcademicRow(current, { id, label: "", gpa: "", credits: "" }));
    clearResult();
  }

  function removeCourse(id: string) {
    setCourses((current) => removeAcademicRow(current, id));
    clearResult();
  }

  function removeSemester(id: string) {
    setSemesters((current) => removeAcademicRow(current, id));
    clearResult();
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const calculation = mode === "gpa"
      ? calculateGpa(courses, scaleMode, gpaScale)
      : calculateCgpa(semesters, cgpaScale);
    if (!calculation.ok) {
      setResult(null);
      setRowErrors(calculation.rowErrors);
      setFormError(calculation.message ?? "Review the highlighted rows.");
      return;
    }
    setResult(calculation.result);
    setRowErrors({});
    setFormError("");
    setCopyStatus("");
    recordToolCompletion("gpa-cgpa-calculator");
  }

  function resetCalculator() {
    setCourses(INITIAL_COURSES.map((row) => ({ ...row })));
    setSemesters(INITIAL_SEMESTERS.map((row) => ({ ...row })));
    setScaleMode("standard");
    setGpaScale("4");
    setCgpaScale("4");
    clearResult();
  }

  async function copyResult() {
    if (!result) return;
    const label = mode === "gpa" ? "GPA" : "CGPA";
    const summary = `${label}: ${formatCalculatorNumber(result.average)} / ${formatCalculatorNumber(result.maxScale)}\nTotal credits: ${formatCalculatorNumber(result.totalCredits, 4)}\nQuality points: ${formatCalculatorNumber(result.qualityPoints, 4)}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Result copied");
    } catch {
      setCopyStatus("Copy unavailable");
    }
  }

  return (
    <main className={styles.main} id="main-content">
      <CalculatorHeader
        eyebrow="Student calculator"
        title="GPA & CGPA Calculator"
        description="Calculate semester GPA or cumulative CGPA with credit-weighted results."
        icon="academic"
      />

      <nav className={styles.toolSwitcher} aria-label="Calculator tools">
        <Link href="/tools/percentage-calculator">Percentage</Link>
        <Link href="/tools/gpa-cgpa-calculator" aria-current="page">GPA &amp; CGPA</Link>
      </nav>

      <div className={styles.academicTabs} role="tablist" aria-label="Academic calculation type">
        <button type="button" role="tab" aria-selected={mode === "gpa"} aria-controls="academic-panel" id="academic-tab-gpa" onClick={() => selectMode("gpa")}>
          <BookOpen size={17} aria-hidden="true" /><span><strong>Semester GPA</strong><small>Courses and credit hours</small></span>
        </button>
        <button type="button" role="tab" aria-selected={mode === "cgpa"} aria-controls="academic-panel" id="academic-tab-cgpa" onClick={() => selectMode("cgpa")}>
          <GraduationCap size={18} aria-hidden="true" /><span><strong>Cumulative CGPA</strong><small>Semesters and total credits</small></span>
        </button>
      </div>

      <div className={styles.workspace}>
        <CalculatorCard className={`${styles.inputCard} ${styles.academicInputCard}`}>
          <form className={styles.calculatorForm} id="academic-panel" role="tabpanel" aria-labelledby={`academic-tab-${mode}`} onSubmit={calculate} noValidate>
            <div className={styles.cardHeading}>
              <div><span>01</span><div><h2>{mode === "gpa" ? "Enter your courses" : "Enter your semesters"}</h2><p>Credits are required so the result can be weighted accurately.</p></div></div>
            </div>

            {mode === "gpa" ? (
              <GpaForm
                rows={courses}
                scaleMode={scaleMode}
                maxScale={gpaScale}
                errors={rowErrors}
                onScaleMode={selectScaleMode}
                onMaxScale={(value) => { setGpaScale(value); clearResult(); }}
                onChange={updateCourse}
                onAdd={addCourse}
                onRemove={removeCourse}
              />
            ) : (
              <CgpaForm
                rows={semesters}
                maxScale={cgpaScale}
                errors={rowErrors}
                onMaxScale={(value) => { setCgpaScale(value); clearResult(); }}
                onChange={updateSemester}
                onAdd={addSemester}
                onRemove={removeSemester}
              />
            )}

            {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}
            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit">Calculate {mode.toUpperCase()}</button>
              <button className={styles.secondaryButton} type="button" onClick={resetCalculator}><RefreshCcw size={16} aria-hidden="true" /> Reset</button>
            </div>
          </form>
        </CalculatorCard>

        <CalculatorCard className={styles.resultCard}>
          {result ? (
            <AcademicResult mode={mode} result={result} onCopy={copyResult} copyStatus={copyStatus} />
          ) : (
            <ResultPlaceholder label={`Add ${mode === "gpa" ? "course" : "semester"} details and calculate. Your entries stay in this tab only.`} />
          )}
        </CalculatorCard>
      </div>

      <section className={styles.howItWorks} aria-labelledby="gpa-how-title">
        <span className={styles.eyebrow}>Weighted formula</span>
        <h2 id="gpa-how-title">How GPA and CGPA are calculated</h2>
        <div>
          <article><b>01</b><h3>Multiply</h3><p>Each grade point or semester GPA is multiplied by its credits.</p><code>value × credits</code></article>
          <article><b>02</b><h3>Add</h3><p>The calculator totals all quality points and all included credits.</p><code>Σ quality points</code></article>
          <article><b>03</b><h3>Divide</h3><p>Total quality points are divided by total credits. Inputs are not stored.</p><code>points ÷ credits</code></article>
        </div>
        <p className={styles.scaleDisclosure}><Info size={15} aria-hidden="true" /> The standard mapping is a common 4.0 scale, not a universal grading policy. Choose custom points if your institution uses another scale.</p>
      </section>

      <CalculatorFooter current="academic" />
    </main>
  );
}

function GpaForm({
  rows,
  scaleMode,
  maxScale,
  errors,
  onScaleMode,
  onMaxScale,
  onChange,
  onAdd,
  onRemove,
}: {
  rows: CourseInput[];
  scaleMode: AcademicScaleMode;
  maxScale: string;
  errors: Record<string, AcademicRowError>;
  onScaleMode: (mode: AcademicScaleMode) => void;
  onMaxScale: (value: string) => void;
  onChange: (id: string, field: CourseField, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      <div className={styles.scaleControls}>
        <fieldset>
          <legend>Grading scale</legend>
          <div className={styles.compactSegments}>
            <button type="button" aria-pressed={scaleMode === "standard"} onClick={() => onScaleMode("standard")}>Standard 4.0</button>
            <button type="button" aria-pressed={scaleMode === "custom"} onClick={() => onScaleMode("custom")}>Custom points</button>
          </div>
        </fieldset>
        {scaleMode === "custom" ? (
          <label className={styles.compactField}>Maximum scale<input type="text" inputMode="decimal" value={maxScale} onChange={(event) => onMaxScale(event.target.value)} /></label>
        ) : (
          <details className={styles.scaleKey}>
            <summary>View grade mapping</summary>
            <p>{STANDARD_GRADE_SCALE.map((item) => `${item.grade} ${item.points.toFixed(2)}`).join(" · ")}</p>
          </details>
        )}
      </div>

      <div className={styles.rowsHeader} aria-hidden="true"><span>Course name (optional)</span><span>Credits</span><span>{scaleMode === "standard" ? "Grade" : "Grade point"}</span><span /></div>
      <div className={styles.academicRows}>
        {rows.length === 0 ? <AcademicEmptyState type="course" onAdd={onAdd} /> : rows.map((row, index) => {
          const error = errors[row.id] ?? {};
          return (
            <fieldset className={styles.academicRow} key={row.id}>
              <legend>Course {index + 1}</legend>
              <label><span>Course name <em>optional</em></span><input type="text" value={row.name ?? ""} onChange={(event) => onChange(row.id, "name", event.target.value)} placeholder={`Course ${index + 1}`} /></label>
              <AcademicNumberField label="Credits" value={String(row.credits)} error={error.credits} id={`${row.id}-credits`} onChange={(value) => onChange(row.id, "credits", value)} />
              {scaleMode === "standard" ? (
                <label><span>Grade</span><select value={row.grade ?? ""} onChange={(event) => onChange(row.id, "grade", event.target.value)} aria-invalid={Boolean(error.grade)} aria-describedby={error.grade ? `${row.id}-grade-error` : undefined}><option value="">Select grade</option>{STANDARD_GRADE_SCALE.map((item) => <option value={item.grade} key={item.grade}>{item.grade} — {item.points.toFixed(2)}</option>)}</select>{error.grade ? <small className={styles.fieldError} id={`${row.id}-grade-error`}>{error.grade}</small> : null}</label>
              ) : (
                <AcademicNumberField label="Grade point" value={String(row.gradePoint ?? "")} error={error.gradePoint} id={`${row.id}-grade-point`} onChange={(value) => onChange(row.id, "gradePoint", value)} />
              )}
              <button className={styles.removeButton} type="button" onClick={() => onRemove(row.id)} aria-label={`Remove course ${index + 1}`}><Trash2 size={16} aria-hidden="true" /></button>
            </fieldset>
          );
        })}
      </div>
      {rows.length > 0 ? <button className={styles.addRowButton} type="button" onClick={onAdd}><Plus size={16} aria-hidden="true" /> Add course</button> : null}
    </>
  );
}

function CgpaForm({
  rows,
  maxScale,
  errors,
  onMaxScale,
  onChange,
  onAdd,
  onRemove,
}: {
  rows: SemesterInput[];
  maxScale: string;
  errors: Record<string, AcademicRowError>;
  onMaxScale: (value: string) => void;
  onChange: (id: string, field: SemesterField, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      <div className={styles.scaleControls}>
        <label className={styles.compactField}>Maximum GPA scale<input type="text" inputMode="decimal" value={maxScale} onChange={(event) => onMaxScale(event.target.value)} /></label>
        <p className={styles.creditReminder}><Info size={15} aria-hidden="true" /> Each semester needs its credit total; semesters are not weighted equally by default.</p>
      </div>
      <div className={styles.rowsHeader} aria-hidden="true"><span>Semester (optional)</span><span>GPA</span><span>Credits</span><span /></div>
      <div className={styles.academicRows}>
        {rows.length === 0 ? <AcademicEmptyState type="semester" onAdd={onAdd} /> : rows.map((row, index) => {
          const error = errors[row.id] ?? {};
          return (
            <fieldset className={styles.academicRow} key={row.id}>
              <legend>Semester {index + 1}</legend>
              <label><span>Semester label <em>optional</em></span><input type="text" value={row.label ?? ""} onChange={(event) => onChange(row.id, "label", event.target.value)} placeholder={`Semester ${index + 1}`} /></label>
              <AcademicNumberField label="GPA" value={String(row.gpa)} error={error.gpa} id={`${row.id}-gpa`} onChange={(value) => onChange(row.id, "gpa", value)} />
              <AcademicNumberField label="Credits" value={String(row.credits)} error={error.credits} id={`${row.id}-credits`} onChange={(value) => onChange(row.id, "credits", value)} />
              <button className={styles.removeButton} type="button" onClick={() => onRemove(row.id)} aria-label={`Remove semester ${index + 1}`}><Trash2 size={16} aria-hidden="true" /></button>
            </fieldset>
          );
        })}
      </div>
      {rows.length > 0 ? <button className={styles.addRowButton} type="button" onClick={onAdd}><Plus size={16} aria-hidden="true" /> Add semester</button> : null}
    </>
  );
}

function AcademicNumberField({ label, value, error, id, onChange }: { label: string; value: string; error?: string; id: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input id={id} type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      {error ? <small className={styles.fieldError} id={`${id}-error`}>{error}</small> : null}
    </label>
  );
}

function AcademicEmptyState({ type, onAdd }: { type: "course" | "semester"; onAdd: () => void }) {
  return (
    <div className={styles.rowsEmpty}>
      <BookOpen size={20} aria-hidden="true" />
      <p>No {type} rows yet.</p>
      <button type="button" onClick={onAdd}><Plus size={15} aria-hidden="true" /> Add {type}</button>
    </div>
  );
}

function AcademicResult({ mode, result, onCopy, copyStatus }: { mode: AcademicMode; result: AcademicCalculation; onCopy: () => void; copyStatus: string }) {
  const progress = Math.min(Math.max((result.average / result.maxScale) * 100, 0), 100);
  const visualStyle = { "--progress": `${progress * 3.6}deg` } as CSSProperties;
  const label = mode === "gpa" ? "GPA" : "CGPA";
  return (
    <div className={styles.resultContent} aria-live="polite">
      <div className={styles.resultTopline}><span>Your {label} result</span><button type="button" onClick={onCopy} aria-label={`Copy ${label} result`}><Clipboard size={16} aria-hidden="true" /> Copy</button></div>
      <div className={styles.academicResultVisual}>
        <div className={styles.progressRing} style={visualStyle} aria-hidden="true"><div><GraduationCap size={25} /></div></div>
        <small>Weighted {label}</small>
        <strong>{formatCalculatorNumber(result.average)} <span>/ {formatCalculatorNumber(result.maxScale)}</span></strong>
      </div>
      <div className={styles.metricGrid}>
        <span><small>Total credits</small><strong>{formatCalculatorNumber(result.totalCredits, 4)}</strong></span>
        <span><small>Quality points</small><strong>{formatCalculatorNumber(result.qualityPoints, 4)}</strong></span>
        <span><small>Included</small><strong>{result.includedCount} {mode === "gpa" ? "courses" : "semesters"}</strong></span>
      </div>
      <div className={styles.breakdown}>
        <h3>Calculation breakdown</h3>
        <div className={styles.breakdownTable} role="table" aria-label={`${label} calculation breakdown`}>
          <div role="row" className={styles.breakdownHeader}><span role="columnheader">Item</span><span role="columnheader">Value</span><span role="columnheader">Credits</span><span role="columnheader">Points</span></div>
          {result.breakdown.map((item) => <div role="row" key={item.id}><span role="cell">{item.label}</span><span role="cell">{formatCalculatorNumber(item.value, 4)}</span><span role="cell">{formatCalculatorNumber(item.credits, 4)}</span><span role="cell">{formatCalculatorNumber(item.qualityPoints, 4)}</span></div>)}
        </div>
      </div>
      <p className={styles.copyStatus} role="status">{copyStatus}</p>
    </div>
  );
}
