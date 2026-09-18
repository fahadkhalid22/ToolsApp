import type { ReactNode } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";

import styles from "./EmptyState.module.css";

type EmptyStateAction = {
  label: string;
} & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
);

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
  function renderAction(action: EmptyStateAction, className: string) {
    return "href" in action && action.href ? (
      <Link className={className} href={action.href}>{action.label}</Link>
    ) : (
      <button className={className} onClick={action.onClick} type="button">{action.label}</button>
    );
  }

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
            renderAction(primaryAction, styles.primary)
          ) : null}
          {secondaryAction ? (
            renderAction(secondaryAction, styles.secondary)
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
