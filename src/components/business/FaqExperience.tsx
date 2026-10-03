"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Search, X } from "lucide-react";

import { DiscoveryFooter } from "@/components/discovery/DiscoveryFooter";
import { faqCategories, faqItems, filterFaqItems, type FaqCategoryId } from "@/data/support";

import styles from "./BusinessPages.module.css";

export function FaqExperience({ initialCategory = "general" }: { initialCategory?: FaqCategoryId }) {
  const [category, setCategory] = useState<FaqCategoryId>(initialCategory);
  const [query, setQuery] = useState("");
  const [openQuestions, setOpenQuestions] = useState<ReadonlySet<string>>(() => new Set([faqItems.find((item) => item.category === initialCategory)?.question ?? ""]));
  const normalizedQuery = query.trim();
  const visible = useMemo(() => normalizedQuery ? filterFaqItems(normalizedQuery) : faqItems.filter((item) => item.category === category), [category, normalizedQuery]);
  const categoryLabel = faqCategories.find((item) => item.id === category)?.label ?? "General";

  function selectCategory(nextCategory: FaqCategoryId) {
    setCategory(nextCategory);
    setQuery("");
    setOpenQuestions(new Set([faqItems.find((item) => item.category === nextCategory)?.question ?? ""]));
  }

  function clearSearch() {
    setQuery("");
    setOpenQuestions(new Set([faqItems.find((item) => item.category === category)?.question ?? ""]));
  }

  function toggleQuestion(question: string, open: boolean) {
    setOpenQuestions((current) => {
      const next = new Set(current);
      if (open) next.add(question);
      else next.delete(question);
      return next;
    });
  }

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.faqHero}>
        <span className={styles.eyebrow}>HELP CENTER</span>
        <h1 className="font-heading">Frequently asked questions</h1>
        <p>Find accurate answers about tools, accounts, AI, billing, privacy, and file processing.</p>
        <div className={styles.faqSearchPanel}>
          <label htmlFor="faq-search">Search questions and answers</label>
          <div className={styles.faqSearch}><Search aria-hidden="true" size={18} /><input id="faq-search" maxLength={120} onChange={(event) => { setQuery(event.target.value); setOpenQuestions(new Set()); }} placeholder="Try “PDF”, “account”, or “billing”" type="search" value={query} />{query ? <button aria-label="Clear FAQ search" onClick={clearSearch} type="button"><X aria-hidden="true" size={16} /></button> : null}</div>
        </div>
      </section>
      <section className={styles.faqShell}>
        <aside aria-label="FAQ categories"><span className={styles.eyebrow}>CATEGORIES</span><h2 className="font-heading">Browse by topic</h2><nav>{faqCategories.map((item) => <button aria-pressed={!normalizedQuery && category === item.id} id={item.id} key={item.id} onClick={() => selectCategory(item.id)} type="button">{item.label}</button>)}</nav></aside>
        <div className={styles.faqList}>
          <div className={styles.faqListHeading}><span>{normalizedQuery ? "Search results" : categoryLabel}</span><strong aria-live="polite">{visible.length} {visible.length === 1 ? "question" : "questions"}</strong></div>
          {visible.length ? visible.map((item) => <details key={`${normalizedQuery ? "search" : category}-${item.question}`} onToggle={(event) => toggleQuestion(item.question, event.currentTarget.open)} open={openQuestions.has(item.question)}><summary><span>{item.question}{normalizedQuery ? <small>{faqCategories.find((entry) => entry.id === item.category)?.label}</small> : null}</span><ChevronDown aria-hidden="true" size={18} /></summary><p>{item.answer}</p></details>) : <div className={styles.faqEmpty}><Search aria-hidden="true" size={22} /><h2 className="font-heading">No matching questions found</h2><p>Try a broader term, choose a category, or visit Support for the available help paths.</p><div><button onClick={clearSearch} type="button">Clear search</button><Link href="/support">Visit Support <ArrowUpRight aria-hidden="true" size={14} /></Link></div></div>}
        </div>
      </section>
      <section className={styles.faqSupport}><div><span className={styles.eyebrow}>STILL NEED HELP?</span><h2 className="font-heading">Choose an available support path</h2><p>Browse practical guidance or open the public issue channel from the Support page.</p></div><Link href="/support">Go to Support <ArrowUpRight aria-hidden="true" size={15} /></Link></section>
      <DiscoveryFooter />
    </main>
  );
}
