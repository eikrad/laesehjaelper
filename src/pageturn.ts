/**
 * Turning pages with the page-turn buttons, the arrow keys or a swipe.
 *
 * While reading, "next" on the last page leads to a calm end of the book instead of greying out (#202).
 * The adults' workshop stops at the last page.
 */

/** Where the reader is: a page, or the end of the book after its last page. */
export interface Place { page: number; end: boolean }

/** Where turning `to` leads from `at` in a book of `pages` pages, or null if there is nowhere to go. */
export function turn(at: Place, to: "prev" | "next", pages: number, reading: boolean): Place | null {
  if (!pages) return null;
  if (to === "prev") {
    if (at.end) return { page: at.page, end: false };
    return at.page > 0 ? { page: at.page - 1, end: false } : null;
  }
  if (at.end) return null;
  if (at.page < pages - 1) return { page: at.page + 1, end: false };
  return reading ? { page: at.page, end: true } : null;
}
