// Speicher für Bücher und Seiten im Browser (IndexedDB). Bleibt auf dem Gerät.

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
