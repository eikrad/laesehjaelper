// Silbentrennung auf Basis der TeX-Trennmuster (Dänisch, Deutsch in neuer Rechtschreibung, britisches Englisch).
import { hyphenateSync as da } from "hyphen/da";
import { hyphenateSync as de } from "hyphen/de-1996";
import { hyphenateSync as en } from "hyphen/en-gb";

const SHY = "­";
const trenner = { da, de, en };

// Einzelnes Wort in Silben zerlegen. Gibt ein Array von Silben zurück.
export function silben(wort: string, sprache: string = "da"): string[] {
  if (wort.length < 3) return [wort];
  const h = trenner[sprache as keyof typeof trenner] || da;
  return h(wort, { hyphenChar: SHY, minWordLength: 3 }).split(SHY).filter(Boolean);
}
