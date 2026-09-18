"use client";

import { useMemo, useState } from "react";
import { Heart, Search } from "lucide-react";

import { toolCategories } from "@/data/categories";
import { getToolById } from "@/data/tools";
import { useFavoriteToolIds } from "@/lib/discovery/local-state";
import { searchTools } from "@/lib/discovery/search";
import type { ToolCategoryId } from "@/types/tool";

import { EmptyState } from "./EmptyState";
import styles from "./LibraryPage.module.css";
import { ToolCard } from "./ToolCard";

export function FavoritesLibrary() {
  const favoriteIds = useFavoriteToolIds();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategoryId | "all">("all");
  const favorites = useMemo(
    () => favoriteIds.flatMap((id) => { const tool = getToolById(id); return tool ? [tool] : []; }),
    [favoriteIds],
  );
  const matches = useMemo(() => {
    const scoped = category === "all" ? favorites : favorites.filter((tool) => tool.categoryId === category);
    return searchTools(scoped, query);
  }, [category, favorites, query]);

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>Your library</span><h1 className="font-heading">Saved tools</h1><p>Keep frequently used utilities close and organize them by category.</p></div>
        <span className={styles.headerMeta}>{favorites.length} saved {favorites.length === 1 ? "tool" : "tools"}</span>
      </header>

      {favorites.length ? (
        <>
          <div className={styles.controls}>
            <label className={styles.search}><Search aria-hidden="true" size={16} /><span className="sr-only">Search favorites</span><input onChange={(event) => setQuery(event.target.value.slice(0, 120))} placeholder="Search saved tools..." type="search" value={query} /></label>
          </div>
          <ul className={styles.tabs} aria-label="Filter favorites by category">
            <li><button aria-pressed={category === "all"} onClick={() => setCategory("all")} type="button">All · {favorites.length}</button></li>
            {toolCategories.filter((item) => favorites.some((tool) => tool.categoryId === item.id)).map((item) => (
              <li key={item.id}><button aria-pressed={category === item.id} onClick={() => setCategory(item.id)} type="button">{item.shortLabel} · {favorites.filter((tool) => tool.categoryId === item.id).length}</button></li>
            ))}
          </ul>
          <div className={styles.summary} aria-live="polite">Showing {matches.length} saved {matches.length === 1 ? "tool" : "tools"}</div>
          {matches.length ? <div className={styles.grid}>{matches.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div> : <EmptyState compact description="Try a different keyword or category." primaryAction={{ href: "/favorites", label: "Reset filters" }} title="No saved tools match" />}
        </>
      ) : (
        <EmptyState description="Save tools from the directory and they’ll stay here across visits." icon={<Heart size={25} />} primaryAction={{ href: "/tools", label: "Explore tools" }} title="No favorites yet" />
      )}
    </main>
  );
}
