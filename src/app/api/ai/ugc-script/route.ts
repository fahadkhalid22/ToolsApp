import { createUgcHandlers } from "@/lib/ai/http";
import { createOpenAiUgcProvider } from "@/lib/ai/provider";
import { DailyUsageStore } from "@/lib/ai/usage";

export const runtime = "nodejs";

const handlers = createUgcHandlers({ provider: createOpenAiUgcProvider(), usage: new DailyUsageStore() });

export const GET = handlers.get;
export const POST = handlers.post;
