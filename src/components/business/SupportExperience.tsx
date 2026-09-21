"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, Bug, CircleUserRound, CreditCard, FileLock2, LifeBuoy, Search, Wrench } from "lucide-react";

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
        <span className={styles.heroIcon}><LifeBuoy aria-hidden="true" size={22} /></span><span className={styles.eyebrow}>SUPPORT</span><h1 className="font-heading">How can we help?</h1><p>Search practical help topics or choose a direct path. No message is collected or silently discarded on this page.</p>
        <label className={styles.supportSearch}><Search aria-hidden="true" size={18} /><span className="sr-only">Search support topics</span><input maxLength={120} onChange={(event) => setQuery(event.target.value)} placeholder="Search support" type="search" value={query} /></label>
      </section>

      <section aria-labelledby="quick-help-heading" className={styles.supportSection}><div className={styles.sectionHeading}><span className={styles.eyebrow}>QUICK HELP</span><h2 className="font-heading" id="quick-help-heading">Start with the right topic</h2><p>{normalized ? `${topics.length} matching support ${topics.length === 1 ? "path" : "paths"}` : "Focused shortcuts based on the features that actually exist."}</p></div>
        {topics.length ? <div className={styles.supportGrid}>{topics.map((topic) => { const Icon = topicIcons[supportTopics.indexOf(topic)]; const content = <><span className={styles.supportIcon}><Icon aria-hidden="true" size={21} /></span><h3 className="font-heading">{topic.title}</h3><p>{topic.description}</p><span className={styles.cardLink}>Open help <ArrowUpRight aria-hidden="true" size={15} /></span></>; return "external" in topic && topic.external ? <a href={topic.href} key={topic.title} rel="noreferrer" target="_blank">{content}</a> : <Link href={topic.href} key={topic.title}>{content}</Link>; })}</div> : <div className={styles.noSupportResults}><Search aria-hidden="true" size={22} /><h3 className="font-heading">No support topic matched</h3><p>Try a broader term such as files, AI, account, billing, or error.</p><button onClick={() => setQuery("")} type="button">Clear search</button></div>}
      </section>

      {answers.length ? <section aria-labelledby="matching-answers" className={styles.answerStrip}><div><span className={styles.eyebrow}>MATCHING ANSWERS</span><h2 className="font-heading" id="matching-answers">From the FAQ</h2></div><ul>{answers.map((item) => <li key={item.question}><Link href={`/faq?category=${item.category}#${item.category}`}>{item.question}<ArrowUpRight aria-hidden="true" size={14} /></Link></li>)}</ul></section> : null}

      <section aria-labelledby="contact-heading" className={styles.contactSection}><div className={styles.sectionHeading}><span className={styles.eyebrow}>CONTACT & NEXT STEPS</span><h2 className="font-heading" id="contact-heading">Real channels, no dead forms</h2><p>Choose the channel that matches what you need.</p></div><div className={styles.contactGrid}><article><strong>Product questions</strong><p>Use the FAQ for current behavior, limits, and privacy answers.</p><Link href="/faq">Browse all FAQs <ArrowUpRight aria-hidden="true" size={14} /></Link></article><article><strong>Bug reports & feedback</strong><p>The public GitHub issue form is the currently available reporting channel.</p><a href="https://github.com/fahadkhalid22/ToolsApp/issues/new" rel="noreferrer" target="_blank">Open GitHub issue <ArrowUpRight aria-hidden="true" size={14} /></a></article><article><strong>Direct email support</strong><p>No support inbox or contact-form backend is configured, so this page does not pretend to send a message.</p><span>Currently unavailable</span></article></div></section>
      <DiscoveryFooter />
    </main>
  );
}
