import { test, expect } from "./fixtures";
import { fixture, fresh } from "./helpers";

test("recognizes a large short exclamation in an original comic page", async ({ page }) => {
  await fresh(page);
  await page.click('#langStart button[data-v="en"]');
  await page.setInputFiles("#file", fixture("side-comic.jpg"));
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 90000 });
  await page.click("#cropWhole");
  await expect(page.locator('#reader .w[data-word="Wow"]')).toBeVisible({ timeout: 90000 });
  await expect(page.locator("#reader")).toContainText("Tara builds a kite.");
});
