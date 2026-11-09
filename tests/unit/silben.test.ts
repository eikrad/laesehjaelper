import { describe, expect, it } from "vitest";
import { LONG_WORD_SYLLABLES, marksSyllables, silben } from "../../src/silben";

describe("silben", () => {
  it("Uses reading syllables instead of the Danish inflection boundary in hunden", () => {
    expect(silben("hunden", "da")).toEqual(["hun", "den"]);
  });
  it("Keeps the reading boundaries in common Danish inflections and initial-vowel words", () => {
    for (const [word, expected] of [
      ["hunde", ["hun", "de"]], ["hundene", ["hun", "de", "ne"]],
      ["hundens", ["hun", "dens"]], ["hundenes", ["hun", "de", "nes"]],
      ["elefant", ["e", "le", "fant"]], ["eleven", ["e", "le", "ven"]],
      ["øerne", ["ø", "er", "ne"]],
    ] as const) expect(silben(word, "da"), word).toEqual(expected);
  });
  it("Splits Danish words", () => {
    expect(silben("sommerfugl", "da")).toEqual(["som", "mer", "fugl"]);
    expect(silben("morgenen", "da")).toEqual(["mor", "ge", "nen"]);
    expect(silben("bedstemor", "da")).toEqual(["bed", "ste", "mor"]);
  });
  it("Splits German words", () => {
    expect(silben("Schokolade", "de")).toEqual(["Scho", "ko", "la", "de"]);
    expect(silben("Apfelbaum", "de").join("")).toBe("Apfelbaum");
    expect(silben("Apfelbaum", "de").length).toBeGreaterThan(1);
  });
  it("Shows single-vowel syllables in familiar German reading words", () => {
    for (const [word, expected] of [
      ["Oma", ["O", "ma"]], ["Opa", ["O", "pa"]], ["Igel", ["I", "gel"]],
      ["Uhu", ["U", "hu"]], ["Esel", ["E", "sel"]], ["Ofen", ["O", "fen"]],
      ["Abend", ["A", "bend"]], ["aber", ["a", "ber"]], ["über", ["ü", "ber"]],
      ["oben", ["o", "ben"]], ["Ameise", ["A", "mei", "se"]],
      ["Ananas", ["A", "na", "nas"]], ["Elefant", ["E", "le", "fant"]],
      ["Idee", ["I", "dee"]], ["Efeu", ["E", "feu"]], ["Deo", ["De", "o"]],
      ["Trio", ["Tri", "o"]], ["Radio", ["Ra", "di", "o"]],
      ["Kakao", ["Ka", "ka", "o"]], ["neue", ["neu", "e"]],
    ] as const) expect(silben(word, "de"), word).toEqual(expected);
  });
  it("Splits English words", () => {
    expect(silben("hedgehog", "en")).toEqual(["hedge", "hog"]);
  });
  it("Keeps consonant-le groups and the syllables of common English reading words", () => {
    for (const [word, expected] of [
      ["apple", ["ap", "ple"]], ["apples", ["ap", "ples"]],
      ["little", ["lit", "tle"]], ["bottle", ["bot", "tle"]], ["table", ["ta", "ble"]],
      ["people", ["peo", "ple"]], ["purple", ["pur", "ple"]],
      ["turtle", ["tur", "tle"]], ["candle", ["can", "dle"]],
      ["banana", ["ba", "na", "na"]], ["animal", ["an", "i", "mal"]], ["elephant", ["el", "e", "phant"]],
      ["open", ["o", "pen"]], ["over", ["o", "ver"]], ["even", ["e", "ven"]],
      ["about", ["a", "bout"]], ["again", ["a", "gain"]], ["away", ["a", "way"]],
    ] as const) expect(silben(word, "en"), word).toEqual(expected);
  });
  it("Keeps short words intact", () => {
    expect(silben("i", "da")).toEqual(["i"]);
    expect(silben("og", "da")).toEqual(["og"]);
  });
  it("Preserves the original case and spelling when applying reviewed boundaries", () => {
    expect(silben("HUNDENE", "da")).toEqual(["HUN", "DE", "NE"]);
    expect(silben("ÜBER", "de")).toEqual(["Ü", "BER"]);
    expect(silben("AnAnAs", "de")).toEqual(["A", "nA", "nAs"]);
    expect(silben("TABLE", "en")).toEqual(["TA", "BLE"]);
  });
  it("Keeps language-specific corrections separate and leaves silent vowels and vowel pairs intact", () => {
    expect(silben("elefant", "da")).toEqual(["e", "le", "fant"]);
    expect(silben("elephant", "en")).toEqual(["el", "e", "phant"]);
    // German-only corrections do not override another language's pattern fallback.
    expect(silben("Oma", "en")).toEqual(["Oma"]);
    for (const word of ["one", "eyes", "home", "cake", "aisle"]) expect(silben(word, "en")).toEqual([word]);
    for (const word of ["Eis", "Ei", "Schnee"]) expect(silben(word, "de")).toEqual([word]);
    expect(silben("Auto", "de")).toEqual(["Au", "to"]);
    expect(silben("hunden", "xx")).toEqual(["hun", "den"]);
  });
  it("Falls back to Danish for an unknown language", () => {
    expect(silben("sommerfugl", "xx")).toEqual(["som", "mer", "fugl"]);
  });
});

describe("Syllable marks only on long words", () => {
  it("Marks every word unless only long words are wanted", () => {
    expect(marksSyllables(1, false)).toBe(true);
    expect(marksSyllables(2, false)).toBe(true);
  });
  it("Marks only words with three or more syllables when only long words are wanted", () => {
    expect(LONG_WORD_SYLLABLES).toBe(3);
    expect(marksSyllables(1, true)).toBe(false);
    expect(marksSyllables(2, true)).toBe(false);
    expect(marksSyllables(3, true)).toBe(true);
    expect(marksSyllables(5, true)).toBe(true);
  });
});
