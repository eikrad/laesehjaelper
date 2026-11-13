import { expect, test } from "./fixtures";
import { fresh, seedBooks, setUiLanguage, toggleReadingSetup } from "./helpers";

test.beforeEach(async ({ page }) => {
  await fresh(page);
  await seedBooks(page, [{ id: "gate", title: "En original prøvebog", texts: ["En original prøveside."] }]);
  await page.locator(".book").click();
});

test("The optional parent gate requires a deliberate mouse hold and cancels a short hold", async ({ page }) => {
  await toggleReadingSetup(page);
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
    await toggleReadingSetup(page);
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
    await setUiLanguage(page, ui);
    await toggleReadingSetup(page);
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
  await toggleReadingSetup(page);
  await expect(page.locator("#gateSet button.on")).toHaveAttribute("data-v", "an");
});

test("Holding the gated entry opens no browser menu or text selection", async ({ page }) => {
  await toggleReadingSetup(page);
  await page.click('#gateSet button[data-v="an"]');
  await page.click("#setClose");
  // Tablets turn a long press into a context menu, a callout or a text selection, which can cancel the hold.
  const press = await page.locator("#editBookBtn").evaluate(el => {
    const menu = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    el.dispatchEvent(menu);
    return { menuPrevented: menu.defaultPrevented, selectable: getComputedStyle(el).userSelect };
  });
  expect(press).toEqual({ menuPrevented: true, selectable: "none" });
});

test("With the parent gate on, tapping the open entry closes it again", async ({ page }) => {
  await toggleReadingSetup(page);
  await page.click('#gateSet button[data-v="an"]');
  await page.click("#setClose");
  const button = page.locator("#editBookBtn");
  await button.focus();
  await page.keyboard.down("Enter");
  await page.waitForTimeout(2200);
  await page.keyboard.up("Enter");
  await expect(page.locator("#editEntry")).toBeVisible({ timeout: 1500 });
  await page.keyboard.press("Enter");
  await expect(page.locator("#editEntry")).toBeHidden();
  await expect(page.locator("#toast")).not.toHaveClass(/show/);
  await expect(button).not.toHaveClass(/holding/);
  const r = (await button.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2200);
  await page.mouse.up();
  await expect(page.locator("#editEntry")).toBeVisible();
  await button.click();
  await expect(page.locator("#editEntry")).toBeHidden();
  await expect(page.locator("#toast")).not.toHaveClass(/show/);
});
