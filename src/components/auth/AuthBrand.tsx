import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

import styles from "./AuthBrand.module.css";

type AuthBrandProps = {
  compact?: boolean;
};

export function AuthBrand({ compact = false }: AuthBrandProps) {
  return (
    <Link className={`${styles.brand} ${compact ? styles.compact : ""}`} href="/">
      <span className={styles.mark} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="font-heading">{APP_NAME}</span>
    </Link>
  );
}
