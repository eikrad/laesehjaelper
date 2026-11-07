import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fresh, openWorkshop, seedBooks } from "./helpers";

test.use({ serviceWorkers: "block" });

type FakeWake = { __wake: { requests: number; held: () => number; hide: () => void; show: () => void } };

/** A fake Screen Wake Lock API and page visibility; like a browser, hiding the app releases its locks. */
async function fakeWakeLock(page: Page) {
  await page.addInitScript(() => {
    let visible = true;
    const locks: { released: boolean }[] = [];
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (visible ? "visible" : "hidden") });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => !visible });
    const wake = {
      requests: 0,
      held: () => locks.filter(l => !l.released).length,
      hide: () => { visible = false; for (const l of locks) l.released = true; document.dispatchEvent(new Event("visibilitychange")); },
      show: () => { visible = true; document.dispatchEvent(new Event("visibilitychange")); },
    };
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: {
        request: async () => {
          wake.requests++;
          const lock = { released: false, release: async () => { lock.released = true; } };
          locks.push(lock);
          return lock;
        },
      },
    });
    Object.assign(window, { __wake: wake });
  });
}
const held = (page: Page) => page.evaluate(() => (window as unknown as FakeWake).__wake.held());
const requests = (page: Page) => page.evaluate(() => (window as unknown as FakeWake).__wake.requests);

async function openBook(page: Page) {
  await seedBooks(page, [{ id: "awake", title: "En vågen bog", texts: ["En selvskrevet side."] }]);
  await page.locator(".book").click();
  await expect(page.locator("#reader")).toContainText("En selvskrevet side.");
}

test("While a book is open the screen stays on; on the bookshelf it may sleep", async ({ page }) => {
  await fakeWakeLock(page);
  await fresh(page);
  await openBook(page);
  await expect.poll(() => held(page)).toBe(1);
  await openWorkshop(page);
  await expect.poll(() => held(page)).toBe(1);
  await page.click("#home");
  await expect(page.locator("#start")).toBeVisible();
  await expect.poll(() => held(page)).toBe(0);
});

test("The screen stays on again when the app comes back into view", async ({ page }) => {
  await fakeWakeLock(page);
  await fresh(page);
  await openBook(page);
  await expect.poll(() => held(page)).toBe(1);
  await page.evaluate(() => (window as unknown as FakeWake).__wake.hide());
  expect(await held(page)).toBe(0);
  await page.evaluate(() => (window as unknown as FakeWake).__wake.show());
  await expect.poll(() => held(page)).toBe(1);
  expect(await requests(page)).toBe(2);
});

test("After 10 minutes without a touch the screen may sleep; the next touch keeps it on again", async ({ page }) => {
  await page.clock.install();
  await fakeWakeLock(page);
  await fresh(page);
  await openBook(page);
  await expect.poll(() => held(page)).toBe(1);
  await page.clock.fastForward("09:00");
  await page.locator("#readingTitle").click();
  await page.clock.fastForward("09:00");
  expect(await held(page)).toBe(1);
  await page.clock.fastForward("01:01");
  await expect.poll(() => held(page)).toBe(0);
  await page.locator("#readingTitle").click();
  await expect.poll(() => held(page)).toBe(1);
});

test("Reading aloud keeps the screen on, however long it takes", async ({ page }) => {
  await page.clock.install();
  await fakeWakeLock(page);
  await page.addInitScript(() => {
    // Speech that only ends when the test says so.
    const fake = {
      speaking: false, getVoices: () => [], cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => { Object.assign(window, { __utterance: u }); },
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
  });
  await fresh(page);
  await openBook(page);
  await page.click("#readBtn");
  await page.clock.fastForward("25:00");
  expect(await held(page)).toBe(1);
  await page.evaluate(() => {
    const u = (window as unknown as { __utterance: SpeechSynthesisUtterance }).__utterance;
    u.onend?.(new Event("end") as SpeechSynthesisEvent);
  });
  await page.clock.fastForward("09:00");
  expect(await held(page)).toBe(1);
  await page.clock.fastForward("01:01");
  await expect.poll(() => held(page)).toBe(0);
});

test("Without the Screen Wake Lock API a book opens and reads as before", async ({ page }) => {
  await page.addInitScript(() => { delete (Navigator.prototype as { wakeLock?: unknown }).wakeLock; });
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await fresh(page);
  expect(await page.evaluate(() => "wakeLock" in navigator)).toBe(false);
  await openBook(page);
  await page.click("#home");
  await expect(page.locator("#start")).toBeVisible();
  expect(errors).toEqual([]);
});
