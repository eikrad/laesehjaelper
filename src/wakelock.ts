// Keep the screen on while a book is open (Screen Wake Lock API), so the page does not go dark
// while a child reads slowly. The browser releases the lock when the app is hidden, on low
// battery or in power-save mode, so ask again when the app is visible or touched. After 10 minutes
// without a touch, let the screen sleep (a tablet left lying with a book open); reading aloud
// counts as activity. Browsers without the API keep working unchanged.

/** The part of the Screen Wake Lock API used here (`navigator.wakeLock`). */
export interface ScreenLockApi {
  request(type: "screen"): Promise<ScreenLock>;
}
interface ScreenLock {
  readonly released: boolean;
  release(): Promise<void>;
}

/** Time without a touch, click or key press after which the screen may sleep. */
export const IDLE_MS = 10 * 60_000;

export function screenWakeLock(api: ScreenLockApi | undefined, visible: () => boolean, idleMs = IDLE_MS) {
  let open = false, idle = false, busy = false, requesting = false;
  let lock: ScreenLock | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const wanted = () => open && !idle && visible();

  async function letGo() {
    const held = lock;
    lock = null;
    if (held && !held.released) await held.release().catch(() => {});
  }

  /** Hold a lock exactly when one is wanted; at most one request at a time. */
  async function sync() {
    if (!api) return;
    if (!wanted()) return letGo();
    if (requesting || (lock && !lock.released)) return;
    requesting = true;
    try {
      lock = await api.request("screen");
    } catch {
      lock = null; // Refused, for example on low battery; the next touch asks again.
    } finally {
      requesting = false;
    }
    if (!wanted()) await letGo(); // The book was closed or the app hidden in the meantime.
  }

  function startIdle() {
    clearTimeout(timer);
    idle = false;
    timer = setTimeout(() => {
      if (busy) startIdle();
      else { idle = true; sync(); }
    }, idleMs);
  }

  /** A touch, click or key press: the 10 minutes start again. */
  function activity() {
    if (!open) return;
    startIdle();
    sync();
  }

  return {
    /** A book is open (true) or the bookshelf is shown (false). */
    keepOn(on: boolean) {
      open = on;
      if (on) startIdle(); else clearTimeout(timer);
      sync();
    },
    activity,
    /** Reading aloud keeps the screen on however long it takes; the 10 minutes start when it ends. */
    busy(on: boolean) {
      const ended = busy && !on;
      busy = on;
      if (ended) activity();
    },
    /** The app became visible or hidden. */
    visibilityChanged() { sync(); },
  };
}
