import { AppShell } from "@/components/layout/AppShell";
import { WordCounterWorkspace } from "./WordCounterWorkspace";

export function TextToolPage({}: { toolId: string }) {
  return (
    <AppShell showRecentPanel={false}>
      <WordCounterWorkspace />
    </AppShell>
  );
}
