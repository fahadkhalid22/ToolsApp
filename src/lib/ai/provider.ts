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
type OpenAiOptions = { apiKey?: string; model?: string; fetcher?: FetchLike; timeoutMs?: number };

function parseProviderEnvelope(value: unknown): UgcScript {
  if (!value || typeof value !== "object") throw new AiProviderError("malformed_response");
  const envelope = value as { status?: unknown; output?: unknown; error?: unknown };
  if (envelope.status !== "completed" || !Array.isArray(envelope.output)) {
    throw new AiProviderError("malformed_response");
  }
  const content = envelope.output.flatMap((item: unknown) => {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) return [];
    return item.content;
  });
  if (content.some((item: unknown) => item && typeof item === "object" && "type" in item && item.type === "refusal")) {
    throw new AiProviderError("safety_refusal");
  }
  const textItem = content.find((item: unknown) => item && typeof item === "object" && "type" in item && item.type === "output_text");
  if (!textItem || typeof textItem !== "object" || !("text" in textItem) || typeof textItem.text !== "string") {
    throw new AiProviderError("malformed_response");
  }
  const script = parseUgcScript(textItem.text);
  if (!script) throw new AiProviderError("malformed_response");
  return script;
}

export function createOpenAiUgcProvider(options: OpenAiOptions = {}): UgcProvider {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY?.trim() ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini";
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;

  return {
    isConfigured: () => Boolean(apiKey),
    async generate(input) {
      if (!apiKey) throw new AiProviderError("configuration_missing");
      let response: Response;
      try {
        response = await fetcher("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            instructions: UGC_SYSTEM_INSTRUCTIONS,
            input: buildUgcPrompt(input),
            text: { format: { type: "json_schema", name: "ugc_ad_script", strict: true, schema: UGC_OUTPUT_SCHEMA } },
            max_output_tokens: 1_600,
            store: false,
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
