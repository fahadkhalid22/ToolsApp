import type { InputHTMLAttributes, ReactNode } from "react";

import styles from "./AuthForm.module.css";

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  startIcon?: ReactNode;
  endAction?: ReactNode;
};

export function AuthField({
  id,
  label,
  error,
  hint,
  startIcon,
  endAction,
  className,
  ...inputProps
}: AuthFieldProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`${styles.field} ${className ?? ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.inputError : ""}`}>
        {startIcon ? <span className={styles.startIcon}>{startIcon}</span> : null}
        <input
          {...inputProps}
          aria-describedby={descriptionId}
          aria-invalid={error ? "true" : undefined}
          id={id}
        />
        {endAction}
      </div>
      {error ? (
        <p className={styles.errorText} id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
