"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ArrowRight, Clock3, Command, Heart, LayoutGrid, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { popularTools, tools } from "@/data/tools";
import { OPEN_GLOBAL_SEARCH_EVENT } from "@/lib/discovery/events";
import { searchTools } from "@/lib/discovery/search";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import styles from "./GlobalSearch.module.css";

const RECENT_SEARCH_KEY = "toolsapp:recent-searches:v1";

function readRecentSearches() {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const normalized = query.trim().slice(0, 120);
  if (!normalized) return;
  try {
    const next = [normalized, ...readRecentSearches().filter((item) => item !== normalized)].slice(0, 4);
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  } catch {
    // Search remains fully usable when storage is blocked or unavailable.
  }
}

export function GlobalSearch() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const results = useMemo(
    () => (query.trim() ? searchTools(tools, query).slice(0, 7) : popularTools.slice(0, 5)),
    [query],
  );
  const safeActiveIndex = results.length ? Math.min(activeIndex, results.length - 1) : 0;

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  const show = useCallback((nextQuery = "") => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setQuery(nextQuery.slice(0, 120));
    setActiveIndex(0);
    setRecentSearches(readRecentSearches());
    setOpen(true);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else show();
      }
    };
    const handleOpen = (event: Event) => {
      const searchEvent = event as CustomEvent<{ query?: string }>;
      show(searchEvent.detail?.query ?? "");
    };
    document.addEventListener("keydown", handleShortcut);
    window.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, handleOpen);
    return () => {
      document.removeEventListener("keydown", handleShortcut);
      window.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, handleOpen);
    };
  }, [close, open, show]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    const handleDialogKeys = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDialogKeys);
    };
  }, [close, open]);

  function openRoute(route: string) {
    saveRecentSearch(query);
    setRecentSearches(readRecentSearches());
    setOpen(false);
    router.push(route);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (results.length ? (current + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current - 1 + results.length) % results.length : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selection = results[safeActiveIndex];
      if (selection) openRoute(selection.route);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.layer}>
      <button aria-label="Close global search" className={styles.backdrop} onClick={close} type="button" />
      <div aria-label="Search tools" aria-modal="true" className={styles.dialog} ref={dialogRef} role="dialog">
        <div className={styles.searchBox}>
          <Search aria-hidden="true" size={22} />
          <label className="sr-only" htmlFor="global-tool-search">Search all tools</label>
          <input
            aria-activedescendant={results.length ? `global-result-${safeActiveIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls="global-search-results"
            aria-expanded="true"
            id="global-tool-search"
            onChange={(event) => { setQuery(event.target.value.slice(0, 120)); setActiveIndex(0); }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search tools or describe what you need..."
            ref={inputRef}
            role="combobox"
            type="search"
            value={query}
          />
          <kbd>Ctrl K</kbd>
          <button aria-label="Close search" onClick={close} type="button"><X aria-hidden="true" size={18} /></button>
        </div>

        {recentSearches.length ? (
          <section className={styles.recentTerms} aria-labelledby="recent-searches-heading">
            <span id="recent-searches-heading">Recent searches</span>
            <div>{recentSearches.map((term) => <button key={term} onClick={() => setQuery(term)} type="button">{term}</button>)}</div>
          </section>
        ) : null}

        <section className={styles.resultsSection} aria-labelledby="search-results-heading">
          <div className={styles.sectionTitle}>
            <span id="search-results-heading">{query.trim() ? "Matching tools" : "Popular tools"}</span>
            <small>{results.length} results</small>
          </div>
          {results.length ? (
            <div className={styles.results} id="global-search-results" role="listbox">
              {results.map((tool, index) => (
                <button
                  aria-selected={index === safeActiveIndex}
                  className={index === safeActiveIndex ? styles.activeResult : ""}
                  id={`global-result-${index}`}
                  key={tool.id}
                  onClick={() => openRoute(tool.route)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <span className={styles.resultIcon}><IconGlyph name={tool.icon as IconName} size={18} /></span>
                  <span className={styles.resultCopy}><strong>{tool.name}</strong><small>{tool.category} · {tool.shortDescription}</small></span>
                  <span className={styles.openHint}>Open <ArrowRight aria-hidden="true" size={14} /></span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <Search aria-hidden="true" size={24} /><strong>No tools found</strong>
              <span>Try another phrase or browse the complete directory.</span>
              <button onClick={() => openRoute("/tools")} type="button">View all tools</button>
            </div>
          )}
        </section>

        <section className={styles.quickActions} aria-labelledby="quick-actions-heading">
          <span id="quick-actions-heading">Quick actions</span>
          <div>
            <button onClick={() => openRoute("/tools")} type="button"><LayoutGrid aria-hidden="true" size={15} /> All tools</button>
            <button onClick={() => openRoute("/favorites")} type="button"><Heart aria-hidden="true" size={15} /> Favorites</button>
            <button onClick={() => openRoute("/history")} type="button"><Clock3 aria-hidden="true" size={15} /> History</button>
          </div>
        </section>

        <footer className={styles.keyboardHelp}>
          <span><kbd>↑</kbd><kbd>↓</kbd> Move</span><span><kbd>↵</kbd> Select</span><span><kbd>Esc</kbd> Close</span>
          <Command aria-hidden="true" size={14} />
        </footer>
      </div>
    </div>
  );
}
