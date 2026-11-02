/**
 * Wortteile (Morpheme) für Dänisch: zusammengesetzte Wörter in bekannte Teile zerlegen und
 * Beugungsendungen abtrennen, z. B. „sommerfuglene“ → sommer | fugl | +ene.
 *
 * Dänisch ist eine tiefe Orthographie (Seymour et al. 2003, doi:10.1348/000712603321661859);
 * bekannte Wortteile helfen, lange Wörter zu entschlüsseln. Die Zerlegung nutzt eine
 * Wortliste (Stavekontrolden, siehe THIRD_PARTY_NOTICES.md) und einfache Regeln. Grenzen:
 * Wörter, die nicht in der Liste stehen, bleiben ganz; mehrdeutige Wörter („anden“ = die Ente
 * oder der andere) werden nicht zerlegt, wenn sie selbst in der Liste stehen; Vorsilben
 * (be-, for-, u-) werden nur erkannt, wenn der Rest ein bekanntes Wort ist und die Vorsilbe
 * selbst als Wort in der Liste steht.
 */

export interface MorphPart { text: string; suffix: boolean }

/** Beugungsendungen (Substantive, Verben, Adjektive), längste zuerst */
const SUFFIXES = ["erne", "ende", "ene", "ede", "ens", "ets", "ers", "ste", "er", "en", "et", "es", "re", "ne", "e", "s", "t", "r", "n"];
const MIN_PART = 3;          // kürzester eigenständiger Wortteil (nur am Ende)
const MIN_FRONT = 4;         // vordere Teile: sonst zu viele Zufallstreffer (mor|gen, sam|men)
const LINKS = ["s", "e"];    // Fugenlaute zwischen Wortteilen

/** Zerlegung eines Stamms in bekannte Teile (Grenzen als Indizes), möglichst wenige Teile. */
function compound(stem: string, has: (w: string) => boolean): number[] | null {
  const n = stem.length;
  // best[i] = kleinste Teilezahl für stem[0..i), mit Zerlegung
  const best: ({ parts: number; cuts: number[]; links: number } | null)[] = new Array(n + 1).fill(null);
  best[0] = { parts: 0, cuts: [], links: 0 };
  for (let i = 0; i < n; i++) {
    const b = best[i]; if (!b) continue;
    for (let j = i + MIN_PART; j <= n; j++) {
      if (i === 0 && j === n) continue;           // das ganze Wort ist keine Zerlegung
      if (!has(stem.slice(i, j))) continue;
      const opts: [number, number][] = [[j, 0]];
      // Fugenlaut nur zwischen zwei Teilen, nie am Ende
      for (const l of LINKS) if (j + l.length < n && stem.startsWith(l, j)) opts.push([j + l.length, 1]);
      for (const [end, link] of opts) {
        if (end < n && end - i < MIN_FRONT) continue;   // vorderer Teil (mit Fugenlaut) zu kurz
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
  // Stamm + Endung: bekanntes Wort ganz, sonst längster bekannter (oder zerlegbarer) Stamm
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

/** Wortteile eines Worts; Bindestriche bleiben am vorderen Teil. */
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
