// Shared types.

/** Rectangle in image pixels, as provided by Tesseract. */
export interface Box { x0: number; y0: number; x1: number; y1: number }

/** The parts of the Tesseract result that we use. */
export interface OcrWord {
  text: string; confidence: number; bbox: Box;
  /** bold in the image (measured locally) */ bold?: boolean;
  /** the word's characters with their boxes */ symbols?: { text: string; bbox: Box }[];
}
export interface OcrLine { text: string; bbox: Box; words: OcrWord[] }
export interface OcrData {
  text?: string;
  blocks?: { paragraphs?: { lines?: OcrLine[] }[] }[] | null;
  imageColor?: string | null;
}

/** A text group (paragraph) on the book page. */
export interface Para {
  bbox: Box;
  lines: Box[];
  /** Areas to paint over (recognized words and nearby fragments) */
  words: Box[];
  /** median line height in pixels */
  lh: number;
  /** Raw OCR text, with lines separated by \n */
  raw: string;
  /** processed text (depending on settings) */
  text?: string;
  /** manually assigned text-box position and size (overrides bbox/grow) */
  place?: Box;
  /** Busy background (text on an image)? */
  busy?: boolean;
  /** The old text on the busy background was inpainted (the picture continues beneath it),
   *  so the new text needs no panel of its own. */
  inpainted?: boolean;
  bg?: string;
  rgb?: number[];
  /** Area into which the replacement text may expand */
  grow?: Box;
}

export type Point = [number, number];
/** Four corners: top left, top right, bottom right, bottom left */
export type Corners = [Point, Point, Point, Point];
/** Page frame: corners plus one midpoint on each edge (top, right, bottom, left)
 *  for tracing curved edges. */
export interface Frame { corners: Corners; mids: Corners }
