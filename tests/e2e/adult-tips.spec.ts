import { expect, test } from "./fixtures";
import { bookAction, fresh, openWorkshop, setUiLanguage } from "./helpers";

test("Adults can open five short reading tips from the book menu and leave them out of reading", async ({ page }) => {
  await fresh(page);
  await page.click("#demoBtn");
  const tips = page.locator("#adultTips");
  await expect(tips).toBeHidden();
  await openWorkshop(page);
  await expect(tips, "no tips section on the workshop page").toBeHidden();
  await bookAction(page, "tipsBtn");
  await expect(tips).toBeVisible();
  await expect(tips).toHaveAccessibleName("Gode råd til fælles læsning");
  await expect(tips.locator("p")).toHaveText("Dit barn bliver bedre til at læse ved at øve sig.");
  await expect(tips.locator("li")).toHaveText([
    "Lad barnet læse for dig, og lyt.",
    "Giv tid til et svært ord. Hjælp, og læs videre.",
    "Ret kun en læsefejl, hvis den ændrer meningen.",
    "Ros indsatsen frem for hurtig eller fejlfri læsning.",
    "Tal om historien. Spørg fx: Hvad tror du, der sker nu?",
  ]);
  await page.keyboard.press("Escape");
  await expect(tips).toBeHidden();
  await expect(page.locator("#bookMenuBtn")).toBeFocused();
  await bookAction(page, "tipsBtn");
  await tips.getByRole("button", { name: "Luk" }).click();
  await expect(tips).toBeHidden();
  await page.click("#readBookBtn");
  await expect(tips).toBeHidden();
  await expect(page.locator("#bookMenuBtn")).toBeHidden();
});

for (const [ui, title, practice, points] of [
  ["de", "Tipps zum gemeinsamen Lesen", "Lesen wird durch Üben besser.", [
    "Lass dein Kind dir vorlesen, und höre zu.",
    "Gib bei einem schweren Wort Zeit. Hilf und lest weiter.",
    "Verbessere einen Lesefehler nur, wenn er den Sinn verändert.",
    "Lobe die Mühe statt schnelles oder fehlerfreies Lesen.",
    "Sprecht über die Geschichte. Frage etwa: Was könnte als Nächstes passieren?",
  ]],
  ["en", "Tips for reading together", "Reading skills grow with practice.", [
    "Let your child read to you, and listen.",
    "Give a hard word time. Help, then read on.",
    "Only correct a slip if it changes the meaning.",
    "Praise effort rather than fast or perfect reading.",
    "Talk about the story. Ask: What might happen next?",
  ]],
] as const) test(`Adult tips follow the ${ui} interface language and work offline`, async ({ page, context }) => {
  await fresh(page);
  await setUiLanguage(page, ui);
  // The Danish book language stays independent from the adult's interface language.
  await page.click("#demoBtn");
  await openWorkshop(page);
  // Installation must finish before disconnecting; the offline reload then uses the active worker.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => {}));
  await context.setOffline(true);
  await page.reload();
  const tips = page.locator("#adultTips");
  await expect(tips).toBeHidden();
  await bookAction(page, "tipsBtn");
  await expect(tips).toHaveAccessibleName(title);
  await expect(tips.locator("p")).toHaveText(practice);
  await expect(tips.locator("li")).toHaveText([...points]);
});
