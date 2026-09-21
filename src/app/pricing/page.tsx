import type { Metadata } from "next";

import { PricingExperience } from "@/components/business/PricingExperience";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Pricing and Pro — ToolsApp",
  description: "See which ToolsApp features are free today and which Pro capabilities remain clearly planned.",
};

export default function PricingPage() {
  return <AppShell showRecentPanel={false}><PricingExperience /></AppShell>;
}
