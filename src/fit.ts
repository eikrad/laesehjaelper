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

/**
 * Respect the reader's text size on a book page. Boxes never get larger than what fits, but they
 * are scaled down together until the body text has the wished size (`target`), so relative sizes
 * (headings larger) stay. The body size is the size of most of the text (`weights`: amount of text
 * per box). `limited`: the page has no room for the wished size.
 */
export function scaleToTarget(sizes: number[], weights: number[], target: number): { sizes: number[]; limited: boolean } {
  const order = sizes.map((_, i) => i).filter(i => sizes[i] > 0 && weights[i] > 0).sort((a, b) => sizes[a] - sizes[b]);
  const total = order.reduce((sum, i) => sum + weights[i], 0);
  if (!total) return { sizes, limited: false };
  let seen = 0, body = 0;
  for (const i of order) { seen += weights[i]; if (seen >= total / 2) { body = sizes[i]; break; } }
  if (body <= target) return { sizes, limited: body < target - 0.5 };
  return { sizes: sizes.map(s => s * target / body), limited: false };
}
