import { expect, test } from "./fixtures";
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
  // Nur-Text-Ansicht; erst dort gibt es den Schalter für das Originalfoto, und er wirkt
  await page.click("#setBtn");
  await expect(page.locator("#origToggle")).toBeHidden();
  await page.click("#viewSet button[data-v=tekst]");
  await expect(page.locator("#reader")).not.toHaveClass(/pagemode/);
  await expect(page.locator("#orig")).toBeVisible();
  await page.click("#origToggle button[data-v=aus]");
  await expect(page.locator("#orig")).toBeHidden();
  await page.click("#origToggle button[data-v=an]");
  await expect(page.locator("#orig")).toBeVisible();
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

test("Überschrift bleibt größer, fettes Wort bleibt fett", async ({ page }) => {
  await addPhotos(page, ["side-overskrift.jpg"]);
  await waitForText(page);
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("*meget*");
  expect(text).not.toMatch(/\*(Om|Ved|Bjørnens)\b/);
  await expect(page.locator('#reader .w.b[data-word="meget"]')).toHaveCount(1);
  await expect(page.locator("#reader .w.b")).toHaveCount(1);
  const size = (word: string) => page.locator(`#reader .tbox:has(.w[data-word="${word}"])`).evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(await size("Bjørnens")).toBeGreaterThan((await size("morgenen")) * 1.3);
});

test("Textfelder auf der Buchseite verschieben, speichern und zurücksetzen", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  await page.locator("#edit summary").click();
  await page.click("#moveBtn");
  await expect(page.locator("#reader")).toHaveClass(/moving/);
  const box = page.locator("#reader .tbox").first();
  const top0 = await box.evaluate(el => el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top);
  const r = (await box.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2 + 60, { steps: 5 });
  await page.mouse.up();
  const top1 = await box.evaluate(el => el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top);
  expect(top1 - top0).toBeGreaterThan(40);
  // Antippen eines Worts liest im Verschiebe-Modus nicht vor, Größe am Griff ändern
  const g = (await box.locator(".grip").boundingBox())!;
  const h0 = r.height;
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + 50, { steps: 5 });
  await page.mouse.up();
  expect((await box.boundingBox())!.height).toBeGreaterThan(h0 + 30);
  // bleibt nach Neuladen erhalten
  await page.reload();
  await page.locator(".book").first().click();
  await waitForText(page);
  const top2 = await page.locator("#reader .tbox").first().evaluate(el => el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top);
  expect(Math.abs(top2 - top1)).toBeLessThan(3);
  // zurücksetzen
  await page.locator("#edit summary").click();
  await page.click("#resetPlaceBtn");
  const top3 = await page.locator("#reader .tbox").first().evaluate(el => el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top);
  expect(Math.abs(top3 - top0)).toBeLessThan(3);
});
