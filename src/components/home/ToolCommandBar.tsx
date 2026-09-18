"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, LayoutGrid, Search } from "lucide-react";

import { tools } from "@/data/tools";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import styles from "./ToolCommandBar.module.css";

export function ToolCommandBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const candidates = normalizedQuery
      ? tools.filter((tool) =>
          `${tool.name} ${tool.shortDescription} ${tool.category}`
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : tools.filter((tool) => tool.popular);
    return candidates.slice(0, 5);
  }, [query]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleShortcut);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const navigateTo = (route: string) => {
    setOpen(false);
    router.push(route);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selection = suggestions[activeIndex] ?? suggestions[0];
    if (selection) {
      navigateTo(selection.route);
    } else if (query.trim()) {
      navigateTo(`/tools?query=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        suggestions.length ? (current + 1) % suggestions.length : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        suggestions.length
          ? (current - 1 + suggestions.length) % suggestions.length
          : 0,
      );
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={styles.commandArea} ref={containerRef}>
      {open ? (
        <div className={styles.suggestions} id="tool-suggestions" role="listbox">
          <div className={styles.suggestionHeader}>
            <span>{query.trim() ? "Matching tools" : "Popular tools"}</span>
            <small>↑↓ to move · Enter to open</small>
          </div>
          {suggestions.length ? (
            suggestions.map((tool, index) => (
              <button
                aria-selected={index === activeIndex}
                className={index === activeIndex ? styles.selectedSuggestion : ""}
                id={`tool-suggestion-${index}`}
                key={tool.id}
                onClick={() => navigateTo(tool.route)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                type="button"
              >
                <span className={styles.suggestionIcon}>
                  <IconGlyph name={tool.icon as IconName} size={17} />
                </span>
                <span>
                  <strong>{tool.name}</strong>
                  <small>{tool.category}</small>
                </span>
              </button>
            ))
          ) : (
            <div className={styles.noResults}>
              No direct match. Press Enter to browse all tools.
            </div>
          )}
        </div>
      ) : null}

      <form className={styles.commandBar} onSubmit={handleSubmit} role="search">
        <Search aria-hidden="true" className={styles.searchIcon} size={19} />
        <label className="sr-only" htmlFor="tool-search">
          Search all tools
        </label>
        <input
          aria-activedescendant={
            open && suggestions.length
              ? `tool-suggestion-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls="tool-suggestions"
          aria-expanded={open}
          id="tool-search"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search tools or type what you want to do..."
          ref={inputRef}
          role="combobox"
          type="search"
          value={query}
        />
        <Link className={styles.allToolsLink} href="/tools">
          <LayoutGrid aria-hidden="true" size={15} />
          <span>All tools</span>
        </Link>
        <kbd className={styles.shortcut}>Ctrl K</kbd>
        <button aria-label="Open selected tool" className={styles.submit} type="submit">
          <ArrowUp aria-hidden="true" size={17} />
        </button>
      </form>
    </div>
  );
}
