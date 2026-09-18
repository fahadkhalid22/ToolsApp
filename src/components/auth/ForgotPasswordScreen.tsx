"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authService } from "@/lib/auth/service";
import { validateEmail } from "@/lib/auth/validation";

import { AuthAlert } from "./AuthAlert";
import { AuthButton } from "./AuthButton";
import { AuthField } from "./AuthField";
import formStyles from "./AuthForm.module.css";
import { AuthHeader } from "./AuthHeader";
import { AuthShell } from "./AuthShell";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = validateEmail(email);
    if (nextError) {
      setEmailError(nextError);
      setFormError("");
      return;
    }

    setEmailError("");
    setFormError("");
    setLoading(true);
    const result = await authService.requestPasswordReset(email.trim());
    setLoading(false);

    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }

    router.push(`/reset-password?state=sent&email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <AuthShell>
      <AuthHeader
        icon={<KeyRound aria-hidden="true" size={25} />}
        eyebrow="Account recovery"
        title="Forgot your password?"
        description="Enter the email linked to your account. If there’s a match, we’ll send a secure reset link."
      />
      <form className={formStyles.form} noValidate onSubmit={handleSubmit}>
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        <AuthField
          autoComplete="email"
          error={emailError}
          id="recovery-email"
          inputMode="email"
          label="Email address"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          startIcon={<Mail aria-hidden="true" size={18} />}
          type="email"
          value={email}
        />
        <AuthButton loading={loading} type="submit">
          Send reset link
        </AuthButton>
      </form>
      <p className={formStyles.footer}>
        <Link href="/login">
          <ArrowLeft aria-hidden="true" size={13} /> Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
