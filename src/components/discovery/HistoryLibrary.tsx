"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ExternalLink, History, Search, Trash2, X } from "lucide-react";

import { toolCategories } from "@/data/categories";
import { getToolById } from "@/data/tools";
import { clearToolHistory, recordToolOpen, removeHistoryEntry, useToolHistory } from "@/lib/discovery/local-state";
import type { ToolCategoryId } from "@/types/tool";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import { EmptyState } from "./EmptyState";
import styles from "./LibraryPage.module.css";

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export function HistoryLibrary() {
  const history = useToolHistory();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategoryId | "all">("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const visibleEntries = useMemo(() => history.flatMap((entry) => {
    const tool = getToolById(entry.toolId);
    return tool ? [{ entry, tool }] : [];
  }), [history]);
  const matches = useMemo(() => visibleEntries
    .filter(({ tool }) => category === "all" || tool.categoryId === category)
    .filter(({ tool }) => `${tool.name} ${tool.category}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((left, right) => (newestFirst ? -1 : 1) * left.entry.timestamp.localeCompare(right.entry.timestamp)), [category, newestFirst, query, visibleEntries]);

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>Activity</span><h1 className="font-heading">Recent tools</h1><p>Review the utilities you opened on this device and jump back into your workflow.</p></div>
        <span className={styles.headerMeta}>Most recent {Math.min(75, visibleEntries.length)} activities</span>
      </header>

      {visibleEntries.length ? (
        <>
          <div className={styles.controls}>
            <label className={styles.search}><Search aria-hidden="true" size={16} /><span className="sr-only">Search tool history</span><input onChange={(event) => setQuery(event.target.value.slice(0, 120))} placeholder="Search activity..." type="search" value={query} /></label>
            <div className={styles.controlGroup}>
              <label className="sr-only" htmlFor="history-category">Filter history by category</label>
              <select id="history-category" onChange={(event) => setCategory(event.target.value as ToolCategoryId | "all")} value={category}><option value="all">All categories</option>{toolCategories.map((item) => <option key={item.id} value={item.id}>{item.shortLabel}</option>)}</select>
              <button className={styles.controlButton} onClick={() => setNewestFirst((current) => !current)} type="button"><ArrowUpDown aria-hidden="true" size={14} /> {newestFirst ? "Newest first" : "Oldest first"}</button>
              <button className={`${styles.controlButton} ${styles.dangerButton}`} onClick={() => { setConfirmClear(true); window.setTimeout(() => cancelRef.current?.focus(), 0); }} type="button"><Trash2 aria-hidden="true" size={14} /> Clear history</button>
            </div>
          </div>
          <div className={styles.summary} aria-live="polite">{matches.length} matching activities</div>
          {matches.length ? (
            <div className={styles.tablePanel}>
              <table className={styles.table}>
                <thead><tr><th scope="col">Tool</th><th scope="col">Status</th><th scope="col">Opened</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{matches.map(({ entry, tool }) => (
                  <tr key={entry.id}>
                    <td data-label="Tool"><span className={styles.toolCell}><span className={styles.toolIcon}><IconGlyph name={tool.icon as IconName} size={17} /></span><span><strong>{tool.name}</strong><small>{tool.category}</small></span></span></td>
                    <td data-label="Status"><span className={styles.status}>Opened</span></td>
                    <td data-label="Opened">{dateFormatter.format(new Date(entry.timestamp))}</td>
                    <td data-label="Actions"><span className={styles.rowActions}><Link aria-label={`Reopen ${tool.name}`} href={tool.route} onClick={() => recordToolOpen(tool.id, "history")}><ExternalLink aria-hidden="true" size={15} /></Link><button aria-label={`Remove ${tool.name} from history`} onClick={() => removeHistoryEntry(entry.id)} type="button"><X aria-hidden="true" size={16} /></button></span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyState compact description="Change your search or category filter to see more activity." primaryAction={{ href: "/history", label: "Reset filters" }} title="No activity matches" />}
        </>
      ) : <EmptyState description="Tools you open will appear here automatically on this device." icon={<History size={25} />} primaryAction={{ href: "/tools", label: "Explore tools" }} title="No recent activity yet" />}

      {confirmClear ? (
        <div className={styles.dialogLayer}>
          <div aria-labelledby="clear-history-title" aria-modal="true" className={styles.dialog} role="alertdialog">
            <h2 className="font-heading" id="clear-history-title">Clear all history?</h2><p>This removes every local activity record from this browser. It won’t affect files or tool settings.</p>
            <div className={styles.dialogActions}><button className={styles.cancel} onClick={() => setConfirmClear(false)} ref={cancelRef} type="button">Keep history</button><button className={styles.confirm} onClick={() => { clearToolHistory(); setConfirmClear(false); }} type="button">Clear history</button></div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
