import type { Metadata } from "next";

import { HistoryLibrary } from "@/components/discovery/HistoryLibrary";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Recent tools — ToolsApp", description: "Review recent tool activity stored on this device." };

export default function HistoryPage() {
  return <AppShell showRecentPanel={false}><HistoryLibrary /></AppShell>;
}
