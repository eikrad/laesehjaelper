import { describe, expect, it } from "vitest";
import { createRecognitionScheduler } from "../../src/recognition-scheduler";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}

describe("Recognition scheduling", () => {
  it("Keeps queued pages in order and retains them until recognition finishes", async () => {
    const first = deferred<void>(), started = deferred<void>();
    const recognised: string[] = [], released: string[] = [];
    const scheduler = createRecognitionScheduler({
      ready: () => true,
      process: async (page: string) => {
        if (page === "first") { started.resolve(); await first.promise; }
        recognised.push(page);
      },
      released: (page: string) => { released.push(page); },
      failed: () => {},
    });
    scheduler.enqueue("first"); scheduler.enqueue("second");
    expect(recognised).toEqual([]);
    const running = scheduler.run();
    await started.promise;
    expect(scheduler.pages()).toEqual(["first", "second"]);
    expect(recognised).toEqual([]);
    first.resolve(); await running;
    expect(recognised).toEqual(["first", "second"]);
    expect(released).toEqual(["first", "second"]);
    expect(scheduler.pages()).toEqual([]);
  });


  it("Shares one execution slot between page and book jobs without splitting their two passes", async () => {
    const first = deferred<void>(), started = deferred<void>();
    const passes: string[] = [];
    const scheduler = createRecognitionScheduler({
      ready: () => true,
      process: async (page: string) => {
        passes.push(`${page}:first`);
        if (page === "a") { started.resolve(); await first.promise; }
        passes.push(`${page}:second`);
      },
      released: () => {}, failed: () => {},
    });
    scheduler.enqueue("a"); scheduler.enqueue("b");
    const running = scheduler.run();
    await started.promise;
    const book = scheduler.exclusive(async () => {
      passes.push("book:first", "book:second");
      return "stored";
    });
    await scheduler.run(); // A second start must not open a second execution slot.
    expect(passes).toEqual(["a:first"]);
    first.resolve();
    expect(await book).toBe("stored");
    await running;
    expect(passes).toEqual(["a:first", "a:second", "book:first", "book:second", "b:first", "b:second"]);
  });

  it("Reports a failed page, releases it and continues later work and future runs", async () => {
    const failure = new Error("Worker unavailable");
    const recognised: string[] = [], released: string[] = [], errors: unknown[] = [];
    const scheduler = createRecognitionScheduler({
      ready: () => true,
      process: async (page: string) => { if (page === "broken") throw failure; recognised.push(page); },
      released: (page: string) => { released.push(page); },
      failed: (error: unknown) => { errors.push(error); },
    });
    scheduler.enqueue("broken"); scheduler.enqueue("next");
    await expect(scheduler.run()).resolves.toBeUndefined();
    expect(errors).toEqual([failure]);
    expect(released).toEqual(["broken", "next"]);
    expect(recognised).toEqual(["next"]);
    expect(scheduler.pages()).toEqual([]);
    scheduler.enqueue("later"); await scheduler.run();
    expect(recognised).toEqual(["next", "later"]);
  });


  it("Skips pages that are deleted or already recognised when their turn arrives", async () => {
    const first = deferred<void>(), started = deferred<void>();
    const states: Record<string, string> = { a: "wait", b: "wait", c: "wait", d: "wait" };
    const recognised: string[] = [], released: string[] = [];
    const scheduler = createRecognitionScheduler({
      ready: (page: string) => states[page] === "wait",
      process: async (page: string) => {
        if (page === "a") { started.resolve(); await first.promise; }
        states[page] = "done"; recognised.push(page);
      },
      released: (page: string) => { released.push(page); }, failed: () => {},
    });
    for (const page of ["a", "b", "c", "d"]) scheduler.enqueue(page);
    const running = scheduler.run(); await started.promise;
    states.b = "deleted"; states.c = "done";
    first.resolve(); await running;
    expect(recognised).toEqual(["a", "d"]);
    expect(released).toEqual(["a", "b", "c", "d"]);
  });


  it("Discards waiting work without interrupting the active page", async () => {
    const first = deferred<void>(), started = deferred<void>();
    const recognised: string[] = [], released: string[] = [];
    const scheduler = createRecognitionScheduler({
      ready: () => true,
      process: async (page: string) => {
        if (page === "a") { started.resolve(); await first.promise; }
        recognised.push(page);
      },
      released: (page: string) => { released.push(page); }, failed: () => {},
    });
    scheduler.enqueue("a"); scheduler.enqueue("b"); scheduler.enqueue("b");
    const running = scheduler.run(); await started.promise;
    scheduler.discard("a"); scheduler.discard("b"); scheduler.enqueue("c");
    expect(scheduler.pages()).toEqual(["a", "c"]);
    first.resolve(); await running;
    expect(recognised).toEqual(["a", "c"]);
    expect(released).toEqual(["a", "c"]);
  });


  it("Keeps one waiting attempt for a replaced active page and retains it until that attempt finishes", async () => {
    const old = deferred<void>(), oldStarted = deferred<void>();
    const replacement = deferred<void>(), replacementStarted = deferred<void>();
    const recognised: string[] = [], released: string[] = [];
    let version = "old";
    const scheduler = createRecognitionScheduler({
      ready: () => true,
      process: async (_page: string) => {
        const picture = version;
        if (picture === "old") { oldStarted.resolve(); await old.promise; }
        else { replacementStarted.resolve(); await replacement.promise; }
        recognised.push(picture);
      },
      released: (page: string) => { released.push(page); }, failed: () => {},
    });
    scheduler.enqueue("photo"); scheduler.enqueue("photo");
    expect(scheduler.pages()).toEqual(["photo"]);
    const running = scheduler.run(); await oldStarted.promise;
    version = "replacement";
    scheduler.enqueue("photo"); scheduler.enqueue("photo");
    expect(scheduler.pages()).toEqual(["photo", "photo"]);
    old.resolve(); await replacementStarted.promise;
    expect(released).toEqual([]);
    replacement.resolve(); await running;
    expect(recognised).toEqual(["old", "replacement"]);
    expect(released).toEqual(["photo"]);
  });


  it("Retains pages waiting behind a book job and continues when that job fails", async () => {
    const bookStarted = deferred<void>(), finishBook = deferred<void>();
    const failure = new Error("Book job failed");
    const recognised: string[] = [];
    const scheduler = createRecognitionScheduler({
      ready: () => true,
      process: async (page: string) => { recognised.push(page); },
      released: () => {}, failed: () => {},
    });
    const book = scheduler.exclusive(async () => {
      bookStarted.resolve(); await finishBook.promise; throw failure;
    });
    const failed = expect(book).rejects.toBe(failure);
    await bookStarted.promise;
    scheduler.enqueue("a");
    const running = scheduler.run();
    scheduler.enqueue("b");
    expect(scheduler.pages()).toEqual(["a", "b"]);
    expect(recognised).toEqual([]);
    finishBook.resolve(); await failed; await running;
    expect(recognised).toEqual(["a", "b"]);
    expect(scheduler.pages()).toEqual([]);
    await scheduler.run(); // An empty run must leave future work usable.
    scheduler.enqueue("c"); await scheduler.run();
    expect(recognised).toEqual(["a", "b", "c"]);
  });

});
