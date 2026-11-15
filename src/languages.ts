// The app language and the book language (#212) are separate settings. On a first start both are
// preselected from the device, so a parent's first book is set to their language. After that each
// is changed only by hand and saved: the app language under DA / DE / EN, the language of new books
// on the start screen before taking photos. The device is not asked again, and changing one never
// changes the other. Settings saved by earlier versions stay exactly as they were.

export const LANGUAGES = ["da", "de", "en"] as const;
export type Language = typeof LANGUAGES[number];

export interface LanguageSettings { ui: Language; lang: Language }

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

/** App language and language of new books at start: from the device on a first start (`saved` is null), otherwise as saved. */
export function startLanguages(saved: Record<string, unknown> | null, device: readonly string[]): LanguageSettings {
  if (!saved) {
    const lang = deviceLanguage(device);
    return { ui: lang, lang };
  }
  return { ui: known(saved.ui) ?? "da", lang: known(saved.lang) ?? "da" };
}
