import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FileToolDemo } from "@/components/file-tools/demo/FileToolDemo";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "File workflow preview — ToolsApp",
  robots: { index: false, follow: false },
};

export default function FileToolPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <AppShell showRecentPanel={false}><FileToolDemo /></AppShell>;
}
