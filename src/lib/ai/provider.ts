import { parseUgcScript, type UgcInput, type UgcScript } from "./ugc-contract.ts";
import { buildUgcPrompt, UGC_OUTPUT_SCHEMA, UGC_SYSTEM_INSTRUCTIONS } from "./ugc-prompt.ts";

export type AiErrorCode =
  | "configuration_missing" | "provider_rate_limited" | "provider_unavailable"
  | "request_timeout" | "malformed_response" | "safety_refusal" | "generation_error";

export class AiProviderError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode) {
    super(code);
    this.name = "AiProviderError";
    this.code = code;
  }
}

export type UgcProvider = {
  isConfigured: () => boolean;
  generate: (input: UgcInput) => Promise<UgcScript>;
};

type FetchLike = typeof fetch;
type GeminiOptions = { fetcher?: FetchLike; timeoutMs?: number };

function parseProviderEnvelope(value: unknown): UgcScript {
  if (!value || typeof value !== "object") throw new AiProviderError("malformed_response");
  const envelope = value as { promptFeedback?: { blockReason?: unknown }; candidates?: { finishReason?: unknown; content?: { parts?: { text?: unknown; thought?: unknown }[] } }[] };
  if (envelope.promptFeedback?.blockReason) {
    throw new AiProviderError("safety_refusal");
  }
  const candidate = Array.isArray(envelope.candidates) ? envelope.candidates[0] : undefined;
  if (["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY"].includes(String(candidate?.finishReason))) {
    throw new AiProviderError("safety_refusal");
  }
  if (candidate?.finishReason !== "STOP" || !Array.isArray(candidate.content?.parts)) {
    throw new AiProviderError("malformed_response");
  }
  const text = candidate.content.parts.filter((part) => part && !part.thought && typeof part.text === "string").map((part) => part.text).join("");
  const script = parseUgcScript(text);
  if (!script) throw new AiProviderError("malformed_response");
  return script;
}

// Imported only by the Node route/handler boundary; never by client components.
export function createGeminiUgcProvider(options: GeminiOptions = {}): UgcProvider {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim() ?? "";
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;

  return {
    isConfigured: () => Boolean(apiKey),
    async generate(input) {
      if (!apiKey) throw new AiProviderError("configuration_missing");
      let response: Response;
      try {
        response = await fetcher("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
          method: "POST",
          headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: UGC_SYSTEM_INSTRUCTIONS }] },
            contents: [{ role: "user", parts: [{ text: buildUgcPrompt(input) }] }],
            generationConfig: { responseMimeType: "application/json", responseJsonSchema: UGC_OUTPUT_SCHEMA, maxOutputTokens: 8192, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
        });
      } catch (error) {
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
          throw new AiProviderError("request_timeout");
        }
        throw new AiProviderError("provider_unavailable");
      }
      if (response.status === 429) throw new AiProviderError("provider_rate_limited");
      if (response.status === 401 || response.status === 403) throw new AiProviderError("configuration_missing");
      if (!response.ok) throw new AiProviderError(response.status >= 500 ? "provider_unavailable" : "generation_error");
      let envelope: unknown;
      try {
        const body = await response.text();
        if (body.length > 120_000) throw new Error("oversized response");
        envelope = JSON.parse(body);
      } catch {
        throw new AiProviderError("malformed_response");
      }
      return parseProviderEnvelope(envelope);
    },
  };
}

export { parseProviderEnvelope };
