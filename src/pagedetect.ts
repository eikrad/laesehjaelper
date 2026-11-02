// Buchseite auf einem Foto finden und gerade entzerren (mit OpenCV.js).
//
// Vorgehen wie bei Dokumenten-Scanner-Apps: Bild verkleinern, Text und Bildinhalt wegglätten, Kanten
// suchen und das größte plausible Viereck nehmen, das die Bildmitte enthält. Wir prüfen mehrere
// Kanäle (Graustufen, Sättigung, Helligkeit) und Empfindlichkeiten. Findet sich kein Viereck mit
// ungefähr rechten Winkeln, geben wir null zurück – dann stellt man die Ecken von Hand ein.
// Lieber kein Vorschlag als ein falscher.

import type { Corners, Frame, Point } from "./types";

// OpenCV.js hat keine brauchbaren Typen; wir nutzen es untypisiert.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CV = any;

const SIZE = 500;

/** Alle vier Winkel ungefähr rechtwinklig (70°–110°)? */
export function anglesOk(q: Point[]): boolean {
  for (let i = 0; i < 4; i++) {
    const p = q[i], a = q[(i + 3) % 4], b = q[(i + 1) % 4];
    const ax = a[0] - p[0], ay = a[1] - p[1], bx = b[0] - p[0], by = b[1] - p[1];
    const cos = Math.abs(ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
    if (cos > 0.35) return false; // nur Winkel zwischen etwa 70° und 110°
  }
  return true;
}

/** Liegt (x, y) im (konvexen) Viereck? */
export function inside(q: Point[], x: number, y: number): boolean {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % 4];
    const c = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0);
    if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); }
  }
  return true;
}

// Ecken ordnen: oben links, oben rechts, unten rechts, unten links
export function orderCorners(q: Point[]): Corners {
  const bySum = [...q].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  const byDiff = [...q].sort((a, b) => a[0] - a[1] - (b[0] - b[1]));
  return [bySum[0], byDiff[3], bySum[3], byDiff[0]];
}

