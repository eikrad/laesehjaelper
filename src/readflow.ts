/**
 * "Listen first, then read yourself."
 *
 * Repeated reading improves reading fluency, most on the practised text; hearing the text
 * read aloud beforehand is among the most effective additions (Lee & Yoon 2017,
 * Journal of Learning Disabilities, doi:10.1177/0022219415605194). In whole classes the
 * effects are smaller and fade without continued practice (Lauer-Schmaltz et al. 2014,
 * Didaktik Deutsch, doi:10.25656/01:17152).
 */

/** Reading speed for each setting (SpeechSynthesisUtterance.rate). */
export const RATES: Record<string, number> = { langsom: 0.65, normal: 0.85 };

export function speechRate(choice: string, slow = false, language = ""): number {
  const rate = RATES[choice] ?? RATES.normal;
  return rate * (slow ? language === "da" ? 0.9 : 0.75 : 1);
}

/** Whether to show the "Your turn" prompt after reading aloud. */
export function showYourTurn(how: "end" | "stop", turn: string): boolean {
  return how === "end" && turn === "an";
}

/** One step when speaking a tapped word. `part` = syllable index, null = whole word. */
export interface WordStep { text: string; part: number | null; slow: boolean }

/**
 * Tapped word: whole, slow support, then whole again. For Danish, keep the slow word intact:
 * isolated written syllables can lose their pronunciation context in reduced Danish speech
 * (Trecca et al. 2021, doi:10.1111/lang.12450). This is a pronunciation safeguard, not evidence
 * that this particular playback sequence improves reading. Other languages keep slow syllables,
 * making the link between letters and sounds audible (systematic
 * letter-sound instruction is the best-supported intervention, Galuschka et al. 2014,
 * PLOS ONE, doi:10.1371/journal.pone.0089900). Speech feedback on hard words during the
 * child's own reading helped in training studies, including segmented feedback followed by
 * the whole word for Danish pupils (Olson & Wise 1992, doi:10.1007/BF01027488;
 * Elbro, Rasmussen & Spelling 1996, doi:10.1111/j.1467-9450.1996.tb00647.x).
 */
export function wordSteps(word: string, parts: string[], language: string): WordStep[] {
  const whole: WordStep = { text: word, part: null, slow: false };
  const syl = parts.map((p, i) => ({ text: p.replace(/[^\p{L}\p{M}]/gu, ""), part: i, slow: true })).filter(s => s.text);
  return syl.length > 1 ? [whole, ...(language === "da" ? [{ ...whole, slow: true }] : syl), { ...whole }] : [whole];
}
