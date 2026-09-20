export const UGC_PLATFORMS = ["TikTok", "Instagram Reels", "YouTube Shorts", "Facebook / Meta", "Short-form video"] as const;
export const UGC_TONES = ["Conversational", "Energetic", "Testimonial style", "Educational", "Problem-solution", "Playful", "Premium", "Direct-response"] as const;
export const UGC_DURATIONS = ["15 seconds", "30 seconds", "45 seconds", "60 seconds"] as const;
export const UGC_GOALS = ["Awareness", "Clicks", "Leads", "Sales", "App installs", "Consideration"] as const;

export type UgcPlatform = (typeof UGC_PLATFORMS)[number];
export type UgcTone = (typeof UGC_TONES)[number];
export type UgcDuration = (typeof UGC_DURATIONS)[number];
export type UgcGoal = (typeof UGC_GOALS)[number];

export type UgcInput = {
  productName: string;
  productDescription: string;
  audience: string;
  platform: UgcPlatform;
  tone: UgcTone;
  duration: UgcDuration;
  goal: UgcGoal;
  cta: string;
  context: string;
};

export type UgcField = keyof UgcInput;
export type UgcFieldErrors = Partial<Record<UgcField, string>>;
export type UgcScene = { sceneNumber: number; duration: string; visual: string; voiceover: string; onScreenText: string };
export type UgcScript = { title: string; hook: string; scenes: UgcScene[]; cta: string; caption: string; alternateHooks: string[] };

export const UGC_FIELD_LIMITS = {
  productName: 90,
  productDescription: 900,
  audience: 180,
  cta: 160,
  context: 1200,
} as const;

export const EMPTY_UGC_INPUT: UgcInput = {
  productName: "",
  productDescription: "",
  audience: "",
  platform: "TikTok",
  tone: "Conversational",
  duration: "30 seconds",
  goal: "Awareness",
  cta: "",
  context: "",
};

type ValidationResult = { ok: true; data: UgcInput } | { ok: false; errors: UgcFieldErrors };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown, label: string, max: number, required: boolean) {
  if (!required && (value === undefined || value === null)) return { value: "" };
  if (typeof value !== "string") return { value: "", error: required ? `${label} is required.` : `${label} must be text.` };
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (required && !text) return { value: text, error: `${label} is required.` };
  if (text.length > max) return { value: text, error: `${label} must be ${max} characters or fewer.` };
  return { value: text };
}

function enumValue<T extends string>(value: unknown, options: readonly T[], label: string) {
  return typeof value === "string" && options.includes(value as T)
    ? { value: value as T }
    : { value: options[0], error: `Choose a valid ${label.toLowerCase()}.` };
}

export function validateUgcInput(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, errors: { productName: "Enter your product or service details." } };
  const productName = boundedText(value.productName, "Product or service name", UGC_FIELD_LIMITS.productName, true);
  const productDescription = boundedText(value.productDescription, "Product details", UGC_FIELD_LIMITS.productDescription, true);
  const audience = boundedText(value.audience, "Target audience", UGC_FIELD_LIMITS.audience, true);
  const cta = boundedText(value.cta, "Call to action", UGC_FIELD_LIMITS.cta, false);
  const context = boundedText(value.context, "Extra context", UGC_FIELD_LIMITS.context, false);
  const platform = enumValue(value.platform, UGC_PLATFORMS, "platform");
  const tone = enumValue(value.tone, UGC_TONES, "tone");
  const duration = enumValue(value.duration, UGC_DURATIONS, "duration");
  const goal = enumValue(value.goal, UGC_GOALS, "goal");
  const fields = { productName, productDescription, audience, cta, context, platform, tone, duration, goal };
  const errors = Object.fromEntries(Object.entries(fields).filter(([, item]) => item.error).map(([key, item]) => [key, item.error])) as UgcFieldErrors;
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      productName: productName.value,
      productDescription: productDescription.value,
      audience: audience.value,
      platform: platform.value,
      tone: tone.value,
      duration: duration.value,
      goal: goal.value,
      cta: cta.value,
      context: context.value,
    },
  };
}

function safeOutputText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export function parseUgcScript(value: unknown): UgcScript | null {
  let candidate: unknown = value;
  if (typeof candidate === "string") {
    try { candidate = JSON.parse(candidate); } catch { return null; }
  }
  if (!isRecord(candidate)) return null;
  if (!safeOutputText(candidate.title, 160) || !safeOutputText(candidate.hook, 500) ||
      !safeOutputText(candidate.cta, 400) || !safeOutputText(candidate.caption, 600)) return null;
  if (!Array.isArray(candidate.scenes) || candidate.scenes.length < 2 || candidate.scenes.length > 8) return null;
  const scenes: UgcScene[] = [];
  for (const [index, item] of candidate.scenes.entries()) {
    if (!isRecord(item) || !safeOutputText(item.duration, 60) || !safeOutputText(item.visual, 500) ||
        !safeOutputText(item.voiceover, 650) || typeof item.onScreenText !== "string" || item.onScreenText.length > 250) return null;
    scenes.push({ sceneNumber: index + 1, duration: item.duration.trim(), visual: item.visual.trim(), voiceover: item.voiceover.trim(), onScreenText: item.onScreenText.trim() });
  }
  if (!Array.isArray(candidate.alternateHooks) || candidate.alternateHooks.length < 1 || candidate.alternateHooks.length > 5 ||
      !candidate.alternateHooks.every((item) => safeOutputText(item, 350))) return null;
  return {
    title: candidate.title.trim(), hook: candidate.hook.trim(), scenes, cta: candidate.cta.trim(),
    caption: candidate.caption.trim(), alternateHooks: candidate.alternateHooks.map((item: string) => item.trim()),
  };
}

export function formatUgcScript(script: UgcScript) {
  return [
    script.title,
    `HOOK\n${script.hook}`,
    ...script.scenes.map((scene) => `SCENE ${scene.sceneNumber} · ${scene.duration}\nVisual: ${scene.visual}\nVoiceover: ${scene.voiceover}${scene.onScreenText ? `\nOn-screen text: ${scene.onScreenText}` : ""}`),
    `CALL TO ACTION\n${script.cta}`,
    `CAPTION\n${script.caption}`,
    `ALTERNATE HOOKS\n${script.alternateHooks.map((hook, index) => `${index + 1}. ${hook}`).join("\n")}`,
  ].join("\n\n");
}
