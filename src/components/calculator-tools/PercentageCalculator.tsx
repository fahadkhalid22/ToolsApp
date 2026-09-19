"use client";

import { Check, Clipboard, Info, RefreshCcw, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { formatCalculatorNumber } from "@/lib/calculators/numbers";
import {
  calculatePercentage,
  type PercentageCalculation,
  type PercentageMode,
} from "@/lib/calculators/percentage";

import { CalculatorCard, CalculatorFooter, CalculatorHeader, ResultPlaceholder } from "./CalculatorShared";
import styles from "./CalculatorTools.module.css";

const MODES: readonly {
  id: PercentageMode;
  label: string;
  shortLabel: string;
  description: string;
  firstLabel: string;
  secondLabel: string;
  firstPrefix?: string;
  secondPrefix?: string;
}[] = [
  {
    id: "percent-of",
    label: "X% of Y",
    shortLabel: "Percent of",
    description: "Find a percentage of any number.",
    firstLabel: "Percentage",
    secondLabel: "Number",
    firstPrefix: "%",
  },
  {
    id: "what-percent",
    label: "X is what % of Y?",
    shortLabel: "What percent?",
    description: "Compare a value with a total.",
    firstLabel: "Value",
    secondLabel: "Total",
    secondPrefix: "of",
  },
  {
    id: "change",
    label: "Percentage change",
    shortLabel: "% change",
    description: "Measure an increase or decrease.",
    firstLabel: "Original value",
    secondLabel: "New value",
  },
] as const;

type ModeInputs = Record<PercentageMode, { first: string; second: string }>;

const EMPTY_INPUTS: ModeInputs = {
  "percent-of": { first: "", second: "" },
  "what-percent": { first: "", second: "" },
  change: { first: "", second: "" },
};

export function PercentageCalculator() {
  const [mode, setMode] = useState<PercentageMode>("percent-of");
  const [inputs, setInputs] = useState<ModeInputs>(EMPTY_INPUTS);
  const [errors, setErrors] = useState<Partial<Record<"first" | "second", string>>>({});
  const [result, setResult] = useState<PercentageCalculation | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const activeMode = MODES.find((item) => item.id === mode) ?? MODES[0];
  const activeInputs = inputs[mode];

  function selectMode(nextMode: PercentageMode) {
    setMode(nextMode);
    setErrors({});
    setResult(null);
    setCopyStatus("");
  }

  function updateInput(field: "first" | "second", value: string) {
    setInputs((current) => ({
      ...current,
      [mode]: { ...current[mode], [field]: value },
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setResult(null);
    setCopyStatus("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const calculation = calculatePercentage(mode, activeInputs);
    if (!calculation.ok) {
      setErrors(calculation.errors);
      setResult(null);
      return;
    }
    setErrors({});
    setResult(calculation.result);
    setCopyStatus("");
    recordToolCompletion("percentage-calculator");
  }

  function resetCalculator() {
    setInputs(EMPTY_INPUTS);
    setErrors({});
    setResult(null);
    setCopyStatus("");
  }

  async function copyResult() {
    if (!result) return;
    const value = getPercentageResultText(result);
    try {
      await navigator.clipboard.writeText(`${value}\n${result.formula}`);
      setCopyStatus("Result copied");
    } catch {
      setCopyStatus("Copy unavailable");
    }
  }

  return (
    <main className={styles.main} id="main-content">
      <CalculatorHeader
        eyebrow="Everyday calculator"
        title="Percentage Calculator"
        description="Calculate a percentage, compare two values, or measure percentage change."
        icon="percentage"
      />

      <nav className={styles.toolSwitcher} aria-label="Calculator tools">
        <Link href="/tools/percentage-calculator" aria-current="page">Percentage</Link>
        <Link href="/tools/gpa-cgpa-calculator">GPA &amp; CGPA</Link>
      </nav>

      <div className={styles.workspace}>
        <CalculatorCard className={styles.inputCard}>
          <div className={styles.cardHeading}>
            <div><span>01</span><div><h2>Choose a calculation</h2><p>Pick the question you want to answer.</p></div></div>
          </div>

          <div className={styles.modeTabs} role="tablist" aria-label="Percentage calculation type">
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={mode === item.id}
                aria-controls="percentage-input-panel"
                id={`percentage-tab-${item.id}`}
                onClick={() => selectMode(item.id)}
              >
                <strong>{item.shortLabel}</strong>
                <small>{item.label}</small>
              </button>
            ))}
          </div>

          <form
            className={styles.calculatorForm}
            onSubmit={handleSubmit}
            noValidate
            id="percentage-input-panel"
            role="tabpanel"
            aria-labelledby={`percentage-tab-${mode}`}
          >
            <div className={styles.questionPreview}>
              <Sparkles size={16} aria-hidden="true" />
              <div><strong>{activeMode.label}</strong><span>{activeMode.description}</span></div>
            </div>

            <div className={styles.twoFieldGrid}>
              <NumberField
                id={`percentage-${mode}-first`}
                label={activeMode.firstLabel}
                prefix={activeMode.firstPrefix}
                value={activeInputs.first}
                error={errors.first}
                onChange={(value) => updateInput("first", value)}
              />
              <NumberField
                id={`percentage-${mode}-second`}
                label={activeMode.secondLabel}
                prefix={activeMode.secondPrefix}
                value={activeInputs.second}
                error={errors.second}
                onChange={(value) => updateInput("second", value)}
              />
            </div>

            {mode === "change" ? (
              <p className={styles.inlineNote}><Info size={15} aria-hidden="true" /> With a negative original value, the signed result follows the formula and may differ from everyday increase/decrease wording.</p>
            ) : null}

            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit">Calculate percentage</button>
              <button className={styles.secondaryButton} type="button" onClick={resetCalculator}><RefreshCcw size={16} aria-hidden="true" /> Reset</button>
            </div>
          </form>
        </CalculatorCard>

        <CalculatorCard className={styles.resultCard}>
          {result ? (
            <PercentageResult result={result} onCopy={copyResult} copyStatus={copyStatus} />
          ) : (
            <ResultPlaceholder label="Complete the two fields and calculate. Nothing is saved." />
          )}
        </CalculatorCard>
      </div>

      <section className={styles.howItWorks} aria-labelledby="percentage-how-title">
        <span className={styles.eyebrow}>Formula guide</span>
        <h2 id="percentage-how-title">How percentage calculations work</h2>
        <div>
          <article><b>01</b><h3>Percentage of a number</h3><p>Divide the percentage by 100, then multiply it by the number.</p><code>(X ÷ 100) × Y</code></article>
          <article><b>02</b><h3>What percent?</h3><p>Divide the value by the total, then multiply the result by 100.</p><code>(X ÷ Y) × 100</code></article>
          <article><b>03</b><h3>Percentage change</h3><p>Divide the difference by the original value, then multiply by 100.</p><code>((new − old) ÷ old) × 100</code></article>
        </div>
      </section>

      <CalculatorFooter current="percentage" />
    </main>
  );
}

function NumberField({
  id,
  label,
  prefix,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  prefix?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.invalidInput : ""}`}>
        {prefix ? <span>{prefix}</span> : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      {error ? <p className={styles.fieldError} id={errorId}>{error}</p> : null}
    </div>
  );
}

function PercentageResult({
  result,
  onCopy,
  copyStatus,
}: {
  result: PercentageCalculation;
  onCopy: () => void;
  copyStatus: string;
}) {
  const resultText = getPercentageResultText(result);
  const visualStyle = { "--progress": `${result.visualPercent * 3.6}deg` } as CSSProperties;
  const directionLabel = result.direction === "increase"
    ? "Increase"
    : result.direction === "decrease"
      ? "Decrease"
      : result.direction === "unchanged"
        ? "No change"
        : "Calculated value";
  const DirectionIcon = result.direction === "decrease" ? TrendingDown : result.direction === "increase" ? TrendingUp : Check;

  return (
    <div className={styles.resultContent} aria-live="polite">
      <div className={styles.resultTopline}><span>Your result</span><button type="button" onClick={onCopy} aria-label="Copy percentage result"><Clipboard size={16} aria-hidden="true" /> Copy</button></div>
      <div className={styles.resultVisual}>
        <div className={styles.progressRing} style={visualStyle} aria-hidden="true"><div><PercentMark /></div></div>
        <span className={styles.directionPill}><DirectionIcon size={14} aria-hidden="true" />{directionLabel}</span>
        <strong>{resultText}</strong>
        <small>{result.mode === "percent-of" ? "calculated amount" : "percentage result"}</small>
      </div>
      <div className={styles.formulaBox}><span>Formula used</span><code>{result.formula}</code></div>
      {Math.abs(result.value) > 100 ? <p className={styles.visualCaveat}>The ring caps at 100% for readability; the number above is the full result.</p> : null}
      <p className={styles.copyStatus} role="status">{copyStatus}</p>
    </div>
  );
}

function PercentMark() {
  return <span aria-hidden="true">%</span>;
}

function getPercentageResultText(result: PercentageCalculation) {
  if (result.mode === "percent-of") return formatCalculatorNumber(result.value, 6);
  const absoluteValue = formatCalculatorNumber(Math.abs(result.value), 6);
  if (result.direction === "increase") return `+${absoluteValue}%`;
  if (result.direction === "decrease") return `−${absoluteValue}%`;
  return `${formatCalculatorNumber(result.value, 6)}%`;
}
