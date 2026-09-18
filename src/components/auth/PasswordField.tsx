"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { AuthField } from "./AuthField";
import styles from "./AuthForm.module.css";

type PasswordFieldProps = Omit<
  ComponentProps<typeof AuthField>,
  "type" | "startIcon" | "endAction"
>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      {...props}
      endAction={
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          className={styles.passwordToggle}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
      startIcon={<LockKeyhole aria-hidden="true" size={18} />}
      type={visible ? "text" : "password"}
    />
  );
}
