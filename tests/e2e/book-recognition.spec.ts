import { expect, test } from "./fixtures";
import fs from "node:fs";
import { fixture, fresh, openRecognisedBook, openWorkshop, setUiLanguage, storedPages } from "./helpers";

test.use({ serviceWorkers: "block" });

async function fakeRecognition(page: import("@playwright/test").Page, failAt = 0, hold = false) {
  await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body: `
    window.batchCalls = [];
    window.Tesseract = { createWorker: async () => ({ setParameters: async () => {}, recognize: async image => {
      window.batchCalls.push({ width: image.width, height: image.height });
      const n = window.batchCalls.length;
      if (${hold} && n === 1) await new Promise(resolve => window.batchRelease = resolve);
      if (n === ${failAt}) throw new Error('Test photo failure');
      return { data: { text: 'Ny original tekst.', blocks: null } };
    } }) };
  ` }));
}

async function seedBatch(page: import("@playwright/test").Page, photoName?: string) {
  await fresh(page);
  await openRecognisedBook(page, ["side-da.jpg", "side-da.jpg", "side-da.jpg", "side-da.jpg"]);
  const photo = photoName && photoName !== "blank" ? fs.readFileSync(fixture(photoName)).toString("base64") : photoName;
  await page.evaluate(async photo => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); });
    const tx = db.transaction("pages", "readwrite"), store = tx.objectStore("pages");
    const r = store.getAll();
    r.onsuccess = () => r.result.forEach((p, i) => {
      if (i < 2) p.manualEdits = i === 1;
      p.lang = ["da", "de", "en", "de"][i];
      if (i === 3) { p.photoBlob = null; p.inputBlob = null; }
      if (i === 0 && photo) {
        let b64 = photo;
        if (photo === "blank") {
          const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 1600;
          const ctx = canvas.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, 1200, 1600);
          b64 = canvas.toDataURL("image/jpeg").split(",")[1];
        }
        p.photoBlob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: "image/jpeg" });
      }
      p.question = "En egen prøvefråga";
      store.put(p);
    });
    await new Promise<void>(resolve => { tx.oncomplete = () => resolve(); }); db.close();
  }, photo);
  await page.goto("/"); await page.locator(".book").click();
  await setUiLanguage(page, "en");
  await openWorkshop(page);
}

test("Book recognition previews protected and missing pages and resets explicit inclusion", async ({ page }) => {
  await seedBatch(page);
  await page.locator("#reprocessBookBtn").click({ timeout: 1500 });
  const dialog = page.locator("#bookRecognition");
  await expect(dialog).toBeVisible();
  await expect(page.locator("#batchIncludeManual")).not.toBeChecked();
  await expect(page.locator("#batchPlan")).toContainText("1 to process · 2 protected · 1 without source photos");
  await page.locator("#batchIncludeManual").check();
  await expect(page.locator("#batchPlan")).toContainText("3 to process · 0 protected · 1 without source photos");
  await expect(dialog).toContainText("replaces manual text corrections");
  await page.keyboard.press("Escape");
  await page.click("#reprocessBookBtn");
  await expect(page.locator("#batchIncludeManual")).not.toBeChecked();
});

test("Book recognition replaces only eligible pages and saves their identity and manual protection", async ({ page }) => {
  await fakeRecognition(page);
  await seedBatch(page);
  const before = await storedPages(page);
  await page.click("#reprocessBookBtn"); await page.click("#batchStart");
  await expect(page.locator("#batchProgress")).toContainText("1 succeeded · 0 failed", { timeout: 3000 });
  await page.click("#batchClose");
  await page.goto("/"); await page.locator(".book").click();
  await expect(page.locator("#reader")).toContainText("Ny original tekst.");
  const after = await storedPages(page);
  expect(after.map(p => p.id)).toEqual(before.map(p => p.id));
  expect(after.slice(1)).toEqual(before.slice(1));
  const metadata = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); });
    const r = db.transaction("pages").objectStore("pages").getAll();
    const records = await new Promise<{ lang: string; question: string }[]>(resolve => { r.onsuccess = () => resolve(r.result); });
    db.close(); return records.map(p => ({ lang: p.lang, question: p.question }));
  });
  expect(metadata).toEqual(["da", "de", "en", "de"].map(lang => ({ lang, question: "En egen prøvefråga" })));
  await openWorkshop(page); await page.click("#checkTextBtn");
  await page.fill("#text", "En manuel original rettelse.");
  await page.goto("/"); await page.locator(".book").click(); await openWorkshop(page);
  await page.click("#reprocessBookBtn");
  await expect(page.locator("#batchPlan")).toContainText("0 to process · 3 protected");
});

