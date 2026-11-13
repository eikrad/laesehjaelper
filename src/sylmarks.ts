// Syllable marks printed in the book.
//
// Some early readers split words into syllables with a short dash or a dot at mid letter height
// ("bo-e-de", "en·gang"). Tesseract reads these marks as hyphens in one word and drops them in
// the next, so the "Syllable breaks" setting could not treat a book's marks alike. Here the marks
// are found in the image and put back into the word where recognition dropped them: small, solid
// spots of ink at mid letter height between two letters, with nothing above or below them. They go
// back as "-", as recognition reads such marks when it sees them (short dashes and dots are hard to
// tell apart in a photo); the setting then decides what they mean.

import type { Box, OcrData, OcrWord } from "./types";

/** Grey image, one value per pixel (0 = black). */
export interface Gray { data: ArrayLike<number>; width: number; height: number }

/** Letters that stand on the baseline and reach exactly the x-height. */
const X_HEIGHT = /^[acemnorsuvwxzæø]$/u;
const LETTER = /^\p{L}$/u;
const MARK = /^[-‐‑·•.]$/u;
const med = (a: number[]): number => { a.sort((x, y) => x - y); return a[a.length >> 1]; };

/** Insert the syllable marks recognition dropped into the words of data, using the page image
 *  the positions refer to. */
export function restoreMarks(data: OcrData, img: Gray): void {
  for (const b of data.blocks || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) for (const w of l.words || []) {
    const marks = marksIn(img, w);
    if (!marks.length) continue;
    const syms = w.symbols || [], lead = w.text.match(/^\s*/u)?.[0] ?? "";
    w.text = lead + syms.map((s, i) => s.text + (marks.find((m) => m.after === i)?.mark ?? "")).join("") + w.text.slice(lead.length + syms.map((s) => s.text).join("").length);
  }
}

/** Marks in the word's image that its characters lack: after which character, and which mark. */
export function marksIn(img: Gray, w: OcrWord): { after: number; mark: string }[] {
  const syms = w.symbols || [];
  if (syms.length < 3 || w.text.trim().slice(0, syms.map((s) => s.text).join("").length) !== syms.map((s) => s.text).join("")) return [];
  // Letter height and baseline from the letters without ascenders or descenders.
  const xs = syms.filter((s) => X_HEIGHT.test(s.text.toLowerCase()) && s.text === s.text.toLowerCase());
  if (!xs.length) return [];
  const base = med(xs.map((s) => s.bbox.y1)), xh = med(xs.map((s) => s.bbox.y1 - s.bbox.y0));
  if (xh < 6) return [];
  const r = clip({ x0: w.bbox.x0 - 1, y0: Math.min(w.bbox.y0, base - xh) - 1, x1: w.bbox.x1 + 1, y1: Math.max(w.bbox.y1, base) + 1 }, img);
  const cw = r.x1 - r.x0, ch = r.y1 - r.y0;
  if (cw < 4 || ch < 4) return [];
  // Ink: darker than halfway between the word's ink and its paper.
  const g = new Float32Array(cw * ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) g[y * cw + x] = img.data[(r.y0 + y) * img.width + r.x0 + x];
  const sorted = Float32Array.from(g).sort(), lo = sorted[Math.floor(sorted.length * 0.05)], hi = sorted[Math.floor(sorted.length * 0.95)];
  if (hi - lo < 40) return [];
  const ink = Uint8Array.from(g, (v) => (v < (lo + hi) / 2 ? 1 : 0));
  const label = new Int32Array(cw * ch).fill(-1), found: { after: number; mark: string }[] = [];
  const bandTop = base - xh - r.y0, bandBot = base - r.y0;   // x-height band in crop rows
  for (let start = 0; start < ink.length; start++) {
    if (!ink[start] || label[start] >= 0) continue;
    // One connected spot of ink (8-neighbours) and its extent.
    let x0 = cw, y0 = ch, x1 = -1, y1 = -1, n = 0;
    const todo = [start];
    label[start] = start;
    while (todo.length) {
      const i = todo.pop() as number, x = i % cw, y = (i - x) / cw;
      n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (let ny = Math.max(0, y - 1); ny <= Math.min(ch - 1, y + 1); ny++)
        for (let nx = Math.max(0, x - 1); nx <= Math.min(cw - 1, x + 1); nx++) {
          const j = ny * cw + nx;
          if (ink[j] && label[j] < 0) { label[j] = start; todo.push(j); }
        }
    }
    const sw = x1 - x0 + 1, sh = y1 - y0 + 1, cy = (y0 + y1) / 2;
    // Small and solid, at mid letter height.
    if (sh > 0.4 * xh || sw > xh || sw < Math.max(2, 0.12 * xh) || sh < 2 || n < 0.5 * sw * sh) continue;
    if (cy < bandBot - 0.75 * xh || cy > bandBot - 0.2 * xh) continue;
    // Nothing else in its columns within the letters' height: not a loose piece of a letter.
    let alone = true;
    for (let y = Math.max(0, Math.round(bandTop)); y < Math.min(ch, Math.round(bandBot)) && alone; y++)
      for (let x = x0; x <= x1; x++) if (ink[y * cw + x] && label[y * cw + x] !== start) { alone = false; break; }
    if (!alone) continue;
    // Between two letters, where recognition put no mark.
    const cx = r.x0 + (x0 + x1) / 2;
    const after = syms.filter((s) => (s.bbox.x0 + s.bbox.x1) / 2 < cx).length - 1;
    const a = syms[after], b = syms[after + 1];
    if (!a || !b || !LETTER.test(a.text) || !LETTER.test(b.text) || MARK.test(a.text) || MARK.test(b.text)) continue;
    // Overlapping character boxes do not establish a gap for a separator: a detached letter
    // stroke can sit between their centers and otherwise be mistaken for a printed dash.
    if (a.bbox.x1 > b.bbox.x0) continue;
    if (!found.some((f) => f.after === after)) found.push({ after, mark: "-" });
  }
  return found;
}

function clip(b: Box, img: Gray): Box {
  return { x0: Math.max(0, Math.round(b.x0)), y0: Math.max(0, Math.round(b.y0)), x1: Math.min(img.width, Math.round(b.x1)), y1: Math.min(img.height, Math.round(b.y1)) };
}
