import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { DB } from "../../src/db";
import { createLibrary, type LibraryStore } from "../../src/library";

interface TestPage { id: string; bookId: string; text: string }
interface TestBook { id: string; title: string; pageIds: string[] }
type TestRecord = TestPage;

let n = 0;
const ids = () => { n++; return { book: `book-${n}`, page: (i: number) => `book-${n}-page-${i}` }; };

/** The real device storage (on the in-memory IndexedDB), with writes that a test can hold or fail. */
function deviceStorage() {
  const held: (() => void)[] = [];
  const state = { failing: false, holding: false, writes: 0 };
  const store: LibraryStore<TestBook, TestRecord> = {
    async write(book, pages) {
      state.writes++;
      if (state.holding) await new Promise<void>(release => held.push(release));
      if (state.failing) throw new Error("QuotaExceededError");
      await DB.putBook(book, pages);
    },
    async remove(pageIds, bookId) {
      for (const id of pageIds) await DB.del("pages", id);
      if (bookId) await DB.del("books", bookId);
    },
  };
  return {
    store, state,
    hold() { state.holding = true; },
    release() { state.holding = false; held.splice(0).forEach(r => r()); },
  };
}

function setup() {
  const storage = deviceStorage();
  const failures: unknown[] = [];
  const changes: string[] = [];
  const library = createLibrary<TestPage, TestBook, TestRecord>({
    store: storage.store,
    encode: async (pg, bookId) => ({ ...pg, bookId }),
    failed: e => failures.push(e),
    changed: bookId => changes.push(bookId),
  });
  return { library, storage, failures, changes };
}

const storedPage = async (id: string) => (await DB.all<TestPage>("pages")).find(p => p.id === id);
const storedBook = async (id: string) => (await DB.all<TestBook>("books")).find(b => b.id === id);
const settle = () => new Promise(r => setTimeout(r, 0));

