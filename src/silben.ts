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
