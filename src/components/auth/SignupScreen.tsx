"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authService } from "@/lib/auth/service";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/auth/validation";

import { AuthAlert } from "./AuthAlert";
import { AuthBrand } from "./AuthBrand";
import { AuthButton } from "./AuthButton";
import { AuthDivider } from "./AuthDivider";
import { AuthField } from "./AuthField";
import formStyles from "./AuthForm.module.css";
import screenStyles from "./AuthScreen.module.css";
import { AuthShell } from "./AuthShell";
import { AuthStepper, type AuthStep } from "./AuthStepper";
import { PasswordField } from "./PasswordField";
import { SocialAuthButton } from "./SocialAuthButton";

const steps: readonly AuthStep[] = [
  { label: "Your details", description: "Tell us where to reach you." },
  { label: "Secure account", description: "Choose a strong password." },
  { label: "Make it yours", description: "Pick tools for your workspace." },
];

const preferences = [
  ["Productivity", "Timers, checklists and daily focus"],
  ["Writing", "Notes, counters and text helpers"],
  ["Calculators", "Quick everyday calculations"],
  ["Planning", "Dates, schedules and decisions"],
] as const;

type SignupErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "password" | "confirmation", string>
>;

export function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function validateCurrentStep() {
    const nextErrors: SignupErrors = {};
    if (step === 1) {
      nextErrors.firstName = validateName(firstName, "First name");
      nextErrors.lastName = validateName(lastName, "Last name");
      nextErrors.email = validateEmail(email);
    }
    if (step === 2) {
      nextErrors.password = validatePassword(password, "new");
      nextErrors.confirmation = validatePasswordConfirmation(password, confirmation);
    }
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!validateCurrentStep()) return;

    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    setLoading(true);
    const result = await authService.signUp({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      preferences: selected,
    });
    setLoading(false);

    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
  }

  async function handleGoogle() {
    setFormError("");
    setGoogleLoading(true);
    const result = await authService.signInWithGoogle();
    setGoogleLoading(false);
    if (!result.ok) setFormError(result.error.message);
  }

  function togglePreference(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  const titles = ["Create your account", "Keep your account secure", "Build your workspace"];
  const descriptions = [
    "A few details and you’ll be ready to bring your everyday tools together.",
    "Use at least 8 characters. A unique password helps keep your work protected.",
    "Choose what you use most. You can always change this later.",
  ];

  const aside = (
    <div className={screenStyles.aside}>
      <AuthBrand />
      <div className={screenStyles.asideIntro}>
        <h2 className="font-heading">One calm place for the tools you use every day.</h2>
        <p>Create a focused workspace in three quick steps.</p>
      </div>
      <AuthStepper activeStep={step} steps={steps} />
      <div className={screenStyles.asideNote}>
        <ShieldCheck aria-hidden="true" size={15} />
        Your details stay private and protected.
      </div>
    </div>
  );

  return (
    <AuthShell aside={aside} variant="split">
      <div className={screenStyles.signupWidth}>
        <div className={screenStyles.stepHeading}>
          <span>Step {step} of 3</span>
          <h1 className="font-heading">{titles[step - 1]}</h1>
          <p>{descriptions[step - 1]}</p>
        </div>

        <form className={screenStyles.formStack} noValidate onSubmit={handleSubmit}>
          {formError ? <AuthAlert>{formError}</AuthAlert> : null}

          {step === 1 ? (
            <>
              <SocialAuthButton
                loading={googleLoading}
                mode="signup"
                onClick={handleGoogle}
                type="button"
              />
              <AuthDivider>or sign up with email</AuthDivider>
              <div className={formStyles.formRow}>
                <AuthField
                  autoComplete="given-name"
                  error={errors.firstName}
                  id="signup-first-name"
                  label="First name"
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Alex"
                  value={firstName}
                />
                <AuthField
                  autoComplete="family-name"
                  error={errors.lastName}
                  id="signup-last-name"
                  label="Last name"
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Morgan"
                  value={lastName}
                />
              </div>
              <AuthField
                autoComplete="email"
                error={errors.email}
                id="signup-email"
                inputMode="email"
                label="Email address"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                startIcon={<Mail aria-hidden="true" size={18} />}
                type="email"
                value={email}
              />
              <div className={screenStyles.singleButton}>
                <AuthButton type="submit">Continue</AuthButton>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <PasswordField
                autoComplete="new-password"
                error={errors.password}
                hint="At least 8 characters"
                id="signup-password"
                label="Password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                value={password}
              />
              <PasswordField
                autoComplete="new-password"
                error={errors.confirmation}
                id="signup-confirmation"
                label="Confirm password"
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Enter it again"
                value={confirmation}
              />
              <div className={screenStyles.buttonRow}>
                <AuthButton
                  onClick={() => {
                    setErrors({});
                    setStep(1);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Back
                </AuthButton>
                <AuthButton type="submit">Continue</AuthButton>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className={screenStyles.preferenceGrid}>
                {preferences.map(([label, description]) => {
                  const isSelected = selected.includes(label);
                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`${screenStyles.preference} ${isSelected ? screenStyles.preferenceSelected : ""}`}
                      key={label}
                      onClick={() => togglePreference(label)}
                      type="button"
                    >
                      {isSelected ? <CheckCircle2 aria-hidden="true" size={17} /> : null}
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </button>
                  );
                })}
              </div>
              <div className={screenStyles.buttonRow}>
                <AuthButton onClick={() => setStep(2)} type="button" variant="secondary">
                  Back
                </AuthButton>
                <AuthButton loading={loading} type="submit">
                  Create account
                </AuthButton>
              </div>
            </>
          ) : null}
        </form>

        <div className={screenStyles.stepDots} aria-hidden="true">
          {[1, 2, 3].map((number) => (
            <span className={number === step ? screenStyles.activeDot : ""} key={number} />
          ))}
        </div>
        <p className={formStyles.footer}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
