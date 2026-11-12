import type { Box } from "./types";

/** Excluded rectangles in the cropped input image, normalized to [0, 1]. */
export type OcrRegion = Box;

export function normaliseRegions(value: unknown): OcrRegion[] {
  if (!Array.isArray(value)) return [];
  const regions: OcrRegion[] = [], seen = new Set<string>();
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  for (const b of value) {
    if (!b || typeof b !== "object" || !["x0", "y0", "x1", "y1"].every(k => typeof b[k] === "number" && Number.isFinite(b[k]))) continue;
    const r = { x0: clamp(Math.min(b.x0, b.x1)), y0: clamp(Math.min(b.y0, b.y1)), x1: clamp(Math.max(b.x0, b.x1)), y1: clamp(Math.max(b.y0, b.y1)) };
    const key = JSON.stringify(r);
    if (r.x1 <= r.x0 || r.y1 <= r.y0 || seen.has(key)) continue;
    seen.add(key); regions.push(r);
  }
  return regions;
}

/** Cover complete edge pixels too, so excluded letters cannot leak through fractional bounds. */
export function regionPixels(regions: OcrRegion[], W: number, H: number): Box[] {
  return normaliseRegions(regions).map(b => ({ x0: Math.floor(b.x0 * W), y0: Math.floor(b.y0 * H), x1: Math.ceil(b.x1 * W), y1: Math.ceil(b.y1 * H) }));
}
