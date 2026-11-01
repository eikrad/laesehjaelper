// Silbentrennung auf Basis der TeX-Trennmuster (Dänisch und Deutsch in neuer Rechtschreibung).
import { hyphenateSync as da } from "hyphen/da";
import { hyphenateSync as de } from "hyphen/de-1996";

const SHY = "­";
const trenner = { da, de };

// Einzelnes Wort in Silben zerlegen. Gibt ein Array von Silben zurück.
export function silben(wort, sprache = "da") {
  if (wort.length < 3) return [wort];
  const h = trenner[sprache] || da;
  return h(wort, { hyphenChar: SHY, minWordLength: 3 }).split(SHY).filter(Boolean);
}
