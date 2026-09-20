export const DAILY_FREE_GENERATIONS = 3;

type UsageEntry = { day: string; successful: number; inFlight: number };

export function utcDay(now: Date) { return now.toISOString().slice(0, 10); }
export function nextUtcMidnight(now: Date) {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString();
}

/** Per-process, cookie-scoped allowance. This is a soft cost guard, not an entitlement. */
export class DailyUsageStore {
  private entries = new Map<string, UsageEntry>();

  private entry(id: string, now: Date) {
    const day = utcDay(now);
    const existing = this.entries.get(id);
    if (existing?.day === day) return existing;
    if (this.entries.size > 10_000) {
      for (const [key, item] of this.entries) if (item.day !== day) this.entries.delete(key);
      if (this.entries.size > 10_000) this.entries.delete(this.entries.keys().next().value!);
    }
    const entry = { day, successful: 0, inFlight: 0 };
    this.entries.set(id, entry);
    return entry;
  }

  status(id: string, now: Date) {
    const entry = this.entry(id, now);
    return { limit: DAILY_FREE_GENERATIONS, remaining: Math.max(0, DAILY_FREE_GENERATIONS - entry.successful - entry.inFlight), resetAt: nextUtcMidnight(now), softLimit: true as const };
  }

  reserve(id: string, now: Date) {
    const entry = this.entry(id, now);
    if (entry.successful + entry.inFlight >= DAILY_FREE_GENERATIONS) return false;
    entry.inFlight += 1;
    return true;
  }

  finish(id: string, day: string, successful: boolean) {
    const entry = this.entries.get(id);
    if (!entry || entry.day !== day) return;
    entry.inFlight = Math.max(0, entry.inFlight - 1);
    if (successful) entry.successful += 1;
  }
}
