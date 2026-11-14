export type BookLocation = { view: "shelf" } | { view: "read" | "workshop"; bookId: string; pageId?: string };

export function parseLocation(hash: string): BookLocation {
  const parts = hash.slice(1).split("/");
  const [view, bookId, pageId] = parts;
  if ((view === "read" || view === "edit") && bookId && (parts.length === 2 || (parts.length === 3 && pageId))) {
    try {
      return { view: view === "read" ? "read" : "workshop", bookId: decodeURIComponent(bookId), ...(pageId ? { pageId: decodeURIComponent(pageId) } : {}) };
    } catch { /* Invalid URL encoding: return to the bookshelf. */ }
  }
  return { view: "shelf" };
}

export function locationHash(target: BookLocation): string {
  if (target.view === "shelf") return "#shelf";
  return `#${target.view === "read" ? "read" : "edit"}/${encodeURIComponent(target.bookId)}${target.pageId ? `/${encodeURIComponent(target.pageId)}` : ""}`;
}

// ---------- Book navigation ----------
// Where links and Back lead, and which navigation is the latest. The browser history sits behind
// a small port (window.history in the app, an in-memory history in tests); showing views and
// loading books stay with the caller.

/** The browser history, as navigation uses it. */
export interface BrowserHistory {
  readonly hash: string;
  readonly state: unknown;
  pushState(state: unknown, unused: string, url: string): void;
  replaceState(state: unknown, unused: string, url: string): void;
  go(delta: number): void;
}

/** The book shown now: its view and its pages in order. */
export interface OpenBook { bookId: string; view: "read" | "workshop"; pageIds: readonly (string | undefined)[] }

/** Where to go after a link or a Back step. */
export type Route =
  | { to: "stay" }
  | { to: "shelf" }
  /** The open book, in `view`; `pageId` is the page to select, if the link names one. */
  | { to: "open"; view: "read" | "workshop"; pageId?: string }
  | { to: "sample"; view: "read" | "workshop" }
  /** Load a book; show it only while `ticket` is still the latest navigation. */
  | { to: "load"; bookId: string; view: "read" | "workshop"; pageId?: string; ticket: number };

export interface Navigation {
  /** Start a navigation. Every earlier one becomes stale. */
  begin(): number;
  /** The latest navigation, for work that starts without navigating (a photo chooser, a batch). */
  current(): number;
  /** Is this still the latest navigation? Work started for an older one must not show anything. */
  isCurrent(ticket: number): boolean;
  /** Record a location as a new Back step (`push`) or in place. An unchanged location writes nothing. */
  record(target: BookLocation, push: boolean): void;
  /** Decide where the current link leads. A direct link first gets the internal Back path. */
  restore(at: { open: OpenBook | null; fromAppHistory?: boolean; cropOpen?: boolean; current?: BookLocation }): Route;
  /** History steps from a view back to the shelf: reading came from the shelf, the workshop from reading. */
  stepsToShelf(view: "read" | "workshop"): number;
}

const recordedView = (state: unknown) => (state as { laese?: string } | null)?.laese;

export function createNavigation(history: BrowserHistory): Navigation {
  let latest = 0;
  const begin = () => ++latest;

  function record(target: BookLocation, push: boolean) {
    const hash = locationHash(target);
    if (history.hash === hash && recordedView(history.state) === target.view) return;   // Already recorded.
    // Browsers cap how often a page may change its history (Safari and Firefox then throw),
    // and some embedded views block it. Reading goes on; only the link is not updated.
    try {
      if (push && history.hash !== hash) history.pushState({ laese: target.view }, "", hash);
      else history.replaceState({ laese: target.view }, "", hash);
    } catch { /* Keep the previous link. */ }
  }

  /** A direct link gets the app's own Back path; reload keeps the history it has. */
  function seed(initial: BookLocation) {
    if (recordedView(history.state)) return;
    record({ view: "shelf" }, false);
    if (initial.view === "shelf") return;
    record({ ...initial, view: "read" }, true);
    if (initial.view === "workshop") record(initial, true);
  }

  return {
    begin,
    current: () => latest,
    isCurrent: ticket => ticket === latest,
    record,
    restore({ open, fromAppHistory = false, cropOpen = false, current }) {
      // A crop has not been accepted or saved yet. Keep its history entry until it finishes.
      if (cropOpen) { if (current) record(current, true); return { to: "stay" }; }
      const ticket = begin();
      const target = parseLocation(history.hash);
      seed(target);
      if (target.view === "shelf") return { to: "shelf" };
      if (open && open.bookId === target.bookId && open.pageIds.length) {
        // Back from the workshop to reading keeps the page chosen in the workshop;
        // an explicit link selects the page it names.
        const keepSelection = fromAppHistory && open.view === "workshop" && target.view === "read";
        const named = !keepSelection && target.pageId && open.pageIds.includes(target.pageId) ? target.pageId : undefined;
        return named ? { to: "open", view: target.view, pageId: named } : { to: "open", view: target.view };
      }
      if (target.bookId === "sample") return { to: "sample", view: target.view };
      return { to: "load", bookId: target.bookId, view: target.view, ...(target.pageId ? { pageId: target.pageId } : {}), ticket };
    },
    stepsToShelf: view => (view === "workshop" ? -2 : -1),
  };
}
