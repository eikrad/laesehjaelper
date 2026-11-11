import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fixture, fresh, openRecognisedBook, openWorkshop, seedBooks } from "./helpers";

// Layout checks. Unlike the other specs, these run at every screen size the app is
// designed for: phone, tablet portrait, tablet landscape and laptop (see playwright.config.ts).

test.beforeEach(async ({ page }) => { await fresh(page); });

test("Adult reading tips fit every screen in every interface language", async ({ page }, info) => {
  await page.click("#demoBtn");
  await openWorkshop(page);
  const tips = page.locator("#adultTips");
  for (const ui of ["da", "de", "en"]) {
    await page.click(`#uiLang button[data-v="${ui}"]`);
    const summary = tips.locator("summary");
    await summary.click();
    await expect(tips.locator("li")).toHaveCount(5);
    const bounds = (await tips.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(await sidewaysScroll(page)).toBe(0);
    await expect.poll(() => smallControls(page, 44, "#adultTips")).toEqual([]);
    await tips.screenshot({ path: info.outputPath(`adult-tips-${ui}.png`) });
    await summary.click();
  }
  await page.click("#readBookBtn");
  await expect(tips).toBeHidden();
});

test("Reading guides fit every screen with usable controls and a single large row", async ({ page }, info) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  for (const mode of ["ruler", "line"]) {
    await page.click("#setBtn"); await page.click(`#guideSet button[data-v="${mode}"]`); await page.click("#setBtn");
    await expect(page.locator("#guideTools")).toBeVisible();
    const tools = (await page.locator("#guideTools").boundingBox())!;
    expect(tools.x).toBeGreaterThanOrEqual(0);
    expect(tools.x + tools.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(tools.y + tools.height).toBeLessThanOrEqual((await page.locator("#dock").boundingBox())!.y);
    for (const id of ["guidePrev", "guideNext"]) {
      const b = (await page.locator(`#${id}`).boundingBox())!;
      expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44);
    }
    if (mode === "line") {
      const tops = await page.locator("#guideLine .w").evaluateAll(ws => ws.map(w => w.getBoundingClientRect().top));
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
      expect(await sidewaysScroll(page)).toBe(0);
    }
    await page.screenshot({ path: info.outputPath(`guide-${mode}.png`) });
  }
});

test("Stored books come first, with large covers and a secondary new-book action", async ({ page }) => {
  await seedBooks(page, Array.from({ length: 6 }, (_, i) => ({ id: `shelf-${i}`, title: i === 5 ? "Enmegetlangselvskrevetprøvebogstiteludenmellemrum" : `Prøvebog ${i + 1}`, texts: ["En selvskrevet prøveside."] })));
  await expect(page.locator("#shelf")).toBeVisible();
  const shelf = (await page.locator("#shelf").boundingBox())!, photo = (await page.locator("#drop").boundingBox())!;
  expect(shelf.y + shelf.height, "books come before creating another book").toBeLessThanOrEqual(photo.y);
  await expect(page.locator("#drop")).toContainText("Ny bog");
  const covers = await page.locator(".book").evaluateAll(books => books.map(b => { const r = b.getBoundingClientRect(); return { width: r.width, height: r.height, y: r.y }; }));
  for (const b of covers) { expect(b.width).toBeGreaterThanOrEqual(48); expect(b.height).toBeGreaterThanOrEqual(48); }
  const columns = covers.filter(b => Math.abs(b.y - covers[0].y) < 1).length;
  if (page.viewportSize()!.width < 600) expect(columns).toBe(2);
  if (page.viewportSize()!.width >= 840) expect(columns).toBeGreaterThan(2);
  expect(await sidewaysScroll(page)).toBe(0);
  await expect(page.locator("#demoBtn")).toBeVisible();
  await expect(page.locator("label:has(#importFile)")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(Object.assign(new Event("beforeinstallprompt"), { prompt: () => Promise.resolve() })));
  await expect(page.locator("#installBtn")).toBeVisible();
});

