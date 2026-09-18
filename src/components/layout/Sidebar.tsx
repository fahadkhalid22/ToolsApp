import Link from "next/link";
import {
  Braces,
  Calculator,
  ChevronDown,
  FileText,
  GraduationCap,
  Image,
  LogIn,
  Sparkles,
  UserRound,
} from "lucide-react";

import { categoryNavigation, mainNavigation } from "@/data/navigation";
import { APP_NAME } from "@/lib/constants";

import { IconGlyph, type IconName } from "../shared/IconGlyph";
import styles from "./Sidebar.module.css";

const categoryIcons = {
  "Image Tools": Image,
  "PDF Tools": FileText,
  Calculators: Calculator,
  "Student Tools": GraduationCap,
  "Developer Tools": Braces,
  "AI Tools": Sparkles,
};

type SidebarProps = {
  instance?: "desktop" | "drawer";
  onNavigate?: () => void;
};

export function Sidebar({ instance = "desktop", onNavigate }: SidebarProps) {
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

      <nav aria-label={instance === "desktop" ? "Primary" : "Mobile primary"}>
        <ul className={styles.navigationList}>
          {mainNavigation.map((item) => (
            <li key={item.href}>
              <Link
                aria-current={item.href === "/" ? "page" : undefined}
                className={`${styles.navigationLink} ${item.href === "/" ? styles.active : ""}`}
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
          ))}
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
