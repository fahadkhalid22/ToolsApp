import { AppShell } from "@/components/layout/AppShell";
import { JsonFormatterWorkspace } from "./JsonFormatterWorkspace";

export function DeveloperToolPage({}: { toolId: string }) {
  return (
    <AppShell showRecentPanel={false}>
      <JsonFormatterWorkspace />
    </AppShell>
  );
}
