"use client";

import { useSyncExternalStore } from "react";

import {
  addHistoryEntry,
  isToolHistoryEntry,
  removeHistoryEntry as removeHistoryEntryFromList,
  toggleFavoriteIds,
  type ToolHistoryEntry,
} from "./state";

const FAVORITES_KEY = "toolsapp:favorites:v1";
const HISTORY_KEY = "toolsapp:history:v1";
const FAVORITES_EVENT = "toolsapp:favorites-updated";
const HISTORY_EVENT = "toolsapp:history-updated";
const EMPTY_IDS: readonly string[] = [];
const EMPTY_HISTORY: readonly ToolHistoryEntry[] = [];

let favoriteSnapshot: readonly string[] = EMPTY_IDS;
let favoriteReady = false;
let historySnapshot: readonly ToolHistoryEntry[] = EMPTY_HISTORY;
let historyReady = false;

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
  const timestamp = new Date().toISOString();
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${toolId}`;
  historySnapshot = addHistoryEntry(getHistorySnapshot(), {
    id,
    toolId,
    timestamp,
    status: "opened",
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
