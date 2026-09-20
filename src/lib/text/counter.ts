export type TextStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  spaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
};

export const READING_WORDS_PER_MINUTE = 200;

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
const HAS_WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/u;

function countSentences(input: string) {
  return input
    .split(/[.!?]+(?:\s+|$)/u)
    .filter((segment) => HAS_WORD_PATTERN.test(segment)).length;
}

export function analyzeText(input: string): TextStats {
  if (!input || typeof input !== "string") {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      spaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTimeMinutes: 0,
    };
  }

  const characters = input.length;
  const charactersNoSpaces = input.replace(/\s/g, "").length;
  const spaces = input.match(/\p{Zs}/gu)?.length ?? 0;

  const trimmed = input.trim();
  const words = input.match(WORD_PATTERN)?.length ?? 0;
  // This is intentionally a simple punctuation-based heuristic rather than
  // language-aware sentence segmentation.
  const sentences = countSentences(input);

  // Paragraphs: split by double newlines or multiple newline sequences, filter non-empty
  const paragraphList = input.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphs = paragraphList.length > 0 ? paragraphList.length : (trimmed === "" ? 0 : 1);

  // Lines: split by newline
  const lines = input === "" ? 0 : input.split(/\r\n|\r|\n/).length;

  const readingTimeMinutes = Math.ceil(words / READING_WORDS_PER_MINUTE);

  return {
    words,
    characters,
    charactersNoSpaces,
    spaces,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes: readingTimeMinutes < 1 && words > 0 ? 1 : readingTimeMinutes,
  };
}
