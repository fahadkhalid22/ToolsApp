import { createUgcHandlers } from "@/lib/ai/http";
import { createGeminiUgcProvider } from "@/lib/ai/provider";
import { DailyUsageStore } from "@/lib/ai/usage";

export const runtime = "nodejs";

const handlers = createUgcHandlers({ provider: createGeminiUgcProvider(), usage: new DailyUsageStore() });

export const GET = handlers.get;
export const POST = handlers.post;
