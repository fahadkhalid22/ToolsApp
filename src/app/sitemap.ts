import type { MetadataRoute } from "next";

import { toolCategories } from "@/data/categories";
import { tools } from "@/data/tools";
import { getSiteUrl } from "@/lib/site-url";

const publicCorePaths = [
  "/",
  "/tools",
  "/about",
  "/faq",
  "/pricing",
  "/privacy",
  "/support",
  "/terms",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const paths = [
    ...publicCorePaths,
    ...toolCategories.map((category) => `/tools/category/${category.slug}`),
    ...tools
      .filter((tool) => tool.availability === "available")
      .map((tool) => tool.route),
  ];

  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
