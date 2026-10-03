import type { Metadata } from "next";
import { AboutExperience } from "@/components/business/AboutExperience";
import { AppShell } from "@/components/layout/AppShell";
export const metadata: Metadata = { title: "About — ToolsApp", description: "Learn how ToolsApp organizes 15 practical digital workflows across eight focused categories." };
export default function AboutPage() { return <AppShell showRecentPanel={false}><AboutExperience /></AppShell>; }
