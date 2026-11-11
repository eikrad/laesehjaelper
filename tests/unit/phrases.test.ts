import { describe, expect, it } from "vitest";
import { phraseCues, phraseBoundaries } from "../../src/phrases";
import { readingText } from "../../src/practice";

describe("adult phrase boundaries", () => {
  it("accepts only boundaries between words in the same paragraph without changing speech", () => {
    const text = "En lille *mus* bor her.\n\nSolen skinner.";
    const cues = phraseCues(text, [2, 2, -1, 4, 6, 1.5, 99]);
    expect(cues.after).toEqual([2]);
    expect(phraseBoundaries(text, cues)).toEqual([2]);
    expect(readingText(text)).toBe("En lille mus bor her.\nSolen skinner.");
  });
  it("invalidates edited text, rejects malformed annotations and keeps harmless formatting changes", () => {
    const text = "En mus bor her.", cues = phraseCues(text, [1]);
    expect(phraseBoundaries("En kat bor her.", cues)).toEqual([]);
    expect(phraseBoundaries("En *mus* bor her.", cues)).toEqual([1]);
    for (const value of [undefined, null, [], { source: text }, { source: text, after: "bad" }])
      expect(phraseBoundaries(text, value)).toEqual([]);
    expect(phraseBoundaries(text, { source: text, after: [1, 1, -1, "0", null, 999] })).toEqual([1]);
  });
});
