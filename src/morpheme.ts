/**
 * Danish word parts (morphemes): split compound words into known parts and
 * separate inflectional endings, e.g. “sommerfuglene” → sommer | fugl | +ene.
 *
 * Danish has a deep orthography (Seymour et al. 2003, doi:10.1348/000712603321661859);
 * familiar word parts help decode long words. Splitting uses a
 * word list (Stavekontrolden, see THIRD_PARTY_NOTICES.md) and simple rules. Limitations:
 * Words missing from the list stay whole; ambiguous words (“anden” = the duck
 * or the other one) are not split if listed themselves; prefixes
 * (be-, for-, u-) are recognized only when the rest is a known word and the prefix
 * itself is listed as a word.
 */

export interface MorphPart { text: string; suffix: boolean }

/** Inflectional endings (nouns, verbs, adjectives), longest first */
const SUFFIXES = ["erne", "ende", "ene", "ede", "ens", "ets", "ers", "ste", "er", "en", "et", "es", "re", "ne", "e", "s", "t", "r", "n"];
const MIN_PART = 3;          // shortest standalone word part (only at the end)
const MIN_FRONT = 4;         // leading parts: shorter ones cause too many accidental matches (mor|gen, sam|men)
const LINKS = ["s", "e"];    // linking sounds between word parts

/** Split a stem into as few known parts as possible (boundaries as indices). */
function compound(stem: string, has: (w: string) => boolean): number[] | null {
  const n = stem.length;
  // best[i] = smallest number of parts for stem[0..i), including the split
  const best: ({ parts: number; cuts: number[]; links: number } | null)[] = new Array(n + 1).fill(null);
  best[0] = { parts: 0, cuts: [], links: 0 };
  for (let i = 0; i < n; i++) {
    const b = best[i]; if (!b) continue;
    for (let j = i + MIN_PART; j <= n; j++) {
      if (i === 0 && j === n) continue;           // the whole word does not count as a split
      if (!has(stem.slice(i, j))) continue;
      const opts: [number, number][] = [[j, 0]];
      // A linking sound occurs only between two parts, never at the end
      for (const l of LINKS) if (j + l.length < n && stem.startsWith(l, j)) opts.push([j + l.length, 1]);
      for (const [end, link] of opts) {
        if (end < n && end - i < MIN_FRONT) continue;   // leading part (including its linking sound) is too short
        const cand = { parts: b.parts + 1, cuts: [...b.cuts, end], links: b.links + link };
        const cur = best[end];
        if (!cur || cand.parts < cur.parts || (cand.parts === cur.parts && cand.links < cur.links)) best[end] = cand;
      }
    }
  }
  const r = best[n];
  return r && r.parts >= 2 ? r.cuts.slice(0, -1) : null;
}

function splitPiece(piece: string, has: (w: string) => boolean): MorphPart[] {
  const low = piece.toLowerCase();
  if (low.length < 2 || !/^\p{L}+$/u.test(low)) return piece ? [{ text: piece, suffix: false }] : [];
  // Stem + ending: keep known words whole; otherwise use the longest known (or splittable) stem
  let stemLen = -1;
  if (has(low)) stemLen = low.length;
  else {
    for (const s of [...SUFFIXES].sort((a, b) => a.length - b.length)) {
      if (!low.endsWith(s) || low.length - s.length < 2) continue;
      if (has(low.slice(0, -s.length))) { stemLen = low.length - s.length; break; }
    }
    if (stemLen < 0) {
      for (const s of ["", ...[...SUFFIXES].sort((a, b) => a.length - b.length)]) {
        if (!low.endsWith(s) || low.length - s.length < 2 * MIN_PART) continue;
        if (compound(low.slice(0, low.length - s.length), has)) { stemLen = low.length - s.length; break; }
      }
    }
  }
  if (stemLen < 0) return [{ text: piece, suffix: false }];
  const cuts = compound(low.slice(0, stemLen), has) || [];
  const out: MorphPart[] = [];
  let at = 0;
  for (const c of [...cuts, stemLen]) { out.push({ text: piece.slice(at, c), suffix: false }); at = c; }
  if (stemLen < piece.length) out.push({ text: piece.slice(stemLen), suffix: true });
  return out;
}

/** Find the parts of a word; keep hyphens attached to the preceding part. */
export function morphParts(word: string, has: (w: string) => boolean): MorphPart[] {
  if (!word) return [];
  const pieces = word.split("-");
  return pieces.flatMap((p, k) => {
    const parts = splitPiece(p, has);
    if (k < pieces.length - 1) {
      if (parts.length) parts[parts.length - 1] = { ...parts[parts.length - 1], text: parts[parts.length - 1].text + "-" };
      else parts.push({ text: "-", suffix: false });
    }
    return parts;
  });
}
