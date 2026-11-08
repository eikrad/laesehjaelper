// Remove the original text from the page image.
//
// Mask only the letter strokes and let OpenCV fill them in from their surroundings (inpainting with
// the fast marching method: Telea, 2004, Journal of Graphics Tools, DOI 10.1080/10867651.2004.10487596).
// On an illustration a fill would leave a visible patch; on a photographed page the paper has a
// texture and uneven light, so a painted box shows too. Everything around the letters stays as it was.
// Without OpenCV, paint each word with the colours around it, as a left-to-right gradient; on a
// picture the page view then gives the text its own panel.

import type { CV } from "./pagedetect";
import type { Box, Para } from "./types";

/** RGBA pixels, as in ImageData. */
export interface Pixels { data: Uint8ClampedArray; width: number; height: number }
type RGB = [number, number, number];

const med = (a: number[]): number => { a.sort((x, y) => x - y); return a[a.length >> 1]; };
const lumOf = (r: number, g: number, b: number) => 0.3 * r + 0.59 * g + 0.11 * b;
const dist = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
/** How much the colours around a paragraph's words may vary (mean per channel) before its text
 *  counts as standing on a picture, which gets a halo in the page view. */
const BUSY = 26;
/** Colour distance (sum over the channels) within which a pixel matches the ground around a word. */
const PLAIN_TOL = 36;
/** Padding around a word that the fill covers and whose border tells the background. */
const padOf = (lh: number) => Math.round(lh * 0.28) + 3;

/** Paint over the recognized text in img and note on each paragraph what lies beneath it
 *  (busy background, background colour, inpainted). */
export function eraseText(img: Pixels, paras: Para[], cv: CV | null = null): void {
  const W = img.width, H = img.height;
  const px = img.data.slice();   // Sample the original, not what has already been painted.
  const orig: Pixels = { data: px, width: W, height: H };
  const lum = (x: number, y: number): number => { const i = (y * W + x) * 4; return lumOf(px[i], px[i + 1], px[i + 2]); };
  // Line endings: ink directly adjacent to a recognized line, such as an uncertain word ending
  // or a comma, belongs to the text and is also painted over.
  function tails(l: Box, h: number): Box[] {
    const res: Box[] = [];
    const y0 = Math.max(0, Math.round(l.y0)), y1 = Math.min(H - 1, Math.round(l.y1));
    let bg = 0;
    for (let y = y0; y <= y1; y += 2) for (const x of [l.x0, l.x1]) { if (x >= 0 && x < W) bg = Math.max(bg, lum(Math.round(x), y)); }
    const inkCol = (x: number): boolean => { for (let y = y0; y <= y1; y += 2) if (lum(x, y) < bg - 70) return true; return false; };
    for (const dir of [1, -1]) {
      let x = dir > 0 ? Math.round(l.x1) + 1 : Math.round(l.x0) - 1, gap = 0, last: number | null = null;
      while (x > 0 && x < W - 1 && gap < 0.6 * h && Math.abs(x - (dir > 0 ? l.x1 : l.x0)) < 2.5 * h) {
        if (inkCol(x)) { last = x; gap = 0; } else gap++;
        x += dir;
      }
      if (last != null) res.push(dir > 0 ? { x0: l.x1, y0: l.y0, x1: last, y1: l.y1 } : { x0: last, y0: l.y0, x1: l.x0, y1: l.y1 });
    }
    return res;
  }
  for (const pa of paras) {
    const words = pa.words || pa.lines, extra = (pa.lines || []).flatMap(l => tails(l, pa.lh));
    const pad = padOf(pa.lh);
    // Sample colours to the left and right of each word separately: the fill is a gradient
    // between them, and how much they vary tells a busy background.
    const fills = [...words, ...extra].map(l => {
      const r = clip({ x0: l.x0 - pad, y0: l.y0 - pad, x1: l.x1 + pad, y1: l.y1 + pad }, W - 1, H - 1);
      const mid = (r.x0 + r.x1) >> 1;
      return { r, L: ringStats(orig, r, r.x0, mid), R: ringStats(orig, r, mid, r.x1) };
    });
    const spreadMax = Math.max(0, ...fills.map(f => Math.min(f.L.dev, f.R.dev)));
    const avg = [0, 1, 2].map(k => Math.round(fills.reduce((a, f) => a + (f.L.m[k] + f.R.m[k]) / 2, 0) / fills.length));
    pa.busy = spreadMax > BUSY;
    pa.bg = `rgba(${avg[0]},${avg[1]},${avg[2]},.94)`;
    pa.rgb = avg;
    delete pa.inpainted;
    if (cv) {
      try {
        // The region holds every masked pixel plus the surroundings the inpainting draws from.
        const radius = Math.max(3, Math.round(pa.lh * 0.1)), m = reachOf(pa.lh) + grown(pa.lh) + radius + 2;
        const roi = clip(union([...words, ...extra].map(b => ({ x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m }))), W, H);
        // Each half of a word goes by its own surroundings, as a line can end on a picture. On plain
        // ground the text is whatever clearly stands out from it; on a picture, whatever looks more
        // like the text than like the picture.
        const plain: Ground[] = [], onPicture: Box[] = [];
        [...words, ...extra].forEach((r, k) => {
          const { L, R } = fills[k], mid = (r.x0 + r.x1) / 2;
          if (L.plain && R.plain) plain.push({ r, L: L.m, R: R.m });
          else if (L.plain) { plain.push({ r: { ...r, x1: mid }, L: L.m, R: L.m }); onPicture.push({ ...r, x0: mid }); }
          else if (R.plain) { plain.push({ r: { ...r, x0: mid }, L: R.m, R: R.m }); onPicture.push({ ...r, x1: mid }); }
          else onPicture.push(r);
        });
        const mask = paperMask(orig, plain, pa.lh, roi), ink = inkMask(orig, words, pa.lh, roi, onPicture);
        for (let i = 0; i < mask.length; i++) mask[i] |= ink[i];
        inpaint(cv, img, mask, roi, radius, pa.lh >= 20 ? 2 : 1);
        if (pa.busy) pa.inpainted = true;   // Text on a picture gets a halo in the page view.
        continue;
      } catch (e) {
        console.warn("Inpainting failed; painting over the text instead", e);
      }
    }
    for (const f of fills) fillGradient(img, f.r, f.L.m, f.R.m);
  }
}

