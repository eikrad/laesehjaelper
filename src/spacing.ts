/**
 * Wortabstand passend zum Buchstabenabstand.
 *
 * Mehr Buchstabenabstand ohne mehr Wortabstand verlangsamt das Lesen
 * (Galliussi et al. 2020, Annals of Dyslexia, doi:10.1007/s11881-020-00194-x);
 * zusammen erhöht helfen beide (Zorzi et al. 2012, PNAS, doi:10.1073/pnas.1205566109).
 * Faustregel: Der Wortabstand wächst um das Doppelte des Buchstabenabstands,
 * damit Wortgrenzen auch bei weit gesperrter Schrift deutlich bleiben.
 */

/** Grundwortabstand in der Textansicht (em). */
export const WORD_BASE_FLOW = 0.25;
/** Grundwortabstand in den Textfeldern der Buchseite (em) — enger, weil der Platz im Original begrenzt ist. */
export const WORD_BASE_BOX = 0.12;
/** Wie stark der Wortabstand pro em Buchstabenabstand wächst. */
export const WORD_PER_LETTER = 2;

/** Wortabstand in em für einen Buchstabenabstand `ls` (em) und einen Grundwert. */
export function wordSpacing(ls: number, base: number): number {
  const extra = Math.max(0, ls) * WORD_PER_LETTER;
  return Math.round((base + extra) * 1000) / 1000;
}
