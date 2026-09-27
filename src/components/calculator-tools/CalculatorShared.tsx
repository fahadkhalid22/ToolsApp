import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./CalculatorTools.module.css";

type CalculatorHeaderProps = {
  title: string;
  description: string;
};

export function CalculatorHeader({ title, description }: CalculatorHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}

export function CalculatorCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}

export function ResultPlaceholder({ label }: { label: string }) {
  return (
    <div className={styles.resultPlaceholder}>
      <h2>Your result</h2>
      <p>{label}</p>
    </div>
  );
}

export function CalculatorFooter({ current }: { current: "percentage" | "academic" }) {
  const related = current === "percentage"
    ? { href: "/tools/gpa-cgpa-calculator", name: "GPA & CGPA Calculator" }
    : { href: "/tools/percentage-calculator", name: "Percentage Calculator" };

  return (
    <footer className={styles.relatedSection}>
      <p>Calculations run in your browser. Your entries are not uploaded or saved.</p>
      <Link href={related.href}>Also available: {related.name}</Link>
    </footer>
  );
}
