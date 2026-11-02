/**
 * Modus „kurze Zeilen“: wenige Wörter pro Zeile.
 *
 * Kurze Zeilen machten Lesende mit Legasthenie schneller und halbierten die Rücksprünge
 * (Schneps et al. 2013, PLOS ONE, doi:10.1371/journal.pone.0071161) — aber nur für einen
 * Teil von ihnen (doi:10.1371/journal.pone.0075634). Darum ist der Modus wählbar, nicht Standard.
 */

const PUNCT = /[.,;:!?…]/;

/**
 * Wo nach Wort i umgebrochen wird. `seps[i]` ist der Text nach Wort i.
 * Nach Satzzeichen wird immer umgebrochen; dazwischen werden die Wörter gleichmäßig
 * auf Zeilen mit höchstens `max` Wörtern verteilt, damit kein Wort allein steht.
 */
export function shortLineBreaks(seps: string[], max = 3): boolean[] {
  const n = seps.length;
  const out = new Array<boolean>(n).fill(false);
  let start = 0;
  for (let i = 0; i < n; i++) {
    if (i < n - 1 && !PUNCT.test(seps[i])) continue;
    // Abschnitt start..i ohne Satzzeichen dazwischen
    const len = i - start + 1;
    const lines = Math.ceil(len / max);
    const size = Math.floor(len / lines), extra = len % lines;
    let k = start;
    for (let l = 0; l < lines - 1; l++) { k += size + (l < extra ? 1 : 0); out[k - 1] = true; }
    if (i < n - 1) out[i] = true;
    start = i + 1;
  }
  return out;
}
