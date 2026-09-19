import { AppShell } from "@/components/layout/AppShell";

import { CalculatorWorkspace, type CalculatorToolId } from "./CalculatorWorkspace";

export function CalculatorToolPage({ toolId }: { toolId: CalculatorToolId }) {
  return (
    <AppShell showRecentPanel={false}>
      <CalculatorWorkspace toolId={toolId} />
    </AppShell>
  );
}
