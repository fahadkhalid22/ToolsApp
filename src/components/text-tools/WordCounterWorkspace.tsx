"use client";

import { useState, useTransition } from "react";
import { Copy, Trash2, FileText, Check, Clock, AlignLeft, Hash } from "lucide-react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { analyzeText, type TextStats } from "@/lib/text/counter";

import styles from "./TextTools.module.css";

const SAMPLE_TEXT = `ToolsApp brings together modern productivity, developer utilities, and everyday calculators into one seamless platform.

Every tool runs entirely in your browser to respect your privacy and provide instantaneous feedback without unnecessary server hops.

Try pasting your own document, essay, or notes to analyze word count, character density, and estimated reading time!`;

export function WordCounterWorkspace() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const stats: TextStats = analyzeText(text);

  function handleTextChange(value: string) {
    setText(value);
    if (value.trim().length > 0) {
      recordToolCompletion("word-character-counter");
    }
  }

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback or ignore
    }
  }

  function handleClear() {
    startTransition(() => {
      setText("");
    });
  }

  function handleInsertSample() {
    handleTextChange(SAMPLE_TEXT);
  }

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}>
        <span className={styles.eyebrow}>Text Utilities</span>
        <h1 className={styles.title}>Word &amp; Character Counter</h1>
        <p className={styles.description}>
          Analyze word count, character density, sentences, paragraphs, and reading time in real-time.
        </p>
      </header>

      <div className={styles.workspace}>
        {/* Editor Area */}
        <section className={styles.editorCard} aria-labelledby="editor-title">
          <div className={styles.editorHeader}>
            <h2 id="editor-title" className={styles.editorTitle}>
              Your Text
            </h2>
            <div className={styles.editorActions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleInsertSample}
                title="Insert sample text"
              >
                <FileText size={14} aria-hidden="true" />
                <span>Sample</span>
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleCopy}
                disabled={!text}
                title="Copy text to clipboard"
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleClear}
                disabled={!text}
                title="Clear text"
              >
                <Trash2 size={14} aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type or paste your text here..."
            aria-label="Text content for analysis"
            spellCheck="true"
          />
        </section>

        {/* Stats Sidebar */}
        <section className={styles.statsSidebar} aria-label="Text statistics">
          {/* Primary stats */}
          <div className={styles.primaryStatsGrid}>
            <div className={`${styles.statCard} ${styles.primaryStatCard}`}>
              <div className={styles.statValue}>{stats.words}</div>
              <div className={styles.statLabel}>Words</div>
            </div>
            <div className={`${styles.statCard} ${styles.primaryStatCard}`}>
              <div className={styles.statValue}>{stats.characters}</div>
              <div className={styles.statLabel}>Characters</div>
            </div>
          </div>

          {/* Reading time */}
          <div className={styles.readingTimeBox}>
            <Clock size={18} className={styles.readingTimeIcon} aria-hidden="true" />
            <span className={styles.readingTimeText}>
              Estimated reading time: <strong>{stats.readingTimeMinutes} min</strong>
            </span>
          </div>

          {/* Secondary stats */}
          <div className={styles.secondaryStatsList}>
            <div className={styles.secondaryStatRow}>
              <span className={styles.secondaryLabel}>
                <Hash size={14} aria-hidden="true" />
                Characters (no spaces)
              </span>
              <span className={styles.secondaryValue}>{stats.charactersNoSpaces}</span>
            </div>
            <div className={styles.secondaryStatRow}>
              <span className={styles.secondaryLabel}>
                <AlignLeft size={14} aria-hidden="true" />
                Sentences
              </span>
              <span className={styles.secondaryValue}>{stats.sentences}</span>
            </div>
            <div className={styles.secondaryStatRow}>
              <span className={styles.secondaryLabel}>
                <AlignLeft size={14} aria-hidden="true" />
                Paragraphs
              </span>
              <span className={styles.secondaryValue}>{stats.paragraphs}</span>
            </div>
            <div className={styles.secondaryStatRow}>
              <span className={styles.secondaryLabel}>
                <AlignLeft size={14} aria-hidden="true" />
                Lines
              </span>
              <span className={styles.secondaryValue}>{stats.lines}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
