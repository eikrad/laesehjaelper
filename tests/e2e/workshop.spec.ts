import { expect, test } from "./fixtures";
import { fresh, seedBooks } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("The workshop exposes book and selected-page tools, with recognition status in the list", async ({ page }) => {
  await seedBooks(page, [{ id: "tools", title: "En værkstedsbog", texts: ["Første originale side.", "Anden originale side."] }]);
  await page.locator(".book").click();
  await page.click("#editBookBtn");
  await expect(page.locator("#text")).toBeVisible({ timeout: 1500 });
  await expect(page.locator("#exportBtn")).toBeVisible();
  await expect(page.locator("#delBookBtn")).toBeVisible();
  await expect(page.locator(".thumb .recognition")).toHaveText(["Klar", "Klar"]);
  await page.locator(".thumb > button").nth(1).click();
  await expect(page.locator("#text")).toHaveValue("Anden originale side.");
  await page.locator(".thumb").nth(1).locator(".ctl button").first().click();
  await expect(page.locator("#count")).toHaveText("1 / 2");
  await page.fill("#text", "En rettet original side.");
  await page.click("#readBookBtn");
  await expect(page.locator("#reader")).toContainText("En rettet original side.");
  await expect(page.locator("#delBookBtn")).toBeHidden();
});

test.describe("Workshop recognition status", () => {
  test.use({ serviceWorkers: "block" });
  test("The list distinguishes ready, recognising and queued pages", async ({ page }) => {
    await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
      "window.Tesseract = { createWorker: async () => { window.ocrWaiting = true; return new Promise(() => {}); } };",
    }));
    await seedBooks(page, [{ id: "status", title: "En bog undervejs", texts: ["En klar side.", "", ""], readyPages: 1 }]);
    await page.locator(".book").click();
    await page.waitForFunction(() => "ocrWaiting" in window);
    await page.click("#editBookBtn");
    await expect(page.locator(".thumb .recognition")).toHaveText(["Klar", "Teksten genkendes …", "Venter på genkendelse …"]);
    await page.locator(".thumb > button").nth(1).click();
    await expect(page.locator("#edit")).toBeHidden();
    await expect(page.locator("#checkTextBtn")).toBeDisabled({ timeout: 1500 });
    await page.locator(".thumb > button").first().click();
    await expect(page.locator("#text")).toHaveValue("En klar side.");
  });
});
