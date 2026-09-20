import { AiProviderError, type AiErrorCode, type UgcProvider } from "./provider.ts";
import { validateUgcInput } from "./ugc-contract.ts";
import { DailyUsageStore, utcDay } from "./usage.ts";

const COOKIE_NAME = "toolsapp_ai_session";
const MAX_BODY_BYTES = 16_384;

export type AiUsageStatus = ReturnType<DailyUsageStore["status"]> & { configured: boolean };
type HandlerDependencies = { provider: UgcProvider; usage: DailyUsageStore; now?: () => Date; createId?: () => string };

const safeMessages: Record<AiErrorCode, string> = {
  configuration_missing: "AI generation is not configured yet. A server API key is required.",
  provider_rate_limited: "The AI provider is busy or rate-limited. Please try again shortly.",
  provider_unavailable: "The AI provider is temporarily unavailable. Please try again.",
  request_timeout: "The request took too long. Please try again.",
  malformed_response: "The AI returned an incomplete script. Please try again.",
  safety_refusal: "The AI could not create a script for this request. Try revising the product details.",
  generation_error: "The script could not be generated. Please try again.",
};

function sessionFor(request: Request, createId: () => string) {
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.match(/(?:^|;\s*)toolsapp_ai_session=([0-9a-f-]{36})(?:;|$)/i);
  if (match) return { id: match[1], isNew: false };
  return { id: createId(), isNew: true };
}

function responseWithSession(request: Request, session: { id: string; isNew: boolean }, body: unknown, status = 200) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (session.isNew) {
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    headers.set("Set-Cookie", `${COOKIE_NAME}=${session.id}; HttpOnly; SameSite=Lax; Path=/api/ai; Max-Age=2592000${secure}`);
  }
  return Response.json(body, { status, headers });
}

async function readBoundedJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("content_type");
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new Error("too_large");
  if (!request.body) throw new Error("invalid_json");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("too_large"); }
    chunks.push(value);
  }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))); }
  catch { throw new Error("invalid_json"); }
}

export function createUgcHandlers({ provider, usage, now = () => new Date(), createId = () => crypto.randomUUID() }: HandlerDependencies) {
  const statusFor = (id: string): AiUsageStatus => ({ ...usage.status(id, now()), configured: provider.isConfigured() });
  return {
    get(request: Request) {
      const session = sessionFor(request, createId);
      return responseWithSession(request, session, { usage: statusFor(session.id) });
    },
    async post(request: Request) {
      const session = sessionFor(request, createId);
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) {
        return responseWithSession(request, session, { error: { code: "invalid_request", message: "This request is not allowed." } }, 403);
      }
      let payload: unknown;
      try { payload = await readBoundedJson(request); }
      catch (error) {
        const code = error instanceof Error ? error.message : "invalid_json";
        return responseWithSession(request, session, { error: { code: "invalid_request", message: code === "too_large" ? "The request is too large." : "Send a valid JSON request." } }, code === "too_large" ? 413 : 400);
      }
      const validation = validateUgcInput(payload);
      if (!validation.ok) return responseWithSession(request, session, { error: { code: "invalid_request", message: "Check the highlighted fields.", fields: validation.errors } }, 400);
      if (!provider.isConfigured()) return responseWithSession(request, session, { error: { code: "configuration_missing", message: safeMessages.configuration_missing }, usage: statusFor(session.id) }, 503);
      const start = now();
      if (!usage.reserve(session.id, start)) return responseWithSession(request, session, { error: { code: "usage_limit", message: "Your three successful generations for today are used. Please come back after the UTC reset." }, usage: statusFor(session.id) }, 429);
      let script;
      try {
        script = await provider.generate(validation.data);
      } catch (error) {
        usage.finish(session.id, utcDay(start), false);
        const code = error instanceof AiProviderError ? error.code : "generation_error";
        const status = code === "provider_rate_limited" ? 429 : code === "configuration_missing" || code === "provider_unavailable" ? 503 : code === "request_timeout" ? 504 : code === "safety_refusal" ? 422 : 502;
        return responseWithSession(request, session, { error: { code, message: safeMessages[code] }, usage: statusFor(session.id) }, status);
      }
      usage.finish(session.id, utcDay(start), true);
      return responseWithSession(request, session, { script, usage: statusFor(session.id) });
    },
  };
}
