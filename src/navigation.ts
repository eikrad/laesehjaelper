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
// Where links, Back steps and the app's own moves lead, and which navigation is the latest. The
// browser history sits behind a small port (window.history in the app, an in-memory history in
// tests); showing views and loading books stay with the caller.
//
// Every history entry the app writes records its view and, when known, its depth: the number of
// Back steps to the nearest shelf entry (shelf 0, reading 1, workshop 2). "Back to reading" and
// Home step back that far, so Forward still returns to the book. An entry without a known depth
// (a refused write, or history from an older version) is replaced instead, so the app is never left.

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

/** A move the app makes on its own: open a book from the shelf, enter the workshop, return to reading, go home. */
export type Intent =
  | { to: "book"; bookId: string; view?: "read" | "workshop"; pageId?: string }
  | { to: "workshop"; bookId: string; pageId?: string }
  | { to: "reading"; bookId: string; pageId?: string }
  | { to: "shelf" };

/** What to show after a move, a link or a Back step. */
export type Route =
  /** Nothing yet: a Back step is under way, and its arrival is restored like any other. */
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
  /** Record the location shown as a new Back step (`push`) or in place. An unchanged location writes nothing. */
  record(target: BookLocation, push: boolean): void;
  /** A move the app makes: change history as the move needs, start one navigation, and say what to show. */
  go(intent: Intent): Route;
  /** Where the current link or Back step leads. A direct link first gets the internal Back path. */
  restore(at: { open: OpenBook | null; cropOpen?: boolean; current?: BookLocation }): Route;
}

interface Entry { laese?: "shelf" | "read" | "workshop"; depth?: number }
const entry = (state: unknown): Entry => (state && typeof state === "object" ? state as Entry : {});

export function createNavigation(history: BrowserHistory): Navigation {
  let latest = 0;
  const begin = () => ++latest;

  function record(target: BookLocation, push: boolean) {
    const hash = locationHash(target), here = entry(history.state);
    if (history.hash === hash && here.laese === target.view) return;   // Already recorded.
    // A new step is one further from the shelf; an entry replaced keeps its distance, unless it becomes the shelf.
    const depth = push && history.hash !== hash
      ? here.depth === undefined ? undefined : here.depth + 1
      : target.view === "shelf" ? 0 : here.depth;
    const state = depth === undefined ? { laese: target.view } : { laese: target.view, depth };
    // Browsers cap how often a page may change its history (Safari and Firefox then throw),
    // and some embedded views block it. Reading goes on; only the link is not updated.
    try {
      if (push && history.hash !== hash) history.pushState(state, "", hash);
      else history.replaceState(state, "", hash);
    } catch { /* Keep the previous link. */ }
  }

  /** A direct link gets the app's own Back path; reload keeps the history it has. */
  function seed(initial: BookLocation) {
    if (entry(history.state).laese) return;
    record({ view: "shelf" }, false);
    if (initial.view === "shelf") return;
    record({ ...initial, view: "read" }, true);
    if (initial.view === "workshop") record(initial, true);
  }

  const at = (view: "read" | "workshop", bookId: string, pageId?: string): BookLocation => ({ view, bookId, ...(pageId ? { pageId } : {}) });

  function go(intent: Intent): Route {
    const ticket = begin();
    const here = entry(history.state);
    switch (intent.to) {
      case "book": {
        // Books open from the shelf: reading first, then the workshop if asked for.
        const view = intent.view ?? "read";
        record(at("read", intent.bookId, intent.pageId), true);
        if (view === "workshop") record(at("workshop", intent.bookId, intent.pageId), true);
        if (intent.bookId === "sample") return { to: "sample", view };
        return { to: "load", bookId: intent.bookId, view, ...(intent.pageId ? { pageId: intent.pageId } : {}), ticket };
      }
      case "workshop":
        // The workshop always sits on a reading step, also for a new book started from the shelf.
        if (here.laese !== "read" && here.laese !== "workshop") record(at("read", intent.bookId, intent.pageId), true);
        // Already in the workshop (adding photos), the entry is updated: Back to reading stays one step.
        record(at("workshop", intent.bookId, intent.pageId), here.laese !== "workshop");
        return { to: "open", view: "workshop" };
      case "reading":
        if (here.laese === "workshop" && here.depth !== undefined && here.depth >= 2) { history.go(-1); return { to: "stay" }; }
        record(at("read", intent.bookId, intent.pageId), false);
        return { to: "open", view: "read" };
      case "shelf":
        if (here.depth !== undefined && here.depth > 0) { history.go(-here.depth); return { to: "stay" }; }
        record({ view: "shelf" }, false);
        return { to: "shelf" };
    }
  }

  return {
    begin,
    current: () => latest,
    isCurrent: ticket => ticket === latest,
    record,
    go,
    restore({ open, cropOpen = false, current }) {
      // A crop has not been accepted or saved yet. Keep its history entry until it finishes.
      if (cropOpen) { if (current) record(current, true); return { to: "stay" }; }
      const ticket = begin();
      // Back steps land on entries the app wrote; a link typed or followed has none of its own.
      const fromApp = !!entry(history.state).laese;
      const target = parseLocation(history.hash);
      seed(target);
      if (target.view === "shelf") return { to: "shelf" };
      if (open && open.bookId === target.bookId && open.pageIds.length) {
        // Back from the workshop to reading keeps the page chosen in the workshop;
        // an explicit link selects the page it names.
        const keepSelection = fromApp && open.view === "workshop" && target.view === "read";
        const named = !keepSelection && target.pageId && open.pageIds.includes(target.pageId) ? target.pageId : undefined;
        return named ? { to: "open", view: target.view, pageId: named } : { to: "open", view: target.view };
      }
      if (target.bookId === "sample") return { to: "sample", view: target.view };
      return { to: "load", bookId: target.bookId, view: target.view, ...(target.pageId ? { pageId: target.pageId } : {}), ticket };
    },
  };
}
