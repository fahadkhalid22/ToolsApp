"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Clipboard, Clapperboard, Copy, Lightbulb, LoaderCircle, MessageCircle, RotateCcw, Sparkles, WandSparkles } from "lucide-react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { EMPTY_UGC_INPUT, UGC_DURATIONS, UGC_FIELD_LIMITS, UGC_GOALS, UGC_PLATFORMS, UGC_TONES, formatUgcScript, parseUgcScript, validateUgcInput, type UgcField, type UgcInput, type UgcScript } from "@/lib/ai/ugc-contract";
import type { AiUsageStatus } from "@/lib/ai/http";

import { AiGenerationLayout, type GenerationPreset } from "./AiGenerationLayout";
import styles from "./AiTools.module.css";

const presets: readonly GenerationPreset[] = [
  { id: "hook", title: "TikTok product hook", description: "A fast opener built for the first three seconds.", icon: <WandSparkles aria-hidden="true" size={20} /> },
  { id: "problem", title: "Problem → solution", description: "Show the pain point, then the product payoff.", icon: <Lightbulb aria-hidden="true" size={20} /> },
  { id: "testimonial", title: "Testimonial style", description: "A natural creator voice without fake reviews.", icon: <MessageCircle aria-hidden="true" size={20} /> },
  { id: "demo", title: "30-second demo", description: "A scene-by-scene product walkthrough.", icon: <Clapperboard aria-hidden="true" size={20} /> },
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
    formRef.current?.scrollIntoView({ block: "start" });
  }

  async function generate() {
    if (pending.current || !validation.ok || !usage?.configured || usage.remaining <= 0) return;
    pending.current = true;
    setIsGenerating(true);
    setRequestError(null);
    setCopyMessage(null);
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
        const error = "error" in payload && payload.error && typeof payload.error === "object" ? payload.error as { message?: unknown } : null;
        setRequestError(typeof error?.message === "string" ? error.message : "The script could not be generated. Please try again.");
        return;
      }
      const script = "script" in payload ? parseUgcScript(payload.script) : null;
      if (!script) { setRequestError("The AI returned an incomplete script. Please try again."); return; }
      setResult(script);
      recordToolCompletion("ai-ugc-script-generator");
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start" }));
    } catch {
      setRequestError("Could not reach the AI service. Check your connection and try again.");
    } finally {
      pending.current = false;
      setIsGenerating(false);
    }
  }

  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopyMessage(`${label} copied.`); }
    catch { setCopyMessage("Copy failed. Select the text and copy it manually."); }
  }

  function reset() {
    setForm({ ...EMPTY_UGC_INPUT });
    setTouched({});
    setActivePreset(null);
    setResult(null);
    setRequestError(null);
    setCopyMessage(null);
    formRef.current?.scrollIntoView({ block: "start" });
  }

  const canGenerate = validation.ok && !!usage?.configured && usage.remaining > 0 && !isGenerating;
  const usageLabel = usage ? `${usage.remaining} of ${usage.limit} successful generations left today` : "Checking today's allowance…";

  return (
    <AiGenerationLayout activePreset={activePreset} description="Turn your product facts into a short-form creator-style ad script with a clear hook, scene plan, and call to action." eyebrow="AI CONTENT STUDIO" onPreset={selectPreset} presets={presets} title="AI UGC Ad Script Generator" result={result ? (
      <section aria-labelledby="script-result-heading" className={styles.resultSection} ref={resultRef}>
        <div className={styles.resultHeader}><div><span className={styles.eyebrow}>YOUR GENERATED SCRIPT</span><h2 className="font-heading" id="script-result-heading">{result.title}</h2><p>Review every claim against your product facts before publishing.</p></div><button className={styles.copyFull} onClick={() => void copy(formatUgcScript(result), "Full script")} type="button"><Clipboard aria-hidden="true" size={17} /> Copy full script</button></div>
        <div className={styles.resultLead}><div><span>THE HOOK</span><p>{result.hook}</p></div><button aria-label="Copy hook" onClick={() => void copy(result.hook, "Hook")} type="button"><Copy aria-hidden="true" size={17} /></button></div>
        <h3 className={`font-heading ${styles.sceneHeading}`}>Scene-by-scene plan</h3>
        <div className={styles.sceneList}>{result.scenes.map((scene) => <article className={styles.sceneCard} key={scene.sceneNumber}><div className={styles.sceneTop}><span>Scene {scene.sceneNumber}</span><small>{scene.duration}</small><button aria-label={`Copy scene ${scene.sceneNumber}`} onClick={() => void copy(`Scene ${scene.sceneNumber} · ${scene.duration}\nVisual: ${scene.visual}\nVoiceover: ${scene.voiceover}${scene.onScreenText ? `\nOn-screen text: ${scene.onScreenText}` : ""}`, `Scene ${scene.sceneNumber}`)} type="button"><Copy aria-hidden="true" size={16} /></button></div><dl><div><dt>Visual</dt><dd>{scene.visual}</dd></div><div><dt>Voiceover</dt><dd>{scene.voiceover}</dd></div>{scene.onScreenText ? <div><dt>On-screen text</dt><dd>{scene.onScreenText}</dd></div> : null}</dl></article>)}</div>
        <div className={styles.resultExtras}><article><div><h3 className="font-heading">Call to action</h3><button aria-label="Copy call to action" onClick={() => void copy(result.cta, "Call to action")} type="button"><Copy aria-hidden="true" size={16} /></button></div><p>{result.cta}</p></article><article><div><h3 className="font-heading">Caption</h3><button aria-label="Copy caption" onClick={() => void copy(result.caption, "Caption")} type="button"><Copy aria-hidden="true" size={16} /></button></div><p>{result.caption}</p></article></div>
        <div className={styles.alternateHooks}><h3 className="font-heading">Alternate hooks</h3><ol>{result.alternateHooks.map((hook, index) => <li key={`${index}-${hook}`}>{hook}</li>)}</ol></div>
        <div className={styles.resultActions}><button disabled={!canGenerate} onClick={() => void generate()} type="button"><RotateCcw aria-hidden="true" size={16} /> Regenerate</button><button onClick={() => formRef.current?.scrollIntoView({ block: "start" })} type="button"><ArrowLeft aria-hidden="true" size={16} /> Edit inputs</button><button onClick={reset} type="button">New script</button></div>
      </section>
    ) : undefined}>
      <div className={styles.composerCard} ref={formRef}>
        <div className={styles.composerHeader}><div><span className={styles.eyebrow}>YOUR CREATIVE BRIEF</span><h2 className="font-heading">Tell us what you&apos;re promoting</h2><p>Use only product details you can stand behind. Fields marked * are required.</p></div><Sparkles aria-hidden="true" size={25} /></div>
        <form onSubmit={(event) => { event.preventDefault(); void generate(); }}>
          <div className={styles.formSection}><h3 className="font-heading">01 · The product</h3><div className={styles.formGrid}>
            <Field count={`${form.productName.length}/${UGC_FIELD_LIMITS.productName}`} error={fieldError("productName")} id="ugc-product-name" label="Product or service name" required><input aria-describedby={fieldError("productName") ? "ugc-product-name-error" : undefined} aria-invalid={!!fieldError("productName")} id="ugc-product-name" maxLength={UGC_FIELD_LIMITS.productName} onBlur={() => touch("productName")} onChange={(event) => updateField("productName", event.target.value)} placeholder="e.g. Northline Bottle" required value={form.productName} /></Field>
            <Field count={`${form.audience.length}/${UGC_FIELD_LIMITS.audience}`} error={fieldError("audience")} id="ugc-audience" label="Target audience" required><input aria-describedby={fieldError("audience") ? "ugc-audience-error" : undefined} aria-invalid={!!fieldError("audience")} id="ugc-audience" maxLength={UGC_FIELD_LIMITS.audience} onBlur={() => touch("audience")} onChange={(event) => updateField("audience", event.target.value)} placeholder="Who should this speak to?" required value={form.audience} /></Field>
            <div className={styles.fullField}><Field count={`${form.productDescription.length}/${UGC_FIELD_LIMITS.productDescription}`} error={fieldError("productDescription")} id="ugc-product-description" label="Product details & key selling points" required><textarea aria-describedby={fieldError("productDescription") ? "ugc-product-description-error" : undefined} aria-invalid={!!fieldError("productDescription")} id="ugc-product-description" maxLength={UGC_FIELD_LIMITS.productDescription} onBlur={() => touch("productDescription")} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateField("productDescription", event.target.value)} placeholder="What does it do? Which benefits or facts are verified?" required rows={4} value={form.productDescription} /></Field></div>
          </div></div>
          <div className={styles.formSection}><h3 className="font-heading">02 · Creative direction</h3><div className={styles.formGrid}>
            <SelectField error={fieldError("platform")} id="ugc-platform" label="Platform" onBlur={() => touch("platform")} onChange={(value) => updateField("platform", value)} options={UGC_PLATFORMS} value={form.platform} />
            <SelectField error={fieldError("tone")} id="ugc-tone" label="Tone" onBlur={() => touch("tone")} onChange={(value) => updateField("tone", value)} options={UGC_TONES} value={form.tone} />
            <SelectField error={fieldError("duration")} id="ugc-duration" label="Approximate duration" onBlur={() => touch("duration")} onChange={(value) => updateField("duration", value)} options={UGC_DURATIONS} value={form.duration} />
            <SelectField error={fieldError("goal")} id="ugc-goal" label="Primary goal" onBlur={() => touch("goal")} onChange={(value) => updateField("goal", value)} options={UGC_GOALS} value={form.goal} />
            <Field count={`${form.cta.length}/${UGC_FIELD_LIMITS.cta}`} error={fieldError("cta")} id="ugc-cta" label="Preferred call to action"><input aria-describedby={fieldError("cta") ? "ugc-cta-error" : undefined} aria-invalid={!!fieldError("cta")} id="ugc-cta" maxLength={UGC_FIELD_LIMITS.cta} onBlur={() => touch("cta")} onChange={(event) => updateField("cta", event.target.value)} placeholder="e.g. Visit our product page" value={form.cta} /></Field>
            <div className={styles.fullField}><Field count={`${form.context.length}/${UGC_FIELD_LIMITS.context}`} error={fieldError("context")} id="ugc-context" label="Extra context or instructions"><textarea aria-describedby={fieldError("context") ? "ugc-context-error" : undefined} aria-invalid={!!fieldError("context")} id="ugc-context" maxLength={UGC_FIELD_LIMITS.context} onBlur={() => touch("context")} onChange={(event) => updateField("context", event.target.value)} placeholder="Any details the writer should consider? Please avoid unsupported claims." rows={3} value={form.context} /></Field></div>
          </div></div>
          <div className={styles.submitBar}><div><span className={styles.usageLine}><Sparkles aria-hidden="true" size={15} /> {usageLabel}</span><small>Soft allowance resets at 00:00 UTC. Only successful scripts count.</small></div><button className={styles.generateButton} disabled={!canGenerate} type="submit">{isGenerating ? <><LoaderCircle aria-hidden="true" className={styles.spinner} size={18} /> Creating your script…</> : <><WandSparkles aria-hidden="true" size={18} /> Generate script <ArrowRight aria-hidden="true" size={18} /></>}</button></div>
        </form>
        <div aria-live="polite" className={styles.feedback} role="status">
          {usageError ? <p className={styles.errorBanner}>Usage status is unavailable. <button onClick={() => void refreshUsage()} type="button">Retry status</button></p> : null}
          {usage && !usage.configured ? <p className={styles.infoBanner}>AI generation is not configured on this server yet. You can prepare your brief, but a server API key is needed to generate a script.</p> : null}
          {usage?.configured && usage.remaining === 0 ? <p className={styles.infoBanner}>Today&apos;s soft allowance is used. Try again after the UTC reset.</p> : null}
          {requestError ? <p className={styles.errorBanner}>{requestError}</p> : null}
          {isGenerating ? <p className={styles.infoBanner}>Creating your script… Keep this page open while the AI responds.</p> : null}
          {copyMessage ? <p className={styles.infoBanner}><Check aria-hidden="true" size={15} /> {copyMessage}</p> : null}
        </div>
      </div>
    </AiGenerationLayout>
  );
}
