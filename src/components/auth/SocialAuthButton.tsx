import type { ButtonHTMLAttributes } from "react";

import { AuthButton } from "./AuthButton";
import styles from "./SocialAuthButton.module.css";

type SocialAuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  mode?: "login" | "signup";
};

export function SocialAuthButton({
  loading,
  mode = "login",
  ...props
}: SocialAuthButtonProps) {
  return (
    <AuthButton {...props} loading={loading} variant="secondary">
      <span className={styles.googleMark} aria-hidden="true">
        G
      </span>
      {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
    </AuthButton>
  );
}
