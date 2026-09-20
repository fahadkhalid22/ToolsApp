import assert from "node:assert/strict";
import test from "node:test";

import { EMPTY_UGC_INPUT, formatUgcScript, parseUgcScript, validateUgcInput } from "../src/lib/ai/ugc-contract.ts";
import { buildUgcPrompt, UGC_OUTPUT_SCHEMA, UGC_SYSTEM_INSTRUCTIONS } from "../src/lib/ai/ugc-prompt.ts";
import { AiProviderError, createOpenAiUgcProvider } from "../src/lib/ai/provider.ts";
import { createUgcHandlers } from "../src/lib/ai/http.ts";
import { DailyUsageStore } from "../src/lib/ai/usage.ts";

const validInput = {
  ...EMPTY_UGC_INPUT,
  productName: "Northline Bottle",
  productDescription: "A reusable bottle with a carry loop and double-wall insulation.",
  audience: "Commuters who carry water to work",
  goal: "Clicks",
  cta: "Visit the product page",
};

const validScript = {
  title: "A simpler commute",
  hook: "Your commute has enough to carry already.",
  scenes: [
    { sceneNumber: 1, duration: "0–5s", visual: "Pick up the bottle by its loop.", voiceover: "This comes with me every morning.", onScreenText: "Ready to go" },
    { sceneNumber: 2, duration: "5–15s", visual: "Place it beside a work bag.", voiceover: "I like the easy carry loop and insulated design.", onScreenText: "" },
  ],
  cta: "See the Northline Bottle on the product page.",
  caption: "A carry-friendly bottle for your routine.",
  alternateHooks: ["Meet your commute companion.", "The bottle I keep by the door."],
};

function providerResponse(script = validScript) {
  return { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(script) }] }] };
}

function makeRequest(input = validInput, cookie = "") {
  return new Request("http://localhost:3000/api/ai/ugc-script", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(input),
  });
}

test("UGC input validation trims fields, rejects empty/overlong values and unknown selections", () => {
  assert.equal(validateUgcInput(validInput).ok, true);
  const trimmed = validateUgcInput({ ...validInput, productName: "  Northline Bottle  ", context: undefined });
  assert.equal(trimmed.ok && trimmed.data.productName, "Northline Bottle");
  assert.equal(trimmed.ok && trimmed.data.context, "");
  const invalid = validateUgcInput({ ...validInput, productName: "  ", productDescription: "x".repeat(901), platform: "Not a platform" });
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.productName, /required/);
  assert.match(invalid.errors.productDescription, /900/);
  assert.match(invalid.errors.platform, /valid platform/);
});

test("UGC prompt includes all requested dimensions and omits empty optional context", () => {
  const prompt = buildUgcPrompt({ ...validInput, context: "" });
  for (const text of [validInput.productName, validInput.platform, validInput.tone, validInput.duration, validInput.goal, validInput.audience, validInput.cta]) {
    assert.ok(prompt.includes(text));
  }
  assert.ok(!prompt.includes("extraContext"));
  assert.ok(!prompt.includes("undefined"));
  assert.ok(!prompt.includes("null"));
  assert.match(UGC_SYSTEM_INSTRUCTIONS, /Never invent prices/);
  assert.equal(UGC_OUTPUT_SCHEMA.additionalProperties, false);
});

test("UGC response validation rejects malformed, missing and oversized sections", () => {
  assert.deepEqual(parseUgcScript(JSON.stringify(validScript)), validScript);
  assert.equal(parseUgcScript("not JSON"), null);
  assert.equal(parseUgcScript({ ...validScript, hook: "" }), null);
  assert.equal(parseUgcScript({ ...validScript, scenes: [] }), null);
  assert.equal(parseUgcScript({ ...validScript, scenes: [{ visual: "missing" }] }), null);
  assert.equal(parseUgcScript({ ...validScript, cta: "" }), null);
  assert.equal(parseUgcScript({ ...validScript, caption: "x".repeat(601) }), null);
  assert.match(formatUgcScript(validScript), /SCENE 2/);
});

test("OpenAI adapter sends server-only structured request and parses a validated script", async () => {
  let sent;
  const provider = createOpenAiUgcProvider({
    apiKey: "test-only-key",
    model: "gpt-4o-mini",
    fetcher: async (url, init) => { sent = { url, init }; return Response.json(providerResponse()); },
  });
  assert.equal(provider.isConfigured(), true);
  assert.deepEqual(await provider.generate(validInput), validScript);
  assert.equal(sent.url, "https://api.openai.com/v1/responses");
  assert.equal(sent.init.headers.Authorization, "Bearer test-only-key");
  const body = JSON.parse(sent.init.body);
  assert.equal(body.store, false);
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.model, "gpt-4o-mini");
  assert.equal(JSON.stringify(body).includes("test-only-key"), false);
});

