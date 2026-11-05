import { readFile } from "node:fs/promises";
import { expect, test } from "./fixtures";
import { fixture, fresh, seedBooks } from "./helpers";

test.use({ serviceWorkers: "block" });

test("Leaving image preparation cannot open a crop or add a page in another book", async ({ page }) => {
  await fresh(page);
  await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
    "window.Tesseract = { createWorker: async () => new Promise(() => {}) };",
  }));
  await seedBooks(page, [
    { id: "a", title: "Original book A", texts: ["Original page A."] },
    { id: "b", title: "Original book B", texts: ["Original page B."] },
  ]);
  await page.locator(".book", { hasText: "Original book A" }).click();
  // Simulate slow device decoding at the browser's image interface, not inside app code.
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src")!;
    let held = false;
    Object.defineProperty(HTMLImageElement.prototype, "src", { ...descriptor, set(value: string) {
      if (!held && value.startsWith("blob:")) {
        held = true;
        Object.assign(window, { releaseTestImage: () => new Promise<void>(resolve => {
          this.addEventListener("load", () => resolve(), { once: true });
          descriptor.set!.call(this, value);
        }) });
      } else descriptor.set!.call(this, value);
    } });
  });
  const bytes = [...await readFile(fixture("side-da.jpg"))];
  await page.evaluate(bytes => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array(bytes)], "original-page.jpg", { type: "image/jpeg" }));
    document.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data }));
  }, bytes);
  await page.waitForFunction(() => "releaseTestImage" in window);
  await page.click("#home");
  await expect(page.locator("#start")).toBeVisible();
  await page.locator(".book", { hasText: "Original book B" }).click();
  await expect(page.locator("#reader")).toContainText("Original page B.");
  await page.evaluate(() => (window as unknown as { releaseTestImage: () => Promise<void> }).releaseTestImage());
  await expect(page.locator("#crop")).toBeHidden({ timeout: 1500 });
  await expect(page.locator("#count")).toHaveText("1 / 1");
  await page.click("#home");
  await expect(page.locator("#start")).toBeVisible();
  await page.locator(".book", { hasText: "Original book B" }).click();
  await expect(page.locator("#count")).toHaveText("1 / 1");
});
