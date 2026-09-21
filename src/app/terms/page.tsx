import type { Metadata } from "next";
import { LegalExperience } from "@/components/business/LegalExperience";
import { AppShell } from "@/components/layout/AppShell";
export const metadata: Metadata = { title: "Terms of Service — ToolsApp", description: "Responsible-use terms and limitations for current ToolsApp tools, files, calculators, and AI output." };
export default function TermsPage() { return <AppShell showRecentPanel={false}><LegalExperience kind="terms" /></AppShell>; }
