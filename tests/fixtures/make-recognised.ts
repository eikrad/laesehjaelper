// Recognise self-made test pages once in the app and store the result next to the photos
// (<name>.recognised.json), so end-to-end tests that only need a recognised page (layout,
// navigation, reading) can start from it instead of running text recognition every time.
// Tests of recognition itself keep using the photos. Run again when the stored page format or the
// recognition changes: npm run build && node tests/fixtures/make-recognised.ts
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const PHOTOS = ["side-da.jpg", "side-overskrift.jpg"];
const port = 4179, url = `http://localhost:${port}/`;

const server = spawn(process.execPath, ["tests/e2e/server.ts"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
try {
  for (let i = 0; i < 50 && !(await fetch(url).then(r => r.ok, () => false)); i++) await new Promise(r => setTimeout(r, 100));
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
  await page.goto(url);
  await page.setInputFiles("#file", PHOTOS.map(p => dir + p));
  for (let i = 0; i < PHOTOS.length; i++) {
    await page.locator("#crop").waitFor();
    await page.waitForFunction(() => !document.querySelector("#cropMsg")?.textContent?.includes("…"), null, { timeout: 120_000 });
    await page.click("#cropOk");
  }
  // Wait until every page is recognised and saved, then read the records with their images.
  const read = () => page.evaluate(async n => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("laesehjaelper", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(["books", "pages"]), books = tx.objectStore("books").getAll(), pages = tx.objectStore("pages").getAll();
    await new Promise<void>(resolve => { tx.oncomplete = () => resolve(); });
    db.close();
    const ids: string[] = books.result[0]?.pageIds || [];
    const list = ids.map(id => pages.result.find(p => p.id === id));
    if (list.length < n || list.some(p => !p || p.status !== "done" || !p.cleanBlob)) return null;
    const b64 = async (b: Blob | null) => {
      if (!b) return null;
      const u = new Uint8Array(await b.arrayBuffer());
      let s = "";
      for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192));
      return btoa(s);
    };
    return Promise.all(list.map(async p => ({
      lang: p.lang, text: p.text, rawText: p.rawText, paras: p.paras, workW: p.workW, workH: p.workH, corners: p.corners,
      input: await b64(p.inputBlob), photo: await b64(p.photoBlob), clean: await b64(p.cleanBlob),
    })));
  }, PHOTOS.length);
  let records = await read();
  for (let i = 0; !records && i < 600; i++) { await page.waitForTimeout(500); records = await read(); }
  if (!records) throw new Error("The pages were not recognised in time");
  records.forEach((r, i) => {
    const out = dir + PHOTOS[i].replace(/\.jpg$/, ".recognised.json");
    fs.writeFileSync(out, JSON.stringify(r) + "\n");
    console.log(`${out}: ${JSON.stringify(r.text).slice(0, 60)}…`);
  });
  await browser.close();
} finally {
  server.kill();
}
