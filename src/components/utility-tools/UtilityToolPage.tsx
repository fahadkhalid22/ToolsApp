import { AppShell } from "@/components/layout/AppShell";
import { QrGeneratorWorkspace } from "./QrGeneratorWorkspace";

export function UtilityToolPage({}: { toolId: string }) {
  return (
    <AppShell>
      <QrGeneratorWorkspace />
    </AppShell>
  );
}
