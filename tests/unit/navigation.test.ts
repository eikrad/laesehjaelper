import { describe, expect, it } from "vitest";
import { createNavigation, locationHash, parseLocation } from "../../src/navigation";

describe("Reading and workshop navigation", () => {
  it("Opens the bookshelf for an empty or unknown link", () => {
    expect(parseLocation("")).toEqual({ view: "shelf" });
    expect(parseLocation("#unknown")).toEqual({ view: "shelf" });
  });
  it("Links directly to a reading or workshop page, including encoded identifiers", () => {
    expect(parseLocation("#read/book/page")).toEqual({ view: "read", bookId: "book", pageId: "page" });
    const target = { view: "workshop", bookId: "a/b", pageId: "side æ" } as const;
    expect(locationHash(target)).toBe("#edit/a%2Fb/side%20%C3%A6");
    expect(parseLocation(locationHash(target))).toEqual(target);
    expect(parseLocation("#edit/book")).toEqual({ view: "workshop", bookId: "book" });
    expect(locationHash({ view: "shelf" })).toBe("#shelf");
  });
  it("Falls back to the shelf for malformed or incomplete links", () => {
    for (const hash of ["#read", "#edit/", "#read/%broken/page", "#read/book/page/extra", "#read/book/"]) {
      expect(parseLocation(hash)).toEqual({ view: "shelf" });
    }
  });
});

/** Browser history in memory: entries, the current one, and an optional refusal like Safari's rate limit. */
function memoryHistory(start = "", state: unknown = null) {
  const entries = [{ hash: start, state }];
  let at = 0;
  const h = {
    refuse: false, writes: 0,
    get hash() { return entries[at].hash; },
    get state() { return entries[at].state; },
    pushState(state: unknown, _: string, hash: string) {
      if (h.refuse) throw new DOMException("Too many calls", "SecurityError");
      h.writes++; entries.splice(at + 1, Infinity, { hash, state }); at++;
    },
    replaceState(state: unknown, _: string, hash: string) {
      if (h.refuse) throw new DOMException("Too many calls", "SecurityError");
      h.writes++; entries[at] = { hash, state };
    },
    go(delta: number) { at = Math.max(0, Math.min(entries.length - 1, at + delta)); },
    entries: () => entries.map(e => e.hash),
  };
  return h;
}

