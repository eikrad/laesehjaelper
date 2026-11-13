// Browser storage for books and pages (IndexedDB). Data stays on the device.

type StoreName = "books" | "pages";

let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open("laesehjaelper", 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore("books", { keyPath: "id" });
        d.createObjectStore("pages", { keyPath: "id" }).createIndex("book", "bookId");
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    dbp.catch(() => { dbp = null; });
  }
  return dbp;
}

async function run<R>(store: StoreName, mode: IDBTransactionMode, fn: (o: IDBObjectStore) => IDBRequest<R>): Promise<R> {
  const d = await open();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => res(req.result);
    tx.onerror = () => rej(tx.error);
  });
}

export const DB = {
  /** Compare and replace in one transaction: another tab's edits and deletions always win. */
  replacePage: async <T extends { id: string; revision?: string }>(page: T, expectedRevision: string | undefined): Promise<boolean> => {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction("pages", "readwrite"), store = tx.objectStore("pages");
      let replaced = false;
      const r = store.get(page.id);
      r.onsuccess = () => {
        if (!r.result || r.result.revision !== expectedRevision) return;
        store.put(page); replaced = true;
      };
      tx.oncomplete = () => resolve(replaced);
      tx.onabort = () => reject(tx.error);
    });
  },
  putBook: async (book: object, pages: readonly object[]): Promise<void> => {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(["books", "pages"], "readwrite");
      let failure: unknown;
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(failure || tx.error);
      try {
        for (const page of pages) tx.objectStore("pages").put(page);
        tx.objectStore("books").put(book);
      } catch (e) {
        failure = e; tx.abort();
      }
    });
  },
  put: <T>(store: StoreName, value: T) => run(store, "readwrite", (o) => o.put(value)),
  del: (store: StoreName, key: string) => run(store, "readwrite", (o) => o.delete(key)),
  all: <T>(store: StoreName) => run(store, "readonly", (o) => o.getAll() as IDBRequest<T[]>),
  pagesOf: <T>(bookId: string) => run("pages", "readonly", (o) => o.index("book").getAll(bookId) as IDBRequest<T[]>),
};
