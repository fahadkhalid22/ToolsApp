import type { ToolCategory } from "@/types/tool";

export type NavigationItem = {
  label: string;
  href: string;
  icon:
    | "home"
    | "layout-grid"
    | "heart"
    | "history"
    | "bell"
    | "settings";
};

export const mainNavigation = [
  { label: "Home", href: "/", icon: "home" },
  { label: "All Tools", href: "/tools", icon: "layout-grid" },
  { label: "Favorites", href: "/favorites", icon: "heart" },
  { label: "History", href: "/history", icon: "history" },
  { label: "Notifications", href: "/notifications", icon: "bell" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const satisfies readonly NavigationItem[];

export const categoryNavigation: ReadonlyArray<{
  label: ToolCategory;
  href: string;
}> = [
  { label: "Image Tools", href: "/tools?category=image" },
  { label: "PDF Tools", href: "/tools?category=pdf" },
  { label: "Calculators", href: "/tools?category=calculators" },
  { label: "Student Tools", href: "/tools?category=student" },
  { label: "Developer Tools", href: "/tools?category=developer" },
  { label: "AI Tools", href: "/tools?category=ai" },
];
