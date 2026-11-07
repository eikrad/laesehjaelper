import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fresh, seedBooks } from "./helpers";

test.use({ serviceWorkers: "block" });

type FakeFullscreen = { __fs: { requests: number; exits: number; full: () => boolean; systemExit: () => void } };

/**
 * A fake Fullscreen API. `enabled: false` is a browser without it (iPhone Safari);
 * `installed: true` is the installed app (display mode standalone).
 */
async function fakeFullscreen(page: Page, { enabled = true, installed = false } = {}) {
  await page.addInitScript(({ enabled, installed }) => {
    let element: Element | null = null;
    const changed = () => document.dispatchEvent(new Event("fullscreenchange"));
    const fs = {
      requests: 0, exits: 0,
      full: () => element !== null,
      systemExit: () => { element = null; changed(); },
    };
    Object.defineProperty(Document.prototype, "fullscreenEnabled", { configurable: true, get: () => enabled });
    Object.defineProperty(Document.prototype, "fullscreenElement", { configurable: true, get: () => element });
    Element.prototype.requestFullscreen = async function (this: Element) { fs.requests++; element = this; changed(); };
    Document.prototype.exitFullscreen = async () => { fs.exits++; element = null; changed(); };
    if (installed) {
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query: string) =>
        query.includes("display-mode: standalone") ? ({ ...matchMedia(query), matches: true, media: query } as MediaQueryList) : matchMedia(query);
    }
    Object.assign(window, { __fs: fs });
  }, { enabled, installed });
}
const fullscreen = (page: Page) => page.evaluate(() => {
  const fs = (window as unknown as FakeFullscreen).__fs;
  return { full: fs.full(), requests: fs.requests, exits: fs.exits };
});

async function openBook(page: Page) {
  await seedBooks(page, [{ id: "full", title: "En stor bog", texts: ["En selvskrevet side."] }]);
  await page.locator(".book").click();
  await expect(page.locator("#reader")).toContainText("En selvskrevet side.");
}
const readingMode = (page: Page) => page.evaluate(() => document.body.classList.contains("focus"));

test("Reading mode fills the whole screen where the browser can, and closing it leaves fullscreen", async ({ page }) => {
  await fakeFullscreen(page);
  await fresh(page);
  await openBook(page);
  await page.click("#focusBtn");
  expect(await readingMode(page)).toBe(true);
  await expect.poll(() => fullscreen(page)).toEqual({ full: true, requests: 1, exits: 0 });
  await page.click("#focusBtn");
  expect(await readingMode(page)).toBe(false);
  await expect.poll(() => fullscreen(page)).toEqual({ full: false, requests: 1, exits: 1 });
});

test("Leaving fullscreen with the system gesture also leaves reading mode", async ({ page }) => {
  await fakeFullscreen(page);
  await fresh(page);
  await openBook(page);
  await page.click("#focusBtn");
  await expect.poll(() => fullscreen(page)).toEqual({ full: true, requests: 1, exits: 0 });
  await page.evaluate(() => (window as unknown as FakeFullscreen).__fs.systemExit());
  await expect.poll(() => readingMode(page)).toBe(false);
  await expect(page.locator("#focusBtn")).toHaveAttribute("aria-label", "Læsetilstand");
  // Reading mode can start again.
  await page.click("#focusBtn");
  await expect.poll(() => fullscreen(page)).toEqual({ full: true, requests: 2, exits: 0 });
});

test("Leaving the book also leaves fullscreen", async ({ page }) => {
  await fakeFullscreen(page);
  await fresh(page);
  await openBook(page);
  await page.click("#focusBtn");
  await expect.poll(() => fullscreen(page)).toEqual({ full: true, requests: 1, exits: 0 });
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
  await expect.poll(() => fullscreen(page)).toEqual({ full: false, requests: 1, exits: 1 });
  expect(await readingMode(page)).toBe(false);
});

for (const [name, options] of [["without the Fullscreen API (iPhone)", { enabled: false }], ["in the installed app", { installed: true }]] as const) {
  test(`Reading mode works as before ${name}`, async ({ page }) => {
    await fakeFullscreen(page, options);
    await fresh(page);
    await openBook(page);
    await page.click("#focusBtn");
    expect(await readingMode(page)).toBe(true);
    await page.click("#focusBtn");
    expect(await readingMode(page)).toBe(false);
    expect(await fullscreen(page)).toEqual({ full: false, requests: 0, exits: 0 });
  });
}
