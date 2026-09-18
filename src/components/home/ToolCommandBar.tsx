"use client";

import Link from "next/link";
import { ArrowUp, LayoutGrid, Search } from "lucide-react";

import { openGlobalSearch } from "@/lib/discovery/events";

import styles from "./ToolCommandBar.module.css";

export function ToolCommandBar() {
  return (
    <div className={styles.commandArea}>
      <div className={styles.commandBar}>
        <Search aria-hidden="true" className={styles.searchIcon} size={19} />
        <button className={styles.searchTrigger} onClick={() => openGlobalSearch()} type="button">
          Search tools or type what you want to do...
        </button>
        <Link className={styles.allToolsLink} href="/tools">
          <LayoutGrid aria-hidden="true" size={15} />
          <span>All tools</span>
        </Link>
        <kbd className={styles.shortcut}>Ctrl K</kbd>
        <button aria-label="Open global tool search" className={styles.submit} onClick={() => openGlobalSearch()} type="button">
          <ArrowUp aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}
