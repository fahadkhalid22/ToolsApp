import Link from "next/link";
import { ArrowRight, Check, Clock3, ShieldCheck } from "lucide-react";

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
        <span className={styles.eyebrow}>PRICING</span>
        <h1 className="font-heading">Simple pricing, no subscription.</h1>
        <p>ToolsApp is Free today. There is no checkout, paid entitlement, or recurring charge; Pro is a future direction and is not available to purchase.</p>
        <div className={styles.availabilitySummary} aria-label="Plan availability">
          <span><small>Available now</small><strong><Check aria-hidden="true" size={14} /> Free</strong></span>
          <span><small>Future direction</small><strong><Clock3 aria-hidden="true" size={14} /> Pro, not for sale</strong></span>
        </div>
      </section>

      <section aria-label="ToolsApp plans" className={styles.pricingGrid}>
        <article className={`${styles.planCard} ${styles.currentPlanCard}`}>
          <div className={styles.planTop}><span className={styles.currentBadge}><Check aria-hidden="true" size={14} /> Current plan</span><h2 className="font-heading">Free</h2><p>Practical utilities with no subscription required.</p></div>
          <div className={styles.priceLine}><strong>$0</strong><span>Free to use · no billing details collected</span></div>
          <Link className={styles.darkButton} href="/tools">Explore all tools <ArrowRight aria-hidden="true" size={16} /></Link>
          <div className={styles.featureBlock}><h3>Included today</h3><ul>{freeFeatures.map((feature) => <li key={feature}><Check aria-hidden="true" size={15} /> {feature}</li>)}</ul></div>
        </article>

        <article className={`${styles.planCard} ${styles.plannedPlan}`}>
          <div className={styles.planTop}><span className={styles.plannedBadge}><Clock3 aria-hidden="true" size={14} /> Planned, not for sale</span><h2 className="font-heading">Pro</h2><p>A future plan concept—not an active product or entitlement.</p></div>
          <div className={styles.priceLine}><strong>—</strong><span>Price and launch date not announced</span></div>
          <div className={styles.unavailableState}>Not available to purchase</div>
          <div className={styles.featureBlock}><h3>Ideas under consideration</h3><ul>{plannedFeatures.map((feature) => <li key={feature}><Clock3 aria-hidden="true" size={15} /> {feature}</li>)}</ul></div>
        </article>
      </section>

      <section aria-labelledby="compare-heading" className={styles.compareSection}>
        <div className={styles.sectionHeading}><span className={styles.eyebrow}>PLAN DETAILS</span><h2 className="font-heading" id="compare-heading">Available today, clearly separated from planned.</h2><p>Planned items are product ideas, not promises of availability, pricing, or launch timing.</p></div>
        <div className={styles.comparisonList}>
          <div className={styles.comparisonHeader} aria-hidden="true"><span>Capability</span><span>Free today</span><span>Pro direction</span></div>
          {comparison.map(([feature, free, pro]) => <article key={feature}><h3>{feature}</h3><div><small>Free today</small><span>{free}</span></div><div><small>Pro direction</small><span>{pro}</span></div></article>)}
        </div>
      </section>

      <section className={styles.pricingNote}><ShieldCheck aria-hidden="true" size={24} /><div><h2 className="font-heading">No hidden subscription state</h2><p>ToolsApp does not currently save cards, issue invoices, renew plans, or expose a billing portal.</p></div><Link href="/billing">Review billing status <ArrowRight aria-hidden="true" size={16} /></Link></section>
      <DiscoveryFooter />
    </main>
  );
}
