/**
 * "Listen first, then read yourself."
 *
 * Repeated reading greatly improves reading fluency; hearing the text read aloud
 * beforehand is among the most effective additions (Lee & Yoon 2017,
 * Journal of Learning Disabilities, doi:10.1177/0022219415605194).
 */

/** Reading speed for each setting (SpeechSynthesisUtterance.rate). */
export const RATES: Record<string, number> = { langsom: 0.65, normal: 0.85 };

export function speechRate(choice: string): number {
  return RATES[choice] ?? RATES.normal;
}

/** Whether to show the "Your turn" prompt after reading aloud. */
export function showYourTurn(how: "end" | "stop", turn: string): boolean {
  return how === "end" && turn === "an";
}

/** One step when speaking a tapped word. `part` = syllable index, null = whole word. */
export interface WordStep { text: string; part: number | null; slow: boolean }

/**
 * Tapped word: first the whole word, then slowly syllable by syllable, then the whole word again,
 * making the link between letters and sounds audible (systematic
 * letter-sound instruction is the best-supported intervention, Galuschka et al. 2014,
 * PLOS ONE, doi:10.1371/journal.pone.0089900).
 */
export function wordSteps(word: string, parts: string[]): WordStep[] {
  const whole: WordStep = { text: word, part: null, slow: false };
  const syl = parts.map((p, i) => ({ text: p.replace(/[^\p{L}\p{M}]/gu, ""), part: i, slow: true })).filter(s => s.text);
  return syl.length > 1 ? [whole, ...syl, { ...whole }] : [whole];
}
