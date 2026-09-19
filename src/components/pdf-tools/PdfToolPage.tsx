import { AppShell } from "@/components/layout/AppShell";

import { PdfToolWorkspace } from "./PdfToolWorkspace";

export type PdfToolId =
  | "pdf-compressor"
  | "merge-pdf"
  | "images-to-pdf"
  | "pdf-to-word";

export function PdfToolPage({ toolId }: { toolId: PdfToolId }) {
  return (
    <AppShell showRecentPanel={false}>
      <PdfToolWorkspace toolId={toolId} />
    </AppShell>
  );
}
