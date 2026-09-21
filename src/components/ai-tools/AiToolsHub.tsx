"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Heart, History, Lightbulb, MessageSquareText, PenLine, Sparkles } from "lucide-react";

import { getToolById } from "@/data/tools";
import { recordToolOpen, toggleFavorite, useFavoriteToolIds, useToolHistory } from "@/lib/discovery/local-state";
import type { AiUsageStatus } from "@/lib/ai/http";
import type { Tool } from "@/types/tool";

import styles from "./AiTools.module.css";

type Filter = "all" | "available" | "coming";

const roadmap = [
  { title: "Caption Generator", description: "Social captions shaped to your channel and voice.", icon: <MessageSquareText aria-hidden="true" size={21} /> },
  { title: "Product Description Writer", description: "Clear product copy grounded in your supplied facts.", icon: <PenLine aria-hidden="true" size={21} /> },
  { title: "Idea Starter", description: "Find a useful angle before creating your next campaign.", icon: <Lightbulb aria-hidden="true" size={21} /> },
] as const;

function validUsage(value: unknown): value is AiUsageStatus {
  return !!value && typeof value === "object" && "remaining" in value && typeof value.remaining === "number" && "configured" in value && typeof value.configured === "boolean";
}

export function AiToolsHub({ tools }: { tools: readonly Tool[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [usage, setUsage] = useState<AiUsageStatus | null>(null);
  const favoriteIds = useFavoriteToolIds();
  const history = useToolHistory();
  const activeTools = tools.filter((tool) => tool.availability === "available");
  const aiToolIds = new Set(tools.map((tool) => tool.id));
  const aiActivity = history.filter((entry) => aiToolIds.has(entry.toolId));
  const savedCount = favoriteIds.filter((id) => aiToolIds.has(id)).length;

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/ai/ugc-script", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((payload: unknown) => {
        if (!controller.signal.aborted && payload && typeof payload === "object" && "usage" in payload && validUsage(payload.usage)) setUsage(payload.usage);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <main className={styles.hubMain} id="main-content">
      <nav aria-label="Breadcrumb" className={styles.hubBreadcrumb}><Link href="/tools">All tools</Link><span aria-hidden="true">/</span><span aria-current="page">AI Tools</span></nav>
      <header className={styles.hubHeader}><div><span className={styles.eyebrow}>THE AI WORKSPACE</span><h1 className="font-heading">AI tools, built for useful work.</h1><p>Start with the live UGC ad script workflow. Explore what is planned next without guessing which tools are ready.</p></div><Link className={styles.hubPrimary} href="/tools/ai-ugc-ad-script-generator" onClick={() => recordToolOpen("ai-ugc-script-generator", "card")}><Sparkles aria-hidden="true" size={17} /> Open script generator <ArrowUpRight aria-hidden="true" size={17} /></Link></header>
      <section aria-label="AI workspace overview" className={styles.overviewGrid}>
        <div className={styles.overviewCard}><span className={styles.overviewIcon}><Sparkles aria-hidden="true" size={18} /></span><strong>{activeTools.length}</strong><span>Active AI {activeTools.length === 1 ? "tool" : "tools"}</span></div>
        <div className={styles.overviewCard}><span className={styles.overviewIcon}><CheckCircle2 aria-hidden="true" size={18} /></span><strong>{usage?.configured ? usage.remaining : "—"}</strong><span>{usage?.configured ? "Generations left today" : "Provider not configured"}</span></div>
        <div className={styles.overviewCard}><span className={styles.overviewIcon}><History aria-hidden="true" size={18} /></span><strong>{aiActivity.filter((entry) => entry.status === "completed").length}</strong><span>Recent scripts created here</span></div>
        <div className={styles.overviewCard}><span className={styles.overviewIcon}><Heart aria-hidden="true" size={18} /></span><strong>{savedCount}</strong><span>Saved AI {savedCount === 1 ? "tool" : "tools"}</span></div>
      </section>
      <div className={styles.hubNotice}><span className={styles.noticeIcon}><Sparkles aria-hidden="true" size={20} /></span><span><strong>Your creator workspace is ready.</strong> Build a brief from your verified product facts and turn it into a scannable script when a provider is connected.</span><Link href="/tools/ai-ugc-ad-script-generator">View workspace <ArrowRight aria-hidden="true" size={15} /></Link></div>
      <section aria-labelledby="ai-discover-heading" className={styles.hubDiscover}>
        <div className={styles.discoverHeader}><div><span className={styles.eyebrow}>DISCOVER</span><h2 className="font-heading" id="ai-discover-heading">Explore AI workflows</h2><p>One working generator now. Future ideas are listed for visibility only.</p></div></div>
        <div aria-label="Filter AI workflows" className={styles.hubTabs} role="group"><button aria-pressed={filter === "all"} onClick={() => setFilter("all")} type="button">All <span>{activeTools.length + roadmap.length}</span></button><button aria-pressed={filter === "available"} onClick={() => setFilter("available")} type="button">Available <span>{activeTools.length}</span></button><button aria-pressed={filter === "coming"} onClick={() => setFilter("coming")} type="button">Coming soon <span>{roadmap.length}</span></button></div>
        <div aria-live="polite" className={styles.hubBoard}>
          {filter !== "coming" && activeTools.map((tool) => <article className={`${styles.hubToolCard} ${styles.activeCard}`} key={tool.id}><div className={styles.hubCardTop}><span className={styles.activeBadge}><CheckCircle2 aria-hidden="true" size={14} /> Available now</span><button aria-label={`${favoriteIds.includes(tool.id) ? "Remove" : "Add"} ${tool.name} ${favoriteIds.includes(tool.id) ? "from" : "to"} favorites`} aria-pressed={favoriteIds.includes(tool.id)} className={styles.hubFavorite} onClick={() => toggleFavorite(tool.id)} type="button"><Heart aria-hidden="true" fill={favoriteIds.includes(tool.id) ? "currentColor" : "none"} size={17} /></button></div><span className={styles.hubCardIcon}><Sparkles aria-hidden="true" size={23} /></span><h3 className="font-heading">{tool.name}</h3><p>{tool.shortDescription}</p><div className={styles.hubCardFoot}><span>Short-form video</span><Link href={tool.route} onClick={() => recordToolOpen(tool.id, "card")}>Open tool <ArrowUpRight aria-hidden="true" size={15} /></Link></div></article>)}
          {filter !== "available" && roadmap.map((idea) => <article className={styles.hubToolCard} key={idea.title}><div className={styles.hubCardTop}><span className={styles.soonBadge}><Clock3 aria-hidden="true" size={14} /> Coming soon</span></div><span className={styles.hubCardIcon}>{idea.icon}</span><h3 className="font-heading">{idea.title}</h3><p>{idea.description}</p><div className={styles.hubCardFoot}><span>Planned idea</span><span className={styles.inertLabel}>Not available yet</span></div></article>)}
        </div>
      </section>
      <section aria-labelledby="ai-recent-heading" className={styles.hubRecent}><div><h2 className="font-heading" id="ai-recent-heading">Your recent AI activity</h2><p>Only tool activity is saved here, never product briefs or generated scripts.</p></div>{aiActivity.length ? <ul>{aiActivity.slice(0, 3).map((entry) => { const tool = getToolById(entry.toolId); return tool ? <li key={entry.id}><span>{entry.status === "completed" ? "Script generated" : "Workspace opened"}</span><Link href={tool.route}>{tool.name} <ArrowUpRight aria-hidden="true" size={14} /></Link><time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleDateString()}</time></li> : null; })}</ul> : <p className={styles.emptyActivity}>No AI activity yet. Open the script generator to get started.</p>}</section>
    </main>
  );
}