// canvas: das Foto. Ergebnis: vier Ecken in Bildkoordinaten oder null.
export function detectPage(cv: CV, canvas: HTMLCanvasElement): Corners | null {
  const k = SIZE / Math.max(canvas.width, canvas.height);
  const src = cv.imread(canvas);
  const sm = new cv.Mat(), hsv = new cv.Mat(), gray = new cv.Mat();
  const keep = [src, sm, hsv, gray];
  try {
    cv.resize(src, sm, new cv.Size(Math.round(canvas.width * k), Math.round(canvas.height * k)), 0, 0, cv.INTER_AREA);
    cv.cvtColor(sm, gray, cv.COLOR_RGBA2GRAY);
    const rgb = new cv.Mat(); keep.push(rgb);
    cv.cvtColor(sm, rgb, cv.COLOR_RGBA2RGB);
    cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
    const ch = new cv.MatVector(); keep.push(ch);
    cv.split(hsv, ch);
    const w = sm.cols, h = sm.rows;
    const channels = [gray, ch.get(1), ch.get(2)];
    keep.push(channels[1], channels[2]);
    const kernel = cv.Mat.ones(9, 9, cv.CV_8U), small = cv.Mat.ones(3, 3, cv.CV_8U);
    keep.push(kernel, small);
    let best: { score: number; q: Point[] } | null = null;
    for (const c of channels) {
      const b = new cv.Mat(); keep.push(b);
      cv.GaussianBlur(c, b, new cv.Size(5, 5), 0);
      cv.morphologyEx(b, b, cv.MORPH_CLOSE, kernel); // dunkle Schrift verschwinden lassen
      for (const [lo, hi] of [[20, 60], [40, 120], [75, 200]]) {
        const e = new cv.Mat(), cs = new cv.MatVector(), hier = new cv.Mat();
        cv.Canny(b, e, lo, hi);
        cv.dilate(e, e, small);
        cv.findContours(e, cs, hier, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
        for (let i = 0; i < cs.size(); i++) {
          const cnt = cs.get(i);
          const peri = cv.arcLength(cnt, true);
          if (peri >= 0.5 * (w + h)) {
            const ap = new cv.Mat();
            cv.approxPolyDP(cnt, ap, 0.02 * peri, true);
            if (ap.rows === 4 && cv.isContourConvex(ap)) {
              const area = cv.contourArea(ap);
              const q: Point[] = [0, 1, 2, 3].map((j): Point => [ap.data32S[j * 2], ap.data32S[j * 2 + 1]]);
              if (area > 0.15 * w * h && area < 0.98 * w * h && anglesOk(q)) {
                const centre = inside(q, w / 2, h / 2);
                const score = area * (centre ? 2 : 1);
                if (!best || score > best.score) best = { score, q };
              }
            }
            ap.delete();
          }
          cnt.delete();
        }
        e.delete(); cs.delete(); hier.delete();
      }
    }
    return best ? orderCorners(best.q.map(([x, y]): Point => [x / k, y / k])) : null;
  } finally {
    keep.forEach((m) => m.delete());
  }
}

const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Rahmen mit geraden Kanten aus vier Ecken. */
export function frameFromCorners(c: Corners): Frame {
  return { corners: c, mids: [mid(c[0], c[1]), mid(c[1], c[2]), mid(c[2], c[3]), mid(c[3], c[0])] };
}

/** Ältere Daten hatten nur vier Ecken. */
export function toFrame(x: Frame | Corners | null | undefined): Frame | null {
  if (!x) return null;
  return Array.isArray(x) ? frameFromCorners(x) : x;
}

/** Länge einer Kante über ihren Mittelpunkt (gebogene Kanten sind länger als die Sehne). */
const edgeLen = (a: Point, m: Point, b: Point) => Math.hypot(m[0] - a[0], m[1] - a[1]) + Math.hypot(b[0] - m[0], b[1] - m[1]);

function applyH(H: number[], [x, y]: Point): Point {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

/**
 * Seite ausschneiden und gerade ziehen.
 * 1. Perspektive entzerren (die vier Ecken werden zum Rechteck).
 * 2. Sind Kanten gewölbt, die Fläche zusätzlich glattziehen: Jede Kante wird als Kurve durch ihren
 *    Mittelpunkt beschrieben, dazwischen wird interpoliert (Coons-Fläche). So werden Textzeilen auf
 *    gewölbten Seiten wieder gerade.
 */
export function warpPage(cv: CV, canvas: HTMLCanvasElement, frame: Frame): HTMLCanvasElement {
  const [tl, tr, br, bl] = frame.corners;
  const [mt, mr, mb, ml] = frame.mids;
  const W = Math.round(Math.max(edgeLen(tl, mt, tr), edgeLen(bl, mb, br)));
  const H = Math.round(Math.max(edgeLen(tl, ml, bl), edgeLen(tr, mr, br)));

  // Homographie Ecken → Rechteck, um zu sehen, wo die Kantenmitten im entzerrten Bild landen
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, [tl, tr, br, bl].flat());
  const to0 = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, W, 0, W, H, 0, H]);
  const M0 = cv.getPerspectiveTransform(from, to0);
  const h0: number[] = Array.from(M0.data64F as Float64Array);
  [to0, M0].forEach((m) => m.delete());
  const straight: Point[] = [[W / 2, 0], [W, H / 2], [W / 2, H], [0, H / 2]];
  // Perspektive verschiebt Mittelpunkte auch entlang einer geraden Kante. Nur
  // die Abweichung quer zur Kante beschreibt Wölbung; längs nicht neu verzerren.
  const mids = [mt, mr, mb, ml].map((p, i): Point => {
    const mapped = applyH(h0, p);
    return i % 2 === 0 ? [W / 2, mapped[1]] : [mapped[0], H / 2];
  });
  const curved = mids.some((p, i) => Math.hypot(p[0] - straight[i][0], p[1] - straight[i][1]) > 2);

  // Rand, damit nach außen gewölbte Teile beim Entzerren nicht abgeschnitten werden
  const mx = curved ? Math.ceil(Math.max(0, ...mids.map((p) => Math.max(-p[0], p[0] - W)))) + 2 : 0;
  const my = curved ? Math.ceil(Math.max(0, ...mids.map((p) => Math.max(-p[1], p[1] - H)))) + 2 : 0;
  const src = cv.imread(canvas), rect = new cv.Mat();
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, [mx, my, W + mx, my, W + mx, H + my, mx, H + my]);
  const M = cv.getPerspectiveTransform(from, to);
  const keep = [src, rect, from, to, M];
  try {
    cv.warpPerspective(src, rect, M, new cv.Size(W + 2 * mx, H + 2 * my), cv.INTER_LINEAR, cv.BORDER_REPLICATE);
    let result = rect;
    if (curved) {
      // Quadratische Kurve durch a, m, b (Kontrollpunkt so gewählt, dass sie m bei t = 0,5 trifft)
      const curve = (a: Point, m: Point, b: Point) => {
        const c: Point = [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];
        return (t: number): Point => {
          const s = 1 - t;
          return [s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]];
        };
      };
      const A: Point = [mx, my], B: Point = [W + mx, my], C: Point = [W + mx, H + my], D: Point = [mx, H + my];
      const off = (p: Point): Point => [p[0] + mx, p[1] + my];
      const top = curve(A, off(mids[0]), B), bottom = curve(D, off(mids[2]), C);
      const left = curve(A, off(mids[3]), D), right = curve(B, off(mids[1]), C);
      const mapX = new cv.Mat(H, W, cv.CV_32FC1), mapY = new cv.Mat(H, W, cv.CV_32FC1);
      keep.push(mapX, mapY);
      const fx = mapX.data32F as Float32Array, fy = mapY.data32F as Float32Array;
      const topPts: Point[] = [], botPts: Point[] = [];
      for (let x = 0; x < W; x++) { const u = x / Math.max(1, W - 1); topPts.push(top(u)); botPts.push(bottom(u)); }
      for (let y = 0; y < H; y++) {
        const v = y / Math.max(1, H - 1);
        const L = left(v), R = right(v);
        for (let x = 0; x < W; x++) {
          const u = x / Math.max(1, W - 1);
          const T = topPts[x], Bt = botPts[x];
          const i = y * W + x;
          // Coons-Fläche: Kanten interpolieren, Ecken einmal abziehen
          fx[i] = (1 - v) * T[0] + v * Bt[0] + (1 - u) * L[0] + u * R[0]
            - ((1 - u) * (1 - v) * A[0] + u * (1 - v) * B[0] + (1 - u) * v * D[0] + u * v * C[0]);
          fy[i] = (1 - v) * T[1] + v * Bt[1] + (1 - u) * L[1] + u * R[1]
            - ((1 - u) * (1 - v) * A[1] + u * (1 - v) * B[1] + (1 - u) * v * D[1] + u * v * C[1]);
        }
      }
      result = new cv.Mat();
      keep.push(result);
      cv.remap(rect, result, mapX, mapY, cv.INTER_LINEAR, cv.BORDER_REPLICATE);
    }
    const out = document.createElement("canvas");
    cv.imshow(out, result);
    return out;
  } finally {
    keep.forEach((m) => m.delete());
  }
}
