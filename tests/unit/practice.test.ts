import { describe, expect, it } from "vitest";
import { practiceWord, practiceContext, savePracticeWord, reviewWords, loadPracticeWords, updatePracticeWord, practiceKey, forgetPractice } from "../../src/practice";

describe("personal word practice", () => {
  it("refreshes stale context when a corrected word is explicitly saved again", () => {
    const page = { id: "p", lang: "da", text: "En mus bor her." };
    const old = { ...practiceWord("a", "b", page, 1)!, familiar: true };
    const fresh = practiceWord("a", "b", { ...page, text: "En mus sover her." }, 1)!;
    expect(savePracticeWord([old], fresh)).toEqual([{ ...fresh, familiar: true }]);
    const replacement = { ...old, pageId: "replacement" };
    expect(savePracticeWord([old], replacement)).toEqual([replacement]);
  });
  it("keeps a chosen word connected to its sentence in the book", () => {
    const page = { id: "page-1", lang: "da", text: "Solen skinner. Den lille *mus* bor her.\n\nDen sover." };
    const word = practiceWord("reader-1", "book-1", page, 4)!;
    expect(word.word).toBe("mus");
    expect(practiceContext(word, page)).toBe("Den lille mus bor her.");
    expect(practiceWord("a", "b", { ...page, id: undefined }, 0)).toBeNull();
    expect(practiceWord("a", "b", page, 100)).toBeNull();
  });

  it("deduplicates a saved spelling within a reader's book and includes familiar words for review", () => {
    const page = { id: "p", lang: "da", text: "Mus og mus bor her." };
    const first = practiceWord("a", "book", page, 0)!;
    let words = savePracticeWord([], { ...first, familiar: true });
    words = savePracticeWord(words, practiceWord("a", "book", page, 2)!);
    words = savePracticeWord(words, practiceWord("b", "book", page, 0)!);
    words = savePracticeWord(words, practiceWord("a", "other-book", page, 0)!);
    expect(reviewWords(words, "a", "book")).toEqual([{ ...first, familiar: true }]);
    expect(reviewWords(words, "b", "book")).toHaveLength(1);
    expect(reviewWords(words, "a", "other-book")).toHaveLength(1);
  });

  it("does not attach an old context to edited, replaced or missing page text", () => {
    const page = { id: "p", lang: "da", text: "En mus bor her." };
    const word = practiceWord("a", "book", page, 1)!;
    expect(practiceContext(word, { ...page, text: "En kat bor her." })).toBeNull();
    expect(practiceContext(word, { ...page, id: "replacement" })).toBeNull();
    expect(practiceContext(word, undefined)).toBeNull();
    expect(practiceContext(word, { ...page, lang: "de" })).toBeNull();
    // Formatting cues may change without changing the actual spelling being practised.
    expect(practiceContext(word, { ...page, text: "En *mus* bor her." })).toBe("En mus bor her.");
  });

  it("loads valid personal items and lets an adult retire them or delete their owner", () => {
    const word = practiceWord("a", "book", { id: "p", lang: "da", text: "En mus bor her." }, 1)!;
    const loaded = loadPracticeWords(JSON.stringify([word, { ...word, start: 99 }, { word: "bad" }]));
    expect(loaded).toEqual([word]);
    expect(loadPracticeWords("broken json")).toEqual([]);
    expect(updatePracticeWord(loaded, practiceKey(word), true)).toEqual([{ ...word, familiar: true }]);
    expect(updatePracticeWord(loaded, practiceKey(word), null)).toEqual([]);
    expect(forgetPractice(loaded, "reader", "a")).toEqual([]);
    expect(forgetPractice(loaded, "book", "book")).toEqual([]);
    expect(forgetPractice(loaded, "reader", "other")).toEqual([word]);
  });
});
