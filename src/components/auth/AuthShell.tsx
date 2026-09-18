import type { ReactNode } from "react";

import styles from "./AuthShell.module.css";

type AuthShellProps = {
  children: ReactNode;
  aside?: ReactNode;
  variant?: "card" | "split" | "status";
};

export function AuthShell({ children, aside, variant = "card" }: AuthShellProps) {
  return (
    <main className={styles.page}>
      <span className={styles.orbOne} aria-hidden="true" />
      <span className={styles.orbTwo} aria-hidden="true" />
      <span className={styles.curve} aria-hidden="true" />
      {variant === "split" ? (
        <section className={styles.splitPanel} aria-label="Create your account">
          <aside className={styles.splitAside}>{aside}</aside>
          <div className={styles.splitContent}>{children}</div>
        </section>
      ) : (
        <section
          className={`${styles.card} ${variant === "status" ? styles.statusCard : ""}`}
        >
          {children}
        </section>
      )}
    </main>
  );
}
