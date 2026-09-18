"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Search } from "lucide-react";

import { tools } from "@/data/tools";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import styles from "./RecentToolsPanel.module.css";

const recentToolIds = [
  "image-compressor",
  "passport-photo-maker",
  "gpa-cgpa-calculator",
  "pdf-compressor",
  "qr-code-generator",
] as const;

const recentMeta = [
  { time: "8 min ago", status: "Compressed 3 images" },
  { time: "1 hr ago", status: "Created a 35 × 45 mm photo" },
  { time: "Yesterday", status: "Calculated 3.72 GPA" },
  { time: "2 days ago", status: "Reduced a PDF by 64%" },
  { time: "3 days ago", status: "Created a URL code" },
] as const;

const recentTools = recentToolIds.flatMap((id, index) => {
  const tool = tools.find((candidate) => candidate.id === id);
  return tool ? [{ ...tool, ...recentMeta[index] }] : [];
});

export function RecentToolsPanel() {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return recentTools;
    return recentTools.filter((tool) =>
      `${tool.name} ${tool.status}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

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
            <Link className={styles.item} href={tool.route} key={tool.id}>
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
