import { describe, expect, it } from "vitest";
import { eraseText, halo, inkMask, type Pixels } from "../../src/erase";
import type { Box, Para } from "../../src/types";
import { loadCv } from "./opencv";

type RGB = [number, number, number];
const W = 320, H = 140;
const WORD: Box = { x0: 80, y0: 50, x1: 220, y1: 82 };
const LH = 32;
const ALL: Box = { x0: 0, y0: 0, x1: W, y1: H };

const PAPER: RGB = [246, 238, 214];
const DARK_INK: RGB = [30, 30, 80];
// Grass: diagonal blades in two greens, busy enough that a flat fill would show as a patch.
const grass = (x: number, y: number): RGB => (Math.floor((x + y) / 10) % 2 ? [205, 225, 120] : [95, 160, 70]);
const night = (x: number, y: number): RGB => (Math.floor((x - y) / 10) % 2 ? [40, 60, 95] : [75, 40, 50]);

/** Letter-like strokes inside WORD: stems every 14 px, joined by short bars. */
const stroke = (x: number, y: number): boolean => {
  const rx = x - WORD.x0, ry = y - WORD.y0;
  if (rx < 2 || ry < 2 || x >= WORD.x1 - 2 || y >= WORD.y1 - 2) return false;
  return rx % 14 < 4 || (ry % 14 < 3 && rx % 28 < 14);
};