/** Median colour along the border of r between columns sx0 and sx1, how much the border deviates
 *  from it (mean per channel), and whether the part runs along plain ground: at least three
 *  quarters of the border above and below it match the ground, so a picture that only touches
 *  the end of a word does not count, but one the word lies on does. */
function ringStats(img: Pixels, r: Box, sx0: number, sx1: number) {
  const W = img.width, px = img.data;
  const R: number[] = [], G: number[] = [], B: number[] = [], xs: number[] = [];
  const take = (x: number, y: number) => { const i = (y * W + x) * 4; R.push(px[i]); G.push(px[i + 1]); B.push(px[i + 2]); xs.push(x); };
  for (let x = sx0; x <= sx1; x += 2) { take(x, r.y0); take(x, r.y1); }
  const rows = R.length;
  if (sx0 === r.x0) for (let y = r.y0; y <= r.y1; y += 2) take(r.x0, y);
  if (sx1 === r.x1) for (let y = r.y0; y <= r.y1; y += 2) take(r.x1, y);
  const m = [med(R.slice()), med(G.slice()), med(B.slice())];
  let dev = 0;
  for (let i = 0; i < R.length; i++) dev += Math.abs(R[i] - m[0]) + Math.abs(G[i] - m[1]) + Math.abs(B[i] - m[2]);
  // The ground along the rows can brighten or darken (uneven light): compare it with a straight
  // line through the medians of the rows' left and right parts.
  const xm = (sx0 + sx1) / 2, xa = (sx0 + xm) / 2, xb = (xm + sx1) / 2;
  const part = (left: boolean) => {
    const k = xs.slice(0, rows).flatMap((x, i) => ((x < xm) === left ? [i] : []));
    return k.length ? [R, G, B].map(c => med(k.map(i => c[i]))) : m;
  };
  const a = part(true), b = part(false);
  let along = 0;
  for (let i = 0; i < rows; i++) {
    const t = (xs[i] - xa) / Math.max(1, xb - xa), c = [R[i], G[i], B[i]];
    if (c.reduce((d, v, k) => d + Math.abs(v - (a[k] + (b[k] - a[k]) * t)), 0) <= PLAIN_TOL) along++;
  }
  return { m, dev: dev / R.length / 3, plain: along >= rows * 0.75 };
}

/** Fill the box (inclusive edges) with a horizontal gradient from colour a to colour b,
 *  as a canvas linear gradient from x0 to x1 would. */
