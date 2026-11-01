// Silbentrennung für Deutsch (neue Rechtschreibung) auf Basis der TeX-Trennmuster.
import { hyphenateSync } from "hyphen/de-1996";

const SHY = "­";

// Einzelnes Wort in Silben zerlegen. Gibt ein Array von Silben zurück.
export function silben(wort) {
  if (wort.length < 3) return [wort];
  const getrennt = hyphenateSync(wort, { hyphenChar: SHY, minWordLength: 3 });
  return getrennt.split(SHY).filter(Boolean);
}

window.Silben = { silben };
