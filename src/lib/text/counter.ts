export type TextStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
};

export function analyzeText(input: string): TextStats {
  if (!input || typeof input !== "string") {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTimeMinutes: 0,
    };
  }

  const characters = input.length;
  const charactersNoSpaces = input.replace(/\s/g, "").length;

  // Words: split by whitespace, filter out empty strings
  const trimmed = input.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;

  // Sentences: count occurrences of sentence-ending punctuation followed by whitespace or end of string
  const sentenceMatches = input.match(/[.!?]+(?=\s|$)/g);
  // If there's text but no explicit terminal punctuation, count as 1 sentence if non-empty
  const sentences = sentenceMatches ? sentenceMatches.length : (trimmed === "" ? 0 : 1);

  // Paragraphs: split by double newlines or multiple newline sequences, filter non-empty
  const paragraphList = input.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphs = paragraphList.length > 0 ? paragraphList.length : (trimmed === "" ? 0 : 1);

  // Lines: split by newline
  const lines = input === "" ? 0 : input.split(/\r\n|\r|\n/).length;

  // Reading time: ~200 words per minute
  const readingTimeMinutes = Math.ceil(words / 200);

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes: readingTimeMinutes < 1 && words > 0 ? 1 : readingTimeMinutes,
  };
}
