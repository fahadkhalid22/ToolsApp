import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/shared/RoutePlaceholder";
import { RecordToolOpen } from "@/components/discovery/RecordToolOpen";
import { CalculatorToolPage } from "@/components/calculator-tools/CalculatorToolPage";
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

const pdfToolIds = ["pdf-compressor", "merge-pdf", "images-to-pdf", "pdf-to-word"] as const;
type PdfToolId = (typeof pdfToolIds)[number];

function isPdfToolId(id: string): id is PdfToolId {
  return pdfToolIds.includes(id as PdfToolId);
}

const calculatorToolIds = ["percentage-calculator", "gpa-cgpa-calculator"] as const;
type CalculatorToolId = (typeof calculatorToolIds)[number];

function isCalculatorToolId(id: string): id is CalculatorToolId {
  return calculatorToolIds.includes(id as CalculatorToolId);
}

const calculatorMetadata: Record<CalculatorToolId, Metadata> = {
  "percentage-calculator": {
    title: "Percentage Calculator — Calculate Percentages & Percentage Change",
    description: "Calculate percentages, compare values, and find percentage increases or decreases with clear formulas.",
  },
  "gpa-cgpa-calculator": {
    title: "GPA & CGPA Calculator — Weighted Grade Point Average",
    description: "Calculate credit-weighted semester GPA and cumulative CGPA with standard or custom grade points.",
  },
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((candidate) => candidate.slug === slug);
  if (tool && isCalculatorToolId(tool.id)) return calculatorMetadata[tool.id];
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

  if (tool.availability === "available" && isCalculatorToolId(tool.id)) {
    return <><RecordToolOpen toolId={tool.id} /><CalculatorToolPage toolId={tool.id} /></>;
  }

  return <><RecordToolOpen toolId={tool.id} /><RoutePlaceholder description={`${tool.shortDescription} Its complete workflow is intentionally deferred to Part ${tool.futurePhase}.`} title={tool.name} /></>;
}
