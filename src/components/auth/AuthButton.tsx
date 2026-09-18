import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./AuthButton.module.css";

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function AuthButton({
  loading = false,
  children,
  variant = "primary",
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <button
      {...props}
      aria-busy={loading}
      className={`${styles.button} ${variant === "secondary" ? styles.secondary : ""}`}
      disabled={disabled || loading}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span>{loading ? "Please wait..." : children}</span>
    </button>
  );
}
