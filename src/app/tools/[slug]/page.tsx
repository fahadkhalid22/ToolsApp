import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/shared/RoutePlaceholder";
import { tools } from "@/data/tools";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export default async function ToolPlaceholderPage({
  params,
}: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = tools.find((candidate) => candidate.slug === slug);

  if (!tool) notFound();

  return (
    <RoutePlaceholder
      description={`${tool.shortDescription} Its complete workflow is intentionally deferred to the appropriate implementation phase.`}
      title={tool.name}
    />
  );
}
