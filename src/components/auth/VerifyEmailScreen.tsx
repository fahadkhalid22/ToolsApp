"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authService } from "@/lib/auth/service";

import { AuthAlert } from "./AuthAlert";
import { AuthButton } from "./AuthButton";
import screenStyles from "./AuthScreen.module.css";
import { AuthShell } from "./AuthShell";
import { AuthStatusPanel } from "./AuthStatusPanel";

export type VerifyEmailState = "pending" | "verified" | "expired" | "invalid";

type VerifyEmailScreenProps = {
  email?: string;
  initialState: VerifyEmailState;
};

export function VerifyEmailScreen({ email = "", initialState }: VerifyEmailScreenProps) {
  const router = useRouter();
  const [cooldown, setCooldown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialState !== "pending" || cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown, initialState]);

  async function handleResend(force = false) {
    if (!email || (!force && cooldown > 0)) return;
    setError("");
    setMessage("");
    setLoading(true);
    const result = await authService.resendVerification(email);
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setCooldown(30);
    setMessage("A new verification email is on its way.");
  }

  if (initialState === "verified") {
    return (
      <AuthShell variant="status">
        <AuthStatusPanel
          icon={<Check aria-hidden="true" size={36} strokeWidth={3} />}
          title="Email verified"
          description="Your account is ready. Sign in to start using your ToolsApp workspace."
          tone="success"
        >
          <AuthButton onClick={() => router.push("/login")} type="button">
            Continue to sign in
          </AuthButton>
        </AuthStatusPanel>
      </AuthShell>
    );
  }

  if (initialState === "expired" || initialState === "invalid") {
    const expired = initialState === "expired";
    return (
      <AuthShell variant="status">
        <AuthStatusPanel
          icon={<AlertTriangle aria-hidden="true" size={34} />}
          title={expired ? "Verification link expired" : "Verification link invalid"}
          description="Request a fresh email to verify your address and finish creating your account."
          tone="error"
        >
          {email ? (
            <AuthButton
              loading={loading}
              onClick={() => handleResend(true)}
              type="button"
            >
              Send a new email
            </AuthButton>
          ) : (
            <AuthButton onClick={() => router.push("/signup")} type="button">
              Return to sign up
            </AuthButton>
          )}
          <Link className={screenStyles.plainLink} href="/login">
            Back to sign in
          </Link>
        </AuthStatusPanel>
      </AuthShell>
    );
  }

  return (
    <AuthShell variant="status">
      <AuthStatusPanel
        icon={<MailCheck aria-hidden="true" size={35} />}
        title="Verify your email"
        description="We’ve sent a verification link to the address you provided. Open it to finish setting up your account."
        tone="success"
      >
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        {message ? <AuthAlert tone="success">{message}</AuthAlert> : null}
        <div className={screenStyles.highlight}>
          Verification email sent to <strong>{email || "your inbox"}</strong>
        </div>
        <ol className={screenStyles.instructionList}>
          <li>Check your inbox for an email from ToolsApp.</li>
          <li>Select “Verify email” in the message.</li>
          <li>Return here and sign in to your workspace.</li>
        </ol>
        <AuthButton onClick={() => router.push("/login")} type="button">
          Continue to sign in
        </AuthButton>
        <div className={screenStyles.resendRow}>
          Didn’t receive it?
          <button
            className={screenStyles.inlineAction}
            disabled={!email || cooldown > 0 || loading}
            onClick={() => handleResend()}
            type="button"
          >
            {loading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </button>
        </div>
        <Link className={screenStyles.plainLink} href="/signup">
          Change email address
        </Link>
      </AuthStatusPanel>
    </AuthShell>
  );
}
