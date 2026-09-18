import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/shared/RoutePlaceholder";
import { RecordToolOpen } from "@/components/discovery/RecordToolOpen";
import { ImageToolPage } from "@/components/image-tools/ImageToolPage";
import { tools } from "@/data/tools";

type ImageToolId =
  | "image-compressor"
  | "image-resizer"
  | "jpg-to-png"
  | "png-to-jpg"
  | "passport-photo-maker";

const imageToolIds: readonly ImageToolId[] = [
  "image-compressor",
  "image-resizer",
  "jpg-to-png",
  "png-to-jpg",
  "passport-photo-maker",
] as const;

function isImageToolId(id: string): id is ImageToolId {
  return imageToolIds.includes(id as ImageToolId);
}

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((candidate) => candidate.slug === slug);
  return tool
    ? { title: `${tool.name} — ToolsApp`, description: tool.shortDescription }
    : { title: "Tool not found — ToolsApp" };
}

export default async function ToolPlaceholderPage({
  params,
}: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = tools.find((candidate) => candidate.slug === slug);

  if (!tool) notFound();

  if (tool.availability === "available" && isImageToolId(tool.id)) {
    return <><RecordToolOpen toolId={tool.id} /><ImageToolPage toolId={tool.id} /></>;
  }

  return <><RecordToolOpen toolId={tool.id} /><RoutePlaceholder description={`${tool.shortDescription} Its complete workflow is intentionally deferred to Part ${tool.futurePhase}.`} title={tool.name} /></>;
}
