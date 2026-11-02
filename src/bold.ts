/**
 * Fettdruck erkennen. Tesseract 5 (LSTM) liefert keine Schriftmerkmale, darum messen wir
 * die Strichstärke jedes Worts im Bild und vergleichen sie mit dem Üblichen auf der Seite.
 */

/**
 * Typische Strichstärke in Pixeln aus den waagrechten Tinten-Läufen im Ausschnitt.
 * Senkrechte Striche (die meisten Buchstaben haben welche) ergeben so genau ihre Breite.
 * `g` = Graustufen (0 = schwarz), Zeile für Zeile. NaN, wenn es keinen Kontrast gibt.
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
  // Mittel der mittleren Hälfte: robust gegen lange Querstriche, feiner als ein ganzzahliger Median
  runs.sort((a, b) => a - b);
  const mid = runs.slice(runs.length >> 2, Math.max((runs.length >> 2) + 1, (3 * runs.length) >> 2));
  return mid.reduce((x, y) => x + y, 0) / mid.length;
}

const MIN_WORDS = 6;    // darunter gibt es keinen verlässlichen Vergleich
const FACTOR = 1.5;     // so viel dicker als der Median gilt als fett (echtes Fett: etwa doppelt)

/** Welche Wörter fett sind, aus Strichstärke relativ zur Worthöhe. NaN = nicht gemessen. */
export function boldFlags(ratios: number[]): boolean[] {
  const valid = ratios.filter((r) => Number.isFinite(r)).sort((a, b) => a - b);
  if (valid.length < MIN_WORDS) return ratios.map(() => false);
  const med = valid[valid.length >> 1];
  return ratios.map((r) => Number.isFinite(r) && r > med * FACTOR);
}
