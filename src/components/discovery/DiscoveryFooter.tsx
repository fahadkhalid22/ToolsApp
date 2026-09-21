import Link from "next/link";

import { toolCategories } from "@/data/categories";
import { APP_NAME } from "@/lib/constants";

import styles from "./DiscoveryFooter.module.css";

export function DiscoveryFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <span className="font-heading">{APP_NAME}</span>
        <p>Focused utilities for common digital tasks.</p>
      </div>
      <div>
        <strong>Explore</strong>
        <Link href="/tools">All tools</Link>
        <Link href="/favorites">Favorites</Link>
        <Link href="/history">History</Link>
      </div>
      <div>
        <strong>Categories</strong>
        {toolCategories.slice(0, 4).map((category) => (
          <Link href={`/tools/category/${category.slug}`} key={category.id}>
            {category.shortLabel}
          </Link>
        ))}
      </div>
      <div>
        <strong>Product</strong>
        <Link href="/pricing">Pricing</Link>
        <Link href="/about">About</Link>
        <Link href="/support">Support</Link>
        <Link href="/faq">FAQ</Link>
      </div>
      <div>
        <strong>Legal & account</strong>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/cookies">Cookies & data</Link>
        <Link href="/settings">Settings</Link>
      </div>
    </footer>
  );
}
