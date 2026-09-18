export type ToolHistoryStatus = "opened" | "completed" | "failed";

export type ToolHistoryEntry = {
  id: string;
  toolId: string;
  timestamp: string;
  status: ToolHistoryStatus;
  source?: "card" | "search" | "direct" | "history";
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
