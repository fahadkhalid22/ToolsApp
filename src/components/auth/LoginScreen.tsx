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
import screenStyles from "./AuthScreen.module.css";
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
      <div className={screenStyles.brandRow}>
        <AuthBrand />
      </div>
      <AuthHeader
        title="Welcome back"
        description="Sign in to keep your everyday tools and recent work close at hand."
      />

      <form className={formStyles.form} noValidate onSubmit={handleSubmit}>
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
        <div className={formStyles.formMeta}>
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

      <AuthDivider />
      <SocialAuthButton
        loading={googleLoading}
        onClick={handleGoogle}
        type="button"
      />
      <p className={formStyles.footer}>
        New to ToolsApp? <Link href="/signup">Create an account</Link>
      </p>
    </AuthShell>
  );
}
