/**
 * Optional line guides. Niklaus et al. (2023), doi:10.1145/3544548.3581367, compared rulers
 * in adults, with results varying by design. This does not validate our modes for young children.
 */

/** Word rectangles in DOM reading order, with a separate block for each paragraph. */
export interface GuideWord { index: number; block: number; left: number; right: number; top: number; bottom: number }
export interface GuideLine { words: number[]; left: number; right: number; top: number; bottom: number }

/** Keep DOM order: two columns at the same height are still two different reading lines. */
export function readingLines(words: GuideWord[]): GuideLine[] {
  const lines: GuideLine[] = [];
  let block = -1;
  for (const w of words) {
    const last = lines.at(-1);
    const overlap = last ? Math.min(last.bottom, w.bottom) - Math.max(last.top, w.top) : 0;
    if (last && block === w.block && overlap >= Math.min(last.bottom - last.top, w.bottom - w.top) / 2) {
      last.words.push(w.index);
      last.left = Math.min(last.left, w.left); last.right = Math.max(last.right, w.right);
      last.top = Math.min(last.top, w.top); last.bottom = Math.max(last.bottom, w.bottom);
    } else lines.push({ words: [w.index], left: w.left, right: w.right, top: w.top, bottom: w.bottom });
    block = w.block;
  }
  return lines;
}
