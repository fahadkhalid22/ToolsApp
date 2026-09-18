export type ToolCategory =
  | "Image Tools"
  | "PDF Tools"
  | "Calculators"
  | "Student Tools"
  | "Developer Tools"
  | "AI Tools";

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

export type Tool = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: ToolCategory;
  icon: ToolIconName;
  route: string;
  featured?: boolean;
  popular?: boolean;
};
