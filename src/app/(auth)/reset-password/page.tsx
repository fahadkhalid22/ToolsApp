import type { Metadata } from "next";

import {
  ResetPasswordScreen,
  type ResetPasswordState,
} from "@/components/auth/ResetPasswordScreen";

export const metadata: Metadata = {
  title: "Choose a new password — ToolsApp",
  description: "Choose a new password for your ToolsApp account.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const allowedStates: readonly ResetPasswordState[] = [
  "new",
  "sent",
  "expired",
  "invalid",
  "success",
];

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const stateValue = Array.isArray(params.state) ? params.state[0] : params.state;
  const emailValue = Array.isArray(params.email) ? params.email[0] : params.email;
  const initialState = allowedStates.includes(stateValue as ResetPasswordState)
    ? (stateValue as ResetPasswordState)
    : "new";

  return <ResetPasswordScreen email={emailValue} initialState={initialState} />;
}
