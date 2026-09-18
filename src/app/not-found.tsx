import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Link aria-label={`${APP_NAME} home`} className={styles.brand} href="/">
        <span aria-hidden="true" className={styles.brandMark}><i /><i /><i /><i /></span>
        <span className="font-heading">{APP_NAME}</span>
      </Link>

      <section className={styles.content}>
        <span className={styles.code} aria-hidden="true">404</span>
        <span className={styles.eyebrow}>Page not found</span>
        <h1 className="font-heading">This tool wandered off.</h1>
        <p>The page may have moved, or the address might be incomplete. Your saved tools and recent activity are still safe on this device.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/"><ArrowLeft aria-hidden="true" size={16} /> Back home</Link>
          <Link className={styles.secondary} href="/tools"><LayoutGrid aria-hidden="true" size={16} /> Explore all tools</Link>
        </div>
      </section>

      <p className={styles.footer}>A calm detour — nothing was changed.</p>
    </main>
  );
}
