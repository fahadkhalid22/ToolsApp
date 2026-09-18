"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";

import { OPEN_NOTIFICATIONS_EVENT } from "@/lib/discovery/events";
import {
  readAllNotifications,
  useVisibleNotifications,
} from "@/lib/discovery/local-state";

import { EmptyState } from "./EmptyState";
import { NotificationList } from "./NotificationList";
import styles from "./NotificationsDrawer.module.css";

export function NotificationsDrawer() {
  const { notifications, unreadCount } = useVisibleNotifications();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener(OPEN_NOTIFICATIONS_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_NOTIFICATIONS_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
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

    document.addEventListener("keydown", handleKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeys);
    };
  }, [close, open]);

  if (!open) return null;

  return (
    <div className={styles.layer}>
      <button aria-label="Close notifications" className={styles.backdrop} onClick={close} type="button" />
      <div aria-labelledby="notifications-drawer-title" aria-modal="true" className={styles.drawer} ref={dialogRef} role="dialog">
        <header>
          <div>
            <span className={styles.eyebrow}>Updates</span>
            <h2 className="font-heading" id="notifications-drawer-title">Notifications</h2>
          </div>
          <button aria-label="Close notifications" className={styles.close} onClick={close} type="button"><X aria-hidden="true" size={18} /></button>
        </header>

        <div className={styles.toolbar}>
          <span aria-live="polite">{unreadCount} unread</span>
          <button disabled={!unreadCount} onClick={readAllNotifications} type="button"><CheckCheck aria-hidden="true" size={14} /> Mark all read</button>
        </div>

        <div className={styles.feed}>
          {notifications.length ? (
            <NotificationList compact onNavigate={close} />
          ) : (
            <EmptyState compact description="You’re all caught up. New local updates will appear here." icon={<Bell size={22} />} primaryAction={{ href: "/tools", label: "Browse tools" }} title="No notifications" />
          )}
        </div>

        <footer>
          <Link href="/notifications" onClick={close}>See all notifications</Link>
        </footer>
      </div>
    </div>
  );
}
