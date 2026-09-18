"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Check, KeyRound, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authService } from "@/lib/auth/service";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/auth/validation";

import { AuthAlert } from "./AuthAlert";
import { AuthButton } from "./AuthButton";
import formStyles from "./AuthForm.module.css";
import { AuthHeader } from "./AuthHeader";
import screenStyles from "./AuthScreen.module.css";
import { AuthShell } from "./AuthShell";
import { AuthStatusPanel } from "./AuthStatusPanel";
import { PasswordField } from "./PasswordField";

export type ResetPasswordState = "new" | "sent" | "expired" | "invalid" | "success";

type ResetPasswordScreenProps = {
  email?: string;
  initialState: ResetPasswordState;
};

export function ResetPasswordScreen({ email = "", initialState }: ResetPasswordScreenProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"password" | "confirmation", string>>>({});
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (state !== "sent" || cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown, state]);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      password: validatePassword(password, "new"),
      confirmation: validatePasswordConfirmation(password, confirmation),
    };
    setErrors(nextErrors);
    setFormError("");
    if (nextErrors.password || nextErrors.confirmation) return;

    setLoading(true);
    const result = await authService.updatePassword(password);
    setLoading(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    setState("success");
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setFormError("");
    setMessage("");
    setResending(true);
    const result = await authService.requestPasswordReset(email);
    setResending(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    setCooldown(30);
    setMessage("A fresh reset link is on its way.");
  }

  if (state === "sent") {
    return (
      <AuthShell variant="status">
        <AuthStatusPanel
          icon={<MailCheck aria-hidden="true" size={34} />}
          title="Check your email"
          description="If an account matches that address, we’ve sent a secure password reset link."
        >
          {formError ? <AuthAlert>{formError}</AuthAlert> : null}
          {message ? <AuthAlert tone="success">{message}</AuthAlert> : null}
          <div className={screenStyles.highlight}>
            Look for a message sent to <strong>{email || "your inbox"}</strong>. The link will expire for your protection.
          </div>
          <ol className={screenStyles.instructionList}>
            <li>Open the email from ToolsApp.</li>
            <li>Select the secure reset link.</li>
            <li>Create a new password you don’t use elsewhere.</li>
          </ol>
          <AuthButton onClick={() => router.push("/login")} type="button">
            Return to sign in
          </AuthButton>
          <div className={screenStyles.resendRow}>
            Didn’t get it?
            <button
              className={screenStyles.inlineAction}
              disabled={!email || cooldown > 0 || resending}
              onClick={handleResend}
              type="button"
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend email"}
            </button>
          </div>
          <Link className={screenStyles.plainLink} href="/forgot-password">
            Use a different email
          </Link>
        </AuthStatusPanel>
      </AuthShell>
    );
  }

  if (state === "expired" || state === "invalid") {
    const expired = state === "expired";
    return (
      <AuthShell variant="status">
        <AuthStatusPanel
          icon={<AlertTriangle aria-hidden="true" size={34} />}
          title={expired ? "This link has expired" : "This link isn’t valid"}
          description={
            expired
              ? "For security, password reset links are time-limited. Request a fresh one to continue."
              : "The reset link may already have been used or may be incomplete. Request a new email to continue safely."
          }
          tone="error"
        >
          <AuthButton onClick={() => router.push("/forgot-password")} type="button">
            Request a new link
          </AuthButton>
          <Link className={screenStyles.plainLink} href="/login">
            Back to sign in
          </Link>
        </AuthStatusPanel>
      </AuthShell>
    );
  }

  if (state === "success") {
    return (
      <AuthShell variant="status">
        <AuthStatusPanel
          icon={<Check aria-hidden="true" size={36} strokeWidth={3} />}
          title="Password updated"
          description="Your new password is ready. You can now sign in to ToolsApp."
          tone="success"
        >
          <AuthButton onClick={() => router.push("/login")} type="button">
            Continue to sign in
          </AuthButton>
        </AuthStatusPanel>
      </AuthShell>
    );
  }

  const strength = Math.min(
    4,
    Number(password.length >= 8) +
      Number(/[A-Z]/.test(password)) +
      Number(/[0-9]/.test(password)) +
      Number(/[^A-Za-z0-9]/.test(password)),
  );

  return (
    <AuthShell>
      <AuthHeader
        icon={<KeyRound aria-hidden="true" size={25} />}
        eyebrow="Secure your account"
        title="Create a new password"
        description="Choose a password you haven’t used before."
      />
      <form className={formStyles.form} noValidate onSubmit={handleReset}>
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        <PasswordField
          autoComplete="new-password"
          error={errors.password}
          id="new-password"
          label="New password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          value={password}
        />
        <div className={screenStyles.strength} aria-label={`Password strength ${strength} of 4`}>
          {[1, 2, 3, 4].map((level) => (
            <span className={level <= strength ? screenStyles.filled : ""} key={level} />
          ))}
        </div>
        <p className={screenStyles.passwordNote}>Add a capital letter, number and symbol for a stronger password.</p>
        <PasswordField
          autoComplete="new-password"
          error={errors.confirmation}
          id="confirm-new-password"
          label="Confirm new password"
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Enter it again"
          value={confirmation}
        />
        <AuthButton loading={loading} type="submit">
          Update password
        </AuthButton>
      </form>
      <p className={formStyles.footer}>
        <Link href="/login">Cancel and return to sign in</Link>
      </p>
    </AuthShell>
  );
}
