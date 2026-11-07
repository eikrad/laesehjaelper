// Syllabification using TeX hyphenation patterns (Danish, reformed German spelling, British English).
import { hyphenateSync as da } from "hyphen/da";
import { hyphenateSync as de } from "hyphen/de-1996";
import { hyphenateSync as en } from "hyphen/en-gb";

const SHY = "­";
const trenner = { da, de, en };

// Split a single word into syllables. Returns an array of syllables.
export function silben(wort: string, sprache: string = "da"): string[] {
  if (wort.length < 3) return [wort];
  const h = trenner[sprache as keyof typeof trenner] || da;
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
