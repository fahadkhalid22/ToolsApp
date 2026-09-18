import type { Metadata } from "next";

import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";

export const metadata: Metadata = {
  title: "Reset your password — ToolsApp",
  description: "Request a secure ToolsApp password reset link.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
