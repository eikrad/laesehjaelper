/**
 * Optional, adult-supported word practice in the child's own text.
 * Context/vocabulary additions helped maintenance of taught words (Petersen-Brown & Burns,
 * 2019, doi:10.1037/spq0000294). Updated rehearsal evidence is mixed (Petersen-Brown et al.,
 * 2026, doi:10.1037/spq0000702). Neither study validates this interface or a mastery schedule.
 */
export interface PracticePage { id?: string; lang: string; text: string }
export interface PracticeWord {
  readerId: string; bookId: string; pageId: string; lang: string;
  word: string; source: string; start: number; familiar: boolean;
}

export const READING_WORD = /[\p{L}\p{M}·]+(?:-[\p{L}\p{M}·]+)*/gu;

/** The same plain spelling and paragraph separation used for page speech. */
export function readingText(text: string): string {
  return text.split(/\n\s*\n/).map(p => p.replace(/\*/g, "").replace(/\n/g, " ").replace(/·/g, "")).join("\n");
}

/** Capture an explicitly chosen rendered word; never infer difficulty from a tap. */
export function practiceWord(readerId: string, bookId: string, page: PracticePage, index: number): PracticeWord | null {
  const source = readingText(page.text), hit = [...source.matchAll(READING_WORD)][index];
  if (!page.id || !hit) return null;
  return { readerId, bookId, pageId: page.id, lang: page.lang, word: hit[0], source, start: hit.index!, familiar: false };
}

/** A page edit makes its saved context unavailable rather than pointing at another word. */
export function practiceContext(word: PracticeWord, page: PracticePage | undefined): string | null {
  if (!page || page.id !== word.pageId || page.lang !== word.lang || readingText(page.text) !== word.source) return null;
  const sentence = [...word.source.matchAll(/[^.!?\n]+[.!?]*|[^\n]+$/gu)]
    .find(m => m.index! <= word.start && m.index! + m[0].length > word.start);
  return sentence?.[0].trim() || null;
}

/** One spelling per language in a reader's book, retaining the chosen context and adult label. */
export function practiceKey(word: PracticeWord): string {
  return JSON.stringify([word.readerId, word.bookId, word.lang, word.word.normalize("NFC").toLowerCase()]);
}
export function savePracticeWord(words: PracticeWord[], word: PracticeWord): PracticeWord[] {
  const old = words.find(w => practiceKey(w) === practiceKey(word));
  if (!old) return [...words, word];
  return old.source === word.source && old.pageId === word.pageId ? words : words.map(w => w === old ? { ...word, familiar: old.familiar } : w);
}
/** Both familiar and still-practised words remain available; no automatic mastery judgement. */
export function reviewWords(words: PracticeWord[], readerId: string, bookId: string): PracticeWord[] {
  return words.filter(w => w.readerId === readerId && w.bookId === bookId);
}

/** Ignore damaged local data, including anchors that do not point at their saved word. */
export function loadPracticeWords(raw: string | null): PracticeWord[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((w): w is PracticeWord => !!w && typeof w === "object"
      && [w.readerId, w.bookId, w.pageId, w.word, w.source].every(x => typeof x === "string" && x.length > 0)
      && ["da", "de", "en"].includes(w.lang) && typeof w.familiar === "boolean" && Number.isInteger(w.start)
      && [...w.source.matchAll(READING_WORD)].some(m => m.index === w.start && m[0] === w.word));
  } catch { return []; }
}
export function updatePracticeWord(words: PracticeWord[], key: string, familiar: boolean | null): PracticeWord[] {
  return words.flatMap(w => practiceKey(w) !== key ? [w] : familiar === null ? [] : [{ ...w, familiar }]);
}
export function forgetPractice(words: PracticeWord[], owner: "reader" | "book", id: string): PracticeWord[] {
  return words.filter(w => (owner === "reader" ? w.readerId : w.bookId) !== id);
}
