"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bell, Menu, Search, X } from "lucide-react";

import { GlobalSearch } from "@/components/discovery/GlobalSearch";
import { NotificationsDrawer } from "@/components/discovery/NotificationsDrawer";
import { APP_NAME } from "@/lib/constants";
import { openGlobalSearch, openNotifications } from "@/lib/discovery/events";
import { useVisibleNotifications } from "@/lib/discovery/local-state";

import { RecentToolsPanel } from "./RecentToolsPanel";
import { Sidebar } from "./Sidebar";
import styles from "./AppShell.module.css";

type AppShellProps = {
  children: ReactNode;
  showRecentPanel?: boolean;
};

export function AppShell({ children, showRecentPanel = true }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount } = useVisibleNotifications();
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;

    const drawer = drawerRef.current;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) return;
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [closeDrawer, drawerOpen]);

  return (
    <div className={styles.canvas}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <section
        className={`${styles.shell} ${!showRecentPanel ? styles.wideShell : ""}`}
        aria-label={`${APP_NAME} workspace`}
      >
        <aside className={styles.desktopSidebar}>
          <Sidebar />
        </aside>

        <div className={styles.centerColumn}>
          <header className={styles.mobileHeader}>
            <span className={styles.mobileBrand}>
              <span className={styles.mobileBrandMark} aria-hidden="true" />
              <span className="font-heading">{APP_NAME}</span>
            </span>
            <span className={styles.mobileActions}>
              <button aria-label="Search tools" className={styles.menuButton} onClick={() => openGlobalSearch()} type="button">
                <Search aria-hidden="true" size={19} />
              </button>
              <button aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} className={styles.menuButton} onClick={() => openNotifications()} type="button">
                <Bell aria-hidden="true" size={19} />
                {unreadCount ? <span className={styles.mobileBadge}>{unreadCount}</span> : null}
              </button>
              <button
                aria-controls="mobile-navigation"
                aria-expanded={drawerOpen}
                aria-label="Open navigation menu"
                className={styles.menuButton}
                onClick={() => setDrawerOpen(true)}
                ref={menuButtonRef}
                type="button"
              >
                <Menu aria-hidden="true" size={20} />
              </button>
            </span>
          </header>
          {children}
        </div>

        {showRecentPanel ? <RecentToolsPanel /> : null}
      </section>

      {drawerOpen ? (
        <div className={styles.drawerLayer}>
          <button
            aria-label="Close navigation menu"
            className={styles.backdrop}
            onClick={closeDrawer}
            type="button"
          />
          <aside
            aria-label="Navigation menu"
            aria-modal="true"
            className={styles.drawer}
            id="mobile-navigation"
            ref={drawerRef}
            role="dialog"
          >
            <button
              aria-label="Close navigation menu"
              className={styles.closeButton}
              onClick={closeDrawer}
              type="button"
            >
              <X aria-hidden="true" size={19} />
            </button>
            <Sidebar instance="drawer" onNavigate={closeDrawer} />
          </aside>
        </div>
      ) : null}
      <GlobalSearch />
      <NotificationsDrawer />
    </div>
  );
}
