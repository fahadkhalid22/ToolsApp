import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/shared/RoutePlaceholder";
import { RecordToolOpen } from "@/components/discovery/RecordToolOpen";
import { CalculatorToolPage } from "@/components/calculator-tools/CalculatorToolPage";
import { ImageToolPage } from "@/components/image-tools/ImageToolPage";
import { PdfToolPage } from "@/components/pdf-tools/PdfToolPage";
import { TextToolPage } from "@/components/text-tools/TextToolPage";
import { UtilityToolPage } from "@/components/utility-tools/UtilityToolPage";
import { DeveloperToolPage } from "@/components/developer-tools/DeveloperToolPage";
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

const textToolIds = ["word-character-counter"] as const;
type TextToolId = (typeof textToolIds)[number];

function isTextToolId(id: string): id is TextToolId {
  return textToolIds.includes(id as TextToolId);
}

const utilityToolIds = ["qr-code-generator"] as const;
type UtilityToolId = (typeof utilityToolIds)[number];

function isUtilityToolId(id: string): id is UtilityToolId {
  return utilityToolIds.includes(id as UtilityToolId);
}

const developerToolIds = ["json-formatter-validator"] as const;
type DeveloperToolId = (typeof developerToolIds)[number];

function isDeveloperToolId(id: string): id is DeveloperToolId {
  return developerToolIds.includes(id as DeveloperToolId);
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

const part08Metadata: Record<TextToolId | UtilityToolId | DeveloperToolId, Metadata> = {
  "word-character-counter": {
    title: "Word & Character Counter — Text Statistics & Reading Time",
    description: "Count words, characters, spaces, sentences, paragraphs, and lines locally with an estimated reading time.",
  },
  "qr-code-generator": {
    title: "QR Code Generator — Download PNG & SVG Codes",
    description: "Create QR codes from text or URLs in your browser. Adjust size, quiet-zone margin, and error correction before export.",
  },
  "json-formatter-validator": {
    title: "JSON Formatter & Validator — Pretty Print, Minify & Check Syntax",
    description: "Format, minify, and validate strict JSON locally with clear syntax feedback and no data upload.",
  },
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((candidate) => candidate.slug === slug);
  if (tool && isCalculatorToolId(tool.id)) return calculatorMetadata[tool.id];
  if (tool && (isTextToolId(tool.id) || isUtilityToolId(tool.id) || isDeveloperToolId(tool.id))) {
    return part08Metadata[tool.id];
  }
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

  if (tool.availability === "available" && isTextToolId(tool.id)) {
    return <><RecordToolOpen toolId={tool.id} /><TextToolPage toolId={tool.id} /></>;
  }

  if (tool.availability === "available" && isUtilityToolId(tool.id)) {
    return <><RecordToolOpen toolId={tool.id} /><UtilityToolPage toolId={tool.id} /></>;
  }

  if (tool.availability === "available" && isDeveloperToolId(tool.id)) {
    return <><RecordToolOpen toolId={tool.id} /><DeveloperToolPage toolId={tool.id} /></>;
  }

  return <><RecordToolOpen toolId={tool.id} /><RoutePlaceholder description={`${tool.shortDescription} Its complete workflow is intentionally deferred to Part ${tool.futurePhase}.`} title={tool.name} /></>;
}
