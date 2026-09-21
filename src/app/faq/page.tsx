import type { Metadata } from "next";

import { FaqExperience } from "@/components/business/FaqExperience";
import { AppShell } from "@/components/layout/AppShell";
import { faqCategories, type FaqCategoryId } from "@/data/support";

export const metadata: Metadata = { title: "Frequently asked questions — ToolsApp", description: "Accurate answers about ToolsApp tools, accounts, AI, billing, privacy, and file processing." };

export default async function FaqPage({ searchParams }: PageProps<"/faq">) {
  const params = await searchParams;
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const initialCategory = faqCategories.some((item) => item.id === rawCategory) ? rawCategory as FaqCategoryId : "general";
  return <AppShell showRecentPanel={false}><FaqExperience initialCategory={initialCategory} /></AppShell>;
}
