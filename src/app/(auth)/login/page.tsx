import type { Metadata } from "next";

import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Sign in — ToolsApp",
  description: "Sign in to your ToolsApp account.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
