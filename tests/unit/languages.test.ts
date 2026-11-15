import { describe, expect, it } from "vitest";
import { afterUiChange, chooseBookLanguage, deviceLanguage, startLanguages } from "../../src/languages";

describe("The app language of a device", () => {
  it("Takes the first device language the app has", () => {
    expect(deviceLanguage(["de-DE", "en-US"])).toBe("de");
    expect(deviceLanguage(["en-GB"])).toBe("en");
    expect(deviceLanguage(["da"])).toBe("da");
  });

  it("Skips languages the app does not have and ignores region and case", () => {
    expect(deviceLanguage(["fr-FR", "sv-SE", "DE-at"])).toBe("de");
  });

  it("Falls back to Danish", () => {
    expect(deviceLanguage(["fr-FR"])).toBe("da");
    expect(deviceLanguage([])).toBe("da");
  });
});

describe("Languages at start", () => {
  it("A first start uses the device language for the app and for the book, which follows the app", () => {
    expect(startLanguages(null, ["de-DE"])).toEqual({ ui: "de", lang: "de", langChoice: "follow" });
  });

  it("Saved settings stay as they are, whatever the device says", () => {
    expect(startLanguages({ ui: "en", lang: "da", langChoice: "follow" }, ["de-DE"])).toEqual({ ui: "en", lang: "da", langChoice: "follow" });
    expect(startLanguages({ ui: "en", lang: "en", langChoice: "chosen" }, ["de-DE"])).toEqual({ ui: "en", lang: "en", langChoice: "chosen" });
  });

  it("Settings saved before the book language could follow keep their book language as chosen", () => {
    expect(startLanguages({ ui: "de", lang: "da" }, ["de-DE"])).toEqual({ ui: "de", lang: "da", langChoice: "chosen" });
    // Very early settings without languages had the Danish defaults.
    expect(startLanguages({ highlight: "an" }, ["de-DE"])).toEqual({ ui: "da", lang: "da", langChoice: "chosen" });
  });

  it("Ignores saved languages the app does not have", () => {
    expect(startLanguages({ ui: "fr", lang: "xx", langChoice: "follow" }, ["de-DE"])).toEqual({ ui: "da", lang: "da", langChoice: "follow" });
  });
});

describe("Changing languages", () => {
  it("The book language follows a new app language until it was chosen", () => {
    expect(afterUiChange({ ui: "de", lang: "de", langChoice: "follow" }, "en")).toEqual({ ui: "en", lang: "en", langChoice: "follow" });
    expect(afterUiChange({ ui: "de", lang: "da", langChoice: "chosen" }, "en")).toEqual({ ui: "en", lang: "da", langChoice: "chosen" });
  });

  it("Choosing a book language keeps it", () => {
    const chosen = chooseBookLanguage({ ui: "de", lang: "de", langChoice: "follow" }, "da");
    expect(chosen).toEqual({ ui: "de", lang: "da", langChoice: "chosen" });
    expect(afterUiChange(chosen, "en").lang).toBe("da");
  });
});
