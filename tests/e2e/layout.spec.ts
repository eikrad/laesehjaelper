import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addPhotos, fixture, fresh, waitForText } from "./helpers";

// Layout checks. Unlike the other specs, these run at every screen size the app is
// designed for: phone, tablet portrait, tablet landscape and laptop (see playwright.config.ts).

test.beforeEach(async ({ page }) => { await fresh(page); });

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
      // An ancestor can clip a nominally large target down to a much smaller hit area.
      for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent), clip = parent.getBoundingClientRect();
        if (["hidden", "clip"].includes(style.overflowX)) { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
        if (["hidden", "clip"].includes(style.overflowY)) { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
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
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
  expect(await sidewaysScroll(page)).toBe(0);
});

test("The toolbar fits on one line inside the screen in every language", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);   // With a photo, so the compare button is shown too.
  await waitForText(page);
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

test("On touch screens every control is at least 44 px", async ({ page }, info) => {
  test.skip(!info.project.use.hasTouch, "A mouse pointer hits smaller targets.");
  await expect.poll(() => smallControls(page), { message: "start screen" }).toEqual([]);
  await addPhotos(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await waitForText(page);
  await expect.poll(() => smallControls(page), { message: "reader" }).toEqual([]);
  await expect.poll(() => smallControls(page, 48, "#dock"), { message: "reading toolbar" }).toEqual([]);
  await page.click("#setBtn");
  await expect.poll(() => smallControls(page), { message: "settings" }).toEqual([]);
  await page.click("#setBtn");
  await page.locator("#edit").evaluate((d: HTMLDetailsElement) => { d.open = true; });
  await page.locator("#editPagesBtn").evaluate((b: HTMLButtonElement) => b.click());
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
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
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
  await addPhotos(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await waitForText(page);
  await page.locator("#editPagesBtn").evaluate((b: HTMLButtonElement) => b.click());   // Editing adds the most controls below the page.
  await page.locator("#edit").evaluate((d: HTMLDetailsElement) => { d.open = true; });
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
  await addPhotos(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await waitForText(page);
  const count = page.locator("#count");
  await expect(count).toHaveText("1 / 2");
  await swipeOnReader(page, -150, 0);
  await expect(count).toHaveText("2 / 2");
  await swipeOnReader(page, 150, 0);
  await expect(count).toHaveText("1 / 2");
  await swipeOnReader(page, -10, 0);    // A tap.
  await swipeOnReader(page, -60, 200);  // Scrolling.
  await expect(count).toHaveText("1 / 2");
  await page.locator("#edit").evaluate((d: HTMLDetailsElement) => { d.open = true; });
  await page.locator("#moveBtn").evaluate((b: HTMLButtonElement) => b.click());
  await page.evaluate(() => window.scrollTo(0, 0));
  await swipeOnReader(page, -150, 0);
  await expect(count).toHaveText("1 / 2");
});

test("On wide screens big buttons at the screen edges turn the page", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg", "side-overskrift.jpg"]);
  await waitForText(page);
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
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
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
  // Without the photo, the text uses the whole card.
  await page.click("#setBtn");
  await page.click("#origToggle button[data-v=aus]");
  await page.click("#setBtn");
  await expect(photo).toBeHidden();
  const card = (await page.locator(".pagecard").boundingBox())!, alone = (await text.boundingBox())!;
  expect(alone.width).toBeGreaterThan(card.width - 4);
});

test("On wide screens the settings open beside the page, which stays visible; otherwise as a bottom sheet", async ({ page }) => {
  await addPhotos(page, ["side-da.jpg"]);
  await waitForText(page);
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
