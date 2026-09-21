import type { Metadata } from "next";
import { LegalExperience } from "@/components/business/LegalExperience";
import { AppShell } from "@/components/layout/AppShell";
export const metadata: Metadata = { title: "Privacy Policy — ToolsApp", description: "How ToolsApp handles browser-local data, files, AI prompts, cookies, and third-party processing." };
export default function PrivacyPage() { return <AppShell showRecentPanel={false}><LegalExperience kind="privacy" /></AppShell>; }
