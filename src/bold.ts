/**
 * Detect bold text. Tesseract 5 (LSTM) does not provide font attributes, so we measure
 * the stroke width of each word in the image and compare it with the page baseline.
 */

/**
 * Typical stroke width in pixels, measured from horizontal ink runs in the crop.
 * Vertical strokes, present in most letters, yield their actual width this way.
 * `g` = grayscale (0 = black), row by row. Returns NaN when there is no contrast.
 */
export function strokeWidth(g: ArrayLike<number>, w: number, h: number): number {
  let lo = 255, hi = 0;
  for (let i = 0; i < w * h; i++) { const v = g[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
  if (hi - lo < 40) return NaN;
  const thr = (lo + hi) / 2;
  const runs: number[] = [];
  for (let y = 0; y < h; y++) {
    let run = 0;
    for (let x = 0; x <= w; x++) {
      const ink = x < w && g[y * w + x] < thr;
      if (ink) run++;
      else if (run) { runs.push(run); run = 0; }
    }
  }
  if (!runs.length) return NaN;
  // Mean of the middle half: robust to long crossbars, finer than an integer median
  runs.sort((a, b) => a - b);
  const mid = runs.slice(runs.length >> 2, Math.max((runs.length >> 2) + 1, (3 * runs.length) >> 2));
  return mid.reduce((x, y) => x + y, 0) / mid.length;
}

const MIN_WORDS = 6;    // too few words for a reliable comparison
const FACTOR = 1.5;     // stroke width above this median multiplier counts as bold (typically about twice as thick)

/** Identify bold words from stroke width relative to word height. NaN = not measured. */
export function boldFlags(ratios: number[]): boolean[] {
  const valid = ratios.filter((r) => Number.isFinite(r)).sort((a, b) => a - b);
  if (valid.length < MIN_WORDS) return ratios.map(() => false);
  const med = valid[valid.length >> 1];
  return ratios.map((r) => Number.isFinite(r) && r > med * FACTOR);
}
