// Small, reviewed corrections for reading; TeX patterns remain the fallback for other words.
// These are spelling groups, not a phonetic transcription of connected speech.
// Entries use lowercase spelling; dots mark reviewed boundaries. Keep the lists deliberately small.
export const readingWords: Record<string, readonly string[]> = {
  // Danish Language Council: spelling groups follow vowel-based syllables, not every morpheme.
  // https://sproget.dk/typiske-problemer/orddeling/
  da: ["hun·de", "hun·den", "hun·de·ne", "hun·dens", "hun·de·nes", "e·le·fant", "e·le·ven", "ø·er·ne"],
  // §84 E1 excludes lone vowel letters only at PRINT line breaks; reading syllables still exist.
  // Rat für deutsche Rechtschreibung (2024), §84: https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf
  // Explicit examples: https://blog.leo.org/2015/09/04/die-zweisilbige-oma/
  de: [
    "o·ma", "o·pa", "i·gel", "u·hu", "e·sel", "o·fen", "a·bend", "a·ber", "ü·ber", "o·ben",
    "a·mei·se", "a·na·nas", "e·le·fant", "i·dee", "e·feu", "de·o", "tri·o", "ra·di·o", "ka·ka·o", "neu·e",
  ],
  // English consonant-le syllables keep the consonant with -le; no blanket split at every vowel.
  // https://ies.ed.gov/use-work/resource-library/resource/other-resource/supporting-your-childs-reading-home
  // British dictionary pronunciations: https://dictionary.cambridge.org/us/pronunciation/english/banana
  en: [
    "ap·ple", "ap·ples", "lit·tle", "bot·tle", "ta·ble", "peo·ple", "pur·ple", "tur·tle", "can·dle",
    "ba·na·na", "an·i·mal", "el·e·phant", "o·pen", "o·ver", "e·ven", "a·bout", "a·gain", "a·way",
  ],
};
