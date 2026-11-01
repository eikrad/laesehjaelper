// Aus dem OCR-Ergebnis von Tesseract die echten Textzeilen und Textgruppen einer Buchseite gewinnen.
//
// Kinderbücher haben viele Zeichnungen. Tesseract hält Schraffuren und Linien darin oft für Buchstaben
// und hängt diese „Wörter“ an echte Zeilen an. Echte Wörter erkennt es aber fast immer mit hoher
// Sicherheit (80–97 %), Bildrauschen mit niedriger. Darauf baut der Filter auf.

const LETTER = /\p{L}/u;
const ONLY_SIGNS = /^[\d.,:;!?»«"'„“”()\-–—]+$/u;

const letters = (t) => (t.match(/\p{L}/gu) || []).length;
// Sieht wie ein Wort aus (Buchstaben, Silbenstriche, Satzzeichen am Rand)?
const WORDLIKE = /^[»«"„“(]*\p{L}[\p{L}·.\-‐]*[.,:;!?»«"“”)]*$/u;
// Innerhalb einer sicheren Zeile reicht es, wie ein Wort auszusehen. Zahlen/Satzzeichen (z. B. „1.“) ab 60 %.
const usable = (w) => w.text && (WORDLIKE.test(w.text) || (ONLY_SIGNS.test(w.text) && w.confidence >= 60));
// Sicheres Wort: daran erkennen wir, dass ein Zeilenstück echter Text ist.
const strong = (w) => letters(w.text) >= 2 && w.confidence >= 90 && WORDLIKE.test(w.text);
// Am Rand eines Zeilenstücks muss ein Wort selbst einigermaßen sicher sein (rechts etwas weniger streng).
const edgeOk = (w, min) => w.confidence >= min && (letters(w.text) >= 2 || (ONLY_SIGNS.test(w.text) && w.confidence >= 85) || /^[IiÅåØøÆæ]$/.test(w.text));

const union = (bs) => ({
  x0: Math.min(...bs.map((b) => b.x0)), y0: Math.min(...bs.map((b) => b.y0)),
  x1: Math.max(...bs.map((b) => b.x1)), y1: Math.max(...bs.map((b) => b.y1)),
});

