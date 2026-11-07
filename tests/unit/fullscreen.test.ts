import { describe, expect, it } from "vitest";
import { readingFullscreen, type FullscreenHost } from "../../src/fullscreen";

/** A fake Fullscreen API: requests wait until the test grants or refuses them. */
function fakeHost(over: Partial<Pick<FullscreenHost, "enabled" | "installed">> = {}) {
  let element: Element | null = null;
  const pending: { grant: () => void; refuse: () => void }[] = [];
  const calls = { requests: 0, exits: 0 };
  const host: FullscreenHost = {
    enabled: () => true,
    installed: () => false,
    ...over,
    element: () => element,
    request: () => {
      calls.requests++;
      return new Promise<void>((resolve, reject) => {
        pending.push({ grant: () => { element = {} as Element; resolve(); }, refuse: () => reject(new TypeError("Permissions check failed")) });
      });
    },
    exit: async () => { calls.exits++; element = null; },
  };
  return { host, pending, calls, isFull: () => element !== null, systemExit: () => { element = null; } };
}
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe("Reading mode on the whole screen", () => {
  it("Asks for fullscreen when reading mode starts and leaves it when reading mode ends", async () => {
    const f = fakeHost(), fs = readingFullscreen(f.host, () => {});
    fs.enter();
    f.pending.shift()!.grant(); await settle();
    expect(f.isFull()).toBe(true);
    fs.leave(); await settle();
    expect(f.isFull()).toBe(false);
  });

  it("Ends reading mode when the system gesture leaves fullscreen, but not when the app leaves it", async () => {
    let left = 0;
    const f = fakeHost(), fs = readingFullscreen(f.host, () => { left++; });
    fs.enter();
    f.pending.shift()!.grant(); await settle();
    fs.changed();
    expect(left).toBe(0); // entering fullscreen also fires a change
    f.systemExit(); fs.changed();
    expect(left).toBe(1);
    fs.enter();
    f.pending.shift()!.grant(); await settle();
    fs.leave(); await settle(); fs.changed();
    expect(left).toBe(1);
  });

  it("Keeps the current reading mode without the API (iPhone) and in the installed app", () => {
    for (const over of [{ enabled: () => false }, { installed: () => true }]) {
      const f = fakeHost(over), fs = readingFullscreen(f.host, () => {});
      fs.enter(); fs.leave(); fs.changed();
      expect(f.calls).toEqual({ requests: 0, exits: 0 });
    }
  });

  it("Leaves a fullscreen that the user started alone", async () => {
    const f = fakeHost(), fs = readingFullscreen(f.host, () => {});
    // For example F11 or the browser's own fullscreen before reading mode starts.
    f.host.request(); f.pending.shift()!.grant(); await settle();
    f.calls.requests = 0;
    fs.enter(); fs.leave(); await settle();
    expect(f.calls).toEqual({ requests: 0, exits: 0 });
    expect(f.isFull()).toBe(true);
  });

  it("Leaves fullscreen that is granted after reading mode already ended", async () => {
    const f = fakeHost(), fs = readingFullscreen(f.host, () => {});
    fs.enter();
    fs.leave();
    f.pending.shift()!.grant(); await settle();
    expect(f.isFull()).toBe(false);
  });

  it("Stays in reading mode without fullscreen when the browser refuses", async () => {
    let left = 0;
    const f = fakeHost(), fs = readingFullscreen(f.host, () => { left++; });
    fs.enter();
    f.pending.shift()!.refuse(); await settle();
    fs.changed(); fs.leave(); await settle();
    expect(left).toBe(0);
    expect(f.calls.exits).toBe(0);
  });
});
