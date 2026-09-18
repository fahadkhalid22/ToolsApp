import type { Tool } from "@/types/tool";

export function normalizeSearchValue(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getToolSearchScore(tool: Tool, query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return tool.popularityWeight ?? 0;

  const tokens = normalizedQuery.split(" ");
  const name = normalizeSearchValue(tool.name);
  const category = normalizeSearchValue(`${tool.category} ${tool.categoryId}`);
  const keywords = normalizeSearchValue(tool.keywords.join(" "));
  const description = normalizeSearchValue(tool.shortDescription);
  const searchable = `${name} ${keywords} ${category} ${description}`;

  if (!tokens.every((token) => searchable.includes(token))) return -1;
  if (name === normalizedQuery) return 1000;
  if (name.startsWith(normalizedQuery)) return 850;
  if (name.includes(normalizedQuery)) return 700;

  const keywordMatches = tokens.filter((token) => keywords.includes(token)).length;
  const categoryMatches = tokens.filter((token) => category.includes(token)).length;
  const descriptionMatches = tokens.filter((token) => description.includes(token)).length;
  return (
    400 +
    keywordMatches * 90 +
    categoryMatches * 50 +
    descriptionMatches * 20 +
    (tool.popularityWeight ?? 0) / 100
  );
}

export function searchTools(source: readonly Tool[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return [...source].sort(
      (left, right) =>
        (right.popularityWeight ?? 0) - (left.popularityWeight ?? 0) ||
        left.name.localeCompare(right.name),
    );
  }

  return source
    .map((tool) => ({ tool, score: getToolSearchScore(tool, normalizedQuery) }))
    .filter((candidate) => candidate.score >= 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.tool.name.localeCompare(right.tool.name),
    )
    .map((candidate) => candidate.tool);
}
