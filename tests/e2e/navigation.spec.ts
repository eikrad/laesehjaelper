import { expect, test } from "./fixtures";
import { fresh, openWorkshop, seedBooks } from "./helpers";

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Reading has one quiet workshop entry and Back stays inside the book and shelf", async ({ page }) => {
  await seedBooks(page, [{ id: "route", title: "En rolig bog", texts: ["Første side.", "Anden side."], lastPage: 1 }]);
  await page.locator(".book").click();
  await expect(page).toHaveURL(/#read\/route\/route-1$/);
  await expect(page.locator("#readingTitle")).toHaveText("En rolig bog");
  for (const id of ["bookTitle", "bookMenuBtn", "checkTextBtn", "editPagesBtn", "exportBtn", "edit", "thumbs", "delBookBtn", "compareBtn"]) {
    await expect(page.locator(`#${id}`)).toBeHidden();
  }
  await expect(page.locator("#editBookBtn")).toHaveText("Rediger bog");
  await openWorkshop(page);
  await expect(page).toHaveURL(/#edit\/route\/route-1$/);
  await expect(page.locator("#bookTitle")).toBeVisible();
  await page.reload();
  await expect(page.locator("#bookTitle")).toHaveValue("En rolig bog");
  await expect(page.locator("#reader")).toContainText("Anden side.");
  await page.goBack();
  await expect(page).toHaveURL(/#read\/route\/route-1$/);
  await expect(page.locator("#editBookBtn")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});

test("A workshop page link restores the selected page and its internal Back path", async ({ page }) => {
  await seedBooks(page, [{ id: "linked", title: "En bog med links", texts: ["Første side.", "En bestemt side."] }]);
  await page.goto("/#edit/linked/linked-1");
  await expect(page.locator("#reader")).toContainText("En bestemt side.");
  await page.click("#prev");
  await expect(page).toHaveURL(/#edit\/linked\/linked-0$/);
  await page.click("#readBookBtn");
  await expect(page.locator("#reader")).toContainText("Første side.");
  await expect(page).toHaveURL(/#read\/linked\/linked-0$/);
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});

test("Missing books return to the shelf and the sample survives reload", async ({ page }) => {
  await page.goto("/#read/missing/page");
  await expect(page.locator("#start")).toBeVisible();
  await page.click("#demoBtn");
  await page.reload();
  await expect(page.locator("#reader")).toContainText("pindsvin");
  await page.goBack();
  await expect(page.locator("#start")).toBeVisible();
});

test("Back during the first photo crop keeps the pending workshop usable", async ({ page }) => {
  const { fixture, waitForText } = await import("./helpers");
  await page.setInputFiles("#file", fixture("side-da.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#edit\//, { timeout: 1500 });
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  await page.click("#cropOk");
  await waitForText(page);
  await page.click("#readBookBtn");
  await expect(page).toHaveURL(/#read\//);
  await expect(page.locator("#reader")).toContainText("Pindsvinet");
});

test("A delayed book load cannot reopen after Back to the shelf", async ({ page }) => {
  await seedBooks(page, [{ id: "delayed", title: "En forsinket bog", texts: ["En selvskrevet side."] }]);
  // Hold a storage transaction open to reproduce slow device storage without mocking app code.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("laesehjaelper", 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const state = { release: false, finished: false };
    Object.assign(window, { slowStorage: state });
    const tx = db.transaction("pages", "readwrite");
    const keepOpen = () => { tx.objectStore("pages").get("delayed-0").onsuccess = () => { if (!state.release) keepOpen(); }; };
    keepOpen();
    tx.oncomplete = () => { state.finished = true; db.close(); };
  });
  await page.goto("/#read/delayed/delayed-0");
  await expect(page).toHaveURL(/#read\/delayed/);
  await page.goBack();
  await expect(page).toHaveURL(/#shelf$/);
  await page.evaluate(() => { (window as unknown as { slowStorage: { release: boolean } }).slowStorage.release = true; });
  await page.waitForFunction(() => (window as unknown as { slowStorage: { finished: boolean } }).slowStorage.finished);
  // Allow the formerly queued read and its UI update to finish before checking the winning navigation.
  await page.waitForTimeout(300);
  await expect(page.locator("#app")).toBeHidden({ timeout: 1500 });
  await expect(page).toHaveURL(/#shelf$/);
});
