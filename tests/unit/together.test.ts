import { describe, expect, it } from "vitest";
import { QUESTIONS, pageQuestions } from "../../src/together";

describe("pageQuestions", () => {
  it("Returns two open questions in the book language", () => {
    for (const lang of ["da", "de", "en"]) {
      const qs = pageQuestions(lang, 0);
      expect(qs).toHaveLength(2);
      qs.forEach(q => expect(QUESTIONS[lang]).toContain(q));
    }
  });
  it("Changes questions between pages", () => {
    expect(pageQuestions("da", 0)).not.toEqual(pageQuestions("da", 1));
  });
  it("Repeats only after using every question", () => {
    const n = QUESTIONS.da.length;
    const seen = new Set<string>();
    for (let i = 0; i < Math.ceil(n / 2); i++) pageQuestions("da", i).forEach(q => seen.add(q));
    expect(seen.size).toBe(n);
  });
  it("Places the custom page question first", () => {
    const qs = pageQuestions("de", 3, "  Warum versteckt sich der Igel?  ");
    expect(qs[0]).toBe("Warum versteckt sich der Igel?");
    expect(qs).toHaveLength(2);
  });
  it("Falls back to Danish for an unknown language", () => {
    expect(QUESTIONS.da).toContain(pageQuestions("xx", 0)[0]);
  });
  it("Uses open questions rather than yes/no questions or quizzes", () => {
    for (const lang of Object.keys(QUESTIONS)) QUESTIONS[lang].forEach(q => expect(q.endsWith("?")).toBe(true));
  });
});
