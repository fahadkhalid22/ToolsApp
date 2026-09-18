export const OPEN_GLOBAL_SEARCH_EVENT = "toolsapp:open-global-search";
export const OPEN_NOTIFICATIONS_EVENT = "toolsapp:open-notifications";

export function openGlobalSearch(query = "") {
  window.dispatchEvent(
    new CustomEvent<{ query: string }>(OPEN_GLOBAL_SEARCH_EVENT, {
      detail: { query },
    }),
  );
}

export function openNotifications() {
  window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_EVENT));
}
