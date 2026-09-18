import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { ToolCategoryDefinition, Tool } from "@/types/tool";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import { DiscoveryFooter } from "./DiscoveryFooter";
import { EmptyState } from "./EmptyState";
import styles from "./DiscoveryPage.module.css";
import { ToolCard } from "./ToolCard";

type CategoryPageProps = {
  category: ToolCategoryDefinition;
  tools: readonly Tool[];
};

export function CategoryPage({ category, tools }: CategoryPageProps) {
  return (
    <main className={styles.main} id="main-content">
      <section className={styles.categoryHero}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/tools">All tools</Link>
          <ChevronRight aria-hidden="true" size={13} />
          <span aria-current="page">{category.shortLabel}</span>
        </nav>
        <span className={styles.categoryIcon}>
          <IconGlyph name={category.icon as IconName} size={29} />
        </span>
        <h1 className="font-heading">{category.title}</h1>
        <p>{category.description}</p>
      </section>

      <section className={styles.categorySection} aria-labelledby="category-tools-heading">
        <h2 className="font-heading" id="category-tools-heading">
          Discover {category.shortLabel.toLowerCase()} tools
        </h2>
        <p>{tools.length} focused {tools.length === 1 ? "utility" : "utilities"} in this category.</p>
        {tools.length ? (
          <div className={styles.grid}>
            {tools.map((tool) => (
              <ToolCard compact key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="New utilities will appear here as the catalog grows."
            primaryAction={{ href: "/tools", label: "Explore tools" }}
            title="No tools in this category yet"
          />
        )}
      </section>

      <section className={styles.ctaStrip}>
        <div>
          <h2 className="font-heading">Need a different utility?</h2>
          <p>Browse the complete directory across every ToolsApp category.</p>
        </div>
        <Link href="/tools">Explore all tools</Link>
      </section>
      <DiscoveryFooter />
    </main>
  );
}
