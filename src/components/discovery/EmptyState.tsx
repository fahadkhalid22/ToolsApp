import type { ReactNode } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";

import styles from "./EmptyState.module.css";

type EmptyStateAction = {
  href: string;
  label: string;
};

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <section className={`${styles.empty} ${compact ? styles.compact : ""}`}>
      <div className={styles.ghostCards} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className={styles.icon}>{icon ?? <SearchX size={24} />}</span>
      <h2 className="font-heading">{title}</h2>
      <p>{description}</p>
      {primaryAction || secondaryAction ? (
        <div className={styles.actions}>
          {primaryAction ? (
            <Link className={styles.primary} href={primaryAction.href}>
              {primaryAction.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link className={styles.secondary} href={secondaryAction.href}>
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
