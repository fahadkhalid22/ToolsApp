import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./AuthAlert.module.css";

type AuthAlertProps = {
  tone?: "error" | "success" | "info";
  children: ReactNode;
};

export function AuthAlert({ tone = "error", children }: AuthAlertProps) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertCircle;
  return (
    <div
      className={`${styles.alert} ${styles[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" size={17} />
      <span>{children}</span>
    </div>
  );
}
