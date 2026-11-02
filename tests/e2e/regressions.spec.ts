import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import type { Para } from "../../src/types";
import { fresh } from "./helpers";

test.use({ serviceWorkers: "block" });

interface StoredPage { text: string; rawText?: string; paras?: Para[] }
const para = (text: string): Para => ({ raw: text, text, bbox: { x0: 10, y0: 10, x1: 300, y1: 150 }, lines: [], words: [], lh: 30 });

/** Kleine eigene Texte im normalen Bücherregal, ohne von OCR-Genauigkeit abhängig zu sein. */
async function openStoredBook(page: Page, items: StoredPage[]) {
  await page.evaluate(async items => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("laesehjaelper", 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(["books", "pages"], "readwrite");
    const ids = items.map((_, i) => `regression-${i}`);
    tx.objectStore("books").put({ id: "regression", title: "Testbog", pageIds: ids, lastPage: 0, created: 1, cover: null });
    items.forEach((item, i) => tx.objectStore("pages").put({ ...item, rawText: item.rawText ?? item.text, id: ids[i], bookId: "regression", lang: "da", status: "done" }));
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, items);
  await page.reload(); await page.locator(".book").click();
  await expect(page.locator("#text")).toHaveValue(items[0].text);
  await page.locator("#edit summary").click();
}

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Korrektur bleibt beim sofortigen Weiterblättern erhalten", async ({ page }) => {
  await openStoredBook(page, [{ text: "Første side" }, { text: "Anden side" }]);
  await page.locator("#text").evaluate((el: HTMLTextAreaElement) => {
    el.value = "Rettet første side"; el.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("next")!.click();
  });
  await page.waitForTimeout(300);
  await page.click("#prev");
  await expect(page.locator("#text")).toHaveValue("Rettet første side", { timeout: 1500 });
  await page.reload(); await page.locator(".book").click();
  await expect(page.locator("#text")).toHaveValue("Rettet første side");
});

test("Zusätzliche Absätze überstehen Bindestrichwechsel und erneutes Öffnen", async ({ page }) => {
  await openStoredBook(page, [{ text: "Første side", paras: [para("Første side")] }]);
  await page.fill("#text", "Første side\n\nNy ekstra tekst");
  await expect(page.locator('#reader .w[data-word="ekstra"]')).toHaveCount(1);
  await page.click("#setBtn"); await page.click('#hyphSet button[data-v="bog"]');
  await expect(page.locator("#text")).toHaveValue("Første side\n\nNy ekstra tekst", { timeout: 1500 });
  await page.reload(); await page.locator(".book").click();
  await expect(page.locator("#text")).toHaveValue("Første side\n\nNy ekstra tekst");
});

test("Bindestrich-Einstellung gilt nach erneutem Öffnen weiterhin", async ({ page }) => {
  await openStoredBook(page, [{ text: "Vi går i sko-le" }]);
  await page.click("#setBtn"); await page.click('#hyphSet button[data-v="bog"]');
  await expect(page.locator("#text")).toHaveValue("Vi går i sko·le");
  await page.reload(); await page.locator(".book").click();
  await expect(page.locator('#hyphSet button[data-v="bog"]')).toHaveClass(/on/);
  await expect(page.locator("#text")).toHaveValue("Vi går i sko·le", { timeout: 1500 });
});

test("Zusatzabsätze aus bereits gespeicherten älteren Büchern bleiben erhalten", async ({ page }) => {
  await openStoredBook(page, [{ text: "Første side\n\nNy ekstra tekst", paras: [para("Første side")] }]);
  await expect(page.locator('#reader .w[data-word="ekstra"]')).toHaveCount(1);
});

test("Manuelle Zahlenabsätze bleiben beim erneuten Öffnen erhalten", async ({ page }) => {
  await openStoredBook(page, [{ text: "En side" }]);
  await page.fill("#text", "En side\n\n42");
  await expect(page.locator("#reader")).toContainText("42");
  await page.reload(); await page.locator(".book").click();
  await expect(page.locator("#text")).toHaveValue("En side\n\n42", { timeout: 1500 });
});

test("Wechsel zwischen Silben und Wortteilen berechnet die Segmente neu", async ({ page }) => {
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

test("Vorlesemarkierung bleibt nach Bindestrichwörtern beim richtigen Wort", async ({ page }) => {
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
