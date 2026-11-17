import { describe, expect, it } from "vitest";
import { createCropSession } from "../../src/crop-session";
import type { Frame } from "../../src/types";
import { frameFromCorners } from "../../src/pagedetect";

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((r, fail) => { resolve = r; reject = fail; });
  return { promise, resolve, reject };
}
const full = frameFromCorners([[0, 0], [100, 0], [100, 100], [0, 100]]);

const suggestion = frameFromCorners([[10, 10], [90, 10], [90, 90], [10, 90]]);
function dialog() {
  const ready = deferred<object | null>(), previewed = deferred<Frame | null>();
  const previews: (Frame | null)[] = [], waits: string[] = [], made: (Frame | null)[] = [], errors: unknown[] = [];
  let closes = 0;
  return {
    ready, previewed, previews, waits, made, errors, closes: () => closes,
    io: {
      ready: ready.promise, detect: (_cv: object): Frame | null => suggestion,
      preview: (frame: Frame | null) => { previews.push(frame); previewed.resolve(frame); },
      waiting: (step: "search" | "straighten") => { waits.push(step); },
      make: (frame: Frame | null, _cv: object | null) => { made.push(frame); return frame ? "cropped photo" : "whole photo"; },
      close: () => { closes++; }, error: (error: unknown) => { errors.push(error); },
    },
  };
}

