import { AppShell } from "@/components/layout/AppShell";

export default function Home() {
  return (
    <AppShell>
      <main
        className="flex min-h-0 flex-1 items-center justify-center p-8 text-center"
        id="main-content"
      >
        <div>
          <p className="text-sm font-semibold text-primary">Workspace ready</p>
          <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-ink">
            Your everyday tools, all in one place.
          </h1>
        </div>
      </main>
    </AppShell>
  );
}