function fillGradient(img: Pixels, r: Box, a: number[], b: number[]) {
  const W = img.width, d = img.data, span = Math.max(1, r.x1 - r.x0);
  for (let x = r.x0; x <= r.x1; x++) {
    const t = Math.min(1, (x - r.x0 + 0.5) / span);
    const c = [0, 1, 2].map(k => Math.round(a[k] + (b[k] - a[k]) * t));
    for (let y = r.y0; y <= r.y1; y++) {
      const i = (y * W + x) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
  }
}

/** Integer box inside [0, W] × [0, H]. */
function clip(b: Box, W: number, H: number): Box {
  return { x0: Math.max(0, Math.round(b.x0)), y0: Math.max(0, Math.round(b.y0)), x1: Math.min(W, Math.round(b.x1)), y1: Math.min(H, Math.round(b.y1)) };
}
function union(bs: Box[]): Box {
  return { x0: Math.min(...bs.map(b => b.x0)), y0: Math.min(...bs.map(b => b.y0)), x1: Math.max(...bs.map(b => b.x1)), y1: Math.max(...bs.map(b => b.y1)) };
}
/** How far beyond a word box to look for its letters (Tesseract boxes can cut off a stroke). */
const reachOf = (lh: number) => 2 + Math.round(lh * 0.08);
/** How far the mask grows beyond the letters: anti-aliasing and JPEG blur around the strokes. */
const grown = (lh: number) => 1 + Math.round(lh * 0.04);

/** Mask (1 = text) over roi for the letters in areas (words or parts of them, line endings): pixels
 *  near them that are closer to the text colour, found in words, than to every colour around the
 *  areas. Picture parts inside an area stay unmasked unless they look like the text. */
export function inkMask(img: Pixels, words: Box[], lh: number, roi: Box, areas: Box[] = words): Uint8Array {
  const W = img.width, H = img.height, px = img.data;
  const rw = roi.x1 - roi.x0, rh = roi.y1 - roi.y0;
  const mask = new Uint8Array(rw * rh);
  const pad = padOf(lh), reach = reachOf(lh);
  const near = (b: Box) => clip({ x0: b.x0 - reach, y0: b.y0 - reach, x1: b.x1 + reach, y1: b.y1 + reach }, W, H);
  // Pixels are addressed by their offset in px, to avoid allocating per pixel.
  const rgb = (i: number): RGB => [px[i], px[i + 1], px[i + 2]];
  const lumAt = (i: number) => lumOf(px[i], px[i + 1], px[i + 2]);
  const bucket = (i: number) => (px[i] >> 3) << 10 | (px[i + 1] >> 3) << 5 | px[i + 2] >> 3;

  // Colours around boxes: the borders of the padded boxes.
  const ring = (bs: Box[]) => {
    const out: number[] = [];
    for (const b of bs) {
      const r = clip({ x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad }, W - 1, H - 1);
      for (let x = r.x0; x <= r.x1; x += 2) out.push((r.y0 * W + x) * 4, (r.y1 * W + x) * 4);
      for (let y = r.y0; y <= r.y1; y += 2) out.push((y * W + r.x0) * 4, (y * W + r.x1) * 4);
    }
    return out;
  };
  const around = ring(areas);
  if (!around.length) return mask;
  const { core } = textPixels(img, words, med(ring(words).map(lumAt)));
  if (!core.length) return mask;
  const text: RGB = [0, 1, 2].map(k => med(core.map(i => px[i + k]))) as RGB;

  // The surrounding palette: frequent colours (in 8-step buckets), without those that look like
  // the text (rings can cross neighbouring words).
  const counts = new Map<number, { c: RGB; n: number }>();
  for (const i of around) {
    const e = counts.get(bucket(i)); if (e) e.n++; else counts.set(bucket(i), { c: rgb(i), n: 1 });
  }
  const contrast = dist(text, [0, 1, 2].map(k => med(around.map(i => px[i + k]))));
  const palette = [...counts.values()].filter(e => dist(e.c, text) > contrast * 0.35).sort((a, b) => b.n - a.n).slice(0, 48).map(e => e.c);

  // Decide once per colour bucket: text if nearer to the text colour than to any background colour.
  const memo = new Int8Array(1 << 15).fill(-1);
  for (const b of areas.map(near)) {
    for (let y = Math.max(b.y0, roi.y0); y < Math.min(b.y1, roi.y1); y++)
      for (let x = Math.max(b.x0, roi.x0); x < Math.min(b.x1, roi.x1); x++) {
        const i = (y * W + x) * 4, key = bucket(i);
        if (memo[key] < 0) { const c = rgb(i), d = dist(c, text); memo[key] = palette.every(p => dist(c, p) > d) ? 1 : 0; }
        if (memo[key]) mask[(y - roi.y0) * rw + x - roi.x0] = 1;
      }
  }
  return dilate(mask, rw, rh, grown(lh));
}

/** The text's own pixels (offsets in img.data): the most extreme tenth of the word pixels (every
 *  other one is enough), on whichever side of the background level the letters lie. */
function textPixels(img: Pixels, words: Box[], bgLum: number): { dark: boolean; core: number[] } {
  const W = img.width, H = img.height, px = img.data;
  const lumAt = (i: number) => lumOf(px[i], px[i + 1], px[i + 2]);
  const inside: number[] = [];
  for (const b of words) { const r = clip(b, W, H); for (let y = r.y0; y < r.y1; y += 2) for (let x = r.x0; x < r.x1; x += 2) inside.push((y * W + x) * 4); }
  if (!inside.length) return { dark: true, core: [] };
  const lums = Float32Array.from(inside, lumAt).sort();
  const lo = lums[Math.floor(lums.length * 0.1)], hi = lums[Math.ceil(lums.length * 0.9) - 1];
  const dark = bgLum - lo >= hi - bgLum;   // Dark on light, or light on dark.
  return { dark, core: inside.filter(i => (dark ? lumAt(i) <= lo : lumAt(i) >= hi)) };
}

/** A word, or the part of it, on plain ground with the ground's colour left (L) and right (R) of it. */
type Ground = { r: Box; L: number[]; R: number[] };

/** How much darker (or lighter) than the plain ground a pixel must be to count as print; the
 *  texture of paper stays below this. */
const PAPER_CONTRAST = 22;

/** Mask (1 = text) over roi for words on plain ground (paper, light or dark): pixels near each word
 *  that clearly stand out from the ground around it, on the side the text lies. Photographed print
 *  has soft edges whose colour lies anywhere between the ink and the paper, and a picture next to a
 *  line can share that colour, so on plain ground brightness is a surer sign than colour. The ground
 *  level runs from the left to the right of each word (its colours L and R), so uneven light does
 *  not count as text. */
export function paperMask(img: Pixels, areas: Ground[], lh: number, roi: Box): Uint8Array {
  const W = img.width, H = img.height, px = img.data;
  const rw = roi.x1 - roi.x0, rh = roi.y1 - roi.y0, reach = reachOf(lh);
  const mask = new Uint8Array(rw * rh);
  if (!areas.length) return mask;
  const ground = med(areas.flatMap(a => [lumOf(a.L[0], a.L[1], a.L[2]), lumOf(a.R[0], a.R[1], a.R[2])]));
  const sign = textPixels(img, areas.map(a => a.r), ground).dark ? 1 : -1;
  for (const a of areas) {
    // Look a little beyond the box, which can cut off a stroke, but there take only print that joins
    // the word's own strokes: a picture right next to the word stays as it is.
    const r = clip(a.r, W, H), b = clip({ x0: a.r.x0 - reach, y0: a.r.y0 - reach, x1: a.r.x1 + reach, y1: a.r.y1 + reach }, W, H);
    const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    if (bw <= 0 || bh <= 0) continue;
    const l0 = lumOf(a.L[0], a.L[1], a.L[2]), l1 = lumOf(a.R[0], a.R[1], a.R[2]);
    const ink = new Uint8Array(bw * bh), todo: number[] = [];   // 1: stands out, 2: print of the word.
    for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) {
      const i = (y * W + x) * 4, j = (y - b.y0) * bw + x - b.x0, level = l0 + (l1 - l0) * (x - b.x0) / bw;
      if (sign * (level - lumOf(px[i], px[i + 1], px[i + 2])) <= PAPER_CONTRAST) continue;
      const inBox = x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;
      ink[j] = inBox ? 2 : 1;
      if (inBox) todo.push(j);
    }
    while (todo.length) {
      const j = todo.pop() as number, x = j % bw, y = (j - x) / bw;
      for (let ny = Math.max(0, y - 1); ny <= Math.min(bh - 1, y + 1); ny++)
        for (let nx = Math.max(0, x - 1); nx <= Math.min(bw - 1, x + 1); nx++)
          if (ink[ny * bw + nx] === 1) { ink[ny * bw + nx] = 2; todo.push(ny * bw + nx); }
    }
    for (let y = Math.max(b.y0, roi.y0); y < Math.min(b.y1, roi.y1); y++)
      for (let x = Math.max(b.x0, roi.x0); x < Math.min(b.x1, roi.x1); x++)
        if (ink[(y - b.y0) * bw + x - b.x0] === 2) mask[(y - roi.y0) * rw + x - roi.x0] = 1;
  }
  return dilate(mask, rw, rh, grown(lh));
}

