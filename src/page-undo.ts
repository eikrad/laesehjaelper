// Undoing a deleted page (#205). A deleted page leaves its book at once, but its record stays on the
// device, marked, until the undo time is over, so Undo also works after a reload within that time.
// Only the latest deletion can be undone; every earlier one is final. Positions are worked out from
// the page's old neighbours, because the list may change before Undo (see src/pagelist.ts).

/** How long a deleted page can be brought back. */
export const UNDO_MS = 10_000;

/** A deletion that may still be undone: where the page was and when the undo ends (ms since 1970). */
export interface DeletedMark {
  until: number;
  /** Position in the book when it was deleted. */
  index: number;
  /** ID of the page to its left, if any. */
  after?: string;
  /** ID of the page to its right, if any. */
  before?: string;
}

/** Mark for deleting the page at `index` of a book with these page IDs, at time `now`. */
export function deletionMark(ids: readonly (string | undefined)[], index: number, now: number): DeletedMark {
  const after = ids[index - 1], before = ids[index + 1];
  return { index, ...(after !== undefined ? { after } : {}), ...(before !== undefined ? { before } : {}), until: now + UNDO_MS };
}

/** Where an undone page goes back: after its old left neighbour, else before its old right one, else at its old position. */
export function restoreIndex(ids: readonly (string | undefined)[], mark: DeletedMark): number {
  const after = mark.after === undefined ? -1 : ids.indexOf(mark.after);
  if (after >= 0) return after + 1;
  const before = mark.before === undefined ? -1 : ids.indexOf(mark.before);
  if (before >= 0) return before;
  return Math.min(mark.index, ids.length);
}

/** Milliseconds left to undo a deletion; 0 once it is final. */
export function undoLeft(mark: DeletedMark | undefined, now: number): number {
  return mark ? Math.max(0, mark.until - now) : 0;
}

/** Of stored pages, the deletion that can still be undone (the latest open one) and the deletions that are final. */
export function pendingDeletions<T extends { id?: string; deleted?: DeletedMark }>(pages: readonly T[], now: number): { undo: T | null; final: T[] } {
  const marked = pages.filter(pg => pg.deleted);
  let undo: T | null = null;
  for (const pg of marked) if (undoLeft(pg.deleted, now) > 0 && (!undo || pg.deleted!.until > undo.deleted!.until)) undo = pg;
  return { undo, final: marked.filter(pg => pg !== undo) };
}
