/**
 * „Erst hören, dann selbst lesen“.
 *
 * Wiederholtes Lesen verbessert die Leseflüssigkeit stark; den Text vorher vorgelesen
 * zu bekommen gehört zu den wirksamsten Zusätzen (Lee & Yoon 2017,
 * Journal of Learning Disabilities, doi:10.1177/0022219415605194).
 */

/** Vorlesetempo je Einstellung (SpeechSynthesisUtterance.rate). */
export const RATES: Record<string, number> = { langsom: 0.65, normal: 0.85 };

export function speechRate(choice: string): number {
  return RATES[choice] ?? RATES.normal;
}

/** Ob nach dem Vorlesen der Hinweis „Jetzt bist du dran“ erscheint. */
export function showYourTurn(how: "end" | "stop", turn: string): boolean {
  return how === "end" && turn === "an";
}

/** Ein Schritt beim Vorlesen eines angetippten Worts. `part` = Index der Silbe, null = ganzes Wort. */
export interface WordStep { text: string; part: number | null; slow: boolean }

/**
 * Angetipptes Wort: erst ganz, dann langsam Silbe für Silbe, dann wieder ganz —
 * so wird die Verbindung von Buchstaben und Lauten hörbar (systematische
 * Buchstabe-Laut-Arbeit ist die am besten belegte Hilfe, Galuschka et al. 2014,
 * PLOS ONE, doi:10.1371/journal.pone.0089900).
 */
export function wordSteps(word: string, parts: string[]): WordStep[] {
  const whole: WordStep = { text: word, part: null, slow: false };
  const syl = parts.map((p, i) => ({ text: p.replace(/[^\p{L}\p{M}]/gu, ""), part: i, slow: true })).filter(s => s.text);
  return syl.length > 1 ? [whole, ...syl, { ...whole }] : [whole];
}
