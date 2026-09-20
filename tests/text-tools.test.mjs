import assert from "node:assert/strict";
import test from "node:test";
import { analyzeText } from "../src/lib/text/counter.ts";

test("analyzeText handles empty string correctly", () => {
  const stats = analyzeText("");
  assert.deepEqual(stats, {
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    spaces: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTimeMinutes: 0,
  });
});

test("analyzeText counts words, characters, sentences, and paragraphs accurately", () => {
  const text = "Hello world! This is a test.\n\nSecond paragraph here with multiple words.";
  const stats = analyzeText(text);
  assert.equal(stats.words, 12);
  assert.equal(stats.characters, text.length);
  assert.equal(stats.charactersNoSpaces, text.replace(/\s/g, "").length);
  assert.equal(stats.spaces, 10);
  assert.equal(stats.sentences, 3);
  assert.equal(stats.paragraphs, 2);
  assert.equal(stats.lines, 3);
  assert.equal(stats.readingTimeMinutes, 1);
});

test("analyzeText handles whitespace and punctuation correctly", () => {
  const str = "   spaces   everywhere...   ";
  const stats = analyzeText(str);
  assert.equal(stats.words, 2);
  assert.equal(stats.characters, str.length);
  assert.equal(stats.charactersNoSpaces, str.replace(/\s/g, "").length);
  assert.equal(stats.spaces, 9);
});

test("analyzeText ignores punctuation-only content and separates tabs and newlines", () => {
  const punctuation = analyzeText("...!? —");
  assert.equal(punctuation.words, 0);
  assert.equal(punctuation.sentences, 0);

  const separated = analyzeText("one\ttwo\nthree");
  assert.equal(separated.words, 3);
  assert.equal(separated.lines, 2);
  assert.equal(separated.spaces, 0);
});

test("analyzeText handles Unicode, paragraphs, apostrophes, and deterministic reading time", () => {
  const unicode = analyzeText("Café isn't closed. مرحبا بالعالم!\n\n第二段");
  assert.equal(unicode.words, 6);
  assert.equal(unicode.sentences, 3);
  assert.equal(unicode.paragraphs, 2);

  const longText = Array.from({ length: 201 }, () => "word").join(" ");
  assert.equal(analyzeText(longText).readingTimeMinutes, 2);
});
