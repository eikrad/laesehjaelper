// Prepare an image for text recognition.
//
// Tesseract uses a single threshold to turn the page into black and white. Text on
// a tinted image background, or under uneven lighting, can disappear in the
// darker areas. Normalize the background first: divide each pixel by the
// estimated local background brightness. The paper then has similar brightness throughout,
// and the text remains consistently dark.

/** Grayscale image with a normalized background, at the original size. */
export function flattenBackground(src: HTMLCanvasElement): HTMLCanvasElement {
  const W = src.width, H = src.height;
  const data = src.getContext("2d")!.getImageData(0, 0, W, H);
  const px = data.data;
  const gray = new Float32Array(W * H);
  for (let i = 0, j = 0; j < gray.length; i += 4, j++) gray[j] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];

  // Estimate the background: favor bright values (text is dark), then average over a wide area.
  // 1) local maximum in small tiles, 2) blur the tile grid, 3) bilinearly scale to image size.
  const tile = Math.max(8, Math.round(Math.max(W, H) / 60));
  const tw = Math.ceil(W / tile), th = Math.ceil(H / tile);
  const tmax = new Float32Array(tw * th);
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    // Use the 90th percentile rather than the maximum to ignore isolated highlights
    const vals: number[] = [];
    for (let y = ty * tile; y < Math.min(H, (ty + 1) * tile); y += 2)
      for (let x = tx * tile; x < Math.min(W, (tx + 1) * tile); x += 2) vals.push(gray[y * W + x]);
    vals.sort((a, b) => a - b);
    tmax[ty * tw + tx] = vals[Math.floor(vals.length * 0.9)] || 255;
  }
  // Blur the grid (three 3×3 passes) so images and text blocks do not leak into the "background"
  let grid = tmax;
  for (let pass = 0; pass < 3; pass++) {
    const next = new Float32Array(grid.length);
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < th && xx >= 0 && xx < tw) { s += grid[yy * tw + xx]; n++; }
      }
      next[y * tw + x] = s / n;
    }
    grid = next;
  }

  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const od = out.getContext("2d")!.createImageData(W, H);
  const o = od.data;
  for (let y = 0; y < H; y++) {
    const gy = Math.min(th - 1.001, Math.max(0, y / tile - 0.5));
    const y0 = Math.floor(gy), fy = gy - y0;
    for (let x = 0; x < W; x++) {
      const gx = Math.min(tw - 1.001, Math.max(0, x / tile - 0.5));
      const x0 = Math.floor(gx), fx = gx - x0;
      const a = grid[y0 * tw + x0], b = grid[y0 * tw + x0 + 1] ?? a;
      const c = grid[(y0 + 1) * tw + x0] ?? a, d = grid[(y0 + 1) * tw + x0 + 1] ?? c;
      const bg = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
      const v = Math.min(255, (gray[y * W + x] / Math.max(bg, 1)) * 240);
      const k = (y * W + x) * 4;
      o[k] = o[k + 1] = o[k + 2] = v; o[k + 3] = 255;
    }
  }
  out.getContext("2d")!.putImageData(od, 0, 0);
  return out;
}

/** Rotate the color image exactly as Tesseract did with rotateAuto (around the center, same size). */
export function rotateLike(src: HTMLCanvasElement, radians: number): HTMLCanvasElement {
  if (!radians) return src;
  const c = document.createElement("canvas");
  c.width = src.width; c.height = src.height;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  x.translate(c.width / 2, c.height / 2); x.rotate(radians);
  x.drawImage(src, -src.width / 2, -src.height / 2);
  return c;
}
