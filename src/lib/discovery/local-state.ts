"use client";

import { useSyncExternalStore } from "react";

import { demoNotifications } from "@/data/notifications";

import {
  addHistoryEntry,
  dismissNotification as dismissNotificationFromState,
  getUnreadNotificationCount,
  isToolHistoryEntry,
  isNotificationPreferenceState,
  markAllNotificationsRead,
  markNotificationRead,
  removeHistoryEntry as removeHistoryEntryFromList,
  toggleFavoriteIds,
  type ToolHistoryEntry,
  type NotificationPreferenceState,
} from "./state";

const FAVORITES_KEY = "toolsapp:favorites:v1";
const HISTORY_KEY = "toolsapp:history:v1";
const FAVORITES_EVENT = "toolsapp:favorites-updated";
const HISTORY_EVENT = "toolsapp:history-updated";
const NOTIFICATIONS_KEY = "toolsapp:notifications:v1";
const NOTIFICATIONS_EVENT = "toolsapp:notifications-updated";
const EMPTY_IDS: readonly string[] = [];
const EMPTY_HISTORY: readonly ToolHistoryEntry[] = [];
const EMPTY_NOTIFICATION_STATE: NotificationPreferenceState = { readIds: [], dismissedIds: [] };

let favoriteSnapshot: readonly string[] = EMPTY_IDS;
let favoriteReady = false;
let historySnapshot: readonly ToolHistoryEntry[] = EMPTY_HISTORY;
let historyReady = false;
let notificationSnapshot: NotificationPreferenceState = EMPTY_NOTIFICATION_STATE;
let notificationReady = false;

function readArray(key: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray(key: string, value: readonly unknown[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // UI state remains available in memory when local storage is unavailable.
  }
}

function readNotificationState() {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(NOTIFICATIONS_KEY) ?? "null");
    const candidate = Array.isArray(parsed) ? parsed[0] : parsed;
    return isNotificationPreferenceState(candidate) ? candidate : EMPTY_NOTIFICATION_STATE;
  } catch {
    return EMPTY_NOTIFICATION_STATE;
  }
}

function getFavoriteSnapshot() {
  if (!favoriteReady) {
    favoriteSnapshot = [...new Set(readArray(FAVORITES_KEY).filter((id): id is string => typeof id === "string"))];
    favoriteReady = true;
  }
  return favoriteSnapshot;
}

function getHistorySnapshot() {
  if (!historyReady) {
    historySnapshot = readArray(HISTORY_KEY).filter(isToolHistoryEntry).slice(0, 75);
    historyReady = true;
  }
  return historySnapshot;
}

function subscribeTo(eventName: string, key: string, reset: () => void, listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    reset();
    listener();
  };
  const handleLocal = () => listener();
  window.addEventListener("storage", handleStorage);
  window.addEventListener(eventName, handleLocal);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(eventName, handleLocal);
  };
}

function subscribeFavorites(listener: () => void) {
  return subscribeTo(FAVORITES_EVENT, FAVORITES_KEY, () => { favoriteReady = false; }, listener);
}

function subscribeHistory(listener: () => void) {
  return subscribeTo(HISTORY_EVENT, HISTORY_KEY, () => { historyReady = false; }, listener);
}

function getNotificationSnapshot() {
  if (!notificationReady) {
    const parsed = readNotificationState();
    notificationSnapshot = {
      readIds: [...new Set(parsed.readIds)],
      dismissedIds: [...new Set(parsed.dismissedIds)],
    };
    notificationReady = true;
  }
  return notificationSnapshot;
}

function subscribeNotifications(listener: () => void) {
  return subscribeTo(NOTIFICATIONS_EVENT, NOTIFICATIONS_KEY, () => { notificationReady = false; }, listener);
}

function saveNotificationState(state: NotificationPreferenceState) {
  notificationSnapshot = state;
  notificationReady = true;
  try {
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(state));
  } catch {
    // UI state remains available in memory when local storage is unavailable.
  }
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
}

export function useFavoriteToolIds() {
  return useSyncExternalStore(subscribeFavorites, getFavoriteSnapshot, () => EMPTY_IDS);
}

export function toggleFavorite(toolId: string) {
  favoriteSnapshot = toggleFavoriteIds(getFavoriteSnapshot(), toolId);
  favoriteReady = true;
  writeArray(FAVORITES_KEY, favoriteSnapshot);
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function useToolHistory() {
  return useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => EMPTY_HISTORY);
}

export function recordToolOpen(
  toolId: string,
  source: ToolHistoryEntry["source"] = "direct",
) {
  recordToolActivity(toolId, "opened", source);
}

export function recordToolCompletion(
  toolId: string,
  source: ToolHistoryEntry["source"] = "direct",
) {
  recordToolActivity(toolId, "completed", source);
}

function recordToolActivity(
  toolId: string,
  status: ToolHistoryEntry["status"],
  source: ToolHistoryEntry["source"],
) {
  const timestamp = new Date().toISOString();
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${toolId}`;
  historySnapshot = addHistoryEntry(getHistorySnapshot(), {
    id,
    toolId,
    timestamp,
    status,
    source,
  });
  historyReady = true;
  writeArray(HISTORY_KEY, historySnapshot);
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function removeHistoryEntry(id: string) {
  historySnapshot = removeHistoryEntryFromList(getHistorySnapshot(), id);
  historyReady = true;
  writeArray(HISTORY_KEY, historySnapshot);
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function clearToolHistory() {
  historySnapshot = EMPTY_HISTORY;
  historyReady = true;
  writeArray(HISTORY_KEY, historySnapshot);
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function useNotificationPreferences() {
  return useSyncExternalStore(
    subscribeNotifications,
    getNotificationSnapshot,
    () => EMPTY_NOTIFICATION_STATE,
  );
}

export function useVisibleNotifications() {
  const preferences = useNotificationPreferences();
  const notifications = demoNotifications.filter(
    (notification) => !preferences.dismissedIds.includes(notification.id),
  );
  return {
    notifications,
    preferences,
    unreadCount: getUnreadNotificationCount(
      preferences,
      notifications.map((notification) => notification.id),
    ),
  };
}

export function readNotification(id: string) {
  saveNotificationState(markNotificationRead(getNotificationSnapshot(), id));
}

export function readAllNotifications() {
  saveNotificationState(
    markAllNotificationsRead(
      getNotificationSnapshot(),
      demoNotifications.map((notification) => notification.id),
    ),
  );
}

export function dismissNotification(id: string) {
  saveNotificationState(dismissNotificationFromState(getNotificationSnapshot(), id));
}
