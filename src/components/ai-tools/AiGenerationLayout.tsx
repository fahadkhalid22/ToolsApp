"use client";

import type { ReactNode } from "react";

import styles from "./AiTools.module.css";

export type GenerationPreset = { id: string; title: string; description: string };

type AiGenerationLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  presets: readonly GenerationPreset[];
  activePreset: string | null;
  onPreset: (id: string) => void;
  children: ReactNode;
  result?: ReactNode;
  disabled?: boolean;
};

/** Shared visual boundary for future focused AI generators. Form and result contracts remain tool-specific. */
export function AiGenerationLayout({ eyebrow, title, description, presets, activePreset, onPreset, children, result, disabled }: AiGenerationLayoutProps) {
  return (
    <main className={styles.generatorMain} id="main-content">
      <header className={styles.generatorIntro}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className="font-heading">{title}</h1>
        <p>{description}</p>
      </header>
      <section aria-label="Creative starting points" className={styles.presetGrid}>
        <p className={styles.presetLabel}>Start with your own brief, or choose a direction</p>
        {presets.map((preset) => (
          <button aria-pressed={activePreset === preset.id} disabled={disabled} className={styles.presetCard} key={preset.id} onClick={() => onPreset(preset.id)} title={preset.description} type="button">
            <strong>{preset.title}</strong>
          </button>
        ))}
      </section>
      {children}
      {result}
    </main>
  );
}
