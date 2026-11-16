import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fixture, fresh, goShelf, seedBooks } from "./helpers";

test.use({ serviceWorkers: "block" });

/** Pause image encoding without replacing the application or its storage implementation. */
async function holdPhotoWrite(page: Page) {
  await page.evaluate(() => {
    const state = { started: false, pageSaved: false, blobsFinished: 0, release: () => {} };
    Object.assign(window, { acceptedPhotoWrite: state });
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
      const finished = (blob: Blob | null) => { callback(blob); state.blobsFinished++; };
      if (!state.started) {
        state.started = true;
        state.release = () => toBlob.call(this, finished, ...args);
      } else toBlob.call(this, finished, ...args);
    };
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value, key) {
      if (this.name === "pages") this.transaction.addEventListener("complete", () => { state.pageSaved = true; }, { once: true });
      return put.call(this, value, key);
    };
  });
}


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
          this.addEventListener("error", () => resolve(), { once: true });
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
  await goShelf(page);
  await expect(page.locator("#start")).toBeVisible();
  await page.locator(".book", { hasText: "Original book B" }).click();
  await expect(page.locator("#reader")).toContainText("Original page B.");
  await page.evaluate(() => (window as unknown as { releaseTestImage: () => Promise<void> }).releaseTestImage());
  await expect(page.locator("#crop")).toBeHidden({ timeout: 1500 });
  await expect(page.locator("#count")).toHaveText("1 / 1");
  await goShelf(page);
  await expect(page.locator("#start")).toBeVisible();
  await page.locator(".book", { hasText: "Original book B" }).click();
  await expect(page.locator("#count")).toHaveText("1 / 1");
});

test("An accepted first photo survives Back during storage and reload", async ({ page }) => {
  await fresh(page);
  await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
    "window.Tesseract = { createWorker: async () => new Promise(() => {}) };",
  }));
  await page.reload();
  await page.setInputFiles("#file", fixture("side-da.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120000 });
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1);
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const state = { release: false, finished: false };
    Object.assign(window, { pendingPhotoSave: state });
    const tx = db.transaction("pages", "readwrite");
    const keepOpen = () => { tx.objectStore("pages").get("missing").onsuccess = () => { if (!state.release) keepOpen(); }; };
    keepOpen();
    tx.oncomplete = () => { state.finished = true; db.close(); };
  });
  await page.click("#cropWhole");
  await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/#read\//);
  await page.evaluate(() => { (window as unknown as { pendingPhotoSave: { release: boolean } }).pendingPhotoSave.release = true; });
  await page.waitForFunction(() => (window as unknown as { pendingPhotoSave: { finished: boolean } }).pendingPhotoSave.finished);
  // Let the queued write and its continuation finish before restoring from storage.
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator("#app")).toBeVisible({ timeout: 1500 });
  await expect(page.locator("#count")).toHaveText("1 / 1");
});

for (const detection of ["loading", "ready"]) {
  test(`A newer photo selection replaces an unfinished crop while detection is ${detection}`, async ({ page }) => {
    await fresh(page);
    let finishDetection!: () => void;
    const detectionReady = new Promise<void>(resolve => { finishDetection = resolve; });
    await page.route("**/opencv.js", async route => {
      if (detection === "loading") await detectionReady;
      await route.abort();
    });
    await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
      "window.Tesseract = { createWorker: async () => new Promise(() => {}) };",
    }));
    await page.reload();
    await page.setInputFiles("#file", [fixture("side-da.jpg"), fixture("side-overskrift.jpg")]);
    await expect(page.locator("#crop")).toBeVisible();
    await expect(page.locator("#cropMsg")).toContainText("1 af 2");
    if (detection === "ready") await expect(page.locator("#cropMsg")).not.toContainText("…");
    const bytes = [...await readFile(fixture("side-illustration.jpg"))];
    await page.evaluate(bytes => {
      const data = new DataTransfer();
      data.items.add(new File([new Uint8Array(bytes)], "replacement.jpg", { type: "image/jpeg" }));
      document.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data }));
    }, bytes);
    try {
      // The replacement is a single photo, without the original batch's counter.
      await expect(page.locator("#cropMsg")).not.toContainText("1 af 2");
      await expect(page.locator("#cropStage .h")).toHaveCount(8, { timeout: 1500 });
      finishDetection();
      await expect(page.locator("#cropMsg")).not.toContainText("…");
      await page.click("#cropWhole");
      await expect(page.locator("#thumbs .thumb")).toHaveCount(1);
      await expect(page.locator("#crop")).toBeHidden();
      await expect(page.locator("#cropStage .h")).toHaveCount(0);
    } finally { finishDetection(); }
  });
}

test("An accepted first photo saves its originating book after another book opens", async ({ page }) => {
  await fresh(page);
  await page.route("**/opencv.js", route => route.abort());
  await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body:
    "window.Tesseract = { createWorker: async () => new Promise(() => {}) };",
  }));
  await seedBooks(page, [{ id: "b", title: "Another original book", texts: ["Original page B."] }]);
  await page.setInputFiles("#file", [fixture("side-da.jpg"), fixture("side-overskrift.jpg"), fixture("side-illustration.jpg")]);
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…");
  const originalHash = new URL(page.url()).hash.replace("#edit/", "#read/");
  await holdPhotoWrite(page);
  await page.click("#cropWhole");
  await page.waitForFunction(() => (window as unknown as { acceptedPhotoWrite: { started: boolean } }).acceptedPhotoWrite.started);
  // A direct link avoids saving the old book as a side effect of the Home button.
  await page.goto("/#read/b/b-0");
  await expect(page.locator("#reader")).toContainText("Original page B.");
  await page.evaluate(() => (window as unknown as { acceptedPhotoWrite: { release: () => void } }).acceptedPhotoWrite.release());
  await page.waitForFunction(() => (window as unknown as { acceptedPhotoWrite: { pageSaved: boolean } }).acceptedPhotoWrite.pageSaved);
  await expect(page.locator("#count")).toHaveText("1 / 1");
  await page.goto(`/${originalHash}`);
  await expect(page.locator("#app")).toBeVisible({ timeout: 1500 });
  await expect(page.locator("#count")).toHaveText("1 / 1");
  await expect(page.locator("#crop")).toBeHidden();
  await page.reload();
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.locator("#count")).toHaveText("1 / 1");
});
