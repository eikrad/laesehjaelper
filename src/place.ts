/**
 * Textfelder auf der Buchseite von Hand verschieben oder vergrößern
 * (z. B. wenn der neue Text in ein Bild ragt, darunter aber Platz ist).
 * Alle Koordinaten im Arbeitsbild (workW × workH).
 */
import type { Box } from "./types";

const MIN_W = 40, MIN_H = 20;

/** Feld um (dx, dy) verschieben ("move") oder an der unteren rechten Ecke ziehen ("resize"). */
export function dragBox(b: Box, dx: number, dy: number, mode: "move" | "resize", { W, H }: { W: number; H: number }): Box {
  if (mode === "move") {
    const w = b.x1 - b.x0, h = b.y1 - b.y0;
    const x0 = Math.min(Math.max(0, b.x0 + dx), W - w), y0 = Math.min(Math.max(0, b.y0 + dy), H - h);
    return { x0, y0, x1: x0 + w, y1: y0 + h };
  }
  const x1 = Math.min(W, Math.max(b.x0 + MIN_W, b.x1 + dx)), y1 = Math.min(H, Math.max(b.y0 + MIN_H, b.y1 + dy));
  return { x0: b.x0, y0: b.y0, x1, y1 };
}

const area = (b: Box) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
function overlap(a: Box, b: Box): number {
  const i = { x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) };
  return area(i) / Math.max(1, Math.min(area(a), area(b)));
}

/** Nach neuer Texterkennung: eigene Positionen für Felder übernehmen, die es (fast deckungsgleich) noch gibt. */
export function transferPlaces<P extends { bbox: Box; place?: Box }>(old: P[] | null | undefined, neu: P[]): P[] {
  if (!old || !old.length) return neu;
  return neu.map((p) => {
    const match = old.find((o) => o.place && overlap(o.bbox, p.bbox) > 0.6);
    return match ? { ...p, place: { ...match.place! } } : p;
  });
}
