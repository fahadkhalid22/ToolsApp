"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { toolCategories } from "@/data/categories";
import { tools } from "@/data/tools";
import { searchTools } from "@/lib/discovery/search";
import type { ToolCategoryId } from "@/types/tool";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import { DiscoveryFooter } from "./DiscoveryFooter";
import { EmptyState } from "./EmptyState";
import styles from "./DiscoveryPage.module.css";
import { ToolCard } from "./ToolCard";

type ToolsDirectoryProps = {
  initialCategory?: ToolCategoryId | "all";
  initialQuery?: string;
};

export function ToolsDirectory({
  initialCategory = "all",
  initialQuery = "",
}: ToolsDirectoryProps) {
  const [category, setCategory] = useState<ToolCategoryId | "all">(initialCategory);
  const [query, setQuery] = useState(initialQuery);

  const matches = useMemo(() => {
    const categoryTools =
      category === "all" ? tools : tools.filter((tool) => tool.categoryId === category);
    return searchTools(categoryTools, query);
  }, [category, query]);

  return (
    <main className={styles.main} id="main-content">
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Tool directory</span>
        <h1 className="font-heading">Explore all tools</h1>
        <p>
          Browse image, PDF, calculator, student, text, developer, utility, and AI
          workflows from one focused directory.
        </p>
        <div className={styles.categoryShowcase} aria-label="Browse tool categories">
          {toolCategories.map((item) => (
            <Link href={`/tools/category/${item.slug}`} key={item.id}>
              <IconGlyph name={item.icon as IconName} size={23} />
              <span>{item.shortLabel}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.directory} aria-labelledby="directory-heading">
        <div className={styles.directoryHeader}>
          <div>
            <h2 className="font-heading" id="directory-heading">
              Find your next tool
            </h2>
            <p>Every utility in the initial ToolsApp catalog.</p>
          </div>
          <label className={styles.searchField}>
            <Search aria-hidden="true" size={16} />
            <span className="sr-only">Search the tool directory</span>
            <input
              onChange={(event) => setQuery(event.target.value.slice(0, 120))}
              placeholder="Search tools..."
              type="search"
              value={query}
            />
          </label>
        </div>

        <ul className={styles.filters} aria-label="Filter tools by category">
          <li>
            <button
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
              type="button"
            >
              All · {tools.length}
            </button>
          </li>
          {toolCategories.map((item) => {
            const count = tools.filter((tool) => tool.categoryId === item.id).length;
            return (
              <li key={item.id}>
                <button
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                  type="button"
                >
                  {item.shortLabel} · {count}
                </button>
              </li>
            );
          })}
        </ul>

        <div className={styles.resultSummary} aria-live="polite">
          <span>{matches.length} tools</span>
          {query ? <span>Results for “{query}”</span> : <span>Sorted by popularity</span>}
        </div>

        {matches.length ? (
          <div className={styles.grid}>
            {matches.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            description="Try another keyword or return to the complete catalog."
            primaryAction={{ label: "View all tools", onClick: () => { setQuery(""); setCategory("all"); } }}
            title="No tools found"
          />
        )}
      </section>
      <DiscoveryFooter />
    </main>
  );
}
