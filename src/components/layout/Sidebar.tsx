"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Braces,
  Calculator,
  ChevronDown,
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
import { openGlobalSearch } from "@/lib/discovery/events";

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

      <button className={styles.searchButton} onClick={() => openGlobalSearch()} type="button">
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
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`${styles.navigationLink} ${active ? styles.active : ""}`}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <IconGlyph name={item.icon as IconName} size={17} />
                  <span>{item.label}</span>
                  {item.label === "Notifications" ? (
                    <span className={styles.notificationCount}>3</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.categoryHeading}>
          <span>Categories</span>
          <ChevronDown aria-hidden="true" size={14} />
        </div>
        <ul className={styles.categoryList}>
          {categoryNavigation.map((item) => {
            const CategoryIcon = categoryIcons[item.label];
            return (
              <li key={item.label}>
                <Link href={item.href} onClick={onNavigate}>
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
        <Link className={styles.signInLink} href="/settings" onClick={onNavigate}>
          <LogIn aria-hidden="true" size={16} />
          <span>Sign in</span>
        </Link>
      </div>
    </div>
  );
}
