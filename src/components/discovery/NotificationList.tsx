"use client";

import Link from "next/link";
import {
  BellRing,
  Check,
  CheckCircle2,
  Info,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import type { AppNotification, AppNotificationTone } from "@/data/notifications";
import {
  dismissNotification,
  readNotification,
  useVisibleNotifications,
} from "@/lib/discovery/local-state";

import styles from "./NotificationList.module.css";

const toneIcons = {
  success: CheckCircle2,
  info: Info,
  warning: ShieldAlert,
  accent: Sparkles,
} satisfies Record<AppNotificationTone, typeof BellRing>;

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

type NotificationListProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

function NotificationContent({
  notification,
  onNavigate,
}: {
  notification: AppNotification;
  onNavigate?: () => void;
}) {
  const content = (
    <>
      <strong>{notification.title}</strong>
      <span>{notification.body}</span>
      <time dateTime={notification.timestamp}>
        {dateFormatter.format(new Date(notification.timestamp))}
      </time>
    </>
  );

  return notification.href ? (
    <Link
      className={styles.content}
      href={notification.href}
      onClick={() => {
        readNotification(notification.id);
        onNavigate?.();
      }}
    >
      {content}
    </Link>
  ) : (
    <div className={styles.content}>{content}</div>
  );
}

export function NotificationList({ compact = false, onNavigate }: NotificationListProps) {
  const { notifications, preferences } = useVisibleNotifications();

  return (
    <div className={`${styles.list} ${compact ? styles.compact : ""}`}>
      {notifications.map((notification) => {
        const ToneIcon = toneIcons[notification.tone];
        const unread = !preferences.readIds.includes(notification.id);
        return (
          <article className={`${styles.item} ${unread ? styles.unread : ""}`} key={notification.id}>
            <span className={`${styles.icon} ${styles[notification.tone]}`}>
              <ToneIcon aria-hidden="true" size={compact ? 16 : 18} />
            </span>
            <NotificationContent notification={notification} onNavigate={onNavigate} />
            <span className={styles.actions}>
              {unread ? (
                <button
                  aria-label={`Mark “${notification.title}” as read`}
                  onClick={() => readNotification(notification.id)}
                  title="Mark as read"
                  type="button"
                >
                  <Check aria-hidden="true" size={15} />
                </button>
              ) : (
                <span className={styles.readLabel}>Read</span>
              )}
              <button
                aria-label={`Dismiss “${notification.title}”`}
                onClick={() => dismissNotification(notification.id)}
                title="Dismiss notification"
                type="button"
              >
                <X aria-hidden="true" size={15} />
              </button>
            </span>
            {unread ? <span aria-label="Unread" className={styles.unreadDot} role="img" /> : null}
          </article>
        );
      })}
    </div>
  );
}
