import type { Metadata } from "next";

import { ToolsDirectory } from "@/components/discovery/ToolsDirectory";
import { AppShell } from "@/components/layout/AppShell";
import { toolCategories } from "@/data/categories";
import type { ToolCategoryId } from "@/types/tool";

export const metadata: Metadata = {
  title: "All tools — ToolsApp",
  description: "Browse all image, PDF, calculator, student, developer, text, utility, and AI tools.",
};

type ToolsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;
  const queryValue = Array.isArray(params.q)
    ? params.q[0]
    : Array.isArray(params.query)
      ? params.query[0]
      : params.q ?? params.query;
  const categoryValue = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const initialCategory = toolCategories.some((item) => item.id === categoryValue)
    ? (categoryValue as ToolCategoryId)
    : "all";

  return (
    <AppShell showRecentPanel={false}>
      <ToolsDirectory initialCategory={initialCategory} initialQuery={queryValue?.slice(0, 120)} />
    </AppShell>
  );
}
