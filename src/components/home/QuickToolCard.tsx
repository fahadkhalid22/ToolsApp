"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Tool } from "@/types/tool";
import { recordToolOpen } from "@/lib/discovery/local-state";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import styles from "./QuickToolCard.module.css";

type QuickToolCardProps = {
  tool: Tool;
};

export function QuickToolCard({ tool }: QuickToolCardProps) {
  return (
    <Link className={styles.card} href={tool.route} onClick={() => recordToolOpen(tool.id, "card")}>
      <span className={styles.iconWrap}>
        <IconGlyph name={tool.icon as IconName} size={21} strokeWidth={1.8} />
      </span>
      <span className={styles.cardCopy}>
        <strong>{tool.name}</strong>
        <span>{tool.shortDescription}</span>
      </span>
      <ArrowUpRight className={styles.arrow} size={16} />
    </Link>
  );
}
