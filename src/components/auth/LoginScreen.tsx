"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authService } from "@/lib/auth/service";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

import { AuthAlert } from "./AuthAlert";
import { AuthBrand } from "./AuthBrand";
import { AuthButton } from "./AuthButton";
import { AuthDivider } from "./AuthDivider";
import { AuthField } from "./AuthField";
import formStyles from "./AuthForm.module.css";
import { AuthHeader } from "./AuthHeader";
import loginStyles from "./LoginScreen.module.css";
import { AuthShell } from "./AuthShell";
import { PasswordField } from "./PasswordField";
import { SocialAuthButton } from "./SocialAuthButton";

type LoginErrors = Partial<Record<"email" | "password", string>>;

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      setFormError("");
      return;
    }

    setErrors({});
    setFormError("");
    setLoading(true);
    const result = await authService.signIn({ email: email.trim(), password, remember });
    setLoading(false);

    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }

    router.push("/");
  }

  async function handleGoogle() {
    setFormError("");
    setGoogleLoading(true);
    const result = await authService.signInWithGoogle();
    setGoogleLoading(false);
    if (!result.ok) setFormError(result.error.message);
  }

  return (
    <AuthShell>
      <div className={loginStyles.brandRow}>
        <AuthBrand />
      </div>
      <div className={loginStyles.header}>
        <AuthHeader
          title="Welcome back"
          description="Enter your email and password to continue."
        />
      </div>

      <form
        className={`${formStyles.form} ${loginStyles.form}`}
        noValidate
        onSubmit={handleSubmit}
      >
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        <AuthField
          autoComplete="email"
          error={errors.email}
          id="login-email"
          inputMode="email"
          label="Email address"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          startIcon={<Mail aria-hidden="true" size={18} />}
          type="email"
          value={email}
        />
        <PasswordField
          autoComplete="current-password"
          error={errors.password}
          id="login-password"
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          value={password}
        />
        <div className={`${formStyles.formMeta} ${loginStyles.formMeta}`}>
          <label className={formStyles.checkbox}>
            <input
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            Remember me
          </label>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
        <AuthButton loading={loading} type="submit">
          Sign in
        </AuthButton>
      </form>

      <div className={loginStyles.secondaryAction}>
        <AuthDivider />
        <SocialAuthButton
          loading={googleLoading}
          onClick={handleGoogle}
          type="button"
        />
      </div>
      <p className={`${formStyles.footer} ${loginStyles.footer}`}>
        New to ToolsApp? <Link href="/signup">Create an account</Link>
      </p>
    </AuthShell>
  );
}
