import { describe, expect, it } from "vitest";
import { PhotoBatches } from "../../src/photo-batch";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}

describe("Photo acceptance", () => {
  it("Prepares a photo batch in order and accepts its pages into the originating book", async () => {
    const books: Record<string, string[]> = { a: [] };
    const errors: unknown[] = [];
    const batches = new PhotoBatches({
      load: async (file: string) => `photo:${file}`,
      crop: async (photo: string) => `${photo}:cropped`,
      accept: async (owner: string, _photo: string, crop: string) => { books[owner].push(crop); },
      error: (error: unknown) => { errors.push(error); },
    });

    expect(await batches.start("a", ["first", "second"])).toEqual({ status: "complete", accepted: 2 });
    expect(books.a).toEqual(["photo:first:cropped", "photo:second:cropped"]);
    expect(errors).toEqual([]);
  });

  it("Skips a cancelled crop and prepares the remaining photos", async () => {
    const pages: string[] = [];
    const batches = new PhotoBatches({
      load: async (file: string) => file,
      crop: async (photo: string) => photo === "skipped" ? null : photo,
      accept: async (_owner: string, _photo: string, crop: string) => { pages.push(crop); },
      error: () => {},
    });
    expect(await batches.start("a", ["skipped", "accepted"])).toEqual({ status: "complete", accepted: 1 });
    expect(pages).toEqual(["accepted"]);
  });

  it("A newer selection replaces unaccepted photos without adding them to either book", async () => {
    const decoding = deferred<string>();
    const books: Record<string, string[]> = { a: [], b: [] };
    const batches = new PhotoBatches({
      load: (file: string) => file === "old" ? decoding.promise : Promise.resolve(file),
      crop: async (photo: string) => photo,
      accept: async (owner: string, _photo: string, crop: string) => { books[owner].push(crop); },
      error: () => {},
    });

    const old = batches.start("a", ["old", "unaccepted"]);
    expect(await batches.start("b", ["new"])).toEqual({ status: "complete", accepted: 1 });
    decoding.resolve("old");
    expect(await old).toEqual({ status: "cancelled", accepted: 0 });
    expect(books).toEqual({ a: [], b: ["new"] });
  });

  it("Leaving during cropping prevents acceptance of the cropped photo", async () => {
    const cropping = deferred<string>();
    const opened = deferred<void>();
    const pages: string[] = [];
    const batches = new PhotoBatches({
      load: async (file: string) => file,
      crop: () => { opened.resolve(); return cropping.promise; },
      accept: async (_owner: string, _photo: string, crop: string) => { pages.push(crop); },
      error: () => {},
    });
    const batch = batches.start("a", ["first"]);
    await opened.promise;
    batches.cancel();
    cropping.resolve("cropped");
    expect(await batch).toEqual({ status: "cancelled", accepted: 0 });
    expect(pages).toEqual([]);
  });

  it("Finishes accepted saves to their originating book after leaving or starting another batch", async () => {
    const storing = deferred<void>();
    const accepted = deferred<void>();
    const books: Record<string, string[]> = { a: [], b: [] };
    const decoded: string[] = [];
    const batches = new PhotoBatches({
      load: async (file: string) => { decoded.push(file); return file; },
      crop: async (photo: string) => photo,
      accept: async (owner: string, _photo: string, crop: string) => {
        if (owner === "a") { accepted.resolve(); await storing.promise; }
        books[owner].push(crop);
      },
      error: () => {},
    });
    const first = batches.start("a", ["accepted", "unaccepted"]);
    await accepted.promise;
    batches.cancel();
    await batches.start("b", ["new"]);
    storing.resolve();
    expect(await first).toEqual({ status: "cancelled", accepted: 1 });
    expect(books).toEqual({ a: ["accepted"], b: ["new"] });
    expect(decoded).toEqual(["accepted", "new"]);
  });

  it("Reports a failed save while retaining acceptance and continuing the remaining photos", async () => {
    const accepted: string[] = [], stored: string[] = [];
    const failure = new Error("Device storage is full");
    const errors: unknown[] = [];
    const batches = new PhotoBatches({
      load: async (file: string) => file,
      crop: async (photo: string) => photo,
      accept: async (_owner: string, _photo: string, crop: string) => {
        accepted.push(crop);
        if (crop === "first") throw failure;
        stored.push(crop);
      },
      error: (error: unknown) => { errors.push(error); },
    });
    expect(await batches.start("a", ["first", "second"])).toEqual({ status: "complete", accepted: 2 });
    expect(accepted).toEqual(["first", "second"]);
    expect(stored).toEqual(["second"]);
    expect(errors).toEqual([failure]);
  });

  it("Closes an unfinished crop through its adapter when a selection is replaced", async () => {
    const opened = deferred<void>();
    const errors: unknown[] = [];
    const books: Record<string, string[]> = { a: [] };
    let cropOpen = false;
    const batches = new PhotoBatches({
      load: async (file: string) => file,
      crop: (photo: string, _position: { index: number; total: number }, signal: AbortSignal) => {
        if (photo === "new") return Promise.resolve(photo);
        cropOpen = true; opened.resolve();
        return new Promise<string>((_resolve, reject) => {
          signal.addEventListener("abort", () => { cropOpen = false; reject(new Error("Crop cancelled")); }, { once: true });
        });
      },
      accept: async (owner: string, _photo: string, crop: string) => { books[owner].push(crop); },
      error: (error: unknown) => { errors.push(error); },
    });
    const old = batches.start("a", ["old"]);
    await opened.promise;
    await batches.start("a", ["new"]);
    expect(cropOpen).toBe(false);
    expect(await old).toEqual({ status: "cancelled", accepted: 0 });
    expect(books.a).toEqual(["new"]);
    expect(errors).toEqual([]);
  });

  it("Continues after a photo cannot be prepared without accepting the failed photo", async () => {
    const failure = new Error("Unreadable photo");
    const pages: string[] = [];
    const errors: unknown[] = [];
    const batches = new PhotoBatches({
      load: async (file: string) => { if (file === "broken") throw failure; return file; },
      crop: async (photo: string) => photo,
      accept: async (_owner: string, _photo: string, crop: string) => { pages.push(crop); },
      error: (error: unknown) => { errors.push(error); },
    });
    expect(await batches.start("a", ["broken", "readable"])).toEqual({ status: "complete", accepted: 1 });
    expect(pages).toEqual(["readable"]);
    expect(errors).toEqual([failure]);
  });

  it("Finishing an older save does not end the lifetime of the newer batch", async () => {
    const storing = deferred<void>(), accepted = deferred<void>(), decoding = deferred<string>();
    const stored: string[] = [];
    const batches = new PhotoBatches({
      load: (file: string) => file === "new" ? decoding.promise : Promise.resolve(file),
      crop: async (photo: string) => photo,
      accept: async (_owner: string, _photo: string, crop: string) => {
        accepted.resolve(); await storing.promise; stored.push(crop);
      },
      error: () => {},
    });
    const old = batches.start("a", ["old"]);
    await accepted.promise;
    const newer = batches.start("a", ["new"]);
    storing.resolve();
    expect(await old).toEqual({ status: "cancelled", accepted: 1 });
    batches.cancel();
    decoding.resolve("new");
    expect(await newer).toEqual({ status: "cancelled", accepted: 0 });
    expect(stored).toEqual(["old"]);
  });
});