test("Explicit inclusion continues after a failed page and keeps its existing result", async ({ page }) => {
  await fakeRecognition(page, 3);
  await seedBatch(page);
  const before = await storedPages(page);
  await page.click("#reprocessBookBtn"); await page.locator("#batchIncludeManual").check(); await page.click("#batchStart");
  await expect(page.locator("#batchProgress")).toContainText("2 succeeded · 1 failed", { timeout: 3000 });
  await expect(page.locator("#batchIncludeManual")).not.toBeChecked({ timeout: 1500 });
  await expect(page.locator("#batchResults")).toContainText("Page 2: Failed; previous content kept");
  const after = await storedPages(page);
  expect(after.map(p => p.text)).toEqual(["Ny original tekst.", before[1].text, "Ny original tekst.", before[3].text]);
  expect(after.map(p => p.status)).toEqual(["done", "done", "done", "done"]);
  expect(after.map(p => p.id)).toEqual(before.map(p => p.id));
  await page.click("#batchClose"); await page.click("#reprocessBookBtn");
  await expect(page.locator("#batchResults")).toContainText("Page 2: Failed; previous content kept", { timeout: 1500 });
});

test("Cancellation finishes the current page and leaves remaining pages untouched", async ({ page }) => {
  await fakeRecognition(page, 0, true); await seedBatch(page);
  const before = await storedPages(page);
  await page.click("#reprocessBookBtn"); await page.locator("#batchIncludeManual").check(); await page.click("#batchStart");
  await page.waitForFunction(() => "batchRelease" in window);
  await page.click("#batchCancel");
  await expect(page.locator("#batchCancel")).toBeDisabled();
  await page.evaluate(() => { if ("batchRelease" in window) (window.batchRelease as () => void)(); });
  await expect(page.locator("#batchStart")).toBeVisible();
  await expect(page.locator("#batchProgress")).toContainText("Cancelled", { timeout: 1500 });
  await expect(page.locator("#batchProgress")).toContainText("1 succeeded · 0 failed · 0 changed or deleted · 2 remaining");
  expect((await storedPages(page)).slice(1)).toEqual(before.slice(1));
});

test("Single-page recognition establishes a protected-edit history that survives reopening", async ({ page }) => {
  await fakeRecognition(page); await seedBatch(page);
  await page.locator("#thumbs .thumb > button").nth(2).click();
  await page.click("#checkTextBtn"); await page.click("#reocrBtn");
  await expect(page.locator("#reader")).toContainText("Ny original tekst.");
  await page.reload();
  await page.click("#reprocessBookBtn");
  await expect(page.locator("#batchPlan")).toContainText("2 to process · 1 protected");
});

test("Automatic page detection straightens the stored original without visiting the crop dialog", async ({ page }) => {
  await fakeRecognition(page); await seedBatch(page, "foto-curved-auto.jpg");
  await page.click("#reprocessBookBtn"); await page.locator("#batchDetect").check(); await page.click("#batchStart");
  await expect(page.locator("#batchProgress")).toContainText("1 succeeded · 0 failed", { timeout: 10000 });
  expect((await storedPages(page))[0].corners).toBe(true);
  await expect(page.locator("#crop")).toBeHidden();
  await page.click("#batchClose"); await page.reload(); await openWorkshop(page); await page.click("#checkTextBtn");
  await page.click("#recropBtn");
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropPoly")).toHaveAttribute("d", /Q/);
});

