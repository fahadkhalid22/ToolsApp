import Link from "next/link";
import { ArrowRight, Calculator, GraduationCap, Percent, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./CalculatorTools.module.css";

type CalculatorHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: "percentage" | "academic";
};

export function CalculatorHeader({ eyebrow, title, description, icon }: CalculatorHeaderProps) {
  const Icon = icon === "percentage" ? Percent : GraduationCap;
  return (
    <header className={styles.pageHeader}>
      <div className={styles.headingIcon}><Icon size={21} aria-hidden="true" /></div>
      <div>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <span className={styles.localBadge}><ShieldCheck size={14} aria-hidden="true" /> Private calculation</span>
    </header>
  );
}

export function CalculatorCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}

export function ResultPlaceholder({ label }: { label: string }) {
  return (
    <div className={styles.resultPlaceholder}>
      <span><Calculator size={24} aria-hidden="true" /></span>
      <h2>Your result will appear here</h2>
      <p>{label}</p>
    </div>
  );
}

export function CalculatorFooter({ current }: { current: "percentage" | "academic" }) {
  const related = current === "percentage"
    ? { href: "/tools/gpa-cgpa-calculator", icon: GraduationCap, name: "GPA & CGPA Calculator", text: "Calculate credit-weighted academic averages." }
    : { href: "/tools/percentage-calculator", icon: Percent, name: "Percentage Calculator", text: "Solve percentages and percentage change." };
  const RelatedIcon = related.icon;

  return (
    <section className={styles.relatedSection} aria-labelledby="related-tools-title">
      <div>
        <span className={styles.eyebrow}>Keep calculating</span>
        <h2 id="related-tools-title">Related tool</h2>
      </div>
      <Link href={related.href} className={styles.relatedCard}>
        <span><RelatedIcon size={20} aria-hidden="true" /></span>
        <div><strong>{related.name}</strong><small>{related.text}</small></div>
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}
