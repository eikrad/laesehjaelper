import { describe, expect, it } from "vitest";
import { type Gray, restoreMarks } from "../../src/sylmarks";
import type { Box, OcrData, OcrWord } from "../../src/types";

// Self-made word images: letters as simple shapes standing on a baseline, and the small marks some
// early readers print between syllables ("bo-e-de", "en·gang").
const W = 420, H = 110, BASE = 70, XH = 24, PAPER = 235, INK = 30;
const ASC = "bdfhklt", WIDE = 18, GAP = 4;

function blank(): Gray { return { data: new Uint8ClampedArray(W * H).fill(PAPER), width: W, height: H }; }
function fill(img: Gray, b: Box) {
  const d = img.data as Uint8ClampedArray;
  for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) d[y * W + x] = INK;
}
/** A letter: a ring at x-height, with a stem up for letters with an ascender, and a dot over "i". */
function letter(img: Gray, x: number, ch: string): Box {
  if (ch === "i") {
    fill(img, { x0: x, y0: BASE - XH, x1: x + 4, y1: BASE });
    fill(img, { x0: x, y0: BASE - XH - 9, x1: x + 4, y1: BASE - XH - 5 });
    return { x0: x, y0: BASE - XH - 9, x1: x + 4, y1: BASE };
  }
  const top = BASE - XH;
  fill(img, { x0: x, y0: top, x1: x + WIDE, y1: top + 3 });
  fill(img, { x0: x, y0: BASE - 3, x1: x + WIDE, y1: BASE });
  fill(img, { x0: x, y0: top, x1: x + 3, y1: BASE });
  fill(img, { x0: x + WIDE - 3, y0: top, x1: x + WIDE, y1: BASE });
  const asc = ASC.includes(ch);
  if (asc) fill(img, { x0: x, y0: top - 12, x1: x + 3, y1: top });
  return { x0: x, y0: asc ? top - 12 : top, x1: x + WIDE, y1: BASE };
}

type Mark = "dash" | "dot" | "speck";
/** Draw a word; marks[i] sits after letter i. Like Tesseract when it drops a mark, the letter after
 *  it gets a box that takes the mark in. */
function word(text: string, marks: Record<number, Mark> = {}, x0 = 40): { img: Gray; w: OcrWord } {
  const img = blank(), symbols: { text: string; bbox: Box }[] = [];
  let x = x0, pending: number | null = null;
  [...text].forEach((ch, i) => {
    const b = letter(img, x, ch);
    symbols.push({ text: ch, bbox: { ...b, x0: pending ?? b.x0 } });
    pending = null;
    x = b.x1 + GAP;
    const m = marks[i];
    if (m) {
      const [w, h] = m === "dash" ? [8, 3] : m === "dot" ? [4, 4] : [1, 1];
      const y0 = BASE - Math.round(XH / 2) - (h >> 1);
      fill(img, { x0: x, y0, x1: x + w, y1: y0 + h });
      pending = x;
      x += w + GAP;
    }
  });
  const bbox = { x0: symbols[0].bbox.x0, y0: Math.min(...symbols.map(s => s.bbox.y0)), x1: x - GAP, y1: BASE };
  return { img, w: { text, confidence: 90, bbox, symbols } };
}
const data = (...ws: OcrWord[]): OcrData => ({ blocks: [{ paragraphs: [{ lines: [{ text: ws.map(w => w.text).join(" "), bbox: ws[0].bbox, words: ws }] }] }] });
/** The word's text after restoring its marks. */
const after = (img: Gray, w: OcrWord): string => { restoreMarks(data(w), img); return w.text; };
const restored = (text: string, marks: Record<number, Mark> = {}) => { const { img, w } = word(text, marks); return after(img, w); };

describe("Syllable marks dropped by recognition", () => {
  it("Puts back short dashes between syllables", () => {
    expect(restored("boede", { 1: "dash", 2: "dash" })).toBe("bo-e-de");
  });

  it("Puts back a round dot the same way, so the book's marks are all treated alike", () => {
    expect(restored("engang", { 1: "dot" })).toBe("en-gang");
  });

  it("Leaves words without marks as they are, with the dot of an i above the letters", () => {
    expect(restored("bil")).toBe("bil");
    expect(restored("dame")).toBe("dame");
  });

  it("Does not add a mark that recognition already found", () => {
    const { img, w } = word("skoven", { 2: "dash" });
    // Recognition read the dash: it has a symbol of its own.
    const s = w.symbols ?? [], dash = { text: "-", bbox: { x0: s[3].bbox.x0, y0: BASE - 14, x1: s[3].bbox.x0 + 8, y1: BASE - 11 } };
    w.symbols = [...s.slice(0, 3), dash, { ...s[3], bbox: { ...s[3].bbox, x0: dash.bbox.x1 + GAP } }, ...s.slice(4)];
    w.text = "sko-ven";
    expect(after(img, w)).toBe("sko-ven");
  });

  it("Ignores specks and loose pieces of a letter", () => {
    expect(restored("rose", { 1: "speck" })).toBe("rose");
    // A crossbar inside a letter, not touching it: ink above and below in the same columns.
    const { img, w } = word("ee");
    fill(img, { x0: w.bbox.x0 + 6, y0: BASE - 13, x1: w.bbox.x0 + 12, y1: BASE - 10 });
    expect(after(img, w)).toBe("ee");
  });

  it("Leaves words alone whose characters do not match their text", () => {
    const { img, w } = word("boede", { 1: "dash" });
    w.text = "bo ede";
    expect(after(img, w)).toBe("bo ede");
  });
});
