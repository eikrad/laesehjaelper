import { normaliseRegions, regionPixels, type OcrRegion } from "./ocr-regions";

/** Mask a copy for OCR only. The stored photograph and displayed/inpainted color page stay intact. */
export function maskForOcr(src: HTMLCanvasElement, regions: OcrRegion[] | undefined): HTMLCanvasElement {
  const valid = normaliseRegions(regions);
  if (!valid.length) return src;
  const out = document.createElement("canvas"); out.width = src.width; out.height = src.height;
  const ctx = out.getContext("2d")!; ctx.drawImage(src, 0, 0); ctx.fillStyle = "#fff";
  for (const r of regionPixels(valid, out.width, out.height)) ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
  return out;
}
