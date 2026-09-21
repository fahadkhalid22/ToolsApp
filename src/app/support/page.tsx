import type { Metadata } from "next";

import { SupportExperience } from "@/components/business/SupportExperience";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Support — ToolsApp", description: "Search ToolsApp help topics, browse FAQs, and use the available bug-reporting channel." };

export default function SupportPage() { return <AppShell showRecentPanel={false}><SupportExperience /></AppShell>; }
