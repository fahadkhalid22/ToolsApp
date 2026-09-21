import type { Metadata } from "next";

import { SettingsWorkspace } from "@/components/account/SettingsWorkspace";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Billing and Pro — ToolsApp",
  description: "Review the current free plan, AI allowance, and ToolsApp billing availability.",
};

export default function BillingPage() {
  return <AppShell showRecentPanel={false}><SettingsWorkspace initialTab="billing" /></AppShell>;
}
