import type { ReactNode } from "react";

import styles from "./AuthForm.module.css";

type AuthHeaderProps = {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: ReactNode;
};

export function AuthHeader({ icon, eyebrow, title, description }: AuthHeaderProps) {
  return (
    <header className={styles.header}>
      {icon ? <span className={styles.headerIcon}>{icon}</span> : null}
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      <h1 className="font-heading">{title}</h1>
      <div className={styles.description}>{description}</div>
    </header>
  );
}
