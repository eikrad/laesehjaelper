import { describe, expect, it } from "vitest";
import { QUESTIONS, pageQuestions } from "../../src/together";

describe("pageQuestions", () => {
  it("gibt zwei offene Fragen in der Buchsprache", () => {
    for (const lang of ["da", "de", "en"]) {
      const qs = pageQuestions(lang, 0);
      expect(qs).toHaveLength(2);
      qs.forEach(q => expect(QUESTIONS[lang]).toContain(q));
    }
  });
  it("wechselt die Fragen von Seite zu Seite", () => {
    expect(pageQuestions("da", 0)).not.toEqual(pageQuestions("da", 1));
  });
  it("wiederholt sich erst nach allen Fragen", () => {
    const n = QUESTIONS.da.length;
    const seen = new Set<string>();
    for (let i = 0; i < Math.ceil(n / 2); i++) pageQuestions("da", i).forEach(q => seen.add(q));
    expect(seen.size).toBe(n);
  });
  it("stellt eine eigene Frage für die Seite an den Anfang", () => {
    const qs = pageQuestions("de", 3, "  Warum versteckt sich der Igel?  ");
    expect(qs[0]).toBe("Warum versteckt sich der Igel?");
    expect(qs).toHaveLength(2);
  });
  it("fällt bei unbekannter Sprache auf Dänisch zurück", () => {
    expect(QUESTIONS.da).toContain(pageQuestions("xx", 0)[0]);
  });
  it("sind offene Fragen, keine Ja/Nein-Fragen und kein Quiz", () => {
    for (const lang of Object.keys(QUESTIONS)) QUESTIONS[lang].forEach(q => expect(q.endsWith("?")).toBe(true));
  });
});
