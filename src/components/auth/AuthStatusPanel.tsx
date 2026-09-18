import type { ReactNode } from "react";

import styles from "./AuthStatusPanel.module.css";

type AuthStatusPanelProps = {
  children: ReactNode;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  tone?: "success" | "info" | "error";
};

export function AuthStatusPanel({
  children,
  icon,
  title,
  description,
  tone = "info",
}: AuthStatusPanelProps) {
  return (
    <div className={styles.layout}>
      <div className={`${styles.icon} ${styles[tone]}`}>{icon}</div>
      <div className={styles.heading}>
        <h1 className="font-heading">{title}</h1>
        <div>{description}</div>
      </div>
      <div className={styles.actions}>{children}</div>
    </div>
  );
}
