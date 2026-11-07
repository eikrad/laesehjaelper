import { expect, test } from "./fixtures";
import { fresh } from "./helpers";

// Coloured syllables start off: on the current evidence they help only some beginners a little
// (README, "What does the research say?"). They stay one tap away.

test("A new device starts without syllable colours, one tap away in the first settings group", async ({ page }) => {
  await fresh(page);
  await page.click("#demoBtn");
  await expect(page.locator("#reader .w").first()).toBeVisible();
  await expect(page.locator("#reader")).not.toHaveClass(/mode-farbe/);
  await page.click("#setBtn");
  await expect(page.locator('#mode button[data-v="aus"]')).toHaveClass(/\bon\b/);
  // Second field, right after the text size.
  await expect(page.locator("#settings .grid > .field").nth(1).locator("#mode")).toHaveCount(1);
  await page.click('#mode button[data-v="farbe"]');
  await expect(page.locator("#reader")).toHaveClass(/mode-farbe/);
});

test("A device that used the app before keeps its syllable colours", async ({ page }) => {
  await fresh(page);
  // Earlier versions saved all settings at the first start, with colours on.
  await page.evaluate(() => localStorage.setItem("lesehelfer", JSON.stringify({ mode: "farbe", size: 32 })));
  await page.reload();
  await page.click("#demoBtn");
  await expect(page.locator("#reader .w").first()).toBeVisible();
  await expect(page.locator("#reader")).toHaveClass(/mode-farbe/);
});

test("A newly added reader starts without syllable colours and keeps the other settings", async ({ page }) => {
  await fresh(page);
  await page.click("#demoBtn");
  await page.click("#setBtn");
  await page.click('#mode button[data-v="farbe"]');
  await page.locator("#size").fill("44");
  await page.fill("#profileName", "Bo");
  await page.click("#profileAdd");
  await expect(page.locator('#mode button[data-v="aus"]')).toHaveClass(/\bon\b/);
  await expect(page.locator("#reader")).not.toHaveClass(/mode-farbe/);
  await expect(page.locator("#size")).toHaveValue("44");
  // The first reader keeps the colours.
  await page.locator("#profileSel").selectOption({ index: 0 });
  await expect(page.locator('#mode button[data-v="farbe"]')).toHaveClass(/\bon\b/);
});