test("Automatic detection keeps the existing crop when no page is found", async ({ page }) => {
  await fakeRecognition(page); await seedBatch(page, "blank");
  const before = await storedPages(page);
  await page.click("#reprocessBookBtn"); await page.locator("#batchDetect").check(); await page.click("#batchStart");
  await expect(page.locator("#batchProgress")).toContainText("1 succeeded · 0 failed", { timeout: 10000 });
  await expect(page.locator("#batchResults")).toContainText("No page found; existing crop kept", { timeout: 1500 });
  expect((await storedPages(page))[0].corners).toBe(before[0].corners);
});

for (const action of ["edit", "delete"] as const) {
  test(`A running book job cannot overwrite a newer ${action}`, async ({ page }) => {
    await fakeRecognition(page, 0, true); await seedBatch(page);
    await page.click("#reprocessBookBtn"); await page.click("#batchStart");
    await page.waitForFunction(() => "batchRelease" in window);
    await page.click("#batchClose");
    await expect(page.locator("#reader")).toContainText("Søren");
    if (action === "edit") {
      await page.click("#checkTextBtn"); await page.fill("#text", "Min nyere originale rettelse.");
    } else {
      await page.locator("#thumbs .thumb").first().locator(".x").click();
      await expect(page.locator("#thumbs .thumb")).toHaveCount(3);
    }
    await page.evaluate(() => { if ("batchRelease" in window) (window.batchRelease as () => void)(); });
    await expect(page.locator("#batchNotice")).toContainText("0 succeeded · 0 failed · 1 changed or deleted", { timeout: 3000 });
    await page.reload();
    if (action === "edit") await expect(page.locator("#reader")).toContainText("Min nyere originale rettelse.");
    else expect((await storedPages(page)).map(p => p.id)).toEqual(["recognised-1", "recognised-2", "recognised-3"]);
  });
}

for (const action of ["edit", "delete"] as const) {
  test(`A book job cannot overwrite a newer ${action} from another tab`, async ({ page }) => {
    await fakeRecognition(page, 0, true); await seedBatch(page);
    await page.click("#reprocessBookBtn"); await page.click("#batchStart");
    await page.waitForFunction(() => "batchRelease" in window);
    const other = await page.context().newPage();
    await other.goto(page.url()); await openWorkshop(other);
    if (action === "edit") {
      await other.click("#checkTextBtn"); await other.fill("#text", "Min originale rettelse fra en anden fane.");
    } else {
      await other.locator("#thumbs .thumb").first().locator(".x").click();
      await expect(other.locator("#thumbs .thumb")).toHaveCount(3);
    }
    await page.evaluate(() => { if ("batchRelease" in window) (window.batchRelease as () => void)(); });
    await expect(page.locator("#batchProgress")).toContainText("0 succeeded · 0 failed · 1 changed or deleted", { timeout: 3000 });
    await page.reload();
    if (action === "edit") await expect(page.locator("#reader")).toContainText("Min originale rettelse fra en anden fane.");
    else expect((await storedPages(page)).map(p => p.id)).toEqual(["recognised-1", "recognised-2", "recognised-3"]);
    await other.close();
  });
}

test("A page edited before its turn is skipped while other eligible pages continue", async ({ page }) => {
  await fakeRecognition(page, 0, true); await seedBatch(page);
  await page.click("#reprocessBookBtn"); await page.locator("#batchIncludeManual").check(); await page.click("#batchStart");
  await page.waitForFunction(() => "batchRelease" in window); await page.click("#batchClose");
  await page.locator("#thumbs .thumb > button").nth(1).click();
  await page.click("#checkTextBtn"); await page.fill("#text", "Meine neuere eigene Korrektur.");
  await page.evaluate(() => { if ("batchRelease" in window) (window.batchRelease as () => void)(); });
  await expect(page.locator("#batchNotice")).toContainText("2 succeeded · 0 failed · 1 changed or deleted", { timeout: 5000 });
  expect((await storedPages(page)).slice(0, 3).map(p => p.text)).toEqual(["Ny original tekst.", "Meine neuere eigene Korrektur.", "Ny original tekst."]);
});
