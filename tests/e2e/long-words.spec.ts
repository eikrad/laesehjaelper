import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fresh } from "./helpers";

/** Colour of a word's first syllable compared with the word's own text colour. */
const marked = (page: Page, word: string) => page.locator(`.w[data-word="${word}"]`).first().evaluate(w =>
  getComputedStyle(w.querySelector(".s")!).color !== getComputedStyle(w).color);

test("With syllable colours only on long words, short words keep the text colour and Danish speech stays whole", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __said: string[] };
    w.__said = [];
    const fake = {
      speaking: false, getVoices: () => [], cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => { w.__said.push(u.text); setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 30); },
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
  });
  await fresh(page);
  await page.click("#demoBtn");
  await page.click("#setBtn");
  await page.click('#mode button[data-v="farbe"]');
  // All words is the default.
  await expect(page.locator('#sylWordsSet button[data-v="alle"]')).toHaveClass(/\bon\b/);
  expect(await marked(page, "pindsvin")).toBe(true);
  await page.click('#sylWordsSet button[data-v="lange"]');
  await expect.poll(() => marked(page, "pindsvin")).toBe(false);   // pinds·vin
  expect(await marked(page, "blomsterne")).toBe(true);             // blom·ster·ne
  // The choice is not needed when no syllables are marked.
  await page.click('#mode button[data-v="aus"]');
  await expect(page.locator("#sylWordsSet")).toBeHidden();
  await page.click('#mode button[data-v="farbe"]');
  await expect(page.locator('#sylWordsSet button[data-v="lange"]')).toHaveClass(/\bon\b/);
  await page.click("#setBtn");
  // Hidden syllable colours do not change the intact Danish playback sequence.
  await page.click('.w[data-word="pindsvin"]');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said)).toEqual(["pindsvin", "pindsvin", "pindsvin"]);
});

test("Syllable arcs follow the same choice", async ({ page }) => {
  await fresh(page);
  await page.click("#demoBtn");
  await page.click("#setBtn");
  await page.click('#mode button[data-v="boegen"]');
  await page.click('#sylWordsSet button[data-v="lange"]');
  const arc = (word: string) => page.locator(`.w[data-word="${word}"] .s`).first().evaluate(s => getComputedStyle(s, "::after").display !== "none" && getComputedStyle(s, "::after").content !== "none");
  await expect.poll(() => arc("pindsvin")).toBe(false);
  expect(await arc("blomsterne")).toBe(true);
});

test("Existing readers keep independent syllable-word choices after an update and reload", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    localStorage.setItem("lesehelfer", JSON.stringify({ mode: "farbe" }));
    localStorage.setItem("laesehjaelper-profiles", JSON.stringify({ active: "ida", list: [
      { id: "ida", name: "Ida", settings: { mode: "farbe" } },
      { id: "bo", name: "Bo", settings: { mode: "farbe" } },
    ] }));
  });
  await page.reload();
  await page.click("#demoBtn");
  await page.click("#setBtn");
  await page.click('#sylWordsSet button[data-v="lange"]');
  expect(await marked(page, "pindsvin")).toBe(false);
  await page.selectOption("#profileSel", "bo");
  await expect(page.locator('#sylWordsSet button[data-v="alle"]')).toHaveClass(/\bon\b/);
  expect(await marked(page, "pindsvin")).toBe(true);
  await page.reload();
  await page.click("#setBtn");
  await expect(page.locator("#profileSel")).toHaveValue("bo");
  await expect(page.locator('#sylWordsSet button[data-v="alle"]')).toHaveClass(/\bon\b/);
  await page.selectOption("#profileSel", "ida");
  await expect(page.locator('#sylWordsSet button[data-v="lange"]')).toHaveClass(/\bon\b/);
  expect(await marked(page, "pindsvin")).toBe(false);
});
