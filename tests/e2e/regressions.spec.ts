import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import type { Para } from "../../src/types";
import { bookTool, fresh } from "./helpers";

test.use({ serviceWorkers: "block" });

interface StoredPage { text: string; rawText?: string; paras?: Para[]; image?: boolean }
const para = (text: string): Para => ({ raw: text, text, bbox: { x0: 10, y0: 10, x1: 300, y1: 150 }, lines: [], words: [], lh: 30 });

/** Short original texts in the normal bookshelf, independent of OCR accuracy. */
async function openStoredBook(page: Page, items: StoredPage[]) {
  await page.evaluate(async items => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 2;
    canvas.getContext("2d")!.fillRect(0, 0, 2, 2);
    const image = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg"));
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("laesehjaelper", 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(["books", "pages"], "readwrite");
    const ids = items.map((_, i) => `regression-${i}`);
    tx.objectStore("books").put({ id: "regression", title: "Testbog", pageIds: ids, lastPage: 0, created: 1, cover: null });
    items.forEach((item, i) => tx.objectStore("pages").put({ ...item, rawText: item.rawText ?? item.text, inputBlob: item.image ? image : null, cleanBlob: item.image ? image : null, id: ids[i], bookId: "regression", lang: "da", status: "done" }));
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, items);
  await page.reload(); await page.locator(".book").click();
  await expect(page.locator("#text")).toHaveValue(items[0].text);
  await bookTool(page, "checkTextBtn");
}

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Preserves corrections when immediately turning the page", async ({ page }) => {
  await openStoredBook(page, [{ text: "Første side" }, { text: "Anden side" }]);
  await page.locator("#text").evaluate((el: HTMLTextAreaElement) => {
    el.value = "Rettet første side"; el.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("next")!.click();
  });
  await page.waitForTimeout(300);
  await page.click("#prev");
  await expect(page.locator("#text")).toHaveValue("Rettet første side", { timeout: 1500 });
  await page.reload();
  await expect(page.locator("#text")).toHaveValue("Rettet første side");
});

test("Additional paragraphs survive hyphen-setting changes and reopening", async ({ page }) => {
  await openStoredBook(page, [{ text: "Første side", paras: [para("Første side")] }]);
  await page.fill("#text", "Første side\n\nNy ekstra tekst");
  await expect(page.locator('#reader .w[data-word="ekstra"]')).toHaveCount(1);
  await page.click("#setBtn"); await page.click('#hyphSet button[data-v="bog"]');
  await expect(page.locator("#text")).toHaveValue("Første side\n\nNy ekstra tekst", { timeout: 1500 });
  await page.reload();
  await expect(page.locator("#text")).toHaveValue("Første side\n\nNy ekstra tekst");
});

test("The hyphen setting remains effective after reopening", async ({ page }) => {
  await openStoredBook(page, [{ text: "Vi går i sko-le" }]);
  await page.click("#setBtn"); await page.click('#hyphSet button[data-v="bog"]');
  await expect(page.locator("#text")).toHaveValue("Vi går i sko·le");
  await page.reload();
  await expect(page.locator('#hyphSet button[data-v="bog"]')).toHaveClass(/on/);
  await expect(page.locator("#text")).toHaveValue("Vi går i sko·le", { timeout: 1500 });
});

test("Preserves additional paragraphs in older saved books", async ({ page }) => {
  await openStoredBook(page, [{ text: "Første side\n\nNy ekstra tekst", paras: [para("Første side")] }]);
  await expect(page.locator('#reader .w[data-word="ekstra"]')).toHaveCount(1);
});

test("Preserves manually entered numeric paragraphs after reopening", async ({ page }) => {
  await openStoredBook(page, [{ text: "En side" }]);
  await page.fill("#text", "En side\n\n42");
  await expect(page.locator("#reader")).toContainText("42");
  await page.reload();
  await expect(page.locator("#text")).toHaveValue("En side\n\n42", { timeout: 1500 });
});

