// Buchseite auf einem Foto finden und gerade entzerren (mit OpenCV.js).
//
// Vorgehen wie bei Dokumenten-Scanner-Apps: Bild verkleinern, Text und Bildinhalt wegglätten, Kanten
// suchen und das größte plausible Viereck nehmen, das die Bildmitte enthält. Wir prüfen mehrere
// Kanäle (Graustufen, Sättigung, Helligkeit) und Empfindlichkeiten. Findet sich kein Viereck mit
// ungefähr rechten Winkeln, geben wir null zurück – dann stellt man die Ecken von Hand ein.
// Lieber kein Vorschlag als ein falscher.

const SIZE = 500;

function anglesOk(q) {
  for (let i = 0; i < 4; i++) {
    const p = q[i], a = q[(i + 3) % 4], b = q[(i + 1) % 4];
    const ax = a[0] - p[0], ay = a[1] - p[1], bx = b[0] - p[0], by = b[1] - p[1];
    const cos = Math.abs(ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
    if (cos > 0.35) return false; // nur Winkel zwischen etwa 70° und 110°
  }
  return true;
}

function inside(q, x, y) {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % 4];
    const c = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0);
    if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); }
  }
  return true;
}

// Ecken ordnen: oben links, oben rechts, unten rechts, unten links
export function orderCorners(q) {
  const bySum = [...q].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  const byDiff = [...q].sort((a, b) => a[0] - a[1] - (b[0] - b[1]));
  return [bySum[0], byDiff[3], bySum[3], byDiff[0]];
}

// canvas: das Foto. Ergebnis: vier Ecken in Bildkoordinaten oder null.
export function detectPage(cv, canvas) {
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
    let best = null;
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
              const q = [0, 1, 2, 3].map((j) => [ap.data32S[j * 2], ap.data32S[j * 2 + 1]]);
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
    return best ? orderCorners(best.q.map(([x, y]) => [x / k, y / k])) : null;
  } finally {
    keep.forEach((m) => m.delete());
  }
}

// Die Seite aus dem Foto ausschneiden und auf ein gerades Rechteck entzerren.
export function warpPage(cv, canvas, corners) {
  const [tl, tr, br, bl] = corners;
  const width = Math.round(Math.max(Math.hypot(tr[0] - tl[0], tr[1] - tl[1]), Math.hypot(br[0] - bl[0], br[1] - bl[1])));
  const height = Math.round(Math.max(Math.hypot(bl[0] - tl[0], bl[1] - tl[1]), Math.hypot(br[0] - tr[0], br[1] - tr[1])));
  const src = cv.imread(canvas), dst = new cv.Mat();
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, [tl, tr, br, bl].flat());
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, width, height, 0, height]);
  const M = cv.getPerspectiveTransform(from, to);
  try {
    cv.warpPerspective(src, dst, M, new cv.Size(width, height), cv.INTER_LINEAR, cv.BORDER_REPLICATE);
    const out = document.createElement("canvas");
    cv.imshow(out, dst);
    return out;
  } finally {
    [src, dst, from, to, M].forEach((m) => m.delete());
  }
}