describe("Crop sessions", () => {
  it("Uses the whole photo immediately and releases its dialog once, without waiting for detection", async () => {
    const ready = deferred<object | null>();
    let closes = 0;
    const previews: unknown[] = [];
    const session = createCropSession(full, null, new AbortController().signal, {
      ready: ready.promise, detect: () => full,
      preview: frame => { previews.push(frame); }, waiting: () => {},
      make: () => "whole photo", close: () => { closes++; }, error: () => {},
    });
    session.whole();
    expect(await session.result).toBe("whole photo");
    session.whole(); session.cancel();
    ready.resolve({});
    await ready.promise;
    expect(closes).toBe(1);
    expect(previews).toEqual([]);
  });
  it("Use waits for the untouched frame's suggestion and makes one crop", async () => {
    const view = dialog();
    const session = createCropSession(full, null, new AbortController().signal, view.io);
    session.use();
    expect(view.waits).toEqual(["search"]);
    session.whole(); session.cancel(); session.use();
    view.ready.resolve({});
    expect(await session.result).toBe("cropped photo");
    expect(view.previews).toEqual([suggestion]);
    expect(view.made).toEqual([suggestion]);
    expect(view.closes()).toBe(1);
  });
  it("Superseding a session while Use waits settles it and ignores late detection", async () => {
    const view = dialog(), controller = new AbortController();
    const session = createCropSession(full, null, controller.signal, view.io);
    session.use();
    controller.abort();
    expect(await session.result).toBeNull();
    view.ready.resolve({});
    await session.use();
    session.whole(); session.cancel(); controller.abort();
    expect(view.made).toEqual([]);
    expect(view.previews).toEqual([]);
    expect(view.closes()).toBe(1);
  });
  it.each(["saved", "adjusted"])("Use keeps a %s frame and waits only for straightening", async source => {
    const view = dialog();
    const session = createCropSession(full, source === "saved" ? suggestion : null, new AbortController().signal, view.io);
    if (source === "adjusted") session.adjust(suggestion);
    session.use();
    expect(view.waits).toEqual(["straighten"]);
    session.cancel(); session.whole();
    view.ready.resolve({});
    expect(await session.result).toBe("cropped photo");
    expect(view.made).toEqual([suggestion]);
    expect(view.previews).toEqual([]);
    expect(view.closes()).toBe(1);
  });
  it.each(["unavailable", "not found"])("Uses the whole photo when page detection is %s", async outcome => {
    const view = dialog();
    view.io.detect = () => null;
    const session = createCropSession(full, null, new AbortController().signal, view.io);
    session.use();
    view.ready.resolve(outcome === "unavailable" ? null : {});
    expect(await session.result).toBe("whole photo");
    expect(view.made).toEqual([null]);
    expect(view.previews).toEqual([null]);
  });
  it.each(["loading", "detection"])("Falls back to the whole photo after a %s failure", async step => {
    const view = dialog(), error = new Error("Detection failed");
    if (step === "detection") view.io.detect = () => { throw error; };
    const session = createCropSession(full, null, new AbortController().signal, view.io);
    session.use();
    if (step === "loading") view.ready.reject(error); else view.ready.resolve({});
    expect(await session.result).toBe("whole photo");
    expect(view.errors).toEqual([error]);
    expect(view.closes()).toBe(1);
  });
  it.each(["whole", "use"] as const)("Settles a failed %s crop and releases its dialog once", async choice => {
    const view = dialog(), controller = new AbortController(), error = new Error("Cannot prepare crop");
    view.io.make = () => { throw error; };
    const session = createCropSession(full, suggestion, controller.signal, view.io);
    const outcome = expect(session.result).rejects.toThrow("Cannot prepare crop");
    session[choice]();
    view.ready.resolve({});
    await outcome;
    controller.abort(); session.cancel(); session.whole();
    expect(view.closes()).toBe(1);
  });
  it.each(["cancel", "abort", "already aborted"])("Releases an unanswered session on %s without making a page", async choice => {
    const view = dialog(), controller = new AbortController();
    if (choice === "already aborted") controller.abort();
    const session = createCropSession(full, null, controller.signal, view.io);
    if (choice === "cancel") session.cancel(); else controller.abort();
    expect(await session.result).toBeNull();
    session.adjust(suggestion); await session.use(); session.whole();
    view.ready.resolve({});
    await view.ready.promise;
    expect(view.made).toEqual([]);
    expect(view.previews).toEqual([]);
    expect(view.closes()).toBe(1);
  });

  it("Uses the completed suggestion without waiting for another page search", async () => {
    const view = dialog();
    const session = createCropSession(full, null, new AbortController().signal, view.io);
    view.ready.resolve({});
    await view.previewed.promise;
    await session.use();
    expect(await session.result).toBe("cropped photo");
    expect(view.made).toEqual([suggestion]);
    expect(view.waits).not.toContain("search");
  });

  it("Keeps a manual adjustment made while Use is waiting for detection", async () => {
    const view = dialog();
    const manual = frameFromCorners([[20, 20], [80, 20], [80, 80], [20, 80]]);
    const session = createCropSession(full, null, new AbortController().signal, view.io);
    session.use(); session.adjust(manual);
    view.ready.resolve({});
    expect(await session.result).toBe("cropped photo");
    expect(view.made).toEqual([manual]);
    expect(view.previews).toEqual([null]);
  });

  it("Locks a chosen frame while straightening and ignores later adjustments", async () => {
    const view = dialog(), controller = new AbortController();
    const session = createCropSession(full, suggestion, controller.signal, view.io);
    session.use(); session.adjust(full);
    view.ready.resolve({});
    expect(await session.result).toBe("cropped photo");
    expect(view.made).toEqual([suggestion]);
  });

  it("Superseding a session waiting for straightening settles without making a page", async () => {
    const view = dialog(), controller = new AbortController();
    const session = createCropSession(full, suggestion, controller.signal, view.io);
    const work = session.use(); controller.abort();
    expect(await session.result).toBeNull();
    view.ready.resolve({}); await work;
    expect(view.made).toEqual([]);
    expect(view.closes()).toBe(1);
  });
  it("Treats a nearly full frame as the whole photo without waiting for OpenCV", async () => {
    const view = dialog();
    const nearFull = frameFromCorners([[1, 0], [100, 1], [100, 100], [0, 100]]);
    const session = createCropSession(full, nearFull, new AbortController().signal, view.io);
    session.use();
    expect(await session.result).toBe("whole photo");
    expect(view.waits).toEqual([]);
  });

  it("Straightens a curved edge even when the four corners are the full photo", async () => {
    const view = dialog(), curved = frameFromCorners(full.corners);
    curved.mids[0] = [50, 5];
    const session = createCropSession(full, curved, new AbortController().signal, view.io);
    session.use(); view.ready.resolve({});
    expect(await session.result).toBe("cropped photo");
    expect(view.made).toEqual([curved]);
  });

  it("Uses the whole photo if OpenCV cannot straighten a saved frame", async () => {
    const view = dialog();
    const session = createCropSession(full, suggestion, new AbortController().signal, view.io);
    session.use(); view.ready.resolve(null);
    expect(await session.result).toBe("whole photo");
    expect(view.made).toEqual([null]);
  });
});
