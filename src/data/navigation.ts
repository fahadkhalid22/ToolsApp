import { toolCategories } from "@/data/categories";

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

export const categoryNavigation = toolCategories.map((category) => ({
  label: category.label,
  href: `/tools/category/${category.slug}`,
}));
