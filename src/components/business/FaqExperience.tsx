"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

import { DiscoveryFooter } from "@/components/discovery/DiscoveryFooter";
import { faqCategories, faqItems, type FaqCategoryId } from "@/data/support";

import styles from "./BusinessPages.module.css";

export function FaqExperience({ initialCategory = "general" }: { initialCategory?: FaqCategoryId }) {
  const [category, setCategory] = useState<FaqCategoryId>(initialCategory);
  const visible = faqItems.filter((item) => item.category === category);
  const categoryLabel = faqCategories.find((item) => item.id === category)?.label ?? "General";

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.faqHero}><span className={styles.heroIcon}><HelpCircle aria-hidden="true" size={22} /></span><span className={styles.eyebrow}>FREQUENTLY ASKED QUESTIONS</span><h1 className="font-heading">Clear answers about how ToolsApp works.</h1><p>Behavior, limits, privacy, AI, billing, and account answers grounded in the current implementation.</p></section>
      <section className={styles.faqShell}>
        <aside aria-label="FAQ categories"><span className={styles.eyebrow}>CATEGORIES</span><h2 className="font-heading">Find your topic</h2><nav>{faqCategories.map((item) => <button aria-current={category === item.id ? "page" : undefined} id={item.id} key={item.id} onClick={() => setCategory(item.id)} type="button">{item.label}</button>)}</nav></aside>
        <div className={styles.faqList}><div className={styles.faqListHeading}><span>{categoryLabel}</span><strong>{visible.length} questions</strong></div>{visible.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><ChevronDown aria-hidden="true" size={18} /></summary><p>{item.answer}</p></details>)}</div>
      </section>
      <DiscoveryFooter />
    </main>
  );
}
