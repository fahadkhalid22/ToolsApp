"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import styles from "./AiTools.module.css";

export type GenerationPreset = { id: string; title: string; description: string; icon: ReactNode };

type AiGenerationLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  presets: readonly GenerationPreset[];
  activePreset: string | null;
  onPreset: (id: string) => void;
  children: ReactNode;
  result?: ReactNode;
};

/** Shared visual boundary for future focused AI generators. Form and result contracts remain tool-specific. */
export function AiGenerationLayout({ eyebrow, title, description, presets, activePreset, onPreset, children, result }: AiGenerationLayoutProps) {
  return (
    <main className={styles.generatorMain} id="main-content">
      <header className={styles.generatorIntro}>
        <span className={styles.introMark}><Sparkles aria-hidden="true" size={23} /></span>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className="font-heading">{title}</h1>
        <p>{description}</p>
      </header>
      <section aria-label="Creative starting points" className={styles.presetGrid}>
        {presets.map((preset) => (
          <button aria-pressed={activePreset === preset.id} className={styles.presetCard} key={preset.id} onClick={() => onPreset(preset.id)} type="button">
            <span className={styles.presetIcon}>{preset.icon}</span>
            <strong>{preset.title}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </section>
      {children}
      {result}
    </main>
  );
}
