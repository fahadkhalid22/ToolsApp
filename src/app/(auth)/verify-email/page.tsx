import type { Metadata } from "next";

import {
  VerifyEmailScreen,
  type VerifyEmailState,
} from "@/components/auth/VerifyEmailScreen";

export const metadata: Metadata = {
  title: "Verify your email — ToolsApp",
  description: "Verify your email address to finish setting up ToolsApp.",
};

type VerifyEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const allowedStates: readonly VerifyEmailState[] = [
  "pending",
  "verified",
  "expired",
  "invalid",
];

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const stateValue = Array.isArray(params.state) ? params.state[0] : params.state;
  const emailValue = Array.isArray(params.email) ? params.email[0] : params.email;
  const initialState = allowedStates.includes(stateValue as VerifyEmailState)
    ? (stateValue as VerifyEmailState)
    : "pending";

  return <VerifyEmailScreen email={emailValue} initialState={initialState} />;
}
