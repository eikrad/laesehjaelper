// Fit the visible outline of a page to the four quadratic edges used by the crop handles.
// Sample each edge evenly along its contour: CHAIN_APPROX_SIMPLE keeps only the endpoints of
// straight stretches. Medians over spatial bins keep a finger or bookmark from bending the page.
import type { Corners, Frame, Point } from "./types";

const median = (a: number[]) => [...a].sort((x, y) => x - y)[a.length >> 1];

/** A plausible page outline, or null when four smooth edges cannot describe the contour. */
export function contourFrame(corners: Corners, contour: Point[]): Frame | null {
  if (contour.length < 4) return null;
  const n = contour.length;
  const at = corners.map(p => contour.reduce((best, q, i) =>
    Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(contour[best][0] - p[0], contour[best][1] - p[1]) ? i : best, 0));
  if (new Set(at).size !== 4) return null;
  const step = (at[1] - at[0] + n) % n < (at[3] - at[0] + n) % n ? 1 : -1;
  const mids: Point[] = [];
  for (let edge = 0; edge < 4; edge++) {
    const a = corners[edge], b = corners[(edge + 1) % 4];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (len < 10) return null;
    const bins: { t: number; d: number }[][] = Array.from({ length: 16 }, () => []);
    for (let i = at[edge]; i !== at[(edge + 1) % 4]; i = (i + step + n) % n) {
      const p = contour[i], q = contour[(i + step + n) % n];
      const samples = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
      for (let j = 0; j < samples; j++) {
        const x = p[0] + (q[0] - p[0]) * j / samples - a[0], y = p[1] + (q[1] - p[1]) * j / samples - a[1];
        const t = (x * dx + y * dy) / (len * len);
        if (t < 0.08 || t > 0.92) continue;
        bins[Math.floor(t * bins.length)].push({ t, d: (dx * y - dy * x) / len });
      }
    }
    const used = bins.filter(bin => bin.length);
    if (used.length < 12) return null;
    // A quadratic through the two corners deviates from the chord by 4*t*(1-t)*sag.
    const sag = median(used.map(bin => median(bin.map(p => p.d / (4 * p.t * (1 - p.t))))));
    const errors = used.map(bin => median(bin.map(p => Math.abs(p.d - 4 * p.t * (1 - p.t) * sag)))).sort((x, y) => x - y);
    if (Math.abs(sag) > len * 0.2 || errors[Math.floor(errors.length * 0.75)] > Math.max(2, len * 0.008)) return null;
    // Rasterisation and the detector's smoothing can move an edge a pixel or two, not a bend.
    const bend = Math.abs(sag) >= 3 ? sag : 0;
    mids.push([(a[0] + b[0]) / 2 - dy / len * bend, (a[1] + b[1]) / 2 + dx / len * bend]);
  }
  return { corners, mids: mids as Corners };
}
