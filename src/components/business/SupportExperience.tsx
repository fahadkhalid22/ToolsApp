"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, Bug, Check, CircleUserRound, CreditCard, FileLock2, Search, Wrench, X } from "lucide-react";

import { DiscoveryFooter } from "@/components/discovery/DiscoveryFooter";
import { faqItems, supportTopics } from "@/data/support";

import styles from "./BusinessPages.module.css";

const topicIcons = [CircleUserRound, Wrench, Bot, CreditCard, FileLock2, Bug] as const;

function matchesSupportText(text: string, query: string) {
  const haystack = text.toLowerCase();
  return query.length <= 2
    ? haystack.split(/[^a-z0-9]+/).includes(query)
    : haystack.includes(query);
}

export function SupportExperience() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const topics = useMemo(() => supportTopics.filter((topic) => !normalized || matchesSupportText(`${topic.title} ${topic.description} ${topic.keywords}`, normalized)), [normalized]);
  const answers = useMemo(() => normalized.length < 2 ? [] : faqItems.filter((item) => matchesSupportText(`${item.question} ${item.answer}`, normalized)).slice(0, 4), [normalized]);

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.supportHero}>
        <span className={styles.eyebrow}>SUPPORT</span><h1 className="font-heading">Find the right help.</h1><p>Search the existing guidance or choose a support path below. ToolsApp does not collect messages on this page.</p>
        <div className={styles.supportSearchPanel}>
          <label htmlFor="support-search">Search help topics</label>
          <div className={styles.supportSearch}><Search aria-hidden="true" size={18} /><input id="support-search" maxLength={120} onChange={(event) => setQuery(event.target.value)} placeholder="Try “PDF”, “billing”, or “AI”" type="search" value={query} />{query ? <button aria-label="Clear support search" onClick={() => setQuery("")} type="button"><X aria-hidden="true" size={16} /></button> : null}</div>
          <small>Searches the help topics and FAQ answers available in this app.</small>
        </div>
      </section>

      <section aria-labelledby="quick-help-heading" className={styles.supportSection}><div className={styles.sectionHeading}><span className={styles.eyebrow}>HELP TOPICS</span><h2 className="font-heading" id="quick-help-heading">Start with an existing answer</h2><p aria-live="polite">{normalized ? `${topics.length} matching support ${topics.length === 1 ? "path" : "paths"}` : "Choose the area closest to your question."}</p></div>
        {topics.length ? <div className={styles.supportGrid}>{topics.map((topic) => { const Icon = topicIcons[supportTopics.indexOf(topic)]; const external = "external" in topic && topic.external; const content = <><span className={styles.supportIcon}><Icon aria-hidden="true" size={19} /></span><span className={styles.supportTopicCopy}><strong>{topic.title}</strong><small>{topic.description}</small></span><span className={styles.cardLink}>{external ? "Open GitHub" : "View help"} <ArrowUpRight aria-hidden="true" size={15} /></span></>; return external ? <a href={topic.href} key={topic.title} rel="noreferrer" target="_blank">{content}</a> : <Link href={topic.href} key={topic.title}>{content}</Link>; })}</div> : <div className={styles.noSupportResults}><Search aria-hidden="true" size={22} /><h3 className="font-heading">No support topic matched</h3><p>Try a broader term such as files, AI, account, billing, or error.</p><button onClick={() => setQuery("")} type="button">Clear search</button></div>}
      </section>

      {answers.length ? <section aria-labelledby="matching-answers" className={styles.answerStrip}><div><span className={styles.eyebrow}>MATCHING ANSWERS</span><h2 className="font-heading" id="matching-answers">From the FAQ</h2></div><ul>{answers.map((item) => <li key={item.question}><Link href={`/faq?category=${item.category}#${item.category}`}>{item.question}<ArrowUpRight aria-hidden="true" size={14} /></Link></li>)}</ul></section> : null}

      <section aria-labelledby="contact-heading" className={styles.contactSection}>
        <div className={styles.sectionHeading}><span className={styles.eyebrow}>CONTACT & NEXT STEPS</span><h2 className="font-heading" id="contact-heading">Report an issue through the public repository</h2><p>GitHub Issues is the only direct reporting channel currently connected.</p></div>
        <div className={styles.contactLayout}>
          <article className={styles.reportPanel}>
            <div><span className={styles.supportIcon}><Bug aria-hidden="true" size={19} /></span><div><strong>Bug reports and product feedback</strong><p>Opening the issue form takes you to GitHub. Your report will be public, so do not include passwords, API keys, private files, or personal information.</p></div></div>
            <div className={styles.reportChecklist}><h3>Useful details to include</h3><ul><li><Check aria-hidden="true" size={14} /> The tool or page where it happened</li><li><Check aria-hidden="true" size={14} /> Steps that reproduce the problem</li><li><Check aria-hidden="true" size={14} /> What you expected and what occurred</li></ul></div>
            <a className={styles.reportButton} href="https://github.com/fahadkhalid22/ToolsApp/issues/new" rel="noreferrer" target="_blank">Open public GitHub issue <ArrowUpRight aria-hidden="true" size={15} /></a>
            <small>The issue is created only after you submit it on GitHub. No response time is promised.</small>
          </article>
          <div className={styles.supportRoutes}>
            <article><strong>Have a product question?</strong><p>Browse the FAQ for current behavior, limits, billing, and privacy answers.</p><Link href="/faq">Browse all FAQs <ArrowUpRight aria-hidden="true" size={14} /></Link></article>
            <article><strong>Need private email support?</strong><p>No support inbox or contact-form backend is configured. This page does not collect or silently discard a message.</p><span>Currently unavailable</span></article>
          </div>
        </div>
      </section>
      <DiscoveryFooter />
    </main>
  );
}
