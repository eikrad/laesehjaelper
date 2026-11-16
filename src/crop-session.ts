import type { Frame } from "./types";

interface CropIO<Cv, Result> {
  ready: Promise<Cv | null>;
  detect(cv: Cv): Frame | null;
  preview(frame: Frame | null): void;
  waiting(step: "search" | "straighten"): void;
  make(frame: Frame | null, cv: Cv | null): Result;
  close(): void;
  error(error: unknown): void;
}

/**
 * Own one crop decision. Use locks the choice; cancellation is still allowed by the owner's signal.
 * Release the dialog once before making a result; crop failures reject result for the batch to handle.
 */
export function createCropSession<Cv, Result>(full: Frame, start: Frame | null, signal: AbortSignal, io: CropIO<Cv, Result>) {
  let phase: "open" | "search" | "straighten" | "closed" = "open";
  let frame = start || full;
  let adjusted = false, searched = false;
  const closed = () => phase === "closed";
  let resolve!: (result: Result | null) => void, reject!: (error: unknown) => void;
  const result = new Promise<Result | null>((r, fail) => { resolve = r; reject = fail; });
  const finish = (make: () => Result | null) => {
    if (phase === "closed") return;
    phase = "closed"; signal.removeEventListener("abort", abort); io.close();
    try { resolve(make()); } catch (error) { reject(error); }
  };
  const abort = () => finish(() => null);
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  const ready = io.ready.catch(error => { io.error(error); return null; });
  const search = ready.then(cv => {
    searched = true;
    if (closed() || phase === "straighten") return;
    let found: Frame | null = null;
    try { found = cv && !start && !adjusted ? io.detect(cv) : null; }
    catch (error) { io.error(error); }
    if (found) frame = found;
    io.preview(found);
  });
  return {
    result,
    async use() {
      if (phase !== "open") return;
      if (!start && !adjusted && !searched) {
        phase = "search"; io.waiting("search");
        await search;
        if (closed()) return;
      }
      const points = (f: Frame) => [...f.corners, ...f.mids];
      if (points(frame).every((p, i) => Math.hypot(p[0] - points(full)[i][0], p[1] - points(full)[i][1]) < 2)) {
        finish(() => io.make(null, null)); return;
      }
      phase = "straighten"; io.waiting("straighten");
      const chosen = frame, cv = await ready;
      if (closed()) return;
      finish(() => io.make(cv ? chosen : null, cv));
    },
    adjust(next: Frame) {
      if (phase !== "open" && phase !== "search") return;
      adjusted = true; frame = next;
    },
    whole: () => { if (phase === "open") finish(() => io.make(null, null)); },
    cancel: () => { if (phase === "open") finish(() => null); },
  };
}
