// Gemeinsame Typen.

/** Rechteck in Bildpixeln (wie Tesseract es liefert). */
export interface Box { x0: number; y0: number; x1: number; y1: number }

/** Die Teile des Tesseract-Ergebnisses, die wir verwenden. */
export interface OcrWord { text: string; confidence: number; bbox: Box }
export interface OcrLine { text: string; bbox: Box; words: OcrWord[] }
export interface OcrData {
  text?: string;
  blocks?: { paragraphs?: { lines?: OcrLine[] }[] }[] | null;
  imageColor?: string | null;
}

/** Eine Textgruppe (Absatz) auf der Buchseite. */
export interface Para {
  bbox: Box;
  lines: Box[];
  /** Flächen zum Übermalen (erkannte Wörter und Reste daneben) */
  words: Box[];
  /** mittlere Zeilenhöhe in Pixeln */
  lh: number;
  /** OCR-Rohtext, Zeilen mit \n getrennt */
  raw: string;
  /** aufbereiteter Text (abhängig von Einstellungen) */
  text?: string;
  /** Hintergrund unruhig (Text auf Bild)? */
  busy?: boolean;
  bg?: string;
  rgb?: number[];
  /** Fläche, in die der neue Text wachsen darf */
  grow?: Box;
}

export type Point = [number, number];
/** Vier Ecken: oben links, oben rechts, unten rechts, unten links */
export type Corners = [Point, Point, Point, Point];
/** Seitenrahmen: Ecken plus je ein Punkt auf der Mitte jeder Kante (oben, rechts, unten, links),
 *  mit denen sich gewölbte Kanten nachzeichnen lassen. */
export interface Frame { corners: Corners; mids: Corners }
