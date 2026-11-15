// The app language and the book language (#212). On a first start both come from the device, so
// a parent's first book is recognised in their language without noticing a setting. A language the
// adult picks is a saved preference: the app language is saved with the settings and the device is
// not asked again, and the book language stays as picked. Until a book language has been picked, it
// follows the app language. Settings saved by earlier versions stay exactly as they were.

export const LANGUAGES = ["da", "de", "en"] as const;
export type Language = typeof LANGUAGES[number];

/** Whether the book language follows the app language ("follow") or was picked by an adult ("chosen"). */
export type LangChoice = "follow" | "chosen";

export interface LanguageSettings { ui: string; lang: string; langChoice: LangChoice }

const known = (code: unknown): Language | undefined =>
  LANGUAGES.find(l => typeof code === "string" && code.toLowerCase().split("-")[0] === l);

/** The first of the device's languages (navigator.languages) that the app has; Danish otherwise. */
export function deviceLanguage(preferred: readonly string[]): Language {
  for (const code of preferred) {
    const lang = known(code);
    if (lang) return lang;
  }
  return "da";
}

/** App and book language at start: from the device on a first start (`saved` is null), otherwise as saved. */
export function startLanguages(saved: Record<string, unknown> | null, device: readonly string[]): LanguageSettings {
  if (!saved) {
    const lang = deviceLanguage(device);
    return { ui: lang, lang, langChoice: "follow" };
  }
  // Earlier versions had no following book language: their book language counts as chosen.
  const langChoice: LangChoice = saved.langChoice === "follow" ? "follow" : "chosen";
  return { ui: known(saved.ui) ?? "da", lang: known(saved.lang) ?? "da", langChoice };
}

/** The app language changed: the book language follows it, unless an adult picked one. */
export function afterUiChange(s: LanguageSettings, ui: string): LanguageSettings {
  return { ...s, ui, lang: s.langChoice === "follow" ? ui : s.lang };
}

/** An adult picked the book language: it stays as picked. */
export function chooseBookLanguage(s: LanguageSettings, lang: string): LanguageSettings {
  return { ...s, lang, langChoice: "chosen" };
}
