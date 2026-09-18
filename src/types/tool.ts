export type ToolCategoryId =
  | "image"
  | "pdf"
  | "calculators"
  | "student"
  | "text"
  | "developer"
  | "ai"
  | "utilities";

export type ToolCategory =
  | "Image Tools"
  | "PDF Tools"
  | "Calculators"
  | "Student Tools"
  | "Text Tools"
  | "Developer Tools"
  | "AI Tools"
  | "Utilities";

export type ToolIconName =
  | "image-down"
  | "scan"
  | "images"
  | "file-down"
  | "files"
  | "file-image"
  | "file-text"
  | "qr-code"
  | "text-cursor-input"
  | "percent"
  | "graduation-cap"
  | "braces"
  | "sparkles";

export type ToolAvailability = "available" | "coming-soon";

export type ToolCategoryDefinition = {
  id: ToolCategoryId;
  slug: ToolCategoryId;
  label: ToolCategory;
  shortLabel: string;
  title: string;
  description: string;
  icon: ToolIconName;
};

export type Tool = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  categoryId: ToolCategoryId;
  category: ToolCategory;
  icon: ToolIconName;
  route: string;
  keywords: readonly string[];
  availability: ToolAvailability;
  featured?: boolean;
  popular?: boolean;
  new?: boolean;
  popularityWeight?: number;
  futurePhase?: number;
};
