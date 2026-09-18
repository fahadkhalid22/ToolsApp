import type { ToolCategoryDefinition, ToolCategoryId } from "@/types/tool";

export const toolCategories: readonly ToolCategoryDefinition[] = [
  {
    id: "image",
    slug: "image",
    label: "Image Tools",
    shortLabel: "Image",
    title: "Image tools",
    description: "Resize, compress, convert, and prepare images for everyday use.",
    icon: "images",
  },
  {
    id: "pdf",
    slug: "pdf",
    label: "PDF Tools",
    shortLabel: "PDF",
    title: "PDF tools",
    description: "Compress, combine, and convert documents with focused PDF utilities.",
    icon: "file-text",
  },
  {
    id: "calculators",
    slug: "calculators",
    label: "Calculators",
    shortLabel: "Calculators",
    title: "Everyday calculators",
    description: "Get quick answers for practical calculations without extra setup.",
    icon: "percent",
  },
  {
    id: "student",
    slug: "student",
    label: "Student Tools",
    shortLabel: "Student",
    title: "Student tools",
    description: "Simple academic helpers for grades, study planning, and progress.",
    icon: "graduation-cap",
  },
  {
    id: "text",
    slug: "text",
    label: "Text Tools",
    shortLabel: "Text",
    title: "Text tools",
    description: "Inspect and refine written content with lightweight text utilities.",
    icon: "text-cursor-input",
  },
  {
    id: "developer",
    slug: "developer",
    label: "Developer Tools",
    shortLabel: "Developer",
    title: "Developer tools",
    description: "Format, validate, and inspect common data used in development work.",
    icon: "braces",
  },
  {
    id: "ai",
    slug: "ai",
    label: "AI Tools",
    shortLabel: "AI",
    title: "AI tools",
    description: "Focused AI-assisted workflows for practical content creation.",
    icon: "sparkles",
  },
  {
    id: "utilities",
    slug: "utilities",
    label: "Utilities",
    shortLabel: "Utilities",
    title: "Quick utilities",
    description: "Small, useful tools for common digital tasks and sharing.",
    icon: "qr-code",
  },
];

export const categoryById = new Map<ToolCategoryId, ToolCategoryDefinition>(
  toolCategories.map((category) => [category.id, category]),
);

export function getCategoryBySlug(slug: string) {
  return toolCategories.find((category) => category.slug === slug);
}
