/**
 * Match word spacing to letter spacing.
 *
 * Increasing letter spacing without increasing word spacing slows reading
 * (Galliussi et al. 2020, Annals of Dyslexia, doi:10.1007/s11881-020-00194-x); increasing
 * both together was merely neutral there. Extra letter spacing itself gives small,
 * inconsistent benefits: fewer errors for some children, rarely faster reading, and not
 * specific to dyslexia (Zorzi et al. 2012, PNAS, doi:10.1073/pnas.1205566109;
 * Hakvoort et al. 2017, doi:10.1016/j.jecp.2017.07.010;
 * Łuniewska et al. 2022, doi:10.1016/j.learninstruc.2021.101576).
 * Rule of thumb: word spacing increases by twice the letter spacing
 * so word boundaries remain clear even with widely spaced letters.
 */

/** Base word spacing in text view (em). */
export const WORD_BASE_FLOW = 0.25;
/** Base word spacing in book-page text boxes (em), tighter because the original space is limited. */
export const WORD_BASE_BOX = 0.12;
/** How much word spacing increases per em of letter spacing. */
export const WORD_PER_LETTER = 2;

/** Word spacing in em for letter spacing `ls` (em) and a base value. */
export function wordSpacing(ls: number, base: number): number {
  const extra = Math.max(0, ls) * WORD_PER_LETTER;
  return Math.round((base + extra) * 1000) / 1000;
}

/** Line spacing in book-page text boxes: tighter than in text view (1.6 at the default 1.9), following the setting. */
export function boxLineHeight(lh: number): number {
  return Math.round(lh * 1.6 / 1.9 * 1000) / 1000;
}

/** Default letter spacing (em) and line spacing of the settings. */
export const DEFAULT_LS = 0.04;
export const DEFAULT_LH = 1.9;

/**
 * Spacing in a book-page text box: at k = 0 the default spacing (or the reader's, where that is
 * tighter), at k = 1 the reader's. A full box first keeps the text size and gets as much of the
 * reader's spacing as fits: a larger font helps more than wider spacing in a box that is too small.
 */
export function boxSpacing(ls: number, lh: number, k: number): { ls: number; lh: number; ws: number } {
  const ls0 = Math.min(DEFAULT_LS, ls), lh0 = Math.min(DEFAULT_LH, lh);
  const l = Math.round((ls0 + (ls - ls0) * k) * 1000) / 1000, h = lh0 + (lh - lh0) * k;
  return { ls: l, lh: boxLineHeight(h), ws: wordSpacing(l, WORD_BASE_BOX) };
}
