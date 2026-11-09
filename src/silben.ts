// Reading syllables: reviewed word corrections, then TeX patterns (Danish, German, British English).
import { hyphenateSync as da } from "hyphen/da";
import { hyphenateSync as de } from "hyphen/de-1996";
import { hyphenateSync as en } from "hyphen/en-gb";
import { readingWords } from "./syllable-words";

const SHY = "­";
const trenner = { da, de, en };
const corrections = new Map(Object.entries(readingWords).map(([language, words]) =>
  [language, new Map(words.map(word => [word.replaceAll("·", ""), word]))]));

// Split a single word into syllables. Returns an array of syllables.
export function silben(wort: string, sprache: string = "da"): string[] {
  if (wort.length < 3) return [wort];
  const language = sprache === "de" || sprache === "en" ? sprache : "da";
  const marked = corrections.get(language)?.get(wort.toLowerCase());
  if (marked) {
    // Apply the boundary lengths to the original word so OCR spelling and capitalisation survive.
    let start = 0;
    return marked.split("·").map(part => {
      const syllable = wort.slice(start, start + part.length);
      start += part.length;
      return syllable;
    });
  }
  const h = trenner[language];
  return h(wort, { hyphenChar: SHY, minWordLength: 3 }).split(SHY).filter(Boolean);
}

/**
 * Syllable marks only on long words: graphic syllable aids help mainly on words with three or more
 * syllables, during the move to fluent reading (Brügelmann 2025, doi:10.25656/01:34472, a report,
 * not peer-reviewed); each extra syllable makes a word harder for young readers (Kearns et al. 2026,
 * doi:10.3389/fpsyg.2026.1852797). An option per reader, since the evidence is weak.
 */
export const LONG_WORD_SYLLABLES = 3;

/** Does a word with this many syllables get coloured syllables or arcs? */
export function marksSyllables(syllables: number, onlyLong: boolean): boolean {
  return !onlyLong || syllables >= LONG_WORD_SYLLABLES;
}
