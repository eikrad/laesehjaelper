// Extract real text lines and groups from Tesseract OCR results for a book page.
//
// Children’s books contain many illustrations. Tesseract often mistakes shading and lines for letters
// and appends these "words" to real lines. Real words usually receive high
// confidence (80–97%), while image noise receives low confidence. The filter uses this distinction.

import type { Box, OcrData, OcrLine, OcrWord, Para } from "./types";

const LETTER = /\p{L}/u;
const ONLY_SIGNS = /^[\d.,:;!?»«"'„“”()\-–—]+$/u;

const letters = (t: string): number => (t.match(/\p{L}/gu) || []).length;
// Does this look like a word (letters, syllable separators, punctuation at the edges)?
const WORDLIKE = /^[»«"'‘’„“(]*\p{L}[\p{L}·.\-‐]*(?:['’]\p{L}[\p{L}·.\-‐]*)*[.,:;!?»«"'‘’“”)]*$/u;
// Inside a reliable line, word-like text is enough. Numbers/punctuation (e.g. “1.”) need 60% confidence.
const usable = (w: OcrWord): boolean => !!w.text && (WORDLIKE.test(w.text) || (ONLY_SIGNS.test(w.text) && w.confidence >= 60));
// Reliable words establish that a line fragment contains real text.
const strong = (w: OcrWord): boolean => letters(w.text) >= 2 && w.confidence >= 90 && WORDLIKE.test(w.text);
// At the edge of a line fragment, a word needs reasonable confidence (slightly lower on the right).
const edgeOk = (w: OcrWord, min: number): boolean => w.confidence >= min && (letters(w.text) >= 2 || (ONLY_SIGNS.test(w.text) && w.confidence >= 85) || /^[AaIiÅåØøÆæ][.,:;!?]?$/.test(w.text));

const union = (bs: Box[]): Box => ({
  x0: Math.min(...bs.map((b) => b.x0)), y0: Math.min(...bs.map((b) => b.y0)),
  x1: Math.max(...bs.map((b) => b.x1)), y1: Math.max(...bs.map((b) => b.y1)),
});

/** A line fragment (part of an OCR line), before and after finalization. */
interface RawUnit { ws: OcrWord[]; pre: OcrWord[]; h: number; extra: OcrWord[] }
interface Unit extends RawUnit { bbox: Box; words: Box[]; text: string }

// Split an OCR line at large gaps between words (e.g. text on the left, an image on the right),
// keeping only fragments that look like real text.
function lineUnits(line: OcrLine): RawUnit[] {
  // With preserve_interword_spaces, Tesseract puts the spaces of a wide gap (e.g. after an image)
  // into the next word (“ Bjørne-far”), which would then no longer look like a word.
  const words = (line.words || []).map((w) => ({ ...w, text: (w.text || "").trim() })).filter((w) => w.text);
  const hs = words.filter(strong).map((w) => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b);
  const h = hs[hs.length >> 1] || line.bbox.y1 - line.bbox.y0;
  // 1. Split at large gaps (beginner readers have wide word spacing; images are farther away)
  const parts: OcrWord[][] = [];
  let cur: OcrWord[] = [];
  for (const w of words) {
    const prev = cur[cur.length - 1];
    if (prev && w.bbox.x0 - prev.bbox.x1 > 2.6 * h) { parts.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) parts.push(cur);
  // 2. Keep fragments with reliable words, remove unusable content, trim uncertain edge words.
  //    Retain trimmed word-like fragments on the left: if they align with the left margin
  //    of the paragraph, they belong to it (words beside images often receive low confidence).
  const units: RawUnit[] = [];
  for (const part of parts) {
    if (!part.some(strong)) continue;
    const ws = part.filter(usable);
    const pre: OcrWord[] = [];
    while (ws.length && !edgeOk(ws[0], 75)) pre.push(ws.shift()!);
    // On the right, an uncertain word may stay if it continues the text: word-like, as tall as the
    // line's words, and close to a word that stays itself. Marks in a picture beside the line can
    // sit close to each other, but none of them is trusted.
    const stays: boolean[] = [];
    ws.forEach((b, i) => {
      const a = ws[i - 1];
      stays.push(edgeOk(b, 55) || (!!a && stays[i - 1] && WORDLIKE.test(b.text) && b.confidence >= 40 &&
        b.bbox.x0 - a.bbox.x1 < 1.2 * h && b.bbox.y1 - b.bbox.y0 <= 1.5 * h));
    });
    while (ws.length && !stays[ws.length - 1]) ws.pop();
    if (!ws.length) continue;
    // Paint over nearby fragments (e.g. an uncertain word ending) without displaying them
    const i0 = part.indexOf(ws[0]), i1 = part.indexOf(ws[ws.length - 1]);
    const extra: OcrWord[] = [];
    for (let i = i1 + 1; i < part.length && part[i].bbox.x0 - part[i - 1].bbox.x1 < 1.0 * h; i++) extra.push(part[i]);
    for (let i = i0 - 1; i >= 0 && part[i + 1].bbox.x0 - part[i].bbox.x1 < 1.0 * h && !pre.includes(part[i]); i--) extra.push(part[i]);
    units.push({ ws, pre: pre.filter((w) => WORDLIKE.test(w.text)), h, extra });
  }
  return units;
}

/** Join words into text; mark bold words, including consecutive ones, as *…*. */
function boldText(ws: OcrWord[]): string {
  const out: string[] = [];
  ws.forEach((w, i) => {
    const open = w.bold && !ws[i - 1]?.bold, close = w.bold && !ws[i + 1]?.bold;
    out.push((open ? "*" : "") + w.text + (close ? "*" : ""));
  });
  return out.join(" ");
}
const finishUnit = (u: RawUnit): Unit => ({ ...u, bbox: union(u.ws.map((w) => w.bbox)), words: [...u.ws, ...(u.extra || [])].map((w) => w.bbox), text: boldText(u.ws) });

// Restore trimmed left-hand words if they start at the group’s shared left margin.
function rescueLeft(group: Unit[]): Unit[] {
  const xs = group.map((u) => u.bbox.x0).sort((a, b) => a - b);
  const margin = xs[(xs.length - 1) >> 1]; // for an even count, use the smaller of the two middle values
  return group.map((u) => {
    if (!u.pre.length) return u;
    for (let i = 0; i < u.pre.length; i++) {
      if (Math.abs(u.pre[i].bbox.x0 - margin) < 0.8 * u.h) return finishUnit({ ...u, ws: [...u.pre.slice(i), ...u.ws], pre: [] });
    }
    return u;
  });
}

// Group lines into paragraphs: vertically adjacent, similar in size, overlapping, without a large gap.
function groupUnits(units: Unit[]): Unit[][] {
  units.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
  const groups: Unit[][] = [];
  for (const u of units) {
    let target: Unit[] | null = null;
    for (let i = groups.length - 1; i >= 0 && !target; i--) {
      const last = groups[i][groups[i].length - 1];
      const gap = u.bbox.y0 - last.bbox.y1;
      const sameSize = Math.max(u.h, last.h) / Math.min(u.h, last.h) < 1.35;
      const overlap = Math.min(u.bbox.x1, last.bbox.x1) - Math.max(u.bbox.x0, last.bbox.x0) > 0;
      const near = gap > -0.5 * last.h && gap < 0.9 * Math.max(u.h, last.h);
      if (sameSize && overlap && near && u.bbox.y0 > last.bbox.y0) target = groups[i];
    }
    if (target) target.push(u); else groups.push([u]);
  }
  return groups;
}

// Clean up OCR text. Line breaks within a paragraph become spaces.
// Option bookSyllables: some beginner readers split difficult words into syllables (“sko-le”,
// “mor·gen·en”). Hyphens/middle dots between letters then become our syllable separator “·”.
// Without this option, ordinary hyphens remain (“Lille-by”), and a hyphen at the
// end of a line is removed as usual (“Wör-\nter” → “Wörter”).
export function cleanOcr(raw: string, { bookSyllables = false }: { bookSyllables?: boolean } = {}): string {
  let t = raw.replace(/\r/g, "").replace(/[|]/g, "I");
  if (bookSyllables) {
    t = t
      .replace(/(\p{L})[-‐‑¬·•]\s*\n\s*(\p{Ll})/gu, "$1·$2")
      .replace(/(\p{L})[-‐‑·•](?=\p{L})/gu, "$1·")
      .replace(/(\p{Ll})\.(?=\p{Ll})/gu, "$1·");
  } else {
    t = t
      .replace(/(\p{Ll})[-‐‑¬]\s*\n\s*(\p{Ll})/gu, "$1$2")
      .replace(/(\p{L})[‐‑](?=\p{L})/gu, "$1-");
  }
  return t
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim())
    .filter((p) => p.length > 0 && LETTER.test(p))
    .join("\n\n");
}

// For tilted page photos, Tesseract sometimes returns the same line twice (as two
// overlapping lines). Keep the one with more reliable words; if equal, the one that kept more
// words (beside an image, one pass may drop an uncertain word that the other reads well).
// A line read twice (in both passes, or twice in one) shares its words with the other reading;
// keep the more reliable one. A line that another line's box only reaches into (a tall word, a
// mark in a picture) is a line of its own.
function dedupe(units: Unit[]): Unit[] {
  const area = (b: Box): number => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
  const overlap = (a: Box, b: Box): boolean => {
    const i = { x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) };
    return area(i) > 0.5 * Math.min(area(a), area(b));
  };
  const shared = (u: Unit, k: Unit): boolean => 2 * u.ws.filter((w) => k.ws.some((v) => overlap(w.bbox, v.bbox))).length >= u.ws.length;
  const score = (u: Unit): number => u.ws.filter(strong).length;
  const kept: Unit[] = [];
  for (const u of [...units].sort((a, b) => score(b) - score(a) || b.ws.length - a.ws.length)) {
    if (!kept.some((k) => overlap(u.bbox, k.bbox) && shared(u, k))) kept.push(u);
  }
  return kept;
}

// Result: text groups with positions, line and word areas (for painting over), and text.
// The caller sets g.text using cleanOcr(g.raw, options), so settings work without rerunning OCR.
// Multiple OCR runs (e.g. the original image and one with a normalized background) can be
// combined: overlapping lines are merged, keeping the more reliable one.
export function parasFromOcr(...runs: OcrData[]): Para[] {
  const units: Unit[] = [];
  for (const data of runs) for (const b of data.blocks || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) units.push(...lineUnits(l).map(finishUnit));
  return groupUnits(dedupe(units)).map(rescueLeft).map((ls) => {
    const hs = ls.map((l) => l.h).sort((a, b) => a - b);
    return {
      bbox: union(ls.map((l) => l.bbox)),
      lines: ls.map((l) => l.bbox),
      words: ls.flatMap((l) => l.words),
      lh: hs[hs.length >> 1],
      raw: ls.map((l) => l.text).join("\n"),
    };
  }).filter((g) => letters(g.raw) >= 4); // omit tiny fragments (usually from images)
}
