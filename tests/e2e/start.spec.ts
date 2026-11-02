import { expect, test } from "@playwright/test";
import { fresh } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Startseite in allen drei Sprachen", async ({ page }) => {
  await expect(page.locator(".cta strong")).toHaveText("Tag et billede af en side");
  await page.click("#uiLang button[data-v=de]");
  await expect(page.locator(".cta strong")).toHaveText("Eine Seite fotografieren");
  await page.click("#uiLang button[data-v=en]");
  await expect(page.locator(".cta strong")).toHaveText("Take a photo of a page");
  await page.reload();
  await expect(page.locator(".cta strong")).toHaveText("Take a photo of a page"); // Einstellung bleibt
});

test("Beispielseite zeigt Silben, Zurück führt zur Startseite", async ({ page }) => {
  await page.click("#demoBtn");
  await expect(page.locator("#app")).toBeVisible();
  const word = page.locator('.w[data-word="pindsvin"]');
  await expect(word.locator(".s")).toHaveCount(2);
  await expect(word.locator(".s0")).toHaveText("pinds");
  await expect(page.locator("#compareBtn")).toBeHidden();  // kein Foto, nichts zu vergleichen
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});

test("Einstellungen: Silben als Bögen, eigene Farbe", async ({ page }) => {
  await page.click("#demoBtn");
  await page.click("#setBtn");
  await page.click("#mode button[data-v=boegen]");
  await expect(page.locator("#reader")).toHaveClass(/mode-boegen/);
  await expect(page.locator("#reader")).not.toHaveClass(/mode-farbe/);
  await page.locator("#c1").evaluate((el: HTMLInputElement) => { el.value = "#16a34a"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  const c1 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--s1").trim());
  expect(c1).toBe("#16a34a");
});

test("Buchsprache Deutsch trennt deutsche Beispielwörter", async ({ page }) => {
  await page.click("#langStart button[data-v=de]");
  await page.click("#demoBtn");
  await expect(page.locator('.w[data-word="Apfelbaum"] .s')).not.toHaveCount(1);
});

test("Mehr Buchstabenabstand vergrößert auch den Wortabstand", async ({ page }) => {
  await page.click("#demoBtn");
  const ws = () => page.locator("#reader").evaluate(el => parseFloat(getComputedStyle(el).wordSpacing));
  const before = await ws();
  await page.click("#setBtn");
  await page.locator("#ls").evaluate((el: HTMLInputElement) => { el.value = "0.2"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  expect(await ws()).toBeGreaterThan(before);
});
