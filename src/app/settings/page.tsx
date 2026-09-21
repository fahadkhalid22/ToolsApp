import type { Metadata } from "next";

import { SettingsWorkspace } from "@/components/account/SettingsWorkspace";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Settings — ToolsApp",
  description: "Manage your browser-local ToolsApp profile, preferences, privacy controls, and truthful billing status.",
};

export default function SettingsPage() {
  return <AppShell showRecentPanel={false}><SettingsWorkspace /></AppShell>;
}
