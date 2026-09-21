export type ToolHistoryStatus = "opened" | "completed" | "failed";

export type ToolHistoryEntry = {
  id: string;
  toolId: string;
  timestamp: string;
  status: ToolHistoryStatus;
  source?: "card" | "search" | "direct" | "history";
};

export type NotificationPreferenceState = {
  readIds: readonly string[];
  dismissedIds: readonly string[];
};

export type WorkspaceSettings = {
  profile: {
    displayName: string;
    email: string;
  };
  inAppNotifications: boolean;
};

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  profile: { displayName: "", email: "" },
  inAppNotifications: true,
};

export function toggleFavoriteIds(ids: readonly string[], toolId: string) {
  return ids.includes(toolId) ? ids.filter((id) => id !== toolId) : [...ids, toolId];
}

export function addHistoryEntry(
  entries: readonly ToolHistoryEntry[],
  entry: ToolHistoryEntry,
  cap = 75,
) {
  const newest = entries[0];
  const duplicateWindow =
    newest?.toolId === entry.toolId &&
    newest?.status === entry.status &&
    Math.abs(Date.parse(entry.timestamp) - Date.parse(newest.timestamp)) < 2000;
  if (duplicateWindow) return [...entries];
  return [entry, ...entries].slice(0, Math.max(1, cap));
}

export function removeHistoryEntry(entries: readonly ToolHistoryEntry[], id: string) {
  return entries.filter((entry) => entry.id !== id);
}

export function isToolHistoryEntry(value: unknown): value is ToolHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ToolHistoryEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.toolId === "string" &&
    typeof entry.timestamp === "string" &&
    ["opened", "completed", "failed"].includes(entry.status ?? "")
  );
}

export function markNotificationRead(state: NotificationPreferenceState, id: string) {
  return state.readIds.includes(id)
    ? state
    : { ...state, readIds: [...state.readIds, id] };
}

export function markAllNotificationsRead(
  state: NotificationPreferenceState,
  visibleIds: readonly string[],
) {
  return { ...state, readIds: [...new Set([...state.readIds, ...visibleIds])] };
}

export function dismissNotification(state: NotificationPreferenceState, id: string) {
  return state.dismissedIds.includes(id)
    ? state
    : { ...state, dismissedIds: [...state.dismissedIds, id] };
}

export function getUnreadNotificationCount(
  state: NotificationPreferenceState,
  visibleIds: readonly string[],
) {
  return visibleIds.filter(
    (id) => !state.readIds.includes(id) && !state.dismissedIds.includes(id),
  ).length;
}

export function isNotificationPreferenceState(value: unknown): value is NotificationPreferenceState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<NotificationPreferenceState>;
  return (
    Array.isArray(state.readIds) &&
    state.readIds.every((id) => typeof id === "string") &&
    Array.isArray(state.dismissedIds) &&
    state.dismissedIds.every((id) => typeof id === "string")
  );
}

export function isWorkspaceSettings(value: unknown): value is WorkspaceSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<WorkspaceSettings>;
  return (
    typeof settings.inAppNotifications === "boolean" &&
    !!settings.profile &&
    typeof settings.profile === "object" &&
    typeof settings.profile.displayName === "string" &&
    settings.profile.displayName.length <= 80 &&
    typeof settings.profile.email === "string" &&
    settings.profile.email.length <= 254
  );
}

export function validateWorkspaceProfile(displayName: string, email: string) {
  const name = displayName.trim();
  const contactEmail = email.trim();
  return {
    displayName: !name
      ? "Enter a display name."
      : name.length < 2
        ? "Use at least 2 characters."
        : name.length > 80
          ? "Keep the display name under 80 characters."
          : undefined,
    email: contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
      ? "Enter a valid email address or leave this field empty."
      : undefined,
    value: { displayName: name, email: contactEmail },
  };
}
