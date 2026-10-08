"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

import { toolCategories } from "@/data/categories";
import { tools } from "@/data/tools";
import { searchTools } from "@/lib/discovery/search";
import type { ToolCategoryId } from "@/types/tool";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import { DiscoveryFooter } from "./DiscoveryFooter";
import { EmptyState } from "./EmptyState";
import styles from "./DiscoveryPage.module.css";
import directoryStyles from "./ToolsDirectory.module.css";
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
      <section className={`${styles.hero} ${directoryStyles.hero}`}>
        <span className={styles.eyebrow}>Tool directory</span>
        <h1 className="font-heading">Tools for everyday work</h1>
        <p>
          Search the complete ToolsApp catalog or browse by category.
        </p>
        <nav
          className={`${styles.categoryShowcase} ${directoryStyles.categoryNav}`}
          aria-label="Browse tool categories"
        >
          {toolCategories.map((item) => (
            <Link href={`/tools/category/${item.slug}`} key={item.id}>
              <IconGlyph name={item.icon as IconName} size={17} />
              <span>{item.shortLabel}</span>
            </Link>
          ))}
        </nav>
      </section>

      <section
        className={`${styles.directory} ${directoryStyles.directory}`}
        aria-labelledby="directory-heading"
      >
        <div className={`${styles.directoryHeader} ${directoryStyles.directoryHeader}`}>
          <div>
            <h2 className="font-heading" id="directory-heading">
              All tools
            </h2>
            <p>Choose a focused utility and get straight to the task.</p>
          </div>
          <div className={`${styles.searchField} ${directoryStyles.searchField}`}>
            <Search aria-hidden="true" size={16} />
            <label className="sr-only" htmlFor="tool-directory-search">
              Search the tool directory
            </label>
            <input
              id="tool-directory-search"
              onChange={(event) => setQuery(event.target.value.slice(0, 120))}
              placeholder="Search tools..."
              type="search"
              value={query}
            />
            {query ? (
              <button
                aria-label="Clear tool search"
                className={directoryStyles.clearSearch}
                onClick={() => setQuery("")}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            ) : null}
          </div>
        </div>

        <ul
          className={`${styles.filters} ${directoryStyles.filters}`}
          aria-label="Filter tools by category"
        >
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

        <div
          className={`${styles.resultSummary} ${directoryStyles.resultSummary}`}
          aria-live="polite"
        >
          <span>{matches.length} {matches.length === 1 ? "tool" : "tools"}</span>
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