test("provider normalizes missing configuration, timeout, rate limit, refusal and malformed output", async () => {
  await assert.rejects(createOpenAiUgcProvider({ apiKey: "" }).generate(validInput), (error) => error.code === "configuration_missing");
  const cases = [
    [async () => { throw new DOMException("Timed out", "TimeoutError"); }, "request_timeout"],
    [async () => new Response("", { status: 429 }), "provider_rate_limited"],
    [async () => new Response("", { status: 503 }), "provider_unavailable"],
    [async () => Response.json({ status: "completed", output: [{ content: [{ type: "refusal", refusal: "No" }] }] }), "safety_refusal"],
    [async () => Response.json(providerResponse({ ...validScript, hook: "" })), "malformed_response"],
  ];
  for (const [fetcher, code] of cases) {
    const provider = createOpenAiUgcProvider({ apiKey: "test", fetcher });
    await assert.rejects(provider.generate(validInput), (error) => error instanceof AiProviderError && error.code === code);
  }
});

test("soft usage counts successful generations only and resets at UTC midnight", () => {
  const usage = new DailyUsageStore();
  const today = new Date("2026-09-20T23:59:00Z");
  assert.equal(usage.status("session", today).remaining, 3);
  assert.equal(usage.reserve("session", today), true);
  assert.equal(usage.status("session", today).remaining, 2);
  usage.finish("session", "2026-09-20", false);
  assert.equal(usage.status("session", today).remaining, 3);
  usage.reserve("session", today);
  usage.finish("session", "2026-09-20", true);
  assert.equal(usage.status("session", today).remaining, 2);
  assert.equal(usage.status("session", new Date("2026-09-21T00:01:00Z")).remaining, 3);
});

test("API returns configuration and validation states without consuming allowance", async () => {
  const usage = new DailyUsageStore();
  const provider = { isConfigured: () => false, generate: async () => { throw new Error("should not call"); } };
  const handlers = createUgcHandlers({ provider, usage, createId: () => "11111111-1111-4111-8111-111111111111" });
  const status = await handlers.get(new Request("http://localhost:3000/api/ai/ugc-script"));
  assert.equal((await status.json()).usage.configured, false);
  assert.match(status.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
  const invalid = await handlers.post(makeRequest({ ...validInput, audience: "" }));
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, "invalid_request");
  const missing = await handlers.post(makeRequest());
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).usage.remaining, 3);
});

test("API validates origin and request size before invoking provider", async () => {
  let calls = 0;
  const handlers = createUgcHandlers({ provider: { isConfigured: () => true, generate: async () => { calls++; return validScript; } }, usage: new DailyUsageStore() });
  const crossOrigin = new Request("http://localhost:3000/api/ai/ugc-script", { method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: JSON.stringify(validInput) });
  assert.equal((await handlers.post(crossOrigin)).status, 403);
  const huge = makeRequest({ ...validInput, context: "x".repeat(20_000) });
  assert.equal((await handlers.post(huge)).status, 413);
  assert.equal(calls, 0);
});

test("API returns structured success, enforces three successful calls and releases failed reservations", async () => {
  let calls = 0;
  const usage = new DailyUsageStore();
  const provider = {
    isConfigured: () => true,
    generate: async () => { calls++; if (calls === 1) throw new AiProviderError("provider_rate_limited"); return validScript; },
  };
  const handlers = createUgcHandlers({ provider, usage, createId: () => "22222222-2222-4222-8222-222222222222" });
  const cookie = "toolsapp_ai_session=22222222-2222-4222-8222-222222222222";
  const failed = await handlers.post(makeRequest(validInput, cookie));
  assert.equal(failed.status, 429);
  assert.equal((await failed.json()).usage.remaining, 3);
  for (const remaining of [2, 1, 0]) {
    const response = await handlers.post(makeRequest(validInput, cookie));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.script, validScript);
    assert.equal(body.usage.remaining, remaining);
  }
  const limited = await handlers.post(makeRequest(validInput, cookie));
  assert.equal(limited.status, 429);
  assert.equal((await limited.json()).error.code, "usage_limit");
  assert.equal(calls, 4);
});
