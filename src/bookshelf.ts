/** Zero-based page to open when continuing a stored book. */
export function resumePage(lastPage: number | undefined, pageCount: number): number {
  return Math.max(0, Math.min(lastPage ?? 0, pageCount - 1));
}
