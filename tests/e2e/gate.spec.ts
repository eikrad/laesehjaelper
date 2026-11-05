import { expect, test } from "./fixtures";
import { fresh, seedBooks } from "./helpers";

test.beforeEach(async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "gate", title: "En original prøvebog", texts: ["En original prøveside."] }]);
  await page.locator(".book").click();
});

test("The optional parent gate requires a deliberate mouse hold and cancels a short hold", async ({ page }) => {
  await page.click("#setBtn");
  await expect(page.locator("#gateSet button.on")).toHaveAttribute("data-v", "aus", { timeout: 1500 });
  await page.click('#gateSet button[data-v="an"]');
  await page.click("#setClose");
  await page.click("#editBookBtn");
  await expect(page.locator("#editEntry")).toBeHidden();
  await expect(page.locator("#toast")).toContainText("Hold");
  const button = page.locator("#editBookBtn"), r = (await button.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(400);
  expect(await button.evaluate(el => parseFloat(el.style.getPropertyValue("--hold-progress")))).toBeGreaterThan(0);
  expect(await button.evaluate(el => getComputedStyle(el).backgroundImage)).toContain("linear-gradient");
  await page.mouse.up();
  await page.waitForTimeout(2100);
  await expect(page.locator("#editEntry")).toBeHidden();
  await page.mouse.down();
  await page.waitForTimeout(2200);
  await page.mouse.up();
  await expect(page.locator("#editEntry")).toBeVisible();
  await page.click("#openWorkshopBtn");
  await expect(page.locator("#bookTitle")).toBeVisible();
});

for (const key of ["Enter", "Space"]) {
  test(`The parent gate accepts a deliberate ${key} hold and cancels a short key press`, async ({ page }) => {
    await page.click("#setBtn");
    await page.click('#gateSet button[data-v="an"]');
    await page.click("#setClose");
    const button = page.locator("#editBookBtn");
    await button.focus();
    await page.keyboard.down(key);
    await page.waitForTimeout(300);
    await page.keyboard.up(key);
    await expect(page.locator("#editEntry")).toBeHidden();
    await page.keyboard.down(key);
    await page.waitForTimeout(2200);
    await page.keyboard.up(key);
    await expect(page.locator("#editEntry")).toBeVisible({ timeout: 1500 });
    await page.click("#openWorkshopBtn");
    await expect(page.locator("#bookTitle")).toBeVisible();
  });
}

test("The parent-gate setting and short-press explanation are translated and persist", async ({ page }) => {
  for (const [ui, label, hint] of [
    ["da", "Forældresikring", "Hold knappen nede i to sekunder"],
    ["de", "Elternschutz", "zwei Sekunden gedrückt halten"],
    ["en", "Parent gate", "Hold for two seconds"],
  ]) {
    await page.click(`#uiLang button[data-v=${ui}]`);
    await page.click("#setBtn");
    await expect(page.locator("#gateSet").locator("..")).toContainText(label);
    await page.click('#gateSet button[data-v="an"]');
    await page.click("#setClose");
    await page.click("#editBookBtn");
    await expect(page.locator("#toast")).toContainText(hint);
    await expect(page.locator("#editEntry")).toBeHidden();
  }
  await page.reload();
  await expect(page.locator("#editBookBtn")).toBeVisible();
  await page.click("#editBookBtn");
  await expect(page.locator("#editEntry")).toBeHidden();
  await page.click("#setBtn");
  await expect(page.locator("#gateSet button.on")).toHaveAttribute("data-v", "an");
});
