/**
 * Match word spacing to letter spacing.
 *
 * Increasing letter spacing without increasing word spacing slows reading
 * (Galliussi et al. 2020, Annals of Dyslexia, doi:10.1007/s11881-020-00194-x);
 * increasing both together helps (Zorzi et al. 2012, PNAS, doi:10.1073/pnas.1205566109).
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
