import type { Metadata } from "next";

import { NotificationsPage } from "@/components/discovery/NotificationsPage";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Notifications — ToolsApp",
  description: "Review local ToolsApp updates and reminders.",
};

export default function NotificationsRoute() {
  return <AppShell showRecentPanel={false}><NotificationsPage /></AppShell>;
}
