"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3, Heart } from "lucide-react";

import { recordToolOpen, toggleFavorite, useFavoriteToolIds } from "@/lib/discovery/local-state";
import type { Tool } from "@/types/tool";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import styles from "./ToolCard.module.css";

type ToolCardProps = {
  tool: Tool;
  compact?: boolean;
};

export function ToolCard({ tool, compact = false }: ToolCardProps) {
  const favoriteIds = useFavoriteToolIds();
  const favorite = favoriteIds.includes(tool.id);

  return (
    <article className={`${styles.card} ${compact ? styles.compact : ""}`}>
      <div className={styles.topline}>
        <span className={styles.icon}>
          <IconGlyph name={tool.icon as IconName} size={22} strokeWidth={1.8} />
        </span>
        <span className={styles.cardActions}>
          <span className={styles.category}>{tool.category}</span>
          <button
            aria-label={`${favorite ? "Remove" : "Add"} ${tool.name} ${favorite ? "from" : "to"} favorites`}
            aria-pressed={favorite}
            className={styles.favoriteButton}
            onClick={() => toggleFavorite(tool.id)}
            type="button"
          >
            <Heart aria-hidden="true" fill={favorite ? "currentColor" : "none"} size={16} />
          </button>
        </span>
      </div>
      <div className={styles.copy}>
        <h3 className="font-heading">{tool.name}</h3>
        <p>{tool.shortDescription}</p>
      </div>
      <div className={styles.footer}>
        <span className={styles.availability}>
          <Clock3 aria-hidden="true" size={13} /> Part {tool.futurePhase}
        </span>
        <Link aria-label={`Open ${tool.name}`} href={tool.route} onClick={() => recordToolOpen(tool.id, "card")}>
          Open tool <ArrowUpRight aria-hidden="true" size={14} />
        </Link>
      </div>
    </article>
  );
}
