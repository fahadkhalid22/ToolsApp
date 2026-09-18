export const OPEN_GLOBAL_SEARCH_EVENT = "toolsapp:open-global-search";

export function openGlobalSearch(query = "") {
  window.dispatchEvent(
    new CustomEvent<{ query: string }>(OPEN_GLOBAL_SEARCH_EVENT, {
      detail: { query },
    }),
  );
}
