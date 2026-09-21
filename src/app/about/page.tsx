import type { Metadata } from "next";
import { AboutExperience } from "@/components/business/AboutExperience";
import { AppShell } from "@/components/layout/AppShell";
export const metadata: Metadata = { title: "About — ToolsApp", description: "Why ToolsApp brings 15 practical digital workflows into one focused, privacy-conscious workspace." };
export default function AboutPage() { return <AppShell showRecentPanel={false}><AboutExperience /></AppShell>; }
