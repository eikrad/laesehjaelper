// The optional parent gate in front of the book tools: with it on, a deliberate two-second hold opens
// the entry, so a child's tap does not. This module owns the hold from start to finish: progress,
// opening once, cancelling, and what a plain press does. The caller translates pointer, key, focus
// and visibility events into start, cancel, press and close, and shows what the gate reports.

const HOLD_MS = 2000;

/** Time and animation frames: performance.now() and requestAnimationFrame() in the browser. */
export interface HoldClock {
  now(): number;
  frame(callback: () => void): number;
  cancel(id: number): void;
}

export interface ParentGateDeps {
  /** Is the gate switched on? Without it, a plain press opens and closes the entry. */
  enabled(): boolean;
  clock: HoldClock;
  /** Hold progress from 0 to 1 while holding; null when no hold is in progress. */
  progress(value: number | null): void;
  /** The entry opened or closed. */
  openChanged(open: boolean): void;
  /** A plain press on the closed, gated entry: explain that it needs a hold. */
  hint(): void;
}

export interface ParentGate {
  readonly open: boolean;
  readonly holding: boolean;
  /** A pointer or key went down on the entry. Repeats during a hold do not restart it. */
  start(): void;
  /** The hold was interrupted: released, left the button, lost capture, blur, hidden page. */
  cancel(): void;
  /** A finished click or key release on the entry. The release of a completed hold does nothing. */
  press(): void;
  /** Close the entry from outside (Escape, a press elsewhere, leaving the view) and end any hold. */
  close(): void;
}

export function createParentGate(deps: ParentGateDeps): ParentGate {
  const { clock } = deps;
  let open = false, started: number | null = null, frame = 0;
  // The click or key release that ends a completed hold must not close the entry it just opened.
  let justOpened = false;

  function stop() {
    if (started === null) return;
    clock.cancel(frame); started = null;
    deps.progress(null);
  }
  function setOpen(value: boolean) {
    if (open === value) return;
    open = value; deps.openChanged(value);
  }
  function tick() {
    if (started === null) return;
    const progress = Math.max(0, Math.min(1, (clock.now() - started) / HOLD_MS));
    if (progress < 1) { deps.progress(progress); frame = clock.frame(tick); return; }
    stop(); justOpened = true; setOpen(true);
  }

  return {
    get open() { return open; },
    get holding() { return started !== null; },
    start() {
      if (!deps.enabled()) return;
      // A new press on the open entry: its release closes it, as a plain press does.
      if (open) { justOpened = false; return; }
      if (started !== null) return;
      justOpened = false; started = clock.now(); tick();
    },
    cancel: stop,
    press() {
      if (justOpened) { justOpened = false; return; }
      if (open) setOpen(false);
      else if (deps.enabled()) deps.hint();
      else setOpen(true);
    },
    close() { stop(); justOpened = false; setOpen(false); },
  };
}