/** Grow the mask by g pixels in every direction (square neighbourhood, separable). */
function dilate(m: Uint8Array, w: number, h: number, g: number): Uint8Array {
  const tmp = new Uint8Array(m.length), out = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x])
    for (let k = Math.max(0, x - g); k <= Math.min(w - 1, x + g); k++) tmp[y * w + k] = 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (tmp[y * w + x])
    for (let k = Math.max(0, y - g); k <= Math.min(h - 1, y + g); k++) out[k * w + x] = 1;
  return out;
}

/** Fill the masked pixels of roi in img from their surroundings (OpenCV, Telea's method).
 *  radius is in image pixels. With scale 2 the fill runs at half resolution: its cost grows with
 *  the masked area times the radius squared, so this is many times faster, and the fill is
 *  smooth anyway. */
function inpaint(cv: CV, img: Pixels, mask: Uint8Array, roi: Box, radius: number, scale = 1): void {
  const W = img.width, d = img.data, w = roi.x1 - roi.x0, h = roi.y1 - roi.y0;
  if (w <= 0 || h <= 0 || !mask.includes(1)) return;
  const sw = Math.ceil(w / scale), sh = Math.ceil(h / scale);
  // New mats hold whatever earlier OpenCV work left in memory; the mask must start empty.
  const src = new cv.Mat(sh, sw, cv.CV_8UC3), m = cv.Mat.zeros(sh, sw, cv.CV_8UC1), dst = new cv.Mat();
  try {
    // Downscale: average the colours; a small pixel is masked if any of its pixels is.
    const sd: Uint8Array = src.data, md: Uint8Array = m.data;   // Each .data read makes a new view.
    const sum = new Float32Array(sw * sh * 3), n = new Uint16Array(sw * sh);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = ((roi.y0 + y) * W + roi.x0 + x) * 4, j = Math.floor(y / scale) * sw + Math.floor(x / scale);
      sum[j * 3] += d[i]; sum[j * 3 + 1] += d[i + 1]; sum[j * 3 + 2] += d[i + 2]; n[j]++;
      if (mask[y * w + x]) md[j] = 1;
    }
    for (let j = 0; j < n.length; j++) for (let k = 0; k < 3; k++) sd[j * 3 + k] = Math.round(sum[j * 3 + k] / n[j]);
    cv.inpaint(src, m, dst, Math.max(2, Math.round(radius / scale)), cv.INPAINT_TELEA);
    // Scale back up (bilinear) into the masked pixels only.
    const dd: Uint8Array = dst.data;
    for (let y = 0; y < h; y++) {
      const fy = Math.min(sh - 1, Math.max(0, (y + 0.5) / scale - 0.5)), y0 = Math.floor(fy), y1 = Math.min(sh - 1, y0 + 1), ty = fy - y0;
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        const fx = Math.min(sw - 1, Math.max(0, (x + 0.5) / scale - 0.5)), x0 = Math.floor(fx), x1 = Math.min(sw - 1, x0 + 1), tx = fx - x0;
        const i = ((roi.y0 + y) * W + roi.x0 + x) * 4;
        for (let k = 0; k < 3; k++) {
          const top = dd[(y0 * sw + x0) * 3 + k] * (1 - tx) + dd[(y0 * sw + x1) * 3 + k] * tx;
          const bottom = dd[(y1 * sw + x0) * 3 + k] * (1 - tx) + dd[(y1 * sw + x1) * 3 + k] * tx;
          d[i + k] = Math.round(top * (1 - ty) + bottom * ty);
        }
      }
    }
  } finally {
    src.delete(); m.delete(); dst.delete();
  }
}

/** CSS text-shadow for new text on an inpainted picture: a soft glow instead of a panel, in the
 *  picture's colour lightened towards white so the dark text stays readable on dark pictures. */
export function halo(rgb: number[]): string {
  const c = `rgb(${rgb.slice(0, 3).map(v => Math.round(v + (255 - v) * 0.6)).join(",")})`;
  return `0 0 .06em ${c}, 0 0 .18em ${c}, 0 0 .35em ${c}`;
}