describe("Book navigation", () => {
  const book = (view: "read" | "workshop", pageIds: string[] = ["p1", "p2"], bookId = "b") => ({ bookId, view, pageIds });

  it("Records a new location as a Back step, and leaves history alone when nothing changed", () => {
    const h = memoryHistory("#shelf");
    const nav = createNavigation(h);
    nav.record({ view: "read", bookId: "b", pageId: "p1" }, true);
    expect(h.entries()).toEqual(["#shelf", "#read/b/p1"]);
    const writes = h.writes;
    nav.record({ view: "read", bookId: "b", pageId: "p1" }, true);
    nav.record({ view: "read", bookId: "b", pageId: "p1" }, false);
    expect(h.writes).toBe(writes);
    nav.record({ view: "read", bookId: "b", pageId: "p2" }, false);
    expect(h.entries()).toEqual(["#shelf", "#read/b/p2"]);
  });

  it("Keeps working when the browser refuses history updates", () => {
    const h = memoryHistory("#shelf");
    const nav = createNavigation(h);
    h.refuse = true;
    expect(() => nav.record({ view: "read", bookId: "b" }, true)).not.toThrow();
    expect(h.entries()).toEqual(["#shelf"]);
  });

  it("A direct workshop link gets the internal Back path shelf, reading, workshop", () => {
    const h = memoryHistory("#edit/b/p2");
    const nav = createNavigation(h);
    expect(nav.restore({ open: null })).toMatchObject({ to: "load", bookId: "b", view: "workshop", pageId: "p2" });
    expect(h.entries()).toEqual(["#shelf", "#read/b/p2", "#edit/b/p2"]);
  });

  it("Reload keeps the history it already has", () => {
    const h = memoryHistory("#shelf");
    const nav = createNavigation(h);
    nav.record({ view: "read", bookId: "b", pageId: "p1" }, true);
    nav.restore({ open: null });
    expect(h.entries()).toEqual(["#shelf", "#read/b/p1"]);
  });

  it("Back from the workshop to reading keeps the page selected in the workshop", () => {
    const h = memoryHistory("#shelf");
    const nav = createNavigation(h);
    nav.record({ view: "read", bookId: "b", pageId: "p1" }, true);
    nav.record({ view: "workshop", bookId: "b", pageId: "p2" }, true);
    h.go(-1);
    expect(nav.restore({ open: book("workshop") })).toEqual({ to: "open", view: "read" });
  });

  it("An explicit reading link selects its requested page in the open book", () => {
    const h = memoryHistory("#read/b/p2");
    const nav = createNavigation(h);
    expect(nav.restore({ open: book("workshop") })).toEqual({ to: "open", view: "read", pageId: "p2" });
  });

  it("A link to another book loads it; the sample opens as the sample; anything else goes to the shelf", () => {
    expect(createNavigation(memoryHistory("#read/other")).restore({ open: book("read") })).toMatchObject({ to: "load", bookId: "other" });
    expect(createNavigation(memoryHistory("#edit/sample")).restore({ open: null })).toEqual({ to: "sample", view: "workshop" });
    expect(createNavigation(memoryHistory("#nonsense")).restore({ open: book("read") })).toEqual({ to: "shelf" });
    // An open book without pages is not shown again; it is loaded.
    expect(createNavigation(memoryHistory("#read/b")).restore({ open: book("read", []) })).toMatchObject({ to: "load", bookId: "b" });
  });

  it("While a crop is open, Back keeps the crop and its history entry", () => {
    const h = memoryHistory("#shelf");
    const nav = createNavigation(h);
    nav.record({ view: "workshop", bookId: "b", pageId: "p1" }, true);
    h.go(-1);
    const current = { view: "workshop", bookId: "b", pageId: "p1" } as const;
    expect(nav.restore({ open: book("workshop"), cropOpen: true, current })).toEqual({ to: "stay" });
    expect(h.hash).toBe("#edit/b/p1");
  });

  it("A later navigation makes every earlier one stale", () => {
    const nav = createNavigation(memoryHistory());
    const loading = nav.begin();
    expect(nav.isCurrent(loading)).toBe(true);
    nav.restore({ open: null });
    expect(nav.isCurrent(loading)).toBe(false);
    const next = nav.begin();
    nav.begin();
    expect(nav.isCurrent(next)).toBe(false);
  });

  it("Work started without navigating belongs to the navigation it started in", () => {
    const nav = createNavigation(memoryHistory());
    nav.begin();
    const photoChooser = nav.current();
    expect(nav.isCurrent(photoChooser)).toBe(true);
    expect(nav.current()).toBe(photoChooser);
    nav.begin();
    expect(nav.isCurrent(photoChooser)).toBe(false);
  });

  /** A history that starts on the shelf, as after opening the app. */
  function onShelf() {
    const h = memoryHistory();
    const nav = createNavigation(h);
    nav.restore({ open: null });
    return { h, nav };
  }

  it("Opening a book from the shelf adds a reading step; Home steps back, and Forward returns", () => {
    const { h, nav } = onShelf();
    expect(nav.go({ to: "book", bookId: "b" })).toMatchObject({ to: "load", bookId: "b", view: "read" });
    nav.record({ view: "read", bookId: "b", pageId: "p1" }, false);   // the page shown after loading
    expect(nav.go({ to: "workshop", bookId: "b", pageId: "p1" })).toEqual({ to: "open", view: "workshop" });
    expect(h.entries()).toEqual(["#shelf", "#read/b/p1", "#edit/b/p1"]);
    expect(nav.go({ to: "shelf" })).toEqual({ to: "stay" });
    expect(h.hash).toBe("#shelf");
    h.go(1);
    expect(h.hash).toBe("#read/b/p1");
  });

  it("Back to reading steps back from the workshop to the reading entry", () => {
    const { h, nav } = onShelf();
    nav.go({ to: "book", bookId: "b", pageId: "p1" });
    nav.go({ to: "workshop", bookId: "b", pageId: "p2" });
    expect(nav.go({ to: "reading", bookId: "b", pageId: "p2" })).toEqual({ to: "stay" });
    expect(h.hash).toBe("#read/b/p1");
    expect(nav.restore({ open: book("workshop") })).toEqual({ to: "open", view: "read" });
  });

  it("A book opened straight into the workshop gets reading and workshop steps", () => {
    const { h, nav } = onShelf();
    expect(nav.go({ to: "workshop", bookId: "new" })).toEqual({ to: "open", view: "workshop" });
    expect(h.entries()).toEqual(["#shelf", "#read/new", "#edit/new"]);
    nav.go({ to: "shelf" });
    expect(h.hash).toBe("#shelf");
  });

  it("Moving to the workshop while already in it adds no Back step", () => {
    const { h, nav } = onShelf();
    nav.go({ to: "book", bookId: "b", pageId: "p1" });
    nav.go({ to: "workshop", bookId: "b", pageId: "p1" });
    nav.go({ to: "workshop", bookId: "b", pageId: "p3" });   // photos added after another page
    expect(h.entries()).toEqual(["#shelf", "#read/b/p1", "#edit/b/p3"]);
    nav.go({ to: "reading", bookId: "b", pageId: "p3" });
    expect(h.hash).toBe("#read/b/p1");
  });

  it("The sample opens as the sample, with a reading step", () => {
    const { h, nav } = onShelf();
    expect(nav.go({ to: "book", bookId: "sample" })).toEqual({ to: "sample", view: "read" });
    expect(h.entries()).toEqual(["#shelf", "#read/sample"]);
  });

  it("Without known Back steps, Back to reading and Home replace the entry instead of leaving the app", () => {
    // History written before steps were recorded, or after the browser refused a step.
    const h = memoryHistory("#edit/b/p1", { laese: "workshop" });
    const nav = createNavigation(h);
    nav.restore({ open: null });
    expect(nav.go({ to: "reading", bookId: "b", pageId: "p1" })).toEqual({ to: "open", view: "read" });
    expect(h.entries()).toEqual(["#read/b/p1"]);
    expect(nav.go({ to: "shelf" })).toEqual({ to: "shelf" });
    expect(h.entries()).toEqual(["#shelf"]);
  });

  it("A refused step is not counted: Back to reading then replaces instead of landing on the shelf", () => {
    const { h, nav } = onShelf();
    nav.go({ to: "book", bookId: "b", pageId: "p1" });
    h.refuse = true;
    nav.go({ to: "shelf" });   // stepping back works; only writing is refused
    h.refuse = false;
    expect(h.hash).toBe("#shelf");
    h.go(1);
    nav.restore({ open: null });
    h.refuse = true;
    nav.go({ to: "workshop", bookId: "b", pageId: "p1" });   // refused: still on the reading entry
    h.refuse = false;
    expect(nav.go({ to: "reading", bookId: "b", pageId: "p1" })).toEqual({ to: "open", view: "read" });
    expect(h.hash).toBe("#read/b/p1");
  });

  it("A shelf shown in place of a missing book is where Home leads", () => {
    const h = memoryHistory("#read/missing");
    const nav = createNavigation(h);
    expect(nav.restore({ open: null })).toMatchObject({ to: "load", bookId: "missing" });
    nav.record({ view: "shelf" }, false);   // the book was not found
    nav.go({ to: "book", bookId: "b" });
    nav.go({ to: "shelf" });
    expect(h.entries()).toEqual(["#shelf", "#shelf", "#read/b"]);
    expect(h.hash).toBe("#shelf");
    expect(h.state).toMatchObject({ laese: "shelf" });
  });

  it("Each move starts exactly one navigation", () => {
    const { nav } = onShelf();
    for (const intent of [{ to: "book", bookId: "b" }, { to: "workshop", bookId: "b" }, { to: "reading", bookId: "b" }, { to: "shelf" }] as const) {
      const before = nav.current();
      nav.go(intent);
      expect(nav.current()).toBe(before + 1);
    }
  });
});
