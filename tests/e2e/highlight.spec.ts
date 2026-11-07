import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fresh } from "./helpers";

// Word-by-word highlighting during read-aloud starts off on new devices and for new readers:
// no benefit has been shown and it can pull children along with the voice (README,
// "What does the research say?"). Devices that used the app before keep it on.

type Fake = { __boundaries: number };

/** Fake speech that reports the first word boundary, then keeps speaking until stopped. */
async function fakeSpeech(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Fake;
    w.__boundaries = 0;
    const fake = {
      speaking: false, getVoices: () => [], cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => {
        setTimeout(() => { u.onboundary?.({ name: "word", charIndex: 0 } as SpeechSynthesisEvent); w.__boundaries++; }, 20);
      },
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
  });
}

/** Read the page aloud until the first word boundary. */
async function readAloud(page: Page) {
  const before = await page.evaluate(() => (window as unknown as Fake).__boundaries);
  await page.click("#readBtn");
  await page.waitForFunction(n => (window as unknown as Fake).__boundaries > n, before);
}

test("A new device reads aloud without highlighting each word; the setting turns it on", async ({ page }) => {
  await fakeSpeech(page);
  await fresh(page);
  await page.click("#demoBtn");
  await expect(page.locator("#reader .w").first()).toBeVisible();
  await readAloud(page);
  await expect(page.locator("#reader .w.speaking")).toHaveCount(0);
  await page.click("#readBtn"); // stop
  await page.click("#setBtn");
  await expect(page.locator('#highlightSet button[data-v="aus"]')).toHaveClass(/\bon\b/);
  await page.click('#highlightSet button[data-v="an"]');
  await page.click("#setBtn");
  await readAloud(page);
  await expect(page.locator("#reader .w.speaking")).toHaveCount(1);
});

test("A device that used the app before keeps highlighting each word", async ({ page }) => {
  await fakeSpeech(page);
  await fresh(page);
  // Earlier versions saved all settings at the first start, without this setting.
  await page.evaluate(() => localStorage.setItem("lesehelfer", JSON.stringify({ mode: "farbe", size: 32 })));
  await page.reload();
  await page.click("#demoBtn");
  await expect(page.locator("#reader .w").first()).toBeVisible();
  await readAloud(page);
  await expect(page.locator("#reader .w.speaking")).toHaveCount(1);
});

test("A newly added reader starts without word highlighting", async ({ page }) => {
  await fresh(page);
  await page.click("#demoBtn");
  await page.click("#setBtn");
  await page.click('#highlightSet button[data-v="an"]');
  await page.fill("#profileName", "Bo");
  await page.click("#profileAdd");
  await expect(page.locator('#highlightSet button[data-v="aus"]')).toHaveClass(/\bon\b/);
  await page.locator("#profileSel").selectOption({ index: 0 });
  await expect(page.locator('#highlightSet button[data-v="an"]')).toHaveClass(/\bon\b/);
});
