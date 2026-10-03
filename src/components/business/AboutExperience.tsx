import Link from "next/link";
import { ArrowRight, Braces, Calculator, Check, FileText, Image, LayoutGrid, QrCode, TextCursorInput, WandSparkles } from "lucide-react";

import { DiscoveryFooter } from "@/components/discovery/DiscoveryFooter";
import { toolCategories } from "@/data/categories";

import styles from "./BusinessPages.module.css";

const categoryIcons = [Image, FileText, Calculator, LayoutGrid, TextCursorInput, Braces, WandSparkles, QrCode] as const;

const productPrinciples = [
  { title: "Focused workflows", text: "Each tool is built around one recognizable task, with the controls and output kept together." },
  { title: "Local where practical", text: "Implemented image and PDF workflows process files in the browser. AI requests are clearly identified before provider processing." },
  { title: "Honest product states", text: "Unavailable services, practical limits, and actual output results are shown instead of being hidden behind promises." },
] as const;

export function AboutExperience() {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.aboutHero}>
        <div><span className={styles.eyebrow}>ABOUT</span><h1 className="font-heading">About ToolsApp</h1><p>ToolsApp brings 15 focused digital workflows into one browser-based workspace. It covers common file, calculation, text, developer, utility, and AI tasks without requiring an account or paid subscription.</p><div><Link className={styles.aboutPrimary} href="/tools">Browse all tools <ArrowRight aria-hidden="true" size={16} /></Link><Link className={styles.aboutSecondary} href="/support">Visit Support</Link></div></div>
        <aside aria-label="ToolsApp at a glance" className={styles.aboutSummary}><span className={styles.eyebrow}>AT A GLANCE</span><h2 className="font-heading">What the current product includes</h2><ul><li><Check aria-hidden="true" size={15} />15 available tools across eight categories</li><li><Check aria-hidden="true" size={15} />Guest use with browser-local workspace preferences</li><li><Check aria-hidden="true" size={15} />Clear file-processing and AI-provider disclosures</li></ul></aside>
      </section>
      <section className={styles.missionSection}><div><span className={styles.eyebrow}>WHY IT EXISTS</span><h2 className="font-heading">Routine digital tasks should not need a complicated setup.</h2></div><p>ToolsApp keeps related utilities in one consistent interface so people can find a task, understand its limits, and work with the result without navigating a collection of unrelated sites.</p></section>
      <section aria-labelledby="category-heading" className={styles.aboutSection}><div className={styles.sectionHeading}><span className={styles.eyebrow}>TOOL CATEGORIES</span><h2 className="font-heading" id="category-heading">Browse the current workspace</h2><p>Each category links to tools that are available in the repository today.</p></div><div className={styles.categoryBoard}>{toolCategories.map((category, index) => { const Icon = categoryIcons[index]; return <Link href={`/tools/category/${category.slug}`} key={category.id}><span><Icon aria-hidden="true" size={19} /></span><span><strong>{category.label}</strong><small>{category.description}</small></span><ArrowRight aria-hidden="true" size={15} /></Link>; })}</div></section>
      <section aria-labelledby="principles-heading" className={styles.valuesSection}><div><span className={styles.eyebrow}>PRODUCT APPROACH</span><h2 className="font-heading" id="principles-heading">Designed around the work itself</h2><p>The product favors clear inputs, understandable states, and useful outputs over decorative complexity.</p></div><div>{productPrinciples.map(({ title, text }, index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-heading">{title}</h3><p>{text}</p></div></article>)}</div></section>
      <DiscoveryFooter />
    </main>
  );
}
