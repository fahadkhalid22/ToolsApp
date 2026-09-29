"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, RotateCcw } from "lucide-react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { EMPTY_UGC_INPUT, UGC_DURATIONS, UGC_FIELD_LIMITS, UGC_GOALS, UGC_PLATFORMS, UGC_TONES, formatUgcScript, parseUgcScript, validateUgcInput, type UgcField, type UgcInput, type UgcScript } from "@/lib/ai/ugc-contract";
import type { AiUsageStatus } from "@/lib/ai/http";

import { AiGenerationLayout, type GenerationPreset } from "./AiGenerationLayout";
import styles from "./AiTools.module.css";

const presets: readonly GenerationPreset[] = [
  { id: "hook", title: "TikTok product hook", description: "A fast opener built for the first three seconds." },
  { id: "problem", title: "Problem → solution", description: "Show the pain point, then the product payoff." },
  { id: "testimonial", title: "Testimonial style", description: "A natural creator voice without fake reviews." },
  { id: "demo", title: "30-second demo", description: "A scene-by-scene product walkthrough." },
];

const presetChanges: Record<string, Partial<UgcInput>> = {
  hook: { platform: "TikTok", tone: "Energetic", duration: "15 seconds", goal: "Clicks", context: "Open with a quick visual hook. Keep the first three seconds especially concise." },
  problem: { tone: "Problem-solution", duration: "30 seconds", goal: "Sales", context: "Show a relatable problem first, then demonstrate only the benefits supplied in the product facts." },
  testimonial: { tone: "Testimonial style", duration: "30 seconds", goal: "Consideration", context: "Write in a creator-style first person without implying this is a verified customer review or real experience." },
  demo: { platform: "Instagram Reels", tone: "Educational", duration: "30 seconds", goal: "Consideration", context: "Show a practical product walkthrough, with clear visuals for each short scene." },
};

function isUsageStatus(value: unknown): value is AiUsageStatus {
  if (!value || typeof value !== "object") return false;
  const status = value as Partial<AiUsageStatus>;
  return typeof status.configured === "boolean" && typeof status.remaining === "number" && typeof status.limit === "number" && typeof status.resetAt === "string" && status.softLimit === true;
}

async function loadUsage(signal?: AbortSignal): Promise<AiUsageStatus> {
  const response = await fetch("/api/ai/ugc-script", { cache: "no-store", signal });
  const payload: unknown = await response.json();
  if (!response.ok || !payload || typeof payload !== "object" || !("usage" in payload) || !isUsageStatus(payload.usage)) throw new Error("usage unavailable");
  return payload.usage;
}

function Field({ id, label, error, required, count, children }: { id: string; label: string; error?: string; required?: boolean; count?: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHeading}><label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>{count ? <small>{count}</small> : null}</div>
      {children}
      {error ? <span className={styles.fieldError} id={`${id}-error`}>{error}</span> : null}
    </div>
  );
}

function SelectField<T extends string>({ id, label, value, options, error, onChange, onBlur }: { id: string; label: string; value: T; options: readonly T[]; error?: string; onChange: (value: T) => void; onBlur: () => void }) {
  return <Field error={error} id={id} label={label}><select aria-describedby={error ? `${id}-error` : undefined} aria-invalid={!!error} id={id} onBlur={onBlur} onChange={(event) => onChange(event.target.value as T)} value={value}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>;
}

