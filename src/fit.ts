/**
 * Schriftgrößen der Textfelder auf der Buchseite aufeinander abstimmen.
 *
 * Jedes Feld bekommt zunächst die größte Schrift, die hineinpasst (`fit`). Danach gilt:
 * - Gleich große Originalschrift (Zeilenhöhe `lh` innerhalb von 20 %) wird gleich groß gesetzt.
 * - Deutlich größere Originalschrift (Überschrift) bleibt sichtbar größer: mindestens im
 *   Verhältnis √(lh_groß / lh_klein). Reicht der Platz der Überschrift nicht, wird der kleinere
 *   Text verkleinert – nie wird ein Feld größer gesetzt, als es passt.
 */
export interface FitItem { lh: number; fit: number }

const SAME = 0.2;      // gleiche Schriftgröße im Original, wenn die Zeilenhöhen so nah beieinander liegen
const BIGGER = 1.2;    // ab diesem Verhältnis gilt Schrift als deutlich größer

export function harmonizeSizes(items: FitItem[]): number[] {
  const s = items.map((it) => it.fit);
  const ok = (i: number) => items[i].fit > 0 && items[i].lh > 0;
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (let i = 0; i < s.length; i++) {
      if (!ok(i)) continue;
      for (let j = 0; j < s.length; j++) {
        if (i === j || !ok(j)) continue;
        const r = items[i].lh / items[j].lh;
        if (Math.abs(r - 1) < SAME && s[j] < s[i] - 1e-9) { s[i] = s[j]; changed = true; }
        else if (r > BIGGER) {
          const max = s[i] / Math.sqrt(r);           // höchste Größe, die j neben i haben darf
          if (s[j] > max + 1e-9) { s[j] = max; changed = true; }
        }
      }
    }
    if (!changed) break;
  }
  return s;
}
