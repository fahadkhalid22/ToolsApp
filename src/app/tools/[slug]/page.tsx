import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/shared/RoutePlaceholder";
import { RecordToolOpen } from "@/components/discovery/RecordToolOpen";
import { ImageToolPage } from "@/components/image-tools/ImageToolPage";
import { PdfToolPage } from "@/components/pdf-tools/PdfToolPage";
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

const pdfToolIds = ["pdf-compressor", "merge-pdf"] as const;
type PdfToolId = (typeof pdfToolIds)[number];

function isPdfToolId(id: string): id is PdfToolId {
  return pdfToolIds.includes(id as PdfToolId);
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

  if (tool.availability === "available" && isPdfToolId(tool.id)) {
    return <><RecordToolOpen toolId={tool.id} /><PdfToolPage toolId={tool.id} /></>;
  }

  return <><RecordToolOpen toolId={tool.id} /><RoutePlaceholder description={`${tool.shortDescription} Its complete workflow is intentionally deferred to Part ${tool.futurePhase}.`} title={tool.name} /></>;
}
