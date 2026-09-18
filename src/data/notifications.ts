export type AppNotificationTone = "success" | "info" | "warning" | "accent";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  tone: AppNotificationTone;
  href?: string;
};

export const demoNotifications: readonly AppNotification[] = [
  {
    id: "discovery-ready",
    title: "Your local library is ready",
    body: "Favorites and recent tool activity now stay available on this device.",
    timestamp: "2026-09-18T10:00:00.000Z",
    tone: "success",
    href: "/favorites",
  },
  {
    id: "new-ai-tool",
    title: "New AI tool in the directory",
    body: "The AI UGC Ad Script Generator is available to preview before its workflow launches.",
    timestamp: "2026-09-17T12:30:00.000Z",
    tone: "accent",
    href: "/tools/ai-ugc-ad-script-generator",
  },
  {
    id: "security-reminder",
    title: "Keep your account secure",
    body: "Use a unique password and verify your email when account sync becomes available.",
    timestamp: "2026-09-16T09:15:00.000Z",
    tone: "warning",
    href: "/settings",
  },
  {
    id: "browse-categories",
    title: "Browse by category",
    body: "Jump directly to image, PDF, student, developer, and other focused tool groups.",
    timestamp: "2026-09-15T08:00:00.000Z",
    tone: "info",
    href: "/tools",
  },
];