describe("Library", () => {
  it("saves an accepted page together with its book record", async () => {
    const { library } = setup();
    const id = ids();
    const pg = { id: id.page(0), bookId: id.book, text: "" };
    const book = { id: id.book, title: "", pageIds: [pg.id] };
    expect(await library.saveBook(book, [pg])).toBe("saved");
    expect(await storedPage(pg.id)).toMatchObject({ bookId: id.book });
    expect(await storedBook(id.book)).toMatchObject({ pageIds: [pg.id] });
  });

  it("keeps the book record as it was when saving was asked for", async () => {
    const { library, storage } = setup();
    const id = ids();
    const book = { id: id.book, title: "Before", pageIds: [] as string[] };
    storage.hold();
    const saving = library.saveBook(book);
    book.title = "After";
    storage.release();
    await saving;
    expect(await storedBook(id.book)).toMatchObject({ title: "Before" });
  });

  it("marks a page unsaved when its write fails, and reports the failure", async () => {
    const { library, storage, failures, changes } = setup();
    const id = ids();
    const pg = { id: id.page(0), bookId: id.book, text: "Fixed text" };
    storage.state.failing = true;
    expect(await library.save(pg)).toBe("unsaved");
    expect(library.isUnsaved(pg)).toBe(true);
    expect(library.hasUnsaved()).toBe(true);
    expect(library.unsavedBookIds()).toEqual([id.book]);
    expect(failures).toHaveLength(1);
    expect(changes).toContain(id.book);
  });

  it("a later successful save of the same book also saves its unsaved pages", async () => {
    const { library, storage } = setup();
    const id = ids();
    const first = { id: id.page(0), bookId: id.book, text: "first" };
    const second = { id: id.page(1), bookId: id.book, text: "second" };
    storage.state.failing = true;
    await library.save(first);
    first.text = "first, corrected while unsaved";
    storage.state.failing = false;
    expect(await library.save(second)).toBe("saved");
    expect(await storedPage(first.id)).toMatchObject({ text: "first, corrected while unsaved" });
    expect(library.isUnsaved(first)).toBe(false);
    expect(library.hasUnsaved()).toBe(false);
  });

  it("retry saves the unsaved record of a new book and its first page", async () => {
    const { library, storage, changes } = setup();
    const id = ids();
    const pg = { id: id.page(0), bookId: id.book, text: "" };
    storage.state.failing = true;
    await library.saveBook({ id: id.book, title: "New", pageIds: [pg.id] }, [pg]);
    expect(library.unsaved(id.book)).toEqual({ book: { id: id.book, title: "New", pageIds: [pg.id] }, pages: [pg] });
    storage.state.failing = false;
    changes.length = 0;
    expect(await library.retry(id.book)).toBe("saved");
    expect(await storedBook(id.book)).toMatchObject({ title: "New", pageIds: [pg.id] });
    expect(await storedPage(pg.id)).toBeDefined();
    expect(library.unsaved(id.book)).toBeUndefined();
    expect(changes).toContain(id.book);
  });

  it("a newer book record replaces an unsaved older one", async () => {
    const { library, storage } = setup();
    const id = ids();
    storage.state.failing = true;
    await library.saveBook({ id: id.book, title: "Old", pageIds: [] });
    storage.state.failing = false;
    await library.saveBook({ id: id.book, title: "New", pageIds: [] });
    expect(await storedBook(id.book)).toMatchObject({ title: "New" });
    expect(library.hasUnsaved()).toBe(false);
  });

  it("a deleted page is never written by a save that was waiting or comes later", async () => {
    const { library, storage } = setup();
    const id = ids();
    const keep = { id: id.page(0), bookId: id.book, text: "keep" };
    const gone = { id: id.page(1), bookId: id.book, text: "gone" };
    await library.save(gone);
    storage.hold();
    const writing = library.save(keep);
    const waiting = library.save(gone);
    const removing = library.remove(gone);
    expect(library.isRemoved(gone)).toBe(true);
    storage.release();
    await Promise.all([writing, waiting, removing]);
    expect(await library.save(gone)).toBe("skipped");
    expect(await storedPage(gone.id)).toBeUndefined();
    expect(await storedPage(keep.id)).toBeDefined();
  });

  it("deleting a page while it is unsaved forgets it", async () => {
    const { library, storage } = setup();
    const id = ids();
    const pg = { id: id.page(0), bookId: id.book, text: "" };
    storage.state.failing = true;
    await library.save(pg);
    storage.state.failing = false;
    await library.remove(pg);
    expect(library.hasUnsaved()).toBe(false);
  });

  it("deleting a book discards its unsaved pages and blocks later writes to it", async () => {
    const { library, storage } = setup();
    const id = ids();
    const pg = { id: id.page(0), bookId: id.book, text: "" };
    const book = { id: id.book, title: "", pageIds: [pg.id] };
    await library.saveBook(book, [pg]);
    storage.state.failing = true;
    await library.save(pg);
    storage.state.failing = false;
    await library.removeBook(book, [pg]);
    expect(library.hasUnsaved()).toBe(false);
    expect(await library.saveBook(book, [pg])).toBe("skipped");
    expect(await storedBook(id.book)).toBeUndefined();
    expect(await storedPage(pg.id)).toBeUndefined();
  });

  it("writes for one book are stored in the order they were asked for", async () => {
    const { library, storage } = setup();
    const id = ids();
    const pg = { id: id.page(0), bookId: id.book, text: "one" };
    storage.hold();
    const first = library.save(pg);
    await settle();
    pg.text = "two";
    const second = library.save({ ...pg });
    storage.release();
    await settle();
    storage.release();
    await Promise.all([first, second]);
    expect(await storedPage(pg.id)).toMatchObject({ text: "two" });
  });

  it("skips a page whose encoding says it changed meanwhile", async () => {
    const storage = deviceStorage();
    const id = ids();
    const library = createLibrary<TestPage, TestBook, TestRecord>({
      store: storage.store, encode: async () => null, failed: () => {}, changed: () => {},
    });
    expect(await library.save({ id: id.page(0), bookId: id.book, text: "" })).toBe("skipped");
    expect(storage.state.writes).toBe(0);
  });

  it("a failed deletion is reported, and the page stays deleted", async () => {
    const failures: unknown[] = [];
    const id = ids();
    const library = createLibrary<TestPage, TestBook, TestRecord>({
      store: { write: async () => {}, remove: async () => { throw new Error("blocked"); } },
      encode: async pg => pg, failed: e => failures.push(e), changed: () => {},
    });
    const pg = { id: id.page(0), bookId: id.book, text: "" };
    await library.remove(pg);
    expect(failures).toHaveLength(1);
    expect(library.isRemoved(pg)).toBe(true);
  });
});
