"use client";

import { Bell, CheckCheck } from "lucide-react";

import {
  readAllNotifications,
  useVisibleNotifications,
} from "@/lib/discovery/local-state";

import { EmptyState } from "./EmptyState";
import styles from "./LibraryPage.module.css";
import { NotificationList } from "./NotificationList";

export function NotificationsPage() {
  const { notifications, unreadCount } = useVisibleNotifications();

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Inbox</span>
          <h1 className="font-heading">Notifications</h1>
          <p>Review product updates and reminders stored for this browser.</p>
        </div>
        <span className={styles.headerMeta}>{unreadCount} unread</span>
      </header>

      {notifications.length ? (
        <>
          <div className={styles.notificationToolbar}>
            <span aria-live="polite">{notifications.length} visible {notifications.length === 1 ? "update" : "updates"}</span>
            <button disabled={!unreadCount} onClick={readAllNotifications} type="button">
              <CheckCheck aria-hidden="true" size={15} /> Mark all as read
            </button>
          </div>
          <div className={styles.notificationFeed}><NotificationList /></div>
        </>
      ) : (
        <EmptyState description="You’re all caught up. New local updates will appear here." icon={<Bell size={25} />} primaryAction={{ href: "/tools", label: "Browse tools" }} title="No notifications" />
      )}
    </main>
  );
}
