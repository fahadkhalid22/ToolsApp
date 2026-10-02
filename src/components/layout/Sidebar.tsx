"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Braces,
  Calculator,
  FileText,
  GraduationCap,
  Image,
  LogIn,
  QrCode,
  Search,
  Sparkles,
  TextCursorInput,
  UserRound,
} from "lucide-react";

import { categoryNavigation, mainNavigation } from "@/data/navigation";
import { APP_NAME } from "@/lib/constants";
import { openGlobalSearch, openNotifications } from "@/lib/discovery/events";
import { useVisibleNotifications } from "@/lib/discovery/local-state";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import styles from "./Sidebar.module.css";

const categoryIcons = {
  "Image Tools": Image,
  "PDF Tools": FileText,
  Calculators: Calculator,
  "Student Tools": GraduationCap,
  "Text Tools": TextCursorInput,
  "Developer Tools": Braces,
  "AI Tools": Sparkles,
  Utilities: QrCode,
};

type SidebarProps = {
  instance?: "desktop" | "drawer";
  onNavigate?: () => void;
};

export function Sidebar({ instance = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useVisibleNotifications();

  function openOverlay(action: () => void) {
    if (!onNavigate) {
      action();
      return;
    }
    onNavigate();
    window.setTimeout(action, 0);
  }

  return (
    <div className={styles.sidebarInner}>
      <Link className={styles.brand} href="/" onClick={onNavigate}>
        <span className={styles.brandMark} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="font-heading">{APP_NAME}</span>
      </Link>

      <button
        aria-haspopup="dialog"
        className={styles.searchButton}
        onClick={() => openOverlay(() => openGlobalSearch())}
        type="button"
      >
        <Search aria-hidden="true" size={16} />
        <span>Search tools</span>
        <kbd>Ctrl K</kbd>
      </button>

      <nav aria-label={instance === "desktop" ? "Primary" : "Mobile primary"}>
        <ul className={styles.navigationList}>
          {mainNavigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/tools"
                  ? pathname === "/tools" || (pathname.startsWith("/tools/") && !pathname.startsWith("/tools/category/"))
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const content = (
              <>
                <IconGlyph name={item.icon as IconName} size={17} />
                <span>{item.label}</span>
                {item.label === "Notifications" && unreadCount ? (
                  <span aria-label={`${unreadCount} unread notifications`} className={styles.notificationCount}>{unreadCount}</span>
                ) : null}
              </>
            );
            return (
              <li key={item.href}>
                {item.label === "Notifications" ? (
                  <button
                    aria-current={active ? "page" : undefined}
                    className={`${styles.navigationLink} ${active ? styles.active : ""}`}
                    onClick={() => openOverlay(() => openNotifications())}
                    type="button"
                  >{content}</button>
                ) : (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`${styles.navigationLink} ${active ? styles.active : ""}`}
                    href={item.href}
                    onClick={onNavigate}
                  >{content}</Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className={styles.categoryHeading}>Categories</div>
        <ul className={styles.categoryList}>
          {categoryNavigation.map((item) => {
            const CategoryIcon = categoryIcons[item.label];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.label}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={active ? styles.activeCategory : undefined}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <CategoryIcon aria-hidden="true" size={16} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.accountCard}>
        <div className={styles.accountSummary}>
          <span className={styles.avatar} aria-hidden="true">
            <UserRound size={16} />
          </span>
          <span>
            <strong>Guest workspace</strong>
            <small>Sign in to sync tools</small>
          </span>
        </div>
        <Link className={styles.signInLink} href="/login" onClick={onNavigate}>
          <LogIn aria-hidden="true" size={16} />
          <span>Sign in</span>
        </Link>
      </div>
    </div>
  );
}
