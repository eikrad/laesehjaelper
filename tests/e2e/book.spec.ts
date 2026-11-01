import { expect, test } from "@playwright/test";
import { addPhotos, fresh, waitForText } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Foto → Zuschnitt → Texterkennung → Buchseite", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("Pindsvinet");
  expect(text).toContain("haven");
  expect(text).toContain("mus");
  await expect(page.locator("#reader")).toHaveClass(/pagemode/);
  // Original zum Vergleichen einblenden und zurück
  await page.click("#compareBtn");
  await expect(page.locator("#reader .origfull")).toBeVisible();
  await page.click("#compareBtn");
  await expect(page.locator("#reader")).toHaveClass(/pagemode/);
  // Nur-Text-Ansicht
  await page.click("#setBtn");
  await page.click("#viewSet button[data-v=tekst]");
  await expect(page.locator("#reader")).not.toHaveClass(/pagemode/);
});

test("Text über einer Illustration wird erkannt, die Seitenzahl nicht", async ({ page }) => {
  await addPhotos(page, ["side-illustration.jpg"]);
  await waitForText(page);
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("Søren går en tur");
  expect(text).toContain("bedste ven");
  expect(text).not.toMatch(/\b12\b/);
});

test("Bücherregal: speichern, neu laden, sortieren, löschen", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg", "side-illustration.jpg"]);
  await page.fill("#bookTitle", "Min testbog");
  await waitForText(page);
  await page.click("#next");
  await waitForText(page);
  await page.goBack();
  await expect(page.locator(".book b")).toHaveText("Min testbog");
  await expect(page.locator(".book span")).toHaveText("2 sider");

  await page.reload();
  await page.click(".book");
  await waitForText(page);
  await expect(page.locator("#bookTitle")).toHaveValue("Min testbog");
  await expect(page.locator("#count")).toHaveText("2 / 2");   // weiter, wo man aufgehört hat

  await page.click("#editPagesBtn");
  await page.locator(".thumb").nth(1).locator(".ctl button").first().click();   // Seite 2 nach links
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await expect(page.locator("#text")).toHaveValue(/Søren går en tur/);
  await page.locator(".thumb").nth(0).locator(".ctl .x").click();               // Seite löschen
  await expect(page.locator("#count")).toHaveText("1 / 1");
  await page.click("#delBookBtn");
  await page.click("#delBookBtn");                                              // zweimal = bestätigen
  await expect(page.locator("#start")).toBeVisible();
  await expect(page.locator("#shelf")).toBeHidden();
});

test("Text korrigieren wird gespeichert", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  await page.click("#edit summary");
  const t = await page.locator("#text").inputValue();
  await page.fill("#text", t.replace("Pindsvinet", "Pind·svi·net"));
  await expect(page.locator('.w[data-word="Pindsvinet"] .s')).toHaveCount(3);
  await page.waitForTimeout(600);
  await page.reload();
  await page.click(".book");
  await waitForText(page);
  await expect(page.locator("#text")).toHaveValue(/Pind·svi·net/);
});
