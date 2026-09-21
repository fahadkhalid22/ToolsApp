import Link from "next/link";
import { ArrowRight, Braces, Calculator, FileText, Gauge, HeartHandshake, Image, LayoutGrid, QrCode, ShieldCheck, Sparkles, TextCursorInput, WandSparkles } from "lucide-react";

import { DiscoveryFooter } from "@/components/discovery/DiscoveryFooter";

import styles from "./BusinessPages.module.css";

const values = [
  { title: "Practical", text: "Focused controls, real outputs, and honest limitations instead of decorative workflows.", icon: Gauge },
  { title: "Privacy-conscious", text: "Browser-local processing and minimal history by default, with AI processing clearly disclosed.", icon: ShieldCheck },
  { title: "Accessible", text: "Keyboard-friendly controls, visible focus, semantic structure, and responsive layouts.", icon: HeartHandshake },
  { title: "Simple", text: "One calm workspace for common tasks without forcing an account or subscription.", icon: Sparkles },
] as const;

const categories = [
  { label: "Image", icon: Image }, { label: "PDF", icon: FileText }, { label: "Calculators", icon: Calculator }, { label: "Student", icon: LayoutGrid },
  { label: "Text", icon: TextCursorInput }, { label: "Developer", icon: Braces }, { label: "AI", icon: WandSparkles }, { label: "Utilities", icon: QrCode },
] as const;

export function AboutExperience() {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.aboutHero}><div><span className={styles.eyebrow}>ABOUT THIS WORKSPACE</span><h1 className="font-heading">Everyday tools should feel focused, not fragmented.</h1><p>ToolsApp is a multi-tool workspace for students, creators, developers, and anyone handling common digital tasks. Its name and identity remain intentionally temporary while the product is being completed.</p><div><Link className={styles.aboutPrimary} href="/tools">Explore all tools <ArrowRight aria-hidden="true" size={16} /></Link><Link className={styles.aboutSecondary} href="/support">Get help</Link></div></div><div aria-label="Current product facts" className={styles.factBoard}><article><strong>15</strong><span>working tools</span></article><article><strong>8</strong><span>focused categories</span></article><article><strong>1</strong><span>calm workspace</span></article><article><strong>0</strong><span>required subscriptions</span></article></div></section>
      <section className={styles.missionSection}><span className={styles.eyebrow}>WHY IT EXISTS</span><h2 className="font-heading">Useful work, with less friction.</h2><p>The goal is straightforward: make routine file, text, calculation, development, and creative tasks easy to find and honest to use. The interface emphasizes clear states, local processing where practical, and limitations users can understand before acting.</p></section>
      <section aria-labelledby="category-heading" className={styles.aboutSection}><div className={styles.sectionHeading}><span className={styles.eyebrow}>THE WORKSPACE</span><h2 className="font-heading" id="category-heading">Eight categories, one visual system</h2><p>Sunset Orange, Sora headings, Inter body text, and shared interaction patterns keep every workflow familiar.</p></div><div className={styles.categoryBoard}>{categories.map(({ label, icon: Icon }) => <article key={label}><Icon aria-hidden="true" size={21} /><strong>{label}</strong></article>)}</div></section>
      <section aria-labelledby="values-heading" className={styles.valuesSection}><div className={styles.sectionHeading}><span className={styles.eyebrow}>VALUES</span><h2 className="font-heading" id="values-heading">What guides the product</h2></div><div>{values.map(({ title, text, icon: Icon }) => <article key={title}><span><Icon aria-hidden="true" size={20} /></span><h3 className="font-heading">{title}</h3><p>{text}</p></article>)}</div></section>
      <section className={styles.aboutCta}><div><span className={styles.eyebrow}>READY WHEN YOU ARE</span><h2 className="font-heading">Choose a tool and get the task moving.</h2></div><Link href="/tools">Explore ToolsApp <ArrowRight aria-hidden="true" size={16} /></Link></section>
      <DiscoveryFooter />
    </main>
  );
}