function CopyAction({ label, copied, onClick, primary = false }: { label: string; copied: boolean; onClick: () => void; primary?: boolean }) {
  return <button aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`} className={primary ? styles.copyFull : styles.copyAction} onClick={onClick} type="button">{copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}{copied ? "Copied" : `Copy ${label.toLowerCase()}`}</button>;
}

export function UgcGeneratorWorkspace() {
  const [form, setForm] = useState<UgcInput>({ ...EMPTY_UGC_INPUT });
  const [touched, setTouched] = useState<Partial<Record<UgcField, boolean>>>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [usage, setUsage] = useState<AiUsageStatus | null>(null);
  const [usageError, setUsageError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<UgcScript | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const pending = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const validation = validateUgcInput(form);
  const errors = validation.ok ? {} : validation.errors;

  function refreshUsage() {
    void loadUsage().then((status) => { setUsage(status); setUsageError(false); }).catch(() => setUsageError(true));
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadUsage(controller.signal).then((status) => {
      if (!controller.signal.aborted) { setUsage(status); setUsageError(false); }
    }).catch(() => { if (!controller.signal.aborted) setUsageError(true); });
    return () => controller.abort();
  }, []);

  function updateField<K extends UgcField>(key: K, value: UgcInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setRequestError(null);
  }

  function touch(field: UgcField) { setTouched((current) => ({ ...current, [field]: true })); }
  function fieldError(field: UgcField) { return touched[field] ? errors[field] : undefined; }

  function selectPreset(id: string) {
    setForm((current) => ({ ...current, ...presetChanges[id] }));
    setActivePreset(id);
    setRequestError(null);
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }

  async function generate() {
    if (pending.current) return;
    if (!validation.ok) {
      setTouched({ productName: true, productDescription: true, audience: true });
      setRequestError("Please add your product name, product details and target audience before generating.");
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!usage?.configured || usage.remaining <= 0) return;
    pending.current = true;
    setIsGenerating(true);
    setRequestError(null);
    setCopyMessage(null);
    setCopiedLabel(null);
    try {
      const response = await fetch("/api/ai/ugc-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object") throw new Error("Invalid server response");
      if ("usage" in payload && isUsageStatus(payload.usage)) setUsage(payload.usage);
      if (!response.ok) {
        const error = "error" in payload && payload.error && typeof payload.error === "object" ? payload.error as { code?: unknown } : null;
        setRequestError(error?.code === "safety_refusal" ? "We couldn’t create a script from these details. Please revise your brief and try again." : error?.code === "usage_limit" ? "You’ve used today’s three scripts. Please come back after the daily reset." : "Unable to generate a script right now. Your brief is saved on this page. Please try again.");
        return;
      }
      const script = "script" in payload ? parseUgcScript(payload.script) : null;
      if (!script) { setRequestError("The AI returned an incomplete script. Please try again."); return; }
      setResult(script);
      recordToolCompletion("ai-ugc-script-generator");
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      setRequestError("Could not reach the AI service. Check your connection and try again.");
    } finally {
      pending.current = false;
      setIsGenerating(false);
    }
  }

  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopiedLabel(label); setCopyMessage(`${label} copied to clipboard.`); }
    catch { setCopiedLabel(null); setCopyMessage("Copy didn’t work. Select the script text and copy it manually."); }
  }

  function reset() {
    setForm({ ...EMPTY_UGC_INPUT });
    setTouched({});
    setActivePreset(null);
    setResult(null);
    setRequestError(null);
    setCopyMessage(null);
    setCopiedLabel(null);
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }

  const canGenerate = validation.ok && !!usage?.configured && usage.remaining > 0 && !isGenerating;
  const usageLabel = usage ? `${usage.remaining} of ${usage.limit} scripts left today` : "Checking availability…";

  return (
    <AiGenerationLayout activePreset={activePreset} disabled={isGenerating} description="Add your product facts. Get a ready-to-film draft with a hook, scene directions, spoken lines and a call to action." eyebrow="AI TOOLS" onPreset={selectPreset} presets={presets} title="AI UGC Ad Script Generator" result={result ? (
      <section aria-labelledby="script-result-heading" className={styles.resultSection} ref={resultRef} tabIndex={-1}>
        <div className={styles.resultHeader}><div><span className={styles.eyebrow}>YOUR SCRIPT</span><h2 className="font-heading" id="script-result-heading">{result.title}</h2><p>Read the spoken lines aloud, check the facts, then copy your draft.</p></div><CopyAction label="Script" copied={copiedLabel === "Script"} onClick={() => void copy(formatUgcScript(result), "Script")} primary /></div>
        <p aria-live="polite" className={styles.copyFeedback} role="status">{copyMessage ?? "Copy the whole script or choose an individual section below."}</p>
        <div className={styles.resultLead}><div><h3>Hook</h3><p>{result.hook}</p></div><CopyAction label="Hook" copied={copiedLabel === "Hook"} onClick={() => void copy(result.hook, "Hook")} /></div>
        <h3 className={`font-heading ${styles.sceneHeading}`}>Scene-by-scene plan</h3>
        <div className={styles.sceneList}>{result.scenes.map((scene) => <article className={styles.sceneCard} key={scene.sceneNumber}><div className={styles.sceneTop}><h4>Scene {scene.sceneNumber}</h4><small>{scene.duration}</small><CopyAction label={`Scene ${scene.sceneNumber}`} copied={copiedLabel === `Scene ${scene.sceneNumber}`} onClick={() => void copy(`Scene ${scene.sceneNumber} · ${scene.duration}\nVisual: ${scene.visual}\nVoiceover: ${scene.voiceover}${scene.onScreenText ? `\nOn-screen text: ${scene.onScreenText}` : ""}`, `Scene ${scene.sceneNumber}`)} /></div><dl><div><dt>Visual direction</dt><dd>{scene.visual}</dd></div><div><dt>Spoken lines</dt><dd>{scene.voiceover}</dd></div>{scene.onScreenText ? <div><dt>On-screen text</dt><dd>{scene.onScreenText}</dd></div> : null}</dl></article>)}</div>
        <div className={styles.resultExtras}><article><div><h3 className="font-heading">Call to action</h3><CopyAction label="Call to action" copied={copiedLabel === "Call to action"} onClick={() => void copy(result.cta, "Call to action")} /></div><p>{result.cta}</p></article><article><div><h3 className="font-heading">Caption</h3><CopyAction label="Caption" copied={copiedLabel === "Caption"} onClick={() => void copy(result.caption, "Caption")} /></div><p>{result.caption}</p></article></div>
        <div className={styles.alternateHooks}><h3 className="font-heading">Alternate hooks</h3><ol>{result.alternateHooks.map((hook, index) => <li key={`${index}-${hook}`}>{hook}</li>)}</ol></div>
        <div className={styles.resultActions}><button disabled={!canGenerate} onClick={() => void generate()} type="button"><RotateCcw aria-hidden="true" size={16} /> {isGenerating ? "Generating…" : "Generate another version"}</button><button disabled={isGenerating} onClick={() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus()} type="button"><ArrowLeft aria-hidden="true" size={16} /> Edit brief</button><button disabled={isGenerating} onClick={reset} type="button">Start a new script</button></div>
        {isGenerating || requestError ? <div className={styles.feedback}><p className={requestError ? styles.errorBanner : styles.infoBanner}>{requestError ?? "Writing another version. Your current script stays available until the new one is ready."}</p></div> : null}
      </section>
    ) : undefined}>
      <div className={styles.composerCard} ref={formRef}>
        <div className={styles.composerHeader}><div><h2 className="font-heading">Your brief</h2><p>Three required fields to get started. Add more detail for a more specific script.</p></div></div>
        <form noValidate onSubmit={(event) => { event.preventDefault(); void generate(); }}>
          <fieldset className={styles.briefFields} disabled={isGenerating}>
          <legend className={styles.srOnly}>Script brief</legend>
          <div className={styles.formSection}><h3 className="font-heading">01 · Product information</h3><p className={styles.sectionHint}>What are you promoting, and what makes it useful? Include only facts you can verify.</p><div className={styles.formGrid}>
            <Field count={`${form.productName.length}/${UGC_FIELD_LIMITS.productName}`} error={fieldError("productName")} id="ugc-product-name" label="Product or service name" required><input aria-describedby={fieldError("productName") ? "ugc-product-name-error" : undefined} aria-invalid={!!fieldError("productName")} id="ugc-product-name" maxLength={UGC_FIELD_LIMITS.productName} onBlur={() => touch("productName")} onChange={(event) => updateField("productName", event.target.value)} placeholder="e.g. Northline Bottle" required value={form.productName} /></Field>
            <div className={styles.fullField}><Field count={`${form.productDescription.length}/${UGC_FIELD_LIMITS.productDescription}`} error={fieldError("productDescription")} id="ugc-product-description" label="Product details & key selling points" required><textarea aria-describedby={fieldError("productDescription") ? "ugc-product-description-error" : undefined} aria-invalid={!!fieldError("productDescription")} id="ugc-product-description" maxLength={UGC_FIELD_LIMITS.productDescription} onBlur={() => touch("productDescription")} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateField("productDescription", event.target.value)} placeholder="What does it do? Which benefits or facts are verified?" required rows={4} value={form.productDescription} /></Field></div>
          </div></div>
          <div className={styles.formSection}><h3 className="font-heading">02 · Audience &amp; platform</h3><p className={styles.sectionHint}>Choose who you’re speaking to and where the video will appear.</p><div className={styles.formGrid}>
            <Field count={`${form.audience.length}/${UGC_FIELD_LIMITS.audience}`} error={fieldError("audience")} id="ugc-audience" label="Target audience" required><input aria-describedby={fieldError("audience") ? "ugc-audience-error" : undefined} aria-invalid={!!fieldError("audience")} id="ugc-audience" maxLength={UGC_FIELD_LIMITS.audience} onBlur={() => touch("audience")} onChange={(event) => updateField("audience", event.target.value)} placeholder="e.g. Commuters who carry water to work" required value={form.audience} /></Field>
            <SelectField error={fieldError("platform")} id="ugc-platform" label="Platform" onBlur={() => touch("platform")} onChange={(value) => updateField("platform", value)} options={UGC_PLATFORMS} value={form.platform} />
            <SelectField error={fieldError("duration")} id="ugc-duration" label="Approximate duration" onBlur={() => touch("duration")} onChange={(value) => updateField("duration", value)} options={UGC_DURATIONS} value={form.duration} />
            <SelectField error={fieldError("goal")} id="ugc-goal" label="Primary goal" onBlur={() => touch("goal")} onChange={(value) => updateField("goal", value)} options={UGC_GOALS} value={form.goal} />
          </div></div>
          <div className={styles.formSection}><h3 className="font-heading">03 · Brand style</h3><p className={styles.sectionHint}>Set the voice. A preferred call to action and extra context are optional.</p><div className={styles.formGrid}>
            <SelectField error={fieldError("tone")} id="ugc-tone" label="Tone" onBlur={() => touch("tone")} onChange={(value) => updateField("tone", value)} options={UGC_TONES} value={form.tone} />
            <Field count={`${form.cta.length}/${UGC_FIELD_LIMITS.cta}`} error={fieldError("cta")} id="ugc-cta" label="Preferred call to action"><input aria-describedby={fieldError("cta") ? "ugc-cta-error" : undefined} aria-invalid={!!fieldError("cta")} id="ugc-cta" maxLength={UGC_FIELD_LIMITS.cta} onBlur={() => touch("cta")} onChange={(event) => updateField("cta", event.target.value)} placeholder="e.g. Visit our product page" value={form.cta} /></Field>
            <div className={styles.fullField}><Field count={`${form.context.length}/${UGC_FIELD_LIMITS.context}`} error={fieldError("context")} id="ugc-context" label="Extra context or instructions"><textarea aria-describedby={fieldError("context") ? "ugc-context-error" : undefined} aria-invalid={!!fieldError("context")} id="ugc-context" maxLength={UGC_FIELD_LIMITS.context} onBlur={() => touch("context")} onChange={(event) => updateField("context", event.target.value)} placeholder="Any details the writer should consider? Please avoid unsupported claims." rows={3} value={form.context} /></Field></div>
          </div></div>
          </fieldset>
          <div className={styles.submitBar}><div><span className={styles.usageLine}>{usageLabel}</span><small>Resets at midnight UTC. Only completed scripts count.</small></div><button className={styles.generateButton} disabled={!usage?.configured || usage.remaining <= 0 || isGenerating} type="submit">{isGenerating ? "Generating script…" : <>Generate script <ArrowRight aria-hidden="true" size={18} /></>}</button></div>
        </form>
        <div aria-live="polite" className={styles.feedback} role="status">
          {usageError ? <p className={styles.errorBanner}>We couldn’t check availability. <button onClick={() => void refreshUsage()} type="button">Try again</button></p> : null}
          {usage && !usage.configured ? <p className={styles.infoBanner}>Script generation is currently unavailable. You can still prepare your brief and try again later.</p> : null}
          {usage?.configured && usage.remaining === 0 ? <p className={styles.infoBanner}>You’ve used today’s three scripts. You can generate again after midnight UTC.</p> : null}
          {requestError ? <p className={styles.errorBanner}>{requestError}</p> : null}
          {isGenerating ? <p className={styles.infoBanner}>Writing your hook, scenes and call to action. Keep this page open; your script will appear below.</p> : null}
        </div>
      </div>
    </AiGenerationLayout>
  );
}
