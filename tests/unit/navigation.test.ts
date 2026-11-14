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
function memoryHistory(start = "") {
  const entries = [{ hash: start, state: null as unknown }];
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
    expect(nav.restore({ open: book("workshop"), fromAppHistory: true })).toEqual({ to: "open", view: "read" });
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

  it("The shelf is one Back step from reading and two from the workshop", () => {
    const nav = createNavigation(memoryHistory());
    expect(nav.stepsToShelf("read")).toBe(-1);
    expect(nav.stepsToShelf("workshop")).toBe(-2);
  });
});
