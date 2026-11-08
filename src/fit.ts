/**
 * Harmonize the font sizes of text boxes on a book page.
 *
 * Each box starts with the largest font that fits (`fit`). Then:
 * - The body text gets one size: the largest that fits every box of the main text (boxes of two
 *   or more lines). A one-line fragment that fits less keeps its own, smaller size, so it does not
 *   shrink the rest.
 * - Only short boxes (at most two lines) whose original line height is clearly larger than the
 *   body text's count as headings. They stay visibly larger, by at least the ratio
 *   √(heading line height / body line height); if a heading lacks space, the body text shrinks.
 *   Headings of similar line height get the same size. Never enlarge a box beyond its fit.
 * - Everything else is body text. A measured line height says little on its own: on a tilted
 *   photo long lines measure taller, and a heading that lost its capital measures smaller.
 */
export interface FitItem { lh: number; fit: number; lines?: number }

const SAME = 0.2;      // original font sizes count as equal when line heights are this close
export function harmonizeSizes(items: FitItem[]): number[] {
  const s = items.map((it) => it.fit);
  const valid = items.map((_, i) => i).filter(i => items[i].fit > 0 && items[i].lh > 0);
  if (!valid.length) return s;
  const lines = (i: number) => items[i].lines ?? 1;
  // The body line height: the median over all lines of text.
  const byLh = [...valid].sort((a, b) => items[a].lh - items[b].lh);
  const total = byLh.reduce((sum, i) => sum + lines(i), 0);
  let seen = 0, bodyLh = items[byLh[0]].lh;
  for (const i of byLh) { seen += lines(i); if (seen >= total / 2) { bodyLh = items[i].lh; break; } }
  const heading = (i: number) => lines(i) <= 2 && items[i].lh >= bodyLh * (1 + SAME);
  const body = valid.filter(i => !heading(i));
  const main = body.filter(i => lines(i) >= 2);
  let bodySize = Math.min(...(main.length ? main : body).map(i => items[i].fit));
  // Headings, larger ones first; similar line heights share a size.
  const groups: { lh: number; size: number; indices: number[] }[] = [];
  for (const i of valid.filter(heading).sort((a, b) => items[a].lh - items[b].lh)) {
    const last = groups[groups.length - 1];
    if (last && items[i].lh / last.lh < 1 + SAME) {
      last.indices.push(i); last.size = Math.min(last.size, items[i].fit);
    } else groups.push({ lh: items[i].lh, size: items[i].fit, indices: [i] });
  }
  for (let g = groups.length - 1; g >= 0; g--) {
    for (let h = g + 1; h < groups.length; h++) {
      groups[g].size = Math.min(groups[g].size, groups[h].size / Math.sqrt(groups[h].lh / groups[g].lh));
    }
    for (const index of groups[g].indices) s[index] = groups[g].size;
  }
  for (const g of groups) bodySize = Math.min(bodySize, g.size / Math.sqrt(g.lh / bodyLh));
  for (const i of body) s[i] = Math.min(items[i].fit, bodySize);
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
