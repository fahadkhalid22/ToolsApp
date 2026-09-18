import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Wrench } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";

type RoutePlaceholderProps = {
  title: string;
  description: string;
};

export function RoutePlaceholder({ title, description }: RoutePlaceholderProps) {
  return (
    <AppShell>
      <main
        className="flex min-h-0 flex-1 items-center justify-center px-6 py-14"
        id="main-content"
      >
        <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-[var(--shadow-card)] sm:p-11">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-soft-orange text-primary">
            <Wrench aria-hidden="true" size={22} />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            Part 01 foundation
          </p>
          <h1 className="font-heading mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">
            {description}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-xs font-semibold text-white transition hover:bg-slate-800"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Back home
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line px-5 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-primary-hover"
              href="/tools"
            >
              Browse tools
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
