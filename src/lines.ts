/**
 * Short-lines mode: a few words per line.
 *
 * Short lines increased reading speed and halved regressions for readers with dyslexia
 * (Schneps et al. 2013, PLOS ONE, doi:10.1371/journal.pone.0071161), but only for a
 * subset of readers (doi:10.1371/journal.pone.0075634). This mode is optional and off by default.
 */

const PUNCT = /[.,;:!?…]/;

/**
 * Decide where to break after word i. `seps[i]` is the text following word i.
 * Always break after punctuation; distribute the words in between evenly
 * over lines of at most `max` words so no word stands alone.
 */
export function shortLineBreaks(seps: string[], max = 3): boolean[] {
  const n = seps.length;
  const out = new Array<boolean>(n).fill(false);
  let start = 0;
  for (let i = 0; i < n; i++) {
    if (i < n - 1 && !PUNCT.test(seps[i])) continue;
    // Section start..i with no punctuation in between
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