test("Reading has one quiet editing entry in every language and fits the screen", async ({ page }) => {
  await page.click("#demoBtn");
  for (const [lang, name] of [["da", "Rediger bog"], ["de", "Buch bearbeiten"], ["en", "Edit book"]]) {
    await page.click(`#uiLang button[data-v=${lang}]`);
    await expect(page.locator("#editBookBtn")).toHaveAccessibleName(name);
    await expect(page.locator("#bookTitle")).toBeHidden();
    await expect(page.locator("#thumbs")).toBeHidden();
    await page.click("#editBookBtn");
    const entry = (await page.locator("#editEntry").boundingBox())!;
    expect(entry.x).toBeGreaterThanOrEqual(0);
    expect(entry.x + entry.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expect.poll(() => smallControls(page, 44, ".reading-entry")).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.locator("#editEntry")).toBeHidden();
    expect(await sidewaysScroll(page)).toBe(0);
  }
});

/**
 * Visible controls under `scope` that are smaller than `min` px in either direction.
 * Links inside running text are exempt, as in WCAG 2.5.5; a colour picker's label is its target.
 */
const smallControls = (page: Page, min = 44, scope = "body") =>
  page.evaluate(([min, scope]) => {
    const sel = "button, select, input:not([type=color]), textarea, summary, a, label.linkbtn, label.add, .pick, [role=button], .grip";
    return [...document.querySelector(scope)!.querySelectorAll<HTMLElement>(sel)].flatMap(el => {
      if (el.tagName === "A" && el.closest("p")) return [];
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return [];
      const r = el.getBoundingClientRect();
      let { left, right, top, bottom } = r;
      // An ancestor can clip a nominally large target down to a much smaller hit area. Inside a
      // scroll container the target can be scrolled into view, so clipping stops there.
      let clipX = true, clipY = true;
      for (let parent = el.parentElement; parent && (clipX || clipY); parent = parent.parentElement) {
        const style = getComputedStyle(parent), clip = parent.getBoundingClientRect();
        if (["auto", "scroll"].includes(style.overflowX)) clipX = false;
        else if (clipX && ["hidden", "clip"].includes(style.overflowX)) { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
        if (["auto", "scroll"].includes(style.overflowY)) clipY = false;
        else if (clipY && ["hidden", "clip"].includes(style.overflowY)) { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
      }
      const width = Math.max(0, right - left), height = Math.max(0, bottom - top);
      if (width >= min && height >= min) return [];
      const name = el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}.${el.className} "${(el.textContent || "").trim().slice(0, 16)}"`;
      return [`${name} ${Math.round(width)}×${Math.round(height)}`];
    });
  }, [min, scope] as const);

/** How far the page can be scrolled sideways, in CSS pixels. */
const sidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test("The start screen fits the screen width", async ({ page }) => {
  expect(await sidewaysScroll(page)).toBe(0);
});

test("A book page fits the screen width", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  expect(await sidewaysScroll(page)).toBe(0);
});

test("The toolbar fits on one line inside the screen in every language", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  const viewport = page.viewportSize()!;
  // Check both sides of the compact-toolbar breakpoint without repeating OCR.
  const widths = viewport.width === 360 ? [360, 440, 441, 600, 601] : [viewport.width];
  for (const width of widths) {
    await page.setViewportSize({ width, height: viewport.height });
    for (const lang of ["da", "de", "en"]) {
      await page.click(`#uiLang button[data-v=${lang}]`);
      for (const button of await page.locator("#dock button:visible").all()) {
        const box = (await button.boundingBox())!;
        expect(box.x, `${width}px, ${lang}: ${await button.getAttribute("id")}`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${width}px, ${lang}: ${await button.getAttribute("id")}`).toBeLessThanOrEqual(width);
      }
      // The read-aloud label does not wrap onto a second line.
      const lines = await page.locator("#readBtn span").evaluate(el => {
        const r = document.createRange(); r.selectNodeContents(el);
        return new Set([...r.getClientRects()].map(rect => Math.round(rect.top))).size;
      });
      expect(lines, `${width}px, ${lang}`).toBeLessThanOrEqual(1);
    }
  }
});

test("The crop dialog fills the screen and keeps its buttons after turning the device", async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, "Laptops are not turned.");
  await page.setInputFiles("#file", fixture("side-da.jpg"));
  await expect(page.locator("#crop")).toBeVisible();
  await expect(page.locator("#cropMsg")).not.toContainText("…", { timeout: 120_000 });
  const { width, height } = page.viewportSize()!;
  await page.setViewportSize({ width: height, height: width });   // Rotate.
  await expect(async () => {
    const dlg = (await page.locator("#crop").boundingBox())!;
    expect(Math.round(dlg.y), "dialog top").toBe(0);
    expect(Math.round(dlg.height), "dialog height").toBe(width);
    for (const id of ["#cropOk", "#cropWhole"]) {
      const b = (await page.locator(id).boundingBox())!;
      expect(b.y + b.height, id).toBeLessThanOrEqual(width);
    }
  }).toPass({ timeout: 5_000 });
});

test("The automatic curved frame and its controls fit the crop photo", async ({ page }) => {
  await page.setInputFiles("#file", fixture("foto-curved-auto.jpg"));
  await expect(page.locator("#cropMsg")).toContainText("Siden er fundet", { timeout: 120_000 });
  const image = (await page.locator("#cropCanvas").boundingBox())!;
  const handles = await page.locator("#cropStage .h").evaluateAll(hs => hs.map(h => {
    const r = h.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }));
  expect(handles).toHaveLength(8);
  expect((handles[6].y - (handles[2].y + handles[3].y) / 2) / (image.width / 1200)).toBeGreaterThan(40);
  for (const p of handles) {
    expect(p.x).toBeGreaterThanOrEqual(image.x); expect(p.x).toBeLessThanOrEqual(image.x + image.width);
    expect(p.y).toBeGreaterThanOrEqual(image.y); expect(p.y).toBeLessThanOrEqual(image.y + image.height);
  }
  for (const id of ["#cropOk", "#cropWhole"]) {
    const b = (await page.locator(id).boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
});

test("On touch screens every control is at least 44 px", async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, "A mouse pointer hits smaller targets.");
  await expect.poll(() => smallControls(page), { message: "start screen" }).toEqual([]);
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await expect.poll(() => smallControls(page), { message: "reading" }).toEqual([]);
  await expect.poll(() => smallControls(page, 48, "#dock"), { message: "reading toolbar" }).toEqual([]);
  await page.click("#setBtn");
  // Measure the open sheet, not the first frame of its fade-in (all controls still invisible).
  await expect(page.locator("#settings")).toHaveCSS("opacity", "1");
  await expect.poll(() => smallControls(page), { message: "settings" }).toEqual([]);
  await page.click("#setBtn");
  await openWorkshop(page);
  await expect.poll(() => smallControls(page), { message: "workshop" }).toEqual([]);
  await page.locator("#checkTextBtn").evaluate((b: HTMLButtonElement) => b.click());
  await page.locator("#moveBtn").evaluate((b: HTMLButtonElement) => b.click());
  await expect.poll(() => smallControls(page), { message: "editing pages and text boxes" }).toEqual([]);
});

test("On touch screens taps do not zoom and words keep no hover colour", async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, "Only touch screens zoom on double tap and keep hover after a tap.");
  await page.click("#demoBtn");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).touchAction)).toBe("manipulation");
  const word = page.locator("#reader .w").first();
  await word.hover();
  await page.waitForTimeout(300);   // Longer than the colour transition.
  expect(await word.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
});

/** Check that the whole book page is visible between the book bar and the toolbar, and all text fits its boxes. */
async function expectPageOnScreen(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(async () => {
    const bar = (await page.locator(".bookbar").boundingBox())!;
    const dock = (await page.locator("#dock").boundingBox())!;
    const pv = (await page.locator("#reader .pageview").boundingBox())!;
    expect(pv.y, "page top below the book bar").toBeGreaterThanOrEqual(bar.y + bar.height);
    expect(pv.y + pv.height, "page bottom above the toolbar").toBeLessThanOrEqual(dock.y);
    const overflow = await page.locator("#reader .tbox-text").evaluateAll(texts => texts.filter(t => t.scrollHeight > t.clientHeight + 1).length);
    expect(overflow, "text boxes whose text does not fit").toBe(0);
  }).toPass({ timeout: 5_000 });
}

test("The whole book page is on screen on tablets and laptops; phones use the full width", async ({ page }, info) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  const { width, height } = page.viewportSize()!;
  if (width < 600) {
    const reader = (await page.locator("#reader").boundingBox())!;
    expect((await page.locator("#reader .pageview").boundingBox())!.width).toBeGreaterThan(reader.width - 2);
    return;
  }
  await expectPageOnScreen(page);
  // The page stays on screen in reading mode too.
  await page.click("#focusBtn");
  const pv = (await page.locator("#reader .pageview").boundingBox())!, dock = (await page.locator("#dock").boundingBox())!;
  expect(pv.y, "reading mode: page top").toBeGreaterThanOrEqual(0);
  expect(pv.y + pv.height, "reading mode: page bottom above the toolbar").toBeLessThanOrEqual(dock.y);
  await page.click("#focusBtn");
  if (!info.project.use.hasTouch) return;
  await page.setViewportSize({ width: height, height: width });   // Rotate.
  await expectPageOnScreen(page);
});

test("Scrolled to the end, the toolbar covers nothing that can be tapped", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await openWorkshop(page);   // Editing adds the most controls below the page.
  await page.locator("#checkTextBtn").evaluate((b: HTMLButtonElement) => b.click());
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const dock = (await page.locator("#dock").boundingBox())!;
  for (const el of await page.locator("#app button:visible, #app summary:visible, #app label:visible").all()) {
    const b = await el.boundingBox();
    if (!b) continue;   // Not rendered, so nothing to cover.
    const overlaps = b.x < dock.x + dock.width && dock.x < b.x + b.width && b.y < dock.y + dock.height && dock.y < b.y + b.height;
    expect(overlaps, await el.evaluate(e => e.outerHTML.slice(0, 80))).toBe(false);
  }
});

/** A real touch move on the reader, starting near its top, by (dx, dy) px. */
async function swipeOnReader(page: Page, dx: number, dy: number) {
  const r = (await page.locator("#reader").boundingBox())!;
  const x = r.x + r.width / 2, y = r.y + 80;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 5; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * i / 5, y: y + dy * i / 5 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

test("Swiping turns the page; taps, scrolling and moving text boxes do not", async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, "Swiping needs a touch screen.");
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"]);
  const count = page.locator("#count");
  await expect(count).toHaveText("1 / 2");
  await swipeOnReader(page, -150, 0);
  await expect(count).toHaveText("2 / 2");
  await swipeOnReader(page, 150, 0);
  await expect(count).toHaveText("1 / 2");
  await swipeOnReader(page, -10, 0);    // A tap.
  await swipeOnReader(page, -60, 200);  // Scrolling.
  await expect(count).toHaveText("1 / 2");
  await openWorkshop(page);
  await page.locator("#checkTextBtn").evaluate((b: HTMLButtonElement) => b.click());
  await page.locator("#moveBtn").evaluate((b: HTMLButtonElement) => b.click());
  await page.evaluate(() => window.scrollTo(0, 0));
  await swipeOnReader(page, -150, 0);
  await expect(count).toHaveText("1 / 2");
});

test("On wide screens big buttons at the screen edges turn the page", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg", "side-overskrift.jpg"]);
  const width = page.viewportSize()!.width;
  const prev = page.locator("#edgePrev"), next = page.locator("#edgeNext");
  if (width < 840) {
    await expect(next).toBeHidden();
    return;
  }
  await expect(prev).toBeHidden();   // No page before the first one.
  const box = (await next.boundingBox())!, card = (await page.locator(".pagecard").boundingBox())!;
  expect(box.x + box.width, "at the right edge of the screen").toBeGreaterThan(width - 40);
  expect(box.x, "beside the page, not on it").toBeGreaterThanOrEqual(card.x + card.width);
  await next.click();
  await expect(page.locator("#count")).toHaveText("2 / 2");
  await expect(next).toBeHidden();
  await prev.click();
  await expect(page.locator("#count")).toHaveText("1 / 2");
});

test("In text view on wide screens the photo sits beside the text, otherwise above it", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  await page.click("#setBtn");
  await page.click("#viewSet button[data-v=tekst]");
  await page.click("#setBtn");
  const photo = page.locator("#orig"), text = page.locator("#reader");
  await expect(photo).toBeVisible();
  const p = (await photo.boundingBox())!, r = (await text.boundingBox())!;
  if (page.viewportSize()!.width >= 840) {
    expect(p.x + p.width, "photo left of the text").toBeLessThanOrEqual(r.x + 1);
    expect(Math.abs(p.y - r.y), "photo and text start at the same height").toBeLessThan(2);
    const prev = (await page.locator(".pagecard").boundingBox())!;
    expect(prev.x, "room for the page buttons at the screen edges").toBeGreaterThanOrEqual(60);
  } else {
    expect(p.y + p.height, "photo above the text").toBeLessThanOrEqual(r.y + 1);
  }
  // Reading mode hides the photo and uses the whole card too.
  await page.click("#focusBtn");
  await expect(photo).toBeHidden();
  const focusedCard = (await page.locator(".pagecard").boundingBox())!, focusedText = (await text.boundingBox())!;
  expect(focusedText.width, "reading-mode text uses the whole card").toBeGreaterThan(focusedCard.width - 4);
  expect(focusedCard.width, "reading mode uses the screen width").toBeGreaterThan(page.viewportSize()!.width - 4);
  await page.click("#focusBtn");
  // Without the photo, the text uses the whole card.
  await page.click("#setBtn");
  await page.click("#origToggle button[data-v=aus]");
  await page.click("#setBtn");
  await expect(photo).toBeHidden();
  const card = (await page.locator(".pagecard").boundingBox())!, alone = (await text.boundingBox())!;
  expect(alone.width).toBeGreaterThan(card.width - 4);
});

test("On wide screens the settings open beside the page, which stays visible; otherwise as a bottom sheet", async ({ page }) => {
  await openRecognisedBook(page, ["side-da.jpg"]);
  await page.click("#setBtn");
  const { width, height } = page.viewportSize()!;
  const panel = page.locator("#settings");
  await expect(panel).toHaveClass(/open/);
  await expect(async () => {
    const s = (await panel.boundingBox())!, dock = (await page.locator("#dock").boundingBox())!;
    expect(s.y + s.height, "settings end above the toolbar").toBeLessThanOrEqual(dock.y);
    if (width >= 840) {
      const card = (await page.locator(".pagecard").boundingBox())!;
      expect(s.x, "settings beside the page").toBeGreaterThanOrEqual(card.x + card.width);
      expect(s.x + s.width, "settings at the right edge").toBeGreaterThan(width - 30);
      expect(s.height, "settings use the height of the screen").toBeGreaterThan(height * 0.6);
    } else {
      expect(s.height, "bottom sheet covers at most 60 % of the screen").toBeLessThanOrEqual(height * 0.6 + 1);
    }
  }).toPass({ timeout: 5_000 });
  if (width < 840) return;
  // Beside the page, the settings stay open while the child taps a word to hear the change.
  await page.locator("#reader .w").first().click();
  await expect(panel).toHaveClass(/open/);
  await page.click("#focusBtn");
  await expect(panel).not.toHaveClass(/open/);
  await expect(page.locator("body")).not.toHaveClass(/settings-open/);
  const focusedCard = (await page.locator(".pagecard").boundingBox())!;
  expect(focusedCard.width, "reading mode does not reserve an invisible settings panel").toBeGreaterThan(width - 4);
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveClass(/focus/);
});

test("The workshop puts the page list beside its editor on wide screens and above it on narrow screens", async ({ page }) => {
  await seedBooks(page, [{ id: "workshop", title: "En bog til værkstedet", texts: ["Første prøveside.", "Anden prøveside."] }]);
  await page.locator(".book").click();
  await openWorkshop(page);
  await expect(page.locator("#pdfBtn")).toBeVisible();
  const pdf = (await page.locator("#pdfBtn").boundingBox())!;
  expect(pdf.x).toBeGreaterThanOrEqual(0);
  expect(pdf.x + pdf.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const list = (await page.locator("#thumbs").boundingBox())!, editor = (await page.locator(".pagecard").boundingBox())!;
  if (page.viewportSize()!.width >= 840) {
    expect(list.x + list.width, "list left of editor").toBeLessThanOrEqual(editor.x);
  } else {
    expect(list.y + list.height, "list before editor").toBeLessThanOrEqual(editor.y);
  }
  expect(await sidewaysScroll(page)).toBe(0);
  await expect.poll(() => smallControls(page), { message: "workshop controls" }).toEqual([]);
  await page.locator(".thumb > button").nth(1).click();
  await page.click("#readBookBtn");
  await expect(page.locator("#reader")).toContainText("Anden prøveside.");
  await expect(page.locator("#pdfBtn")).toBeHidden();
  await expect(page).toHaveURL(/#read\/workshop\/workshop-1$/);
});

test("The parent gate supports a deliberate touch hold with visible progress", async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, "Touch input needs a touch screen.");
  await seedBooks(page, [{ id: "touch-gate", title: "En original prøvebog", texts: ["En original prøveside."] }]);
  await page.locator(".book").click();
  await page.click("#setBtn");
  await page.click('#gateSet button[data-v="an"]');
  await page.click("#setClose");
  const button = page.locator("#editBookBtn"), r = (await button.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }] });
  await page.waitForTimeout(400);
  expect(await button.evaluate(el => parseFloat(el.style.getPropertyValue("--hold-progress")))).toBeGreaterThan(0);
  expect(await button.evaluate(el => getComputedStyle(el).backgroundImage)).toContain("linear-gradient");
  await page.waitForTimeout(1800);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
  await expect(page.locator("#editEntry")).toBeVisible();
  await page.click("#correctPageBtn");
  await expect(page.locator("#text")).toBeFocused();
});

test("Page photo actions fit the workshop in every language and stay out of reading", async ({ page }) => {
  await seedBooks(page, [{ id: "photo-tools", title: "Original book", texts: ["En original side."] }]);
  for (const [ui, labels] of [
    ["da", ["Indsæt side før", "Indsæt side efter", "Erstat foto"]],
    ["de", ["Seite davor einfügen", "Seite danach einfügen", "Foto ersetzen"]],
    ["en", ["Insert page before", "Insert page after", "Replace photo"]],
  ] as const) {
    await page.click(`#uiLang button[data-v=${ui}]`);
    await page.locator(".book").click();
    await expect(page.locator("#pagePhotoTools")).toBeHidden();
    await openWorkshop(page);
    for (const [i, id] of ["insertBeforeBtn", "insertAfterBtn", "replacePhotoBtn"].entries()) {
      const button = page.locator(`#${id}`);
      await expect(button).toHaveText(labels[i]);
      await button.scrollIntoViewIfNeeded();
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
    await expect(page.locator("#replacePhotoHint")).toHaveCSS("font-size", "14px");
    await page.click("#focusBtn");
    await expect(page.locator("#pagePhotoTools")).toBeHidden();
    await page.click("#focusBtn");
    await page.click("#readBookBtn");
    await expect(page.locator("#pagePhotoTools")).toBeHidden();
    await page.click("#home");
    await expect(page.locator("#start")).toBeVisible();
  }
});
