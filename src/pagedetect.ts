// Find and straighten a book page in a photo (using OpenCV.js).
//
// Use a document-scanner approach: downscale the image, smooth away text and image content, detect
// edges, and choose the largest plausible page containing the image center. Fit four corners
// and smooth quadratic edges to its contour, checking multiple channels (grayscale, saturation,
// brightness) and sensitivities. Reject outlines that cannot describe a page with near-right-angle
// corners and smooth edges, so the user can adjust the frame manually.
// Look for a page with its own outline first. Only if there is none, let the photo border close
// the outline of a page that leaves the photo: otherwise a missed fold would let the facing page in.
// Prefer no suggestion to an incorrect one.

import type { Corners, Frame, Point } from "./types";
import { contourFrame } from "./pagecurve";

// OpenCV.js lacks suitable types here, so use it without typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CV = any;

const SIZE = 500;

/** Are all four angles approximately right angles (70°–110°)? */
export function anglesOk(q: Point[]): boolean {
  for (let i = 0; i < 4; i++) {
    const p = q[i], a = q[(i + 3) % 4], b = q[(i + 1) % 4];
    const ax = a[0] - p[0], ay = a[1] - p[1], bx = b[0] - p[0], by = b[1] - p[1];
    const cos = Math.abs(ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
    if (cos > 0.35) return false; // only angles between approximately 70° and 110°
  }
  return true;
}

/** Is (x, y) inside the convex quadrilateral? */
export function inside(q: Point[], x: number, y: number): boolean {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % 4];
    const c = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0);
    if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); }
  }
  return true;
}

// Order corners: top left, top right, bottom right, bottom left
export function orderCorners(q: Point[]): Corners {
  const cx = q.reduce((s, p) => s + p[0], 0) / q.length;
  const cy = q.reduce((s, p) => s + p[1], 0) / q.length;
  const around = [...q].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  const first = around.reduce((best, p, i) => p[0] + p[1] < around[best][0] + around[best][1] ? i : best, 0);
  return [...around.slice(first), ...around.slice(0, first)] as Corners;
}

/** A clipped page still needs three visible edges; photo borders are not evidence. */
function plausiblePage(q: Corners, width: number, height: number): boolean {
  if (!inside(q, width / 2, height / 2)) return false;
  const atBorder = (a: Point, b: Point) =>
    (a[0] <= 3 && b[0] <= 3) || (a[0] >= width - 4 && b[0] >= width - 4) ||
    (a[1] <= 3 && b[1] <= 3) || (a[1] >= height - 4 && b[1] >= height - 4);
  return q.filter((a, i) => atBorder(a, q[(i + 1) % 4])).length <= 1;
}

/** Suggested page outline, including curved edges, in photo coordinates. */
export function detectFrame(cv: CV, canvas: HTMLCanvasElement): Frame | null {
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
    const blurred = channels.map((c) => {
      const b = new cv.Mat(); keep.push(b);
      cv.GaussianBlur(c, b, new cv.Size(5, 5), 0);
      cv.morphologyEx(b, b, cv.MORPH_CLOSE, kernel); // remove dark text
      return b;
    });
    // Keep the contour as well as its corners: its curved edges supply the crop midpoints.
    const search = (closeBorder: boolean): Frame | null => {
      let best: { area: number; frame: Frame } | null = null;
      for (const b of blurred) {
        for (const [lo, hi] of [[20, 60], [40, 120], [75, 200]]) {
          const e = new cv.Mat(), cs = new cv.MatVector(), hier = new cv.Mat();
          cv.Canny(b, e, lo, hi);
          cv.dilate(e, e, small);
          // A page may leave the photo (especially at the book fold): the photo border then closes its outline.
          if (closeBorder) cv.rectangle(e, new cv.Point(0, 0), new cv.Point(w - 1, h - 1), new cv.Scalar(255), 1);
          cv.findContours(e, cs, hier, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
          for (let i = 0; i < cs.size(); i++) {
            const cnt = cs.get(i);
            const peri = cv.arcLength(cnt, true);
            if (peri >= 0.5 * (w + h)) {
              const ap = new cv.Mat();
              // A bowed outline needs more tolerance to locate its four corners. The fit below
              // still checks the original contour, so this does not accept arbitrary polygons.
              for (const epsilon of [0.02, 0.035, 0.05]) {
                cv.approxPolyDP(cnt, ap, epsilon * peri, true);
                if (ap.rows !== 4 || !cv.isContourConvex(ap)) continue;
                const area = cv.contourArea(ap);
                const q = orderCorners([0, 1, 2, 3].map((j): Point => [ap.data32S[j * 2], ap.data32S[j * 2 + 1]]));
                if (area > 0.15 * w * h && area < 0.98 * w * h && anglesOk(q) && plausiblePage(q, w, h) && (!best || area > best.area)) {
                  const points: Point[] = Array.from({ length: cnt.rows }, (_, j) => [cnt.data32S[j * 2], cnt.data32S[j * 2 + 1]]);
                  const frame = contourFrame(q, points);
                  if (frame) best = { area, frame };
                }
                break;
              }
              ap.delete();
            }
            cnt.delete();
          }
          e.delete(); cs.delete(); hier.delete();
        }
      }
      return best && best.frame;
    };
    const found = search(false) ?? search(true);
    const scale = (ps: Corners) => ps.map(([x, y]): Point => [x / k, y / k]) as Corners;
    return found && { corners: scale(found.corners), mids: scale(found.mids) };
  } finally {
    keep.forEach((m) => m.delete());
  }
}

