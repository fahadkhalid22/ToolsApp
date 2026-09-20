"use client";

import { useMemo, useRef, useState } from "react";
import { AlignLeft, Check, Clock, Copy, FileText, Hash, Space, Trash2 } from "lucide-react";

import { recordToolCompletion } from "@/lib/discovery/local-state";
import { analyzeText, type TextStats } from "@/lib/text/counter";

import styles from "./TextTools.module.css";

const SAMPLE_TEXT = `ToolsApp brings together modern productivity, developer utilities, and everyday calculators into one seamless platform.

Every tool runs entirely in your browser to respect your privacy and provide instantaneous feedback without unnecessary server hops.

Try pasting your own document, essay, or notes to analyze word count, character density, and estimated reading time!`;

export function WordCounterWorkspace() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const hasRecordedUse = useRef(false);

  const stats: TextStats = useMemo(() => analyzeText(text), [text]);

  function handleTextChange(value: string) {
    setText(value);
    if (value.trim().length > 0 && !hasRecordedUse.current) {
      recordToolCompletion("word-character-counter");
      hasRecordedUse.current = true;
    }
  }

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  function handleClear() {
    setText("");
    setCopied(false);
    setCopyError(false);
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
          <div className={styles.editorFooter}>
            <span>Counts update locally as you type. Reading time assumes 200 words per minute.</span>
            <span aria-live="polite">{copyError ? "Copy failed. Select the text and copy it manually." : ""}</span>
          </div>
        </section>

        <section className={styles.statsSidebar} aria-label="Text statistics">
          <dl className={styles.primaryStatsGrid}>
            <div className={`${styles.statCard} ${styles.primaryStatCard}`}>
              <dt className={styles.statLabel}>Words</dt>
              <dd className={styles.statValue}>{stats.words}</dd>
            </div>
            <div className={`${styles.statCard} ${styles.primaryStatCard}`}>
              <dt className={styles.statLabel}>Characters</dt>
              <dd className={styles.statValue}>{stats.characters}</dd>
            </div>
          </dl>

          <div className={styles.readingTimeBox}>
            <Clock size={18} className={styles.readingTimeIcon} aria-hidden="true" />
            <span className={styles.readingTimeText}>
              Estimated reading time: <strong>{stats.readingTimeMinutes} min</strong>
            </span>
          </div>

          <dl className={styles.secondaryStatsList}>
            <div className={styles.secondaryStatRow}>
              <dt className={styles.secondaryLabel}>
                <Hash size={14} aria-hidden="true" />
                Characters (no spaces)
              </dt>
              <dd className={styles.secondaryValue}>{stats.charactersNoSpaces}</dd>
            </div>
            <div className={styles.secondaryStatRow}>
              <dt className={styles.secondaryLabel}>
                <AlignLeft size={14} aria-hidden="true" />
                Sentences
              </dt>
              <dd className={styles.secondaryValue}>{stats.sentences}</dd>
            </div>
            <div className={styles.secondaryStatRow}>
              <dt className={styles.secondaryLabel}>
                <AlignLeft size={14} aria-hidden="true" />
                Paragraphs
              </dt>
              <dd className={styles.secondaryValue}>{stats.paragraphs}</dd>
            </div>
            <div className={styles.secondaryStatRow}>
              <dt className={styles.secondaryLabel}>
                <AlignLeft size={14} aria-hidden="true" />
                Lines
              </dt>
              <dd className={styles.secondaryValue}>{stats.lines}</dd>
            </div>
            <div className={styles.secondaryStatRow}>
              <dt className={styles.secondaryLabel}>
                <Space size={14} aria-hidden="true" />
                Spaces
              </dt>
              <dd className={styles.secondaryValue}>{stats.spaces}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
