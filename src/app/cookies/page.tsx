import type { Metadata } from "next";
import { LegalExperience } from "@/components/business/LegalExperience";
import { AppShell } from "@/components/layout/AppShell";
export const metadata: Metadata = { title: "Cookie and Data Handling — ToolsApp", description: "The current ToolsApp inventory of essential cookies, browser storage, and temporary data." };
export default function CookiesPage() { return <AppShell showRecentPanel={false}><LegalExperience kind="cookies" /></AppShell>; }
