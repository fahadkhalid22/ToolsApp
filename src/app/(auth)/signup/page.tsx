import type { Metadata } from "next";

import { SignupScreen } from "@/components/auth/SignupScreen";

export const metadata: Metadata = {
  title: "Create an account — ToolsApp",
  description: "Create your ToolsApp account in three quick steps.",
};

export default function SignupPage() {
  return <SignupScreen />;
}
