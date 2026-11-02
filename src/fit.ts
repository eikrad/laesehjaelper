/**
 * Schriftgrößen der Textfelder auf der Buchseite aufeinander abstimmen.
 *
 * Jedes Feld bekommt zunächst die größte Schrift, die hineinpasst (`fit`). Danach gilt:
 * - Ähnliche Zeilenhöhen werden in Gruppen mit höchstens 20 % Streuung gleich groß gesetzt.
 * - Deutlich größere Originalschrift (Überschrift) bleibt sichtbar größer: mindestens im
 *   Verhältnis √(lh_groß / lh_klein). Reicht der Platz der Überschrift nicht, wird der kleinere
 *   Text verkleinert – nie wird ein Feld größer gesetzt, als es passt.
 */
export interface FitItem { lh: number; fit: number }

const SAME = 0.2;      // gleiche Schriftgröße im Original, wenn die Zeilenhöhen so nah beieinander liegen
export function harmonizeSizes(items: FitItem[]): number[] {
  const s = items.map((it) => it.fit);
  const order = items.map((_, i) => i).filter(i => items[i].fit > 0 && items[i].lh > 0)
    .sort((a, b) => items[a].lh - items[b].lh);
  const groups: { lh: number; size: number; indices: number[] }[] = [];
  for (const i of order) {
    const last = groups[groups.length - 1];
    if (last && items[i].lh / last.lh < 1 + SAME) {
      last.indices.push(i); last.size = Math.min(last.size, items[i].fit);
    } else groups.push({ lh: items[i].lh, size: items[i].fit, indices: [i] });
  }
  // Jede Gruppe hat genau eine Rolle. Gleichheit kann dadurch keinen Zyklus mit
  // der Überschriftenregel bilden; größere Gruppen werden zuerst festgelegt.
  for (let i = groups.length - 1; i >= 0; i--) {
    for (let j = i + 1; j < groups.length; j++) {
      groups[i].size = Math.min(groups[i].size, groups[j].size / Math.sqrt(groups[j].lh / groups[i].lh));
    }
    for (const index of groups[i].indices) s[index] = groups[i].size;
  }
  return s;
}