const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Corner-only view of the suggested crop for callers that do not need edge curvature. */
export function detectPage(cv: CV, canvas: HTMLCanvasElement): Corners | null {
  return detectFrame(cv, canvas)?.corners ?? null;
}

/** Build a straight-edged frame from four corners. */
export function frameFromCorners(c: Corners): Frame {
  return { corners: c, mids: [mid(c[0], c[1]), mid(c[1], c[2]), mid(c[2], c[3]), mid(c[3], c[0])] };
}

/** Older data stored only four corners. */
export function toFrame(x: Frame | Corners | null | undefined): Frame | null {
  if (!x) return null;
  return Array.isArray(x) ? frameFromCorners(x) : x;
}

/** Edge length through its midpoint (curved edges are longer than their chord). */
const edgeLen = (a: Point, m: Point, b: Point) => Math.hypot(m[0] - a[0], m[1] - a[1]) + Math.hypot(b[0] - m[0], b[1] - m[1]);

function applyH(H: number[], [x, y]: Point): Point {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

/**
 * Crop and straighten a page.
 * 1. Correct perspective (map the four corners to a rectangle).
 * 2. If edges curve, also flatten the surface: describe each edge as a curve through its
 *    midpoint and interpolate between them (a Coons patch). This straightens text lines on
 *    curved pages.
 */
export function warpPage(cv: CV, canvas: HTMLCanvasElement, frame: Frame): HTMLCanvasElement {
  const [tl, tr, br, bl] = frame.corners;
  const [mt, mr, mb, ml] = frame.mids;
  const W = Math.round(Math.max(edgeLen(tl, mt, tr), edgeLen(bl, mb, br)));
  const H = Math.round(Math.max(edgeLen(tl, ml, bl), edgeLen(tr, mr, br)));

  // Map corners → rectangle with a homography to locate edge midpoints in the corrected image
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, [tl, tr, br, bl].flat());
  const to0 = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, W, 0, W, H, 0, H]);
  const M0 = cv.getPerspectiveTransform(from, to0);
  const h0: number[] = Array.from(M0.data64F as Float64Array);
  [to0, M0].forEach((m) => m.delete());
  const straight: Point[] = [[W / 2, 0], [W, H / 2], [W / 2, H], [0, H / 2]];
  // Perspective shifts midpoints along straight edges too. Only deviation
  // perpendicular to the edge describes curvature; avoid further distortion along the edge.
  const mids = [mt, mr, mb, ml].map((p, i): Point => {
    const mapped = applyH(h0, p);
    return i % 2 === 0 ? [W / 2, mapped[1]] : [mapped[0], H / 2];
  });
  const curved = mids.some((p, i) => Math.hypot(p[0] - straight[i][0], p[1] - straight[i][1]) > 2);

  // Add a margin so outward-curving parts are not clipped during correction
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
      // Quadratic curve through a, m, b (choose the control point so it passes through m at t = 0.5)
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
          // Coons patch: interpolate the edges and subtract the corners once
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
