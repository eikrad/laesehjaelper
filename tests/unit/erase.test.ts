import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { eraseText, halo, inkMask, type Pixels } from "../../src/erase";
import type { Box, Para } from "../../src/types";

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

// A stand-in for OpenCV that fails on any use: plain paper must not need it.
const noCv = new Proxy({}, { get: () => { throw new Error("OpenCV used"); } });
const loadCv = async () => {
  let cv = createRequire(import.meta.url)("@techstark/opencv-js");
  if (cv instanceof Promise) cv = await cv;
  else if (!cv.Mat) await new Promise<void>(r => { cv.onRuntimeInitialized = r; });
  return cv;
};

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
    const img = picture(grass, DARK_INK), m = inkMask(img, [WORD], LH, ALL, [tail]);
    for (let x = tail.x0 + 6; x < tail.x1; x++) expect(masked(m, x, WORD.y0 + 15)).toBe(false);
  });
});

describe("Erasing the original text", () => {
  it("Paints text on plain paper with the paper colour, without OpenCV", () => {
    const img = picture(() => PAPER, DARK_INK), pa = para();
    eraseText(img, [pa], noCv);
    expect(pa.busy).toBe(false);
    expect(pa.inpainted).toBeFalsy();
    for (let y = WORD.y0; y < WORD.y1; y++) for (let x = WORD.x0; x < WORD.x1; x++) expect(dist(at(img, x, y), PAPER)).toBeLessThan(3);
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
