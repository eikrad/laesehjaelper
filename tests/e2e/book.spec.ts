import { expect, test } from "./fixtures";
import { addPhotos, bookTool, fresh, waitForText } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Photo → crop → text recognition → book page", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("Pindsvinet");
  expect(text).toContain("haven");
  expect(text).toContain("mus");
  await expect(page.locator("#reader")).toHaveClass(/pagemode/);
  // Show the original for comparison, then switch back.
  await page.click("#compareBtn");
  await expect(page.locator("#reader .origfull")).toBeVisible();
  await page.click("#compareBtn");
  await expect(page.locator("#reader")).toHaveClass(/pagemode/);
  // The original-photo toggle is available and effective only in text-only view.
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

test("Recognizes text over an illustration while excluding the page number", async ({ page }) => {
  await addPhotos(page, ["side-illustration.jpg"]);
  await waitForText(page);
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("Søren går en tur");
  expect(text).toContain("bedste ven");
  expect(text).not.toMatch(/\b12\b/);
});

test("Keeps the first word of lines that start right beside an illustration", async ({ page }) => {
  await addPhotos(page, ["side-bjorn.jpg"]);
  await waitForText(page);
  const text = await page.locator("#text").inputValue();
  expect(text).toContain("Bjørne-far synger en sang");
  expect(text).toContain("Så falder lille bjørn i søvn.");
});

test("Bookshelf: save, reload, reorder and delete", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg", "side-illustration.jpg"]);
  await page.fill("#bookTitle", "Min testbog");
  await waitForText(page);
  await page.click("#next");
  await waitForText(page);
  await page.click("#home");
  await expect(page.locator(".book b")).toHaveText("Min testbog");
  await expect(page.locator(".book")).toContainText("2 sider");

  await page.reload();
  await page.click(".book");
  await waitForText(page);
  await expect(page.locator("#readingTitle")).toHaveText("Min testbog");
  await expect(page.locator("#count")).toHaveText("2 / 2");   // Resume where reading stopped.

  await bookTool(page, "editPagesBtn");
  await page.locator(".thumb").nth(1).locator(".ctl button").first().click();   // Move page 2 to the left.
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await expect(page.locator("#text")).toHaveValue(/Søren går en tur/);
  await page.locator(".thumb").nth(0).locator(".ctl .x").click();               // Delete the page.
  await expect(page.locator("#count")).toHaveText("1 / 1");
  await page.click("#delBookBtn");
  await page.click("#delBookBtn");                                              // Click twice to confirm.
  await expect(page.locator("#start")).toBeVisible();
  await expect(page.locator("#shelf")).toBeHidden();
  await expect(page.locator("#drop")).toContainText("Tag et billede af en side");
});

test("Saves text corrections", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  await bookTool(page, "checkTextBtn");
  const t = await page.locator("#text").inputValue();
  await page.fill("#text", t.replace("Pindsvinet", "Pind·svi·net"));
  await expect(page.locator('.w[data-word="Pindsvinet"] .s')).toHaveCount(3);
  await page.waitForTimeout(600);
  await page.reload();
  await waitForText(page);
  await expect(page.locator("#text")).toHaveValue(/Pind·svi·net/);
});

test("Keeps headings larger and bold words bold", async ({ page }) => {
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

test("Moves, saves and resets text boxes on the book page", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  await bookTool(page, "checkTextBtn");
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
  // Tapping a word in move mode does not read it aloud; resize using the handle.
  const g = (await box.locator(".grip").boundingBox())!;
  const h0 = r.height;
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + 50, { steps: 5 });
  await page.mouse.up();
  expect((await box.boundingBox())!.height).toBeGreaterThan(h0 + 30);
  // The position survives reloading.
  await page.reload();
  await waitForText(page);
  const top2 = await page.locator("#reader .tbox").first().evaluate(el => el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top);
  expect(Math.abs(top2 - top1)).toBeLessThan(3);
  // Reset the position.
  await bookTool(page, "checkTextBtn");
  await page.click("#resetPlaceBtn");
  const top3 = await page.locator("#reader .tbox").first().evaluate(el => el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top);
  expect(Math.abs(top3 - top0)).toBeLessThan(3);
});
