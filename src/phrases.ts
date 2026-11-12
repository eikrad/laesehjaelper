import { READING_WORD, readingText } from "./practice";

/** Adult-selected boundaries, anchored to unchanged spelling; never part of speech text.
 * Rodgers, D'Agostino, Levin & Rasinski (2025), doi:10.1111/1467-9817.70002:
 * ten English-speaking readers, adult-supported readers theatre; clearer effects on expression
 * and phrasing than automaticity. This does not validate automatic grouping or this app.
 */
export interface PhraseCues { source: string; after: number[] }

export function phraseCues(text: string, after: number[]): PhraseCues {
  const source = readingText(text), words = [...source.matchAll(READING_WORD)];
  return { source, after: [...new Set(after)].filter(i => Number.isInteger(i) && i >= 0 && i < words.length - 1 &&
    !source.slice(words[i].index! + words[i][0].length, words[i + 1].index).includes("\n")).sort((a, b) => a - b) };
}

export function phraseBoundaries(text: string, cues: unknown): number[] {
  if (!cues || typeof cues !== "object" || !("source" in cues) || cues.source !== readingText(text) || !("after" in cues) || !Array.isArray(cues.after)) return [];
  return phraseCues(text, cues.after).after;
}

/** Empty marks carry no text, cannot become speech tokens, and are hidden from assistive speech. */
export function renderPhraseCues(paragraphs: HTMLElement[], after: number[]) {
  const words = paragraphs.flatMap(p => [...p.querySelectorAll<HTMLElement>(".w")]);
  for (const i of after) {
    const mark = document.createElement("span"); mark.className = "phrase-cue"; mark.setAttribute("aria-hidden", "true");
    words[i + 1]?.before(mark);
  }
}
