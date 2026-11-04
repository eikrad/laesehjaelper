/**
 * Turning pages by swiping, as in other reading apps (e.g. Kobo: swipe or tap the edge).
 *
 * Only a quick, mostly horizontal move counts, so a tap on a word still reads it aloud
 * and a vertical move still scrolls.
 */
const MIN_DISTANCE = 60;   // px; shorter moves are taps
const MAX_TIME = 800;      // ms; slower moves are drags
const RATIO = 1.5;         // horizontal movement must clearly exceed vertical movement

/** Page to turn to after a touch moved by (dx, dy) px in `ms`, or null if it was no swipe. */
export function swipeDirection(dx: number, dy: number, ms: number): "next" | "prev" | null {
  if (ms > MAX_TIME || Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * RATIO) return null;
  return dx < 0 ? "next" : "prev";
}