// Eine OCR-Zeile in Stücke teilen, wo zwischen Wörtern eine große Lücke ist (z. B. Text links, Bild rechts),
// und nur Stücke behalten, die nach echtem Text aussehen.
function lineUnits(line) {
  const words = (line.words || []).filter((w) => w.text && w.text.trim());
  const hs = words.filter(strong).map((w) => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b);
  const h = hs[hs.length >> 1] || line.bbox.y1 - line.bbox.y0;
  // 1. an großen Lücken teilen (Lesebücher haben breite Wortabstände, Bilder liegen weiter weg)
  const parts = [];
  let cur = [];
  for (const w of words) {
    const prev = cur[cur.length - 1];
    if (prev && w.bbox.x0 - prev.bbox.x1 > 2.6 * h) { parts.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) parts.push(cur);
  // 2. nur Stücke mit sicherem Wort; Unbrauchbares raus; unsichere Wörter am Rand abschneiden.
  //    Links abgeschnittene, wortähnliche Wörter merken wir uns: Stehen sie genau am linken Rand
  //    des Absatzes, gehören sie dazu (Wörter neben Bildern werden oft schlecht bewertet).
  const units = [];
  for (const part of parts) {
    if (!part.some(strong)) continue;
    let ws = part.filter(usable);
    const pre = [];
    while (ws.length && !edgeOk(ws[0], 75)) pre.push(ws.shift());
    // rechts: unsicheres Wort darf bleiben, wenn es wortähnlich ist und dicht am Vorgänger steht
    const closeRight = () => {
      const a = ws[ws.length - 2], b = ws[ws.length - 1];
      return a && WORDLIKE.test(b.text) && b.confidence >= 40 && b.bbox.x0 - a.bbox.x1 < 1.2 * h;
    };
    while (ws.length && !edgeOk(ws[ws.length - 1], 55) && !closeRight()) ws.pop();
    if (!ws.length) continue;
    // Reste direkt daneben (z. B. eine unsicher erkannte Wortendung) nicht anzeigen, aber übermalen
    const i0 = part.indexOf(ws[0]), i1 = part.indexOf(ws[ws.length - 1]);
    const extra = [];
    for (let i = i1 + 1; i < part.length && part[i].bbox.x0 - part[i - 1].bbox.x1 < 1.0 * h; i++) extra.push(part[i]);
    for (let i = i0 - 1; i >= 0 && part[i + 1].bbox.x0 - part[i].bbox.x1 < 1.0 * h && !pre.includes(part[i]); i--) extra.push(part[i]);
    units.push({ ws, pre: pre.filter((w) => WORDLIKE.test(w.text)), h, extra });
  }
  return units;
}

const finishUnit = (u) => ({ ...u, bbox: union(u.ws.map((w) => w.bbox)), words: [...u.ws, ...(u.extra || [])].map((w) => w.bbox), text: u.ws.map((w) => w.text).join(" ") });

// Links abgeschnittene Wörter zurückholen, wenn sie am gemeinsamen linken Rand der Gruppe beginnen.
function rescueLeft(group) {
  const xs = group.map((u) => u.bbox.x0).sort((a, b) => a - b);
  const margin = xs[xs.length >> 1];
  return group.map((u) => {
    if (!u.pre.length) return u;
    for (let i = 0; i < u.pre.length; i++) {
      if (Math.abs(u.pre[i].bbox.x0 - margin) < 0.8 * u.h) return finishUnit({ ...u, ws: [...u.pre.slice(i), ...u.ws], pre: [] });
    }
    return u;
  });
}

// Zeilen zu Textgruppen (Absätzen) zusammenfassen: untereinander, ähnlich groß, überlappend, ohne große Lücke.
function groupUnits(units) {
  units.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
  const groups = [];
  for (const u of units) {
    let target = null;
    for (let i = groups.length - 1; i >= 0 && !target; i--) {
      const last = groups[i][groups[i].length - 1];
      const gap = u.bbox.y0 - last.bbox.y1;
      const sameSize = Math.max(u.h, last.h) / Math.min(u.h, last.h) < 1.35;
      const overlap = Math.min(u.bbox.x1, last.bbox.x1) - Math.max(u.bbox.x0, last.bbox.x0) > 0;
      const near = gap > -0.5 * last.h && gap < 0.9 * Math.max(u.h, last.h);
      if (sameSize && overlap && near && u.bbox.y0 > last.bbox.y0) target = groups[i];
    }
    if (target) target.push(u); else groups.push([u]);
  }
  return groups;
}

// OCR-Text aufräumen. Zeilenumbrüche innerhalb eines Absatzes werden zu Leerzeichen.
// Option bookSyllables: Manche Lesebücher trennen schwierige Wörter selbst in Silben („sko-le“,
// „mor·gen·en“). Dann werden Bindestriche/Mittelpunkte zwischen Buchstaben zu unserem Silbenzeichen „·“.
// Ohne die Option bleiben Bindestriche normale Bindestriche („Lille-by“), und ein Trennstrich am
// Zeilenende wird wie üblich entfernt („Wör-\nter“ → „Wörter“).
export function cleanOcr(raw, { bookSyllables = false } = {}) {
  let t = raw.replace(/\r/g, "").replace(/[|]/g, "I");
  if (bookSyllables) {
    t = t
      .replace(/(\p{L})[-‐‑¬·•]\s*\n\s*(\p{Ll})/gu, "$1·$2")
      .replace(/(\p{L})[-‐‑·•](?=\p{L})/gu, "$1·")
      .replace(/(\p{Ll})\.(?=\p{Ll})/gu, "$1·");
  } else {
    t = t
      .replace(/(\p{Ll})[-‐‑¬]\s*\n\s*(\p{Ll})/gu, "$1$2")
      .replace(/(\p{L})[‐‑](?=\p{L})/gu, "$1-");
  }
  return t
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim())
    .filter((p) => p.length > 0 && LETTER.test(p))
    .join("\n\n");
}

// Bei schräg fotografierten Seiten liefert Tesseract manchmal dieselbe Zeile doppelt (als zwei
// überlappende Zeilen). Dann behalten wir die mit mehr sicheren Wörtern.
function dedupe(units) {
  const area = (b) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
  const score = (u) => u.ws.filter(strong).length;
  const kept = [];
  for (const u of [...units].sort((a, b) => score(b) - score(a))) {
    const clash = kept.some((k) => {
      const i = { x0: Math.max(u.bbox.x0, k.bbox.x0), y0: Math.max(u.bbox.y0, k.bbox.y0), x1: Math.min(u.bbox.x1, k.bbox.x1), y1: Math.min(u.bbox.y1, k.bbox.y1) };
      return area(i) > 0.5 * Math.min(area(u.bbox), area(k.bbox));
    });
    if (!clash) kept.push(u);
  }
  return kept;
}

// Ergebnis: Textgruppen mit Position, Zeilen- und Wortflächen (zum Übermalen) und Text.
// Den Text (g.text) setzt der Aufrufer mit cleanOcr(g.raw, Optionen), damit Einstellungen ohne neue Erkennung wirken.
export function parasFromOcr(data) {
  const units = [];
  for (const b of data.blocks || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) units.push(...lineUnits(l).map(finishUnit));
  return groupUnits(dedupe(units)).map(rescueLeft).map((ls) => {
    const hs = ls.map((l) => l.h).sort((a, b) => a - b);
    return {
      bbox: union(ls.map((l) => l.bbox)),
      lines: ls.map((l) => l.bbox),
      words: ls.flatMap((l) => l.words),
      lh: hs[hs.length >> 1],
      raw: ls.map((l) => l.text).join("\n"),
    };
  }).filter((g) => letters(g.raw) >= 4); // winzige Bruchstücke (meist aus Bildern) weglassen
}
