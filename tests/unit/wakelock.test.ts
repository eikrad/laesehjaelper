import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDLE_MS, screenWakeLock, type ScreenLockApi } from "../../src/wakelock";

/** A fake Screen Wake Lock API: requests wait until the test grants or refuses them. */
function fakeApi() {
  const locks: { released: boolean; release: () => Promise<void> }[] = [];
  const pending: { grant: () => void; refuse: () => void }[] = [];
  const api: ScreenLockApi = {
    request: () => new Promise((resolve, reject) => {
      pending.push({
        grant: () => {
          const lock = { released: false, release: async () => { lock.released = true; } };
          locks.push(lock); resolve(lock);
        },
        refuse: () => reject(new DOMException("Low battery", "NotAllowedError")),
      });
    }),
  };
  const held = () => locks.filter(l => !l.released).length;
  return { api, locks, pending, held };
}

const settle = () => vi.advanceTimersByTimeAsync(0);

describe("Keeping the screen on while a book is open", () => {
  let visible = true;
  beforeEach(() => { vi.useFakeTimers(); visible = true; });
  afterEach(() => { vi.useRealTimers(); });

  it("Takes a screen lock when a book opens and lets it go on the bookshelf", async () => {
    const f = fakeApi(), wake = screenWakeLock(f.api, () => visible);
    wake.keepOn(true);
    f.pending.shift()!.grant(); await settle();
    expect(f.held()).toBe(1);
    wake.keepOn(false); await settle();
    expect(f.held()).toBe(0);
  });

  it("Asks only once, however often the book is shown again", async () => {
    const f = fakeApi(), wake = screenWakeLock(f.api, () => visible);
    wake.keepOn(true); wake.keepOn(true); wake.activity();
    expect(f.pending).toHaveLength(1);
    f.pending.shift()!.grant(); await settle();
    wake.keepOn(true); wake.activity(); await settle();
    expect(f.pending).toHaveLength(0);
    expect(f.held()).toBe(1);
  });

  it("Lets go of a lock that is granted after the book was closed", async () => {
    const f = fakeApi(), wake = screenWakeLock(f.api, () => visible);
    wake.keepOn(true);
    wake.keepOn(false);
    f.pending.shift()!.grant(); await settle();
    expect(f.locks).toHaveLength(1);
    expect(f.held()).toBe(0);
  });

  it("Waits until the app is visible, and asks again when it comes back", async () => {
    const f = fakeApi(), wake = screenWakeLock(f.api, () => visible);
    visible = false;
    wake.keepOn(true);
    expect(f.pending).toHaveLength(0);
    visible = true; wake.visibilityChanged();
    f.pending.shift()!.grant(); await settle();
    // The browser releases the lock when the app is hidden.
    visible = false; f.locks[0].released = true; wake.visibilityChanged(); await settle();
    expect(f.pending).toHaveLength(0);
    visible = true; wake.visibilityChanged();
    f.pending.shift()!.grant(); await settle();
    expect(f.held()).toBe(1);
  });

  it("Keeps working when the browser refuses, and tries again at the next touch", async () => {
    const f = fakeApi(), wake = screenWakeLock(f.api, () => visible);
    wake.keepOn(true);
    f.pending.shift()!.refuse(); await settle();
    expect(f.held()).toBe(0);
    wake.activity();
    f.pending.shift()!.grant(); await settle();
    expect(f.held()).toBe(1);
  });

  it("Does nothing in browsers without the API", async () => {
    const wake = screenWakeLock(undefined, () => visible);
    expect(() => { wake.keepOn(true); wake.activity(); wake.busy(true); wake.visibilityChanged(); wake.keepOn(false); }).not.toThrow();
    await settle();
  });
});

describe("Letting the screen sleep when nobody reads", () => {
  let visible = true;
  beforeEach(() => { vi.useFakeTimers(); visible = true; });
  afterEach(() => { vi.useRealTimers(); });

  it("Lets go after 10 minutes without a touch and takes the lock again at the next touch", async () => {
    const f = fakeApi(), wake = screenWakeLock(f.api, () => visible);
    expect(IDLE_MS).toBe(10 * 60_000);
    wake.keepOn(true);
    f.pending.shift()!.grant(); await settle();
    await vi.advanceTimersByTimeAsync(IDLE_MS - 1000);
    wake.activity(); // a touch starts the 10 minutes again
    await vi.advanceTimersByTimeAsync(IDLE_MS - 1000);
    expect(f.held()).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(f.held()).toBe(0);
    wake.activity();
    f.pending.shift()!.grant(); await settle();
    expect(f.held()).toBe(1);
  });

  it("Keeps the screen on while a page is read aloud, however long it takes", async () => {
    const f = fakeApi(), wake = screenWakeLock(f.api, () => visible);
    wake.keepOn(true);
    f.pending.shift()!.grant(); await settle();
    wake.busy(true);
    await vi.advanceTimersByTimeAsync(3 * IDLE_MS);
    expect(f.held()).toBe(1);
    // The 10 minutes start when reading aloud ends.
    wake.busy(false);
    await vi.advanceTimersByTimeAsync(IDLE_MS - 1000);
    expect(f.held()).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(f.held()).toBe(0);
  });

  it("Does not count time on the bookshelf", async () => {
    const f = fakeApi(), wake = screenWakeLock(f.api, () => visible);
    wake.keepOn(true);
    f.pending.shift()!.grant(); await settle();
    wake.keepOn(false); await settle();
    await vi.advanceTimersByTimeAsync(2 * IDLE_MS);
    wake.activity();
    expect(f.pending).toHaveLength(0);
  });
});
