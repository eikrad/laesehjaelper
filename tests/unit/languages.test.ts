import { describe, expect, it } from "vitest";
import { deviceLanguage, startLanguages } from "../../src/languages";

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
  it("A first start preselects the device language for the app and for new books", () => {
    expect(startLanguages(null, ["de-DE"])).toEqual({ ui: "de", lang: "de" });
  });

  it("Saved languages stay as they are, whatever the device says", () => {
    expect(startLanguages({ ui: "en", lang: "da" }, ["de-DE"])).toEqual({ ui: "en", lang: "da" });
  });

  it("Settings saved before languages existed keep the Danish defaults", () => {
    expect(startLanguages({ highlight: "an" }, ["de-DE"])).toEqual({ ui: "da", lang: "da" });
  });

  it("Ignores saved languages the app does not have", () => {
    expect(startLanguages({ ui: "fr", lang: "xx" }, ["de-DE"])).toEqual({ ui: "da", lang: "da" });
  });
});
