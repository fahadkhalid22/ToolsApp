import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Tool, ToolCategoryDefinition } from "@/types/tool";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import { DiscoveryFooter } from "./DiscoveryFooter";
import { EmptyState } from "./EmptyState";
import styles from "./ImageCategoryPage.module.css";
import { ToolCard } from "./ToolCard";

type ImageCategoryPageProps = {
  category: ToolCategoryDefinition;
  tools: readonly Tool[];
};

export function ImageCategoryPage({ category, tools }: ImageCategoryPageProps) {
  return (
    <main className={styles.main} id="main-content">
      <section className={styles.intro}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/tools">All tools</Link>
          <ChevronRight aria-hidden="true" size={13} />
          <span aria-current="page">{category.shortLabel}</span>
        </nav>
        <div className={styles.headingRow}>
          <span className={styles.categoryIcon} aria-hidden="true">
            <IconGlyph name={category.icon as IconName} size={23} />
          </span>
          <div>
            <span className={styles.eyebrow}>Image workflows</span>
            <h1 className="font-heading">{category.title}</h1>
            <p>{category.description}</p>
          </div>
        </div>
      </section>

      <section className={styles.toolsSection} aria-labelledby="image-tools-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 className="font-heading" id="image-tools-heading">
              Choose an image tool
            </h2>
            <p>Pick the utility that matches the image task you need to complete.</p>
          </div>
          <span>{tools.length} {tools.length === 1 ? "tool" : "tools"}</span>
        </div>

        {tools.length ? (
          <div className={styles.grid}>
            {tools.map((tool) => (
              <ToolCard compact key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="New image utilities will appear here as the catalog grows."
            primaryAction={{ href: "/tools", label: "Explore tools" }}
            title="No image tools available"
          />
        )}
      </section>

      <section className={styles.directoryLink}>
        <div>
          <h2 className="font-heading">Looking for another kind of tool?</h2>
          <p>Browse the complete ToolsApp directory by task or category.</p>
        </div>
        <Link href="/tools">Browse all tools</Link>
      </section>
      <DiscoveryFooter />
    </main>
  );
}
