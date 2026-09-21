import Link from "next/link";
import { ArrowRight, Check, Clock3, Minus, ShieldCheck, Sparkles } from "lucide-react";

import { DiscoveryFooter } from "@/components/discovery/DiscoveryFooter";

import styles from "./BusinessPages.module.css";

const freeFeatures = [
  "All 15 current tools",
  "Browser-local favorites and history",
  "Local image, PDF, text, JSON, and QR workflows",
  "Soft daily AI allowance when a provider is configured",
] as const;

const plannedFeatures = [
  "Durable account sync across devices",
  "A durable server-backed AI allowance",
  "Subscription management and billing records",
  "Additional capabilities only after they ship",
] as const;

const comparison = [
  ["15-tool catalog", "Included", "Included"],
  ["Browser-local favorites & history", "Included", "Included"],
  ["Cross-device account sync", "Not available", "Planned"],
  ["Subscription billing", "Not required", "Planned"],
  ["AI generation", "Soft limit, provider required", "Allowance not announced"],
] as const;

export function PricingExperience() {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.pricingHero}>
        <span className={styles.heroIcon}><Sparkles aria-hidden="true" size={22} /></span>
        <span className={styles.eyebrow}>SIMPLE, HONEST ACCESS</span>
        <h1 className="font-heading">Use the tools that exist today. Free.</h1>
        <p>There is no checkout or paid subscription yet. The current catalog is available on the Free plan, while Pro remains a clearly labeled product direction.</p>
        <div className={styles.planMode}><span aria-current="true">Available now</span><span>Future plans</span></div>
      </section>

      <section aria-label="ToolsApp plans" className={styles.pricingGrid}>
        <article className={styles.planCard}>
          <div className={styles.planTop}><span className={styles.currentBadge}><Check aria-hidden="true" size={14} /> Current plan</span><h2 className="font-heading">Free</h2><p>Practical utilities with no subscription required.</p></div>
          <div className={styles.priceLine}><strong>$0</strong><span>No billing details collected</span></div>
          <Link className={styles.darkButton} href="/tools">Explore all tools <ArrowRight aria-hidden="true" size={16} /></Link>
          <ul>{freeFeatures.map((feature) => <li key={feature}><Check aria-hidden="true" size={15} /> {feature}</li>)}</ul>
        </article>

        <article className={`${styles.planCard} ${styles.highlightedPlan}`}>
          <div className={styles.planTop}><span className={styles.plannedBadge}><Clock3 aria-hidden="true" size={14} /> Planned, not for sale</span><h2 className="font-heading">Pro</h2><p>A future plan concept—not an active product or entitlement.</p></div>
          <div className={styles.priceLine}><strong>—</strong><span>Price and launch date not announced</span></div>
          <button className={styles.disabledButton} disabled type="button">Upgrade unavailable</button>
          <ul>{plannedFeatures.map((feature) => <li key={feature}><Clock3 aria-hidden="true" size={15} /> {feature}</li>)}</ul>
        </article>
      </section>

      <section aria-labelledby="compare-heading" className={styles.compareSection}>
        <div className={styles.sectionHeading}><span className={styles.eyebrow}>COMPARE</span><h2 className="font-heading" id="compare-heading">What each state really means</h2><p>Planned items are not promises of availability, pricing, or launch timing.</p></div>
        <div className={styles.comparisonTable} role="region" aria-label="Plan feature comparison" tabIndex={0}>
          <table><thead><tr><th scope="col">Capability</th><th scope="col">Free today</th><th scope="col">Pro direction</th></tr></thead><tbody>{comparison.map(([feature, free, pro]) => <tr key={feature}><th scope="row">{feature}</th><td>{free === "Included" ? <Check aria-hidden="true" size={15} /> : <Minus aria-hidden="true" size={15} />}{free}</td><td>{pro === "Included" ? <Check aria-hidden="true" size={15} /> : <Clock3 aria-hidden="true" size={15} />}{pro}</td></tr>)}</tbody></table>
        </div>
      </section>

      <section className={styles.pricingNote}><ShieldCheck aria-hidden="true" size={24} /><div><h2 className="font-heading">No hidden subscription state</h2><p>ToolsApp does not currently save cards, issue invoices, renew plans, or expose a billing portal.</p></div><Link href="/billing">Review billing status <ArrowRight aria-hidden="true" size={16} /></Link></section>
      <DiscoveryFooter />
    </main>
  );
}
