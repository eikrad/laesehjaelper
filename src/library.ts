// The library: books and pages kept on this device, and what has not reached device storage yet.
//
// Every write for a book is one transaction that also carries the book's unsaved pages and, if it
// is unsaved, its book record. So a later successful save of a book saves what failed before, and a
// book record is never stored without the pages it lists. Writes for one book run one after
// another, in the order they were asked for. Deletion wins: a deleted page or book is never written
// again, not even by a save that was already waiting.
//
// A page whose latest write failed is an unsaved page (GLOSSARY.md). It stays in memory for the
// session, attached to its book, until a later write of that book succeeds or it is deleted.

export type SaveResult = "saved" | "unsaved" | "skipped";

/** Device storage, as the library uses it. */
export interface LibraryStore<B, R> {
  /** Store the page records and, if given, the book record, all in one transaction. */
  write(book: B | null, pages: readonly R[]): Promise<void>;
  /** Delete page records and, if given, the book record. */
  remove(pageIds: readonly string[], bookId?: string): Promise<void>;
}

export interface LibraryDeps<P, B, R> {
  store: LibraryStore<B, R>;
  /** The record to store for a page; null when the page changed meanwhile and a newer save follows. */
  encode(pg: P, bookId: string): Promise<R | null>;
  /** A write or deletion failed. */
  failed(error: unknown): void;
  /** The unsaved state of a book changed. */
  changed(bookId: string): void;
}

export interface Unsaved<P, B> {
  /** The latest book record that failed to save, or null when the stored one is current. */
  book: B | null;
  /** Unsaved pages, in the order they first failed. */
  pages: P[];
}

export interface Library<P, B> {
  /** Save a page of its book (`bookId`). */
  save(pg: P): Promise<SaveResult>;
  /** Save the book record as it is now, together with the given pages. */
  saveBook(book: B, pages?: readonly P[]): Promise<SaveResult>;
  /** Try once more to save a book's unsaved pages and record. */
  retry(bookId: string): Promise<SaveResult>;
  remove(pg: P): Promise<void>;
  removeBook(book: B, pages: readonly P[]): Promise<void>;
  isRemoved(pg: P): boolean;
  isUnsaved(pg: P): boolean;
  /** What of a book has not been saved, or undefined when everything is saved. */
  unsaved(bookId: string): Unsaved<P, B> | undefined;
  unsavedBookIds(): string[];
  hasUnsaved(): boolean;
}

interface PageLike { id?: string; bookId?: string | null }
interface BookLike { id: string; pageIds: string[] }

export function createLibrary<P extends PageLike, B extends BookLike, R>(deps: LibraryDeps<P, B, R>): Library<P, B> {
  const unsaved = new Map<string, Unsaved<P, B>>();
  const removedPages = new Set<string>();
  const removedBooks = new Set<string>();
  const queues = new Map<string, Promise<unknown>>();

  const isRemoved = (pg: P) => !!pg.id && removedPages.has(pg.id);

  /** Run after everything already asked for this book. */
  function queued<T>(bookId: string, job: () => Promise<T>): Promise<T> {
    const next = (queues.get(bookId) ?? Promise.resolve()).then(job);
    const tail = next.catch(() => {});
    queues.set(bookId, tail);
    tail.then(() => { if (queues.get(bookId) === tail) queues.delete(bookId); });
    return next;
  }

  function entry(bookId: string): Unsaved<P, B> {
    let e = unsaved.get(bookId);
    if (!e) unsaved.set(bookId, e = { book: null, pages: [] });
    return e;
  }

  /** Forget saved or deleted pages and, once a book record is stored, the unsaved older one. */
  function forget(bookId: string, pages: readonly P[], recordSaved: boolean): boolean {
    const e = unsaved.get(bookId);
    if (!e) return false;
    const before = e.pages.length + (e.book ? 1 : 0);
    e.pages = e.pages.filter(p => !pages.includes(p) && !isRemoved(p));
    if (recordSaved) e.book = null;
    if (!e.pages.length && !e.book) unsaved.delete(bookId);
    return before !== e.pages.length + (e.book ? 1 : 0);
  }

  async function write(bookId: string, book: B | null, asked: readonly P[]): Promise<SaveResult> {
    if (removedBooks.has(bookId)) return "skipped";
    const e = unsaved.get(bookId);
    // A newer book record replaces an unsaved older one.
    const record = book ?? e?.book ?? null;
    const pages = [...new Set([...asked, ...(e?.pages ?? [])])].filter(p => p.id && !isRemoved(p));
    const encoded: { pg: P; rec: R }[] = [];
    for (const pg of pages) {
      const rec = await deps.encode(pg, bookId);
      if (rec !== null) encoded.push({ pg, rec });
    }
    // Pages or the book may have been deleted while their records were being made.
    if (removedBooks.has(bookId)) return "skipped";
    const written = encoded.filter(({ pg }) => !isRemoved(pg));
    if (!record && !written.length) return "skipped";
    try {
      await deps.store.write(record, written.map(w => w.rec));
    } catch (err) {
      if (removedBooks.has(bookId)) return "skipped";
      const u = entry(bookId);
      for (const { pg } of written) if (!u.pages.includes(pg) && !isRemoved(pg)) u.pages.push(pg);
      if (record) u.book = record;
      deps.failed(err);
      deps.changed(bookId);
      return "unsaved";
    }
    // Writes for a book run in order, so a stored record is never older than an unsaved one.
    if (forget(bookId, written.map(w => w.pg), !!record)) deps.changed(bookId);
    return "saved";
  }

  return {
    save(pg) {
      const bookId = pg.bookId;
      if (!bookId || !pg.id || isRemoved(pg) || removedBooks.has(bookId)) return Promise.resolve("skipped");
      return queued(bookId, () => write(bookId, null, [pg]));
    },
    saveBook(book, pages = []) {
      if (removedBooks.has(book.id)) return Promise.resolve("skipped");
      const snapshot = { ...book, pageIds: [...book.pageIds] };
      return queued(book.id, () => write(book.id, snapshot, pages));
    },
    retry(bookId) {
      return queued(bookId, () => write(bookId, null, []));
    },
    remove(pg) {
      if (!pg.id) return Promise.resolve();
      const id = pg.id, bookId = pg.bookId;
      removedPages.add(id);
      if (bookId && forget(bookId, [pg], false)) deps.changed(bookId);
      const del = () => deps.store.remove([id]).catch(deps.failed);
      return bookId ? queued(bookId, del) : del();
    },
    removeBook(book, pages) {
      removedBooks.add(book.id);
      const ids = new Set(book.pageIds);
      for (const pg of [...pages, ...(unsaved.get(book.id)?.pages ?? [])]) if (pg.id) { ids.add(pg.id); removedPages.add(pg.id); }
      if (unsaved.delete(book.id)) deps.changed(book.id);
      return queued(book.id, () => deps.store.remove([...ids], book.id).catch(deps.failed));
    },
    isRemoved,
    isUnsaved: pg => !!pg.bookId && !!unsaved.get(pg.bookId)?.pages.includes(pg),
    unsaved: bookId => {
      const e = unsaved.get(bookId);
      return e && { book: e.book, pages: [...e.pages] };
    },
    unsavedBookIds: () => [...unsaved.keys()],
    hasUnsaved: () => unsaved.size > 0,
  };
}