test("Switching between syllables and word parts rebuilds the segments", async ({ page }) => {
  await page.click("#demoBtn"); await page.click("#setBtn");
  const parts = page.locator('#reader .w[data-word="pindsvin"] .s');
  await expect(parts).toHaveText(["pinds", "vin"]);
  await page.click('#mode button[data-v="morf"]');
  await expect(parts).toHaveText(["pind", "svin"]);
  await page.click('#mode button[data-v="farbe"]');
  await expect(parts).toHaveText(["pinds", "vin"], { timeout: 1500 });
  await page.click('#mode button[data-v="morf"]');
  await expect(parts).toHaveText(["pind", "svin"]);
});

test("Speech highlighting stays aligned after hyphenated words", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: {
      getVoices: () => [], cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => {
        setTimeout(() => u.onboundary?.(Object.assign(new Event("boundary"), { name: "word", charIndex: 9 }) as SpeechSynthesisEvent), 10);
      },
    }, configurable: true });
  });
  await page.reload();
  await openStoredBook(page, [{ text: "rot-blau ist schön" }]);
  await page.click("#readBtn");
  await expect(page.locator("#reader .w.speaking")).toHaveAttribute("data-word", "ist", { timeout: 1500 });
});

test("Manually entered text can be read aloud after an empty OCR result", async ({ page }) => {
  await openStoredBook(page, [{ text: "" }]);
  await expect(page.locator("#readBtn")).toBeDisabled();
  await page.fill("#text", "Nu har siden tekst");
  await expect(page.locator('#reader .w[data-word="tekst"]')).toHaveCount(1);
  await expect(page.locator("#readBtn")).toBeEnabled({ timeout: 1500 });
});

test("A page deleted during OCR stays deleted after reopening", async ({ page }) => {
  await page.route("**/tesseract.min.js", route => route.fulfill({ contentType: "text/javascript", body: `
    let first = true;
    window.Tesseract = { createWorker: async () => ({
      setParameters: async () => {},
      recognize: async () => {
        if (first) { first = false; await new Promise(r => { window.finishRecognition = r; }); }
        return { data: { text: 'En prøveside', blocks: [{ paragraphs: [{ lines: [{ text: 'En prøveside',
          bbox: {x0:100,y0:100,x1:350,y1:130}, words: [
            {text:'En',confidence:97,bbox:{x0:100,y0:100,x1:130,y1:130}},
            {text:'prøveside',confidence:97,bbox:{x0:150,y0:100,x1:350,y1:130}}
          ] }] }] }] } };
      }
    }) };
  ` }));
  await page.reload();
  const { addPhotos, openWorkshop, waitForText } = await import("./helpers");
  await addPhotos(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await page.waitForFunction(() => "finishRecognition" in window);
  await openWorkshop(page);
  await page.locator(".thumb").first().locator(".ctl .x").click();
  await expect(page.locator(".thumb")).toHaveCount(1);
  await page.evaluate(() => (window as unknown as { finishRecognition: () => void }).finishRecognition());
  await waitForText(page);
  await page.click("#home"); await page.locator(".book").click();
  await expect(page.locator("#count")).toHaveText("1 / 1", { timeout: 1500 });
});

test("Releases images from previous book views when reopening", async ({ page }) => {
  await openStoredBook(page, [{ text: "En side med billede", image: true }]);
  const previousUrl = await page.locator("#origImg").getAttribute("src");
  await page.click("#home"); await page.locator(".book").click();
  await expect(page.locator("#text")).toHaveValue("En side med billede");
  await expect(page.locator("#origImg")).not.toHaveAttribute("src", previousUrl!);
  const isReadable = (url: string) => page.evaluate(async url => {
    try { return (await fetch(url)).ok; } catch { return false; }
  }, url);
  expect(await isReadable(previousUrl!)).toBe(false);
  expect(await isReadable((await page.locator("#origImg").getAttribute("src"))!)).toBe(true);
});
