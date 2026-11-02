/**
 * Harmonize the font sizes of text boxes on a book page.
 *
 * Each box starts with the largest font that fits (`fit`). Then:
 * - Similar line heights are grouped within a 20% range and receive equal font sizes.
 * - Clearly larger original text (headings) stays visibly larger, by at least the
 *   ratio √(larger line height / smaller line height). If a heading lacks space, shrink
 *   the smaller text; never enlarge a box beyond its fitted font size.
 */
export interface FitItem { lh: number; fit: number }

const SAME = 0.2;      // original font sizes count as equal when line heights are this close
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
  // Each group has exactly one role, so equality cannot create a cycle with
  // the heading rule. Resolve larger groups first.
  for (let i = groups.length - 1; i >= 0; i--) {
    for (let j = i + 1; j < groups.length; j++) {
      groups[i].size = Math.min(groups[i].size, groups[j].size / Math.sqrt(groups[j].lh / groups[i].lh));
    }
    for (const index of groups[i].indices) s[index] = groups[i].size;
  }
  return s;
}
