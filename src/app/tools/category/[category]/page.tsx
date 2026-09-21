import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryPage } from "@/components/discovery/CategoryPage";
import { AiToolsHub } from "@/components/ai-tools/AiToolsHub";
import { AppShell } from "@/components/layout/AppShell";
import { getCategoryBySlug, toolCategories } from "@/data/categories";
import { tools } from "@/data/tools";

export function generateStaticParams() {
  return toolCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.title} — ToolsApp`,
    description: category.id === "ai" ? "Explore AI-assisted workflows and create structured UGC ad scripts for short-form video." : category.description,
  };
}

export default async function ToolCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const categoryTools = tools.filter((tool) => tool.categoryId === category.id);

  return (
    <AppShell showRecentPanel={false}>
      {category.id === "ai" ? <AiToolsHub tools={categoryTools} /> : <CategoryPage category={category} tools={categoryTools} />}
    </AppShell>
  );
}
