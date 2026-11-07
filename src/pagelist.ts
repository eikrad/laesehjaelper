// Where pages go in a book and which page stays selected, independent of the page objects.
// The workshop may change the list between two photos of a batch (deleting or moving pages),
// so positions are worked out from the pages themselves, never from remembered indexes.

/** Where new photos go, relative to the selected page. */
export type Placement = "before" | "after" | "end";

/**
 * Index for the next photo of a batch. A batch stays together in the chosen order: after the
 * last photo it added that still exists. The first photo goes before or after the selected page
 * (`target`). Without either, it goes at the end.
 */
export function insertIndex<T>(list: readonly T[], added: readonly T[], target: T | null, placement: Placement): number {
  for (let i = added.length - 1; i >= 0; i--) {
    const at = list.indexOf(added[i]);
    if (at >= 0) return at + 1;
  }
  const at = target === null ? -1 : list.indexOf(target);
  if (placement === "end" || at < 0) return list.length;
  return placement === "after" ? at + 1 : at;
}

/** Index of the selected page after the list changed; if it is gone, the previous index within the list. */
export function selectedIndex<T>(list: readonly T[], selected: T | undefined, previous: number): number {
  const at = selected === undefined ? -1 : list.indexOf(selected);
  return at >= 0 ? at : Math.max(0, Math.min(previous, list.length - 1));
}
