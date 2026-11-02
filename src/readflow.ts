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
