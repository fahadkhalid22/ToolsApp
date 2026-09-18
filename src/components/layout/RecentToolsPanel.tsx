"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Search } from "lucide-react";

import { getToolById, popularTools } from "@/data/tools";
import { recordToolOpen, useToolHistory } from "@/lib/discovery/local-state";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import styles from "./RecentToolsPanel.module.css";

function relativeTime(timestamp: string) {
  const difference = Date.now() - Date.parse(timestamp);
  const minutes = Math.max(1, Math.floor(difference / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export function RecentToolsPanel() {
  const [query, setQuery] = useState("");
  const history = useToolHistory();

  const recentTools = useMemo(() => {
    const entries = history.flatMap((entry) => {
      const tool = getToolById(entry.toolId);
      return tool ? [{ ...tool, time: relativeTime(entry.timestamp), status: "Opened on this device" }] : [];
    }).slice(0, 5);
    return entries.length
      ? entries
      : popularTools.slice(0, 5).map((tool) => ({ ...tool, time: "Explore", status: "Popular tool" }));
  }, [history]);

  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return recentTools;
    return recentTools.filter((tool) =>
      `${tool.name} ${tool.status}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query, recentTools]);

  return (
    <aside className={styles.panel} aria-labelledby="recent-tools-heading">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Activity</span>
          <h2 className="font-heading" id="recent-tools-heading">
            Recent tools
          </h2>
        </div>
        <Link
          aria-label="Open complete tool history"
          className={styles.historyButton}
          href="/history"
        >
          <Clock3 size={17} />
        </Link>
      </header>

      <label className={styles.searchField}>
        <Search aria-hidden="true" size={15} />
        <span className="sr-only">Search recent tools</span>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search activity..."
          type="search"
          value={query}
        />
      </label>

      <div className={styles.list} aria-live="polite">
        {matches.length ? (
          matches.map((tool) => (
            <Link className={styles.item} href={tool.route} key={`${tool.id}-${tool.time}`} onClick={() => recordToolOpen(tool.id, "history")}>
              <span className={styles.icon}>
                <IconGlyph name={tool.icon as IconName} size={17} />
              </span>
              <span className={styles.itemCopy}>
                <span className={styles.itemTopline}>
                  <strong>{tool.name}</strong>
                  <small>{tool.time}</small>
                </span>
                <span className={styles.status}>{tool.status}</span>
              </span>
            </Link>
          ))
        ) : (
          <div className={styles.emptyState}>
            <Search aria-hidden="true" size={18} />
            <span>No recent tools match “{query}”.</span>
          </div>
        )}
      </div>

      <Link className={styles.openAllLink} href="/tools">
        <span>View all tools</span>
        <ArrowUpRight aria-hidden="true" size={16} />
      </Link>
    </aside>
  );
}
