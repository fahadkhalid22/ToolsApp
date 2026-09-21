import { AppShell } from "@/components/layout/AppShell";
import { UgcGeneratorWorkspace } from "./UgcGeneratorWorkspace";

export function AiToolPage() {
  return <AppShell showRecentPanel={false}><UgcGeneratorWorkspace /></AppShell>;
}
