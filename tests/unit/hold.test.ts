import { describe, expect, it } from "vitest";
import { createParentGate, type HoldClock } from "../../src/hold";

/** Time that only moves when a test says so, with animation frames at 16 ms. */
function testClock() {
  let now = 0, next = 1;
  const frames = new Map<number, () => void>();
  const clock: HoldClock = {
    now: () => now,
    frame(cb) { const id = next++; frames.set(id, cb); return id; },
    cancel(id) { frames.delete(id); },
  };
  return {
    clock,
    advance(ms: number) {
      const end = now + ms;
      while (now < end) {
        now = Math.min(end, now + 16);
        const due = [...frames.values()]; frames.clear();
        due.forEach(cb => cb());
      }
    },
    pendingFrames: () => frames.size,
  };
}

function setup(gated = true) {
  const time = testClock();
  const seen = { progress: [] as (number | null)[], hints: 0, opened: 0 };
  const gate = createParentGate({
    enabled: () => gated,
    clock: time.clock,
    progress: p => seen.progress.push(p),
    openChanged: open => { if (open) seen.opened++; },
    hint: () => { seen.hints++; },
  });
  return { gate, time, seen };
}

describe("Parent gate", () => {
  it("A two-second hold opens the entry once, and its release does not close it again", () => {
    const { gate, time, seen } = setup();
    gate.start();
    time.advance(1000);
    expect(gate.open).toBe(false);
    expect(seen.progress.at(-1)).toBeCloseTo(0.5, 1);
    time.advance(1000);
    expect(gate.open).toBe(true);
    expect(seen.opened).toBe(1);
    expect(seen.progress.at(-1)).toBeNull();
    gate.cancel();   // pointer up
    gate.press();    // the click that follows it
    expect(gate.open).toBe(true);
    expect(time.pendingFrames()).toBe(0);
  });

  it("A short hold opens nothing and explains how to open the entry", () => {
    const { gate, time, seen } = setup();
    gate.start();
    time.advance(300);
    gate.cancel();
    gate.press();
    time.advance(3000);
    expect(gate.open).toBe(false);
    expect(seen.hints).toBe(1);
    expect(seen.progress.at(-1)).toBeNull();
  });

  it("An interrupted hold (leaving the button, blur, hidden page) opens nothing", () => {
    const { gate, time } = setup();
    gate.start();
    time.advance(1900);
    gate.cancel();
    time.advance(500);
    expect(gate.open).toBe(false);
    expect(gate.holding).toBe(false);
  });

  it("Repeated starts during a hold do not restart its time", () => {
    const { gate, time } = setup();
    gate.start();
    time.advance(1500);
    gate.start();   // key repeat or a second pointer
    time.advance(500);
    expect(gate.open).toBe(true);
  });

  it("An open entry closes with a plain press", () => {
    const { gate, time } = setup();
    gate.start(); time.advance(2000); gate.cancel(); gate.press();
    gate.start();   // the next press goes down …
    gate.cancel();
    gate.press();   // … and up
    expect(gate.open).toBe(false);
  });

  it("A hold that ends away from the button does not swallow the next press", () => {
    const { gate, time } = setup();
    gate.start(); time.advance(2000);
    gate.cancel();   // released outside: no click follows
    gate.start(); gate.cancel(); gate.press();
    expect(gate.open).toBe(false);
  });

  it("Without the gate a plain press opens and closes the entry, and holding does nothing", () => {
    const { gate, time, seen } = setup(false);
    gate.start();
    time.advance(2500);
    expect(gate.open).toBe(false);
    gate.press();
    expect(gate.open).toBe(true);
    gate.press();
    expect(gate.open).toBe(false);
    expect(seen.hints).toBe(0);
  });

  it("Closing from outside (Escape, a press elsewhere, leaving the view) ends any hold", () => {
    const { gate, time } = setup();
    gate.start(); time.advance(2000);
    gate.close();
    expect(gate.open).toBe(false);
    gate.press();
    expect(gate.open).toBe(false);   // a plain press asks for the hold again
    gate.start(); time.advance(1000);
    gate.close();
    time.advance(2000);
    expect(gate.open).toBe(false);
  });
});