function picture(bg: (x: number, y: number) => RGB, ink: RGB | null): Pixels {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = ink && stroke(x, y) ? ink : bg(x, y), i = (y * W + x) * 4;
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
  }
  return { data, width: W, height: H };
}
const para = (): Para => ({ bbox: { ...WORD }, lines: [{ ...WORD }], words: [{ ...WORD }], lh: LH, raw: "tekst" });
const at = (img: Pixels, x: number, y: number): RGB => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
const dist = (a: RGB, b: RGB) => (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3;
/** Mean colour difference between two images inside a box. */
function meanDiff(a: Pixels, b: Pixels, r: Box): number {
  let s = 0, n = 0;
  for (let y = r.y0; y < r.y1; y++) for (let x = r.x0; x < r.x1; x++) { s += dist(at(a, x, y), at(b, x, y)); n++; }
  return s / n;
}
const padded: Box = { x0: WORD.x0 - 12, y0: WORD.y0 - 12, x1: WORD.x1 + 12, y1: WORD.y1 + 12 };


describe("Ink mask for text on an illustration", () => {
  const masked = (m: Uint8Array, x: number, y: number) => m[y * W + x] > 0;
  const gap = { x: WORD.x0 + 9, y: WORD.y0 + 8 };   // Between two stems and two bars, 5 px from each.

  it("Marks the letter strokes and spares the picture between them", () => {
    const img = picture(grass, DARK_INK), m = inkMask(img, [WORD], LH, ALL);
    for (let y = WORD.y0; y < WORD.y1; y++) for (let x = WORD.x0; x < WORD.x1; x++) if (stroke(x, y)) expect(masked(m, x, y)).toBe(true);
    expect(masked(m, gap.x, gap.y)).toBe(false);
    expect(masked(m, WORD.x0 - 20, WORD.y0 + 10)).toBe(false);
  });

  it("Also finds light letters on a dark picture", () => {
    const img = picture(night, [250, 248, 235]), m = inkMask(img, [WORD], LH, ALL);
    for (let y = WORD.y0; y < WORD.y1; y++) for (let x = WORD.x0; x < WORD.x1; x++) if (stroke(x, y)) expect(masked(m, x, y)).toBe(true);
    expect(masked(m, gap.x, gap.y)).toBe(false);
  });

  it("Leaves picture parts beside a line alone when they do not look like the text", () => {
    // A dark blade right of the line would be found as a line ending; it is not text-coloured.
    const tail: Box = { x0: WORD.x1, y0: WORD.y0, x1: WORD.x1 + 40, y1: WORD.y1 };
    const img = picture(grass, DARK_INK), m = inkMask(img, [WORD], LH, ALL, [WORD, tail]);
    for (let x = tail.x0 + 6; x < tail.x1; x++) expect(masked(m, x, WORD.y0 + 15)).toBe(false);
  });
});

describe("Erasing the original text", () => {
  it("Paints text on plain paper with the paper colour when OpenCV is not available", () => {
    const img = picture(() => PAPER, DARK_INK), pa = para();
    eraseText(img, [pa], null);
    expect(pa.busy).toBe(false);
    expect(pa.inpainted).toBeFalsy();
    for (let y = WORD.y0; y < WORD.y1; y++) for (let x = WORD.x0; x < WORD.x1; x++) expect(dist(at(img, x, y), PAPER)).toBeLessThan(3);
  });

  it("On paper with uneven light, replaces only the letters and leaves the paper around them as it was", async () => {
    const cv = await loadCv();
    // Light falls off downwards and to the right, and the paper has a fine texture (as in a photo).
    const paper = (x: number, y: number): RGB => { const v = 246 - y * 0.5 - x * 0.08 + ((x * 7 + y * 13) % 9) - 4; return [v, v - 8, v - 32]; };
    const img = picture(paper, DARK_INK), clean = picture(paper, null), pa = para();
    eraseText(img, [pa], cv);
    expect(pa.busy).toBe(false);
    expect(pa.inpainted).toBeFalsy();   // Text on paper gets no halo in the page view.
    for (let y = WORD.y0; y < WORD.y1; y++) for (let x = WORD.x0; x < WORD.x1; x++) if (stroke(x, y)) expect(dist(at(img, x, y), DARK_INK)).toBeGreaterThan(40);
    // A rectangle painted over the word would flatten the light fall-off and the texture.
    expect(meanDiff(img, clean, padded)).toBeLessThan(3);
  });

  it("On paper, also removes the soft edges of the letters, so no outline of the old text is left", async () => {
    const cv = await loadCv();
    const paper = (x: number, y: number): RGB => { const v = 246 - y * 0.5 - x * 0.08 + ((x * 7 + y * 13) % 9) - 4; return [v, v - 8, v - 32]; };
    // Photographed print has soft edges: two rings of pixels around each stroke blend ink and paper.
    const near = (x: number, y: number, r: number) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (stroke(x + dx, y + dy)) return true; return false; };
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const bg = paper(x, y), t = stroke(x, y) ? 1 : near(x, y, 1) ? 0.55 : near(x, y, 2) ? 0.2 : 0;
      const i = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) data[i + k] = bg[k] + (DARK_INK[k] - bg[k]) * t;
      data[i + 3] = 255;
    }
    const img: Pixels = { data, width: W, height: H }, clean = picture(paper, null);
    eraseText(img, [para()], cv);
    let darkest = 0;
    for (let y = WORD.y0 - 4; y < WORD.y1 + 4; y++) for (let x = WORD.x0 - 4; x < WORD.x1 + 4; x++) {
      const a = at(img, x, y), c = at(clean, x, y);
      darkest = Math.max(darkest, (c[0] + c[1] + c[2] - a[0] - a[1] - a[2]) / 3);
    }
    expect(darkest).toBeLessThan(16);
  });

  it("On paper darkening towards a shadow, removes the soft letter edges also where other words stand in the shadow", async () => {
    const cv = await loadCv();
    // Light falls off strongly to the right, as on a photographed page near the fold.
    const paper = (x: number, y: number): RGB => { const v = 250 - x * 0.4 + ((x * 7 + y * 13) % 9) - 4; return [v, v - 8, v - 32]; };
    const WORD2: Box = { x0: 236, y0: WORD.y0, x1: 312, y1: WORD.y1 };
    const ink = (x: number, y: number) => stroke(x, y) || (x >= WORD2.x0 && x < WORD2.x1 && stroke(x - 156, y));
    const near = (x: number, y: number, r: number) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (ink(x + dx, y + dy)) return true; return false; };
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const bg = paper(x, y), t = ink(x, y) ? 1 : near(x, y, 1) ? 0.55 : near(x, y, 2) ? 0.2 : 0;
      const i = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) data[i + k] = bg[k] + (DARK_INK[k] - bg[k]) * t;
      data[i + 3] = 255;
    }
    const img: Pixels = { data, width: W, height: H }, clean = picture(paper, null);
    const both: Para = { bbox: { x0: WORD.x0, y0: WORD.y0, x1: WORD2.x1, y1: WORD.y1 }, lines: [{ x0: WORD.x0, y0: WORD.y0, x1: WORD2.x1, y1: WORD.y1 }], words: [{ ...WORD }, WORD2], lh: LH, raw: "tekst tekst" };
    eraseText(img, [both], cv);
    let darkest = 0;
    for (let y = WORD.y0 - 4; y < WORD.y1 + 4; y++) for (let x = WORD.x0 - 4; x < WORD.x1 + 4; x++) {
      const a = at(img, x, y), c = at(clean, x, y);
      darkest = Math.max(darkest, (c[0] + c[1] + c[2] - a[0] - a[1] - a[2]) / 3);
    }
    expect(darkest).toBeLessThan(16);
  });

  it("On paper, removes the soft letter edges also when the next line comes close", async () => {
    const cv = await loadCv();
    const paper = (x: number, y: number): RGB => { const v = 236 + ((x * 7 + y * 13) % 9) - 4; return [v, v - 8, v - 32]; };
    // Lines are close: the next line's ascenders reach into the ring around the word.
    const NEXT: Box = { x0: WORD.x0, y0: WORD.y1 + 9, x1: WORD.x1, y1: WORD.y1 + 9 + (WORD.y1 - WORD.y0) };
    const ink = (x: number, y: number) => stroke(x, y) || (y >= NEXT.y0 && y < NEXT.y1 && stroke(x, y - NEXT.y0 + WORD.y0));
    const near = (x: number, y: number, r: number) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (ink(x + dx, y + dy)) return true; return false; };
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const bg = paper(x, y), t = ink(x, y) ? 1 : near(x, y, 1) ? 0.55 : near(x, y, 2) ? 0.25 : 0;
      const i = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) data[i + k] = bg[k] + (DARK_INK[k] - bg[k]) * t;
      data[i + 3] = 255;
    }
    const img: Pixels = { data, width: W, height: H }, clean = picture(paper, null);
    const lines: Para = { bbox: { x0: WORD.x0, y0: WORD.y0, x1: WORD.x1, y1: NEXT.y1 }, lines: [{ ...WORD }, NEXT], words: [{ ...WORD }, NEXT], lh: LH, raw: "tekst\ntekst" };
    eraseText(img, [lines], cv);
    let darkest = 0;
    for (let y = WORD.y0 - 4; y < NEXT.y1 + 4; y++) for (let x = WORD.x0 - 4; x < WORD.x1 + 4; x++) {
      const a = at(img, x, y), c = at(clean, x, y);
      darkest = Math.max(darkest, (c[0] + c[1] + c[2] - a[0] - a[1] - a[2]) / 3);
    }
    expect(darkest).toBeLessThan(16);
  });

  it("On a plain dark page, removes light print with soft edges", async () => {
    const cv = await loadCv();
    const dark = (x: number, y: number): RGB => { const v = ((x * 7 + y * 13) % 9) - 4; return [28 + v, 40 + v, 72 + v]; };
    const LIGHT_INK: RGB = [250, 246, 228];
    const near = (x: number, y: number, r: number) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (stroke(x + dx, y + dy)) return true; return false; };
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const bg = dark(x, y), t = stroke(x, y) ? 1 : near(x, y, 1) ? 0.55 : near(x, y, 2) ? 0.25 : 0;
      const i = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) data[i + k] = bg[k] + (LIGHT_INK[k] - bg[k]) * t;
      data[i + 3] = 255;
    }
    const img: Pixels = { data, width: W, height: H }, clean = picture(dark, null);
    eraseText(img, [para()], cv);
    let brightest = 0;
    for (let y = WORD.y0 - 4; y < WORD.y1 + 4; y++) for (let x = WORD.x0 - 4; x < WORD.x1 + 4; x++) {
      const a = at(img, x, y), c = at(clean, x, y);
      brightest = Math.max(brightest, (a[0] + a[1] + a[2] - c[0] - c[1] - c[2]) / 3);
    }
    expect(brightest).toBeLessThan(16);
  });

  it("On paper, removes brown print with soft edges also when a brown picture touches the line end", async () => {
    const cv = await loadCv();
    const paper = (x: number, y: number): RGB => { const v = 236 + ((x * 7 + y * 13) % 9) - 4; return [v, v - 8, v - 32]; };
    // Photographed print is dark brown with soft, mid-brown edges; a picture (say a burrow) in the
    // same mid-brown starts right after the line, inside the area the mask compares colours with.
    const BROWN_INK: RGB = [40, 24, 12], BURROW: Box = { x0: WORD.x1 + 3, y0: WORD.y0 - 14, x1: WORD.x1 + 40, y1: WORD.y1 + 14 };
    const near = (x: number, y: number, r: number) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (stroke(x + dx, y + dy)) return true; return false; };
    const scene = (withInk: boolean): Pixels => {
      const data = new Uint8ClampedArray(W * H * 4);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const inBurrow = x >= BURROW.x0 && x < BURROW.x1 && y >= BURROW.y0 && y < BURROW.y1;
        const bg: RGB = inBurrow ? [130 + ((x + y) % 7), 112, 95] : paper(x, y);
        const t = !withInk ? 0 : stroke(x, y) ? 1 : near(x, y, 1) ? 0.55 : near(x, y, 2) ? 0.25 : 0;
        const i = (y * W + x) * 4;
        for (let k = 0; k < 3; k++) data[i + k] = bg[k] + (BROWN_INK[k] - bg[k]) * t;
        data[i + 3] = 255;
      }
      return { data, width: W, height: H };
    };
    const img = scene(true), clean = scene(false), pa = para();
    eraseText(img, [pa], cv);
    let darkest = 0;
    for (let y = WORD.y0 - 4; y < WORD.y1 + 4; y++) for (let x = WORD.x0 - 4; x < WORD.x1 - 2; x++) {
      const a = at(img, x, y), c = at(clean, x, y);
      darkest = Math.max(darkest, (c[0] + c[1] + c[2] - a[0] - a[1] - a[2]) / 3);
    }
    expect(darkest).toBeLessThan(16);
    // The picture is no word ending: it stays as it was.
    expect(meanDiff(img, clean, BURROW)).toBeLessThan(2);
  });

  it("Fills in the picture under the part of a word that stands on it, also when the rest is on paper", async () => {
    const cv = await loadCv();
    // The picture starts in the middle of the word.
    const EDGE = 150, scene = (x: number, y: number): RGB => (x >= EDGE ? grass(x, y) : PAPER);
    const img = picture(scene, DARK_INK), clean = picture(scene, null), pa = para();
    eraseText(img, [pa], cv);
    for (let y = WORD.y0; y < WORD.y1; y++) for (let x = WORD.x0; x < WORD.x1; x++) expect(dist(at(img, x, y), DARK_INK)).toBeGreaterThan(40);
    // The grass continues where the text was: its dark blades are not taken for print.
    expect(meanDiff(img, clean, { ...padded, x0: EDGE + 4 })).toBeLessThan(15);
    expect(meanDiff(img, clean, { ...padded, x1: EDGE - 4 })).toBeLessThan(4);
  });

  it("Fills in the illustration under text on a picture, leaving no patch", async () => {
    const cv = await loadCv();
    const img = picture(grass, DARK_INK), clean = picture(grass, null), pa = para();
    eraseText(img, [pa], cv);
    expect(pa.busy).toBe(true);
    expect(pa.inpainted).toBe(true);
    for (let y = WORD.y0; y < WORD.y1; y++) for (let x = WORD.x0; x < WORD.x1; x++) expect(dist(at(img, x, y), DARK_INK)).toBeGreaterThan(40);
    // The grass continues where the text was; a flat fill differs by almost 40 here.
    expect(meanDiff(img, clean, padded)).toBeLessThan(15);
    // Away from the text the picture is untouched.
    expect(meanDiff(img, clean, { x0: 0, y0: 0, x1: W, y1: 30 })).toBe(0);
  });

  it("Is not misled by memory left over from earlier OpenCV work", async () => {
    // OpenCV reuses freed memory without clearing it; in the app, cropping runs first.
    const cv = await loadCv();
    for (let k = 0; k < 4; k++) new cv.Mat(400, 400, cv.CV_8UC4, new cv.Scalar(255, 255, 255, 255)).delete();
    const img = picture(grass, DARK_INK), clean = picture(grass, null), pa = para();
    eraseText(img, [pa], cv);
    expect(meanDiff(img, clean, padded)).toBeLessThan(15);
  });

  it("Falls back to painting over the text when OpenCV is not available", () => {
    const img = picture(grass, DARK_INK), pa = para();
    eraseText(img, [pa], null);
    expect(pa.busy).toBe(true);
    expect(pa.inpainted).toBeFalsy();
    for (let y = WORD.y0; y < WORD.y1; y++) for (let x = WORD.x0; x < WORD.x1; x++) expect(dist(at(img, x, y), DARK_INK)).toBeGreaterThan(40);
  });
});

describe("Halo around new text on a picture", () => {
  it("Glows in a light version of the picture's colour, so dark text stays readable on dark pictures", () => {
    const h = halo([40, 80, 20]);
    expect(h).toMatch(/^0 0 [\d.]+em rgb\(/);
    expect(h).toContain("rgb(169,185,161)");
    expect(h).not.toContain("rgb(40,80,20)");
  });
});
