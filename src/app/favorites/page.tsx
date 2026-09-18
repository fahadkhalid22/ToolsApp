import type { Metadata } from "next";

import { FavoritesLibrary } from "@/components/discovery/FavoritesLibrary";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Saved tools — ToolsApp", description: "View and organize your favorite ToolsApp utilities." };

export default function FavoritesPage() {
  return <AppShell showRecentPanel={false}><FavoritesLibrary /></AppShell>;
}
