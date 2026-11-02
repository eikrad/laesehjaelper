// Læsehjælper – App-Logik (Oberfläche, Texterkennung, Bücherregal).
import { addProfile, initProfiles, removeProfile, switchProfile, syncActive, type ProfileStore } from "./profiles";
import { pageQuestions } from "./together";
import { harmonizeSizes } from "./fit";
import { boldFlags, strokeWidth } from "./bold";
import { dragBox, transferPlaces } from "./place";
import { morphParts } from "./morpheme";
import { shortLineBreaks } from "./lines";
import { speechRate, showYourTurn, wordSteps } from "./readflow";
import { wordSpacing, WORD_BASE_BOX, WORD_BASE_FLOW } from "./spacing";
import { silben } from "./silben";
import { cleanOcr, parasFromOcr } from "./layout";
import { detectPage, warpPage, orderCorners, frameFromCorners, toFrame } from "./pagedetect";
import type { CV } from "./pagedetect";
import { DB } from "./db";
import { flattenBackground, rotateLike } from "./prep";
import { buildEpub, readEpub } from "./epub";
import type { DataPage, EpubFont, EpubPage } from "./epub";
import type { Box, Corners, Frame, OcrData, Para, Point } from "./types";

declare const Tesseract: {
  createWorker(langs: unknown, oem: number, options: Record<string, unknown>): Promise<TessWorker>;
};
interface TessWorker {
  setParameters(p: Record<string, string>): Promise<unknown>;
  recognize(image: HTMLCanvasElement | Blob, options?: Record<string, unknown>, output?: Record<string, boolean>): Promise<{ data: OcrData & { rotateRadians?: number } }>;
}
declare global { interface Window { cv: unknown; TRAINEDDATA: Record<string, string>; WORDS?: Record<string, string> } }

interface Settings {
  font: string; size: number; ls: number; lh: number; mode: string; colors: string; bg: string;
  orig: string; view: string; hyph: string; lang: string; ui: string; rate: string; turn: string; lines: string; together: string;
}
/** Einstellungen, die über Knopfgruppen (data-v) gesetzt werden */
type ChoiceKey = "mode" | "colors" | "bg" | "orig" | "lang" | "ui" | "view" | "hyph" | "rate" | "turn" | "lines" | "together";

interface Page {
  id?: string;
  bookId?: string | null;
  lang: string;
  status: "wait" | "ocr" | "done" | "error";
  stage?: string;
  progress: number;
  error?: string;
  text: string;
  rawText?: string;
  paras?: Para[] | null;
  workW?: number;
  workH?: number;
  corners?: Frame | Corners | null;
  /** eigene Frage für „gemeinsam lesen“ */
  question?: string;
  /** Anzeige der (zugeschnittenen) Seite: data:- oder blob:-URL */
  img: string | null;
  /** Seite mit übermalter Originalschrift */
  clean?: string | null;
  photo?: HTMLCanvasElement;
  canvas?: HTMLCanvasElement;
  inputBlob?: Blob | null;
  photoBlob?: Blob | null;
  cleanBlob?: Blob | null;
}
interface Book {
  id: string; title: string; pageIds: string[]; lastPage: number; cover: string | null;
  created: number; updated?: number; demo?: boolean;
}
type Speech = { full: string; wordPos: { start: number; end: number; i: number }[] };

const Silben = { silben };
const Layout = { cleanOcr, parasFromOcr };
const Lib = { detectPage, warpPage, orderCorners };

  function $<E extends Element = HTMLElement>(id: string): E {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} fehlt`);
    return el as unknown as E;
  }
  const $in = (id: string) => $<HTMLInputElement>(id);
  const abs = (p: string) => new URL(p, location.href).href;
  const val = (e: Event) => (e.target as HTMLInputElement).value;

  // ---------- Einstellungen ----------
  const defaults: Settings = { font: '"Andika", sans-serif', size: 32, ls: 0.04, lh: 1.9, mode: "farbe", colors: "#2f3fe0,#e5412d", bg: "#ffffff", orig: "an", view: "side", hyph: "normal", lang: "da", ui: "da", rate: "normal", turn: "an", lines: "normal", together: "aus" };
  const S: Settings = { ...defaults };
  try { Object.assign(S, JSON.parse(localStorage.getItem("lesehelfer") || "{}")); } catch (e) {}
  const PROFILES = "laesehjaelper-profiles";
  let prof: ProfileStore | null = null;   // wird nach den Texten angelegt (Name des ersten Profils)
  const save = () => {
    try {
      localStorage.setItem("lesehelfer", JSON.stringify(S));
      if (prof) { prof = syncActive(prof, S); localStorage.setItem(PROFILES, JSON.stringify(prof)); }
    } catch (e) {}
  };

  // ---------- Texte (Oberfläche) ----------
  const T: Record<string, Record<string, string>> = {
    da: {
      brand1: "Læse", brand2: "hjælper", docTitle: "Læsehjælper",
      startTitle: "Gør bogsider lettere at læse",
      heroWord: "Læ·se·hjæl·per", startIntro: "Børnebøger sat op, så de er lettere at læse: stor skrift, god luft og farvede stavelser.",
      dropMain: "Tag et billede af en side",
      dropSub: "eller vælg flere billeder på én gang",
      bookLangColon: "Bogen er på", bookLang: "Bogens sprog",
      langDaFlag: "🇩🇰 Dansk", langDeFlag: "🇩🇪 Tysk", langDa: "Dansk", langDe: "Tysk", langEn: "Engelsk",
      demo: "Prøv med en eksempelside",
      how1t: "Tag et billede", how1: "Fotografér siden lige og i godt lys, helst uden skygger.",
      how2t: "Tjek teksten", how2: "Se de genkendte ord igennem og ret eventuelle fejl.",
      how3t: "Læs", how3: "Tryk på et ord for at høre det. Tilpas skrift og farver.",
      prevPage: "Forrige side", nextPage: "Næste side", page: "Side", pageOf: "{a} / {b}",
      read: "Læs op", stop: "Stop", adjust: "Tilpas", focus: "Læsetilstand", close: "Luk læsetilstand",
      font: "Skrift", andika: "Andika (til begyndere)", size: "Skriftstørrelse", letterSp: "Bogstavafstand", lineSp: "Linjeafstand",
      syllables: "Stavelser", off: "Fra", color: "Farve", arcs: "Buer", both: "Begge",
      sylColors: "Stavelsesfarver", cBlueRed: "Blå og rød", cBlueBlack: "Blå og sort", cRedBlack: "Rød og sort", cPurpleGreen: "Lilla og grøn", syl1: "1. stavelse", syl2: "2. stavelse", view: "Visning", viewPage: "Bogens side", viewText: "Kun teksten", hyph: "Bindestreger i bogen", hyphNormal: "Almindelige", hyphBook: "Stavelsesdeling", hyphHint: "Vælg „Stavelsesdeling“, hvis bogen selv deler ord med bindestreg, f.eks. „sko-le“.",
      background: "Baggrund", bWhite: "Hvid", bCream: "Creme", bYellow: "Gul", bBlue: "Lyseblå", bGreen: "Lysegrøn",
      original: "Originalside", show: "Vis", hide: "Skjul", origAlt: "Originalside",
      editSummary: "Tjek og ret teksten",
      editHint: "Tom linje = nyt afsnit. Du kan selv sætte stavelsesgrænser med ·, f.eks. <b>hun·den</b>. Fed skrift: *ord*.",
      foot: "Alt foregår på din egen telefon eller computer. Billederne bliver ikke sendt nogen steder hen.",
      noText: "Der blev ikke fundet nogen tekst på denne side.<br>Åbn „Tjek og ret teksten“ og skriv den selv.",
      ocrFailed: "Genkendelsen mislykkedes.",
      waiting: "Venter på genkendelse …", recognizing: "Teksten genkendes …", recognizing2: "Teksten tjekkes en gang til …", loadingCore: "Genkendelsen indlæses …",
      loadingLang: "Sprogdata indlæses …", preparing: "Gøres klar …",
      imgError: "Billedet kunne ikke åbnes.", noSpeech: "Oplæsning understøttes ikke af denne browser.",
      example: "Eksempel", addPages: "Tilføj sider", toStart: "Til forsiden", shelfTitle: "Dine bøger", pagesN: "{n} sider", page1: "1 side", untitled: "Bog uden titel", titlePh: "Bogens titel", editPages: "Rediger sider", done: "Færdig", deleteBook: "Slet bogen", confirmDelete: "Tryk igen for at slette bogen", moveLeft: "Flyt til venstre", moveRight: "Flyt til højre", deletePage: "Slet side", evTitle: "Hvad siger forskningen?", evText: "Mere afstand mellem bogstaver <i>og</i> ord hjælper mange ordblinde børn med at læse hurtigere. Korte linjer hjælper nogle børn, men ikke alle. Oplæsning hjælper forståelsen, og at høre en tekst og så læse den selv flere gange gør læsningen mere flydende.<br><br>Farvede stavelser hjælper nogle børn i begyndelsen, andre ikke. Prøv, hvad dit barn kan lide, og slå dem fra, når det læser flydende.<br><br>Særlige ordblindeskrifter som OpenDyslexic og farvet baggrund har ikke vist nogen effekt i undersøgelser. Brug dem gerne, hvis barnet synes, de er rare, men ikke som behandling. <a href=\"https://github.com/eikrad/laesehjaelper/blob/main/README.md#hvad-siger-forskningen\">Kilder</a>", rateLabel: "Oplæsning", rateSlow: "Langsom", rateNormal: "Normal", turnLabel: "Efter oplæsning", turnOn: "Din tur", turnOff: "Kun lyt", yourTurn: "Nu er det din tur. Læs siden selv.", again: "Hør igen", linesLabel: "Linjer", linesNormal: "Normale", linesShort: "Korte", linesHint: "Korte linjer med få ord hjælper nogle børn. Gælder kun, når teksten vises alene.", reader: "Læser", reader1: "Læser 1", addReader: "Tilføj", newReaderPh: "Navn på ny læser", removeReader: "Slet læser", confirmReader: "Tryk igen for at slette", readerHint: "Hver læser har sine egne indstillinger for skrift, afstand, stavelser og oplæsning.", sylHint: "Når barnet læser flydende, kan stavelserne slås fra.", togetherLabel: "Læs sammen", togetherOn: "Til", togetherOff: "Fra", togetherHint: "Viser et par åbne spørgsmål til den voksne, der læser med. Ikke en quiz – lad barnet fortælle.", togetherTitle: "Snak om siden", ownQ: "Eget spørgsmål", ownQPh: "Skriv et spørgsmål til denne side", save: "Gem", moveBoxes: "Flyt tekstfelter", moveDone: "Færdig med at flytte", resetPlace: "Nulstil placering", moveHint: "Træk i et felt for at flytte det, eller i hjørnet for at ændre størrelsen.", morf: "Orddele", morfOnlyDa: "Orddele findes indtil videre kun for dansk.", morfFail: "Ordlisten kunne ikke hentes.", aboutTitle: "Om Læsehjælper og ansvarsfraskrivelse", aboutText: "Læsehjælper er et gratis hobbyprojekt og ikke et færdigt produkt. Tekstgenkendelse og stavelsesdeling laver fejl – tjek derfor altid teksten, før et barn læser den. Appen erstatter ikke undervisning, læsevejledning eller en udredning for ordblindhed.<br><br>Billeder og bøger bliver kun behandlet og gemt på din egen enhed og bliver ikke sendt til nogen server. Bøger er beskyttet af ophavsret: brug kun Læsehjælper til bøger, du selv har adgang til, og kun til privat brug. Del ikke omdannede bøger med andre, medmindre du har rettighederne.<br><br>Brug sker på eget ansvar og uden garanti. Kildekoden er åben: <a href=\"https://github.com/eikrad/laesehjaelper\">github.com/eikrad/laesehjaelper</a>", noStorage: "Bøgerne kan ikke gemmes i denne browser.", cropTitle: "Tilpas siden", cropFound: "Siden er fundet. Træk i hjørnerne, hvis det ikke passer.", cropNone: "Træk hjørnerne hen til sidens kanter.", cropLoading: "Finder siden …", cropUse: "Brug", cropWhole: "Hele billedet", cropAgain: "Beskær siden igen", ocrAgain: "Genkend teksten igen", cropOf: "Billede {a} af {b}", exportBook: "Gem som e-bog", importBook: "Hent en e-bog (EPUB) fra Læsehjælper", exporting: "Laver e-bogen …", exported: "E-bogen er gemt: {name}", importFail: "Filen er ikke en e-bog fra Læsehjælper.", importing: "Henter e-bogen …", notReady: "Vent, til alle sider er genkendt.", install: "Installér som app på denne enhed", compare: "Vis den oprindelige tekst", compareOff: "Vis den nye tekst",
    },
    en: {
      brand1: "Læse", brand2: "hjælper", docTitle: "Læsehjælper",
      startTitle: "Make book pages easier to read",
      heroWord: "Læ·se·hjæl·per", startIntro: "Children's books set to be easier to read: large type, generous spacing and coloured syllables.",
      dropMain: "Take a photo of a page",
      dropSub: "or choose several photos at once",
      bookLangColon: "The book is in", bookLang: "Language of the book",
      langDaFlag: "🇩🇰 Danish", langDeFlag: "🇩🇪 German", langDa: "Danish", langDe: "German", langEn: "English",
      demo: "Try a sample page",
      how1t: "Take a photo", how1: "Photograph the page straight on in good light, ideally without shadows.",
      how2t: "Check the text", how2: "Look through the recognised words and fix any mistakes.",
      how3t: "Read", how3: "Tap a word to hear it. Adjust the font and colours.",
      prevPage: "Previous page", nextPage: "Next page", page: "Page", pageOf: "{a} / {b}",
      read: "Read aloud", stop: "Stop", adjust: "Adjust", focus: "Reading mode", close: "Close reading mode",
      font: "Font", andika: "Andika (for beginners)", size: "Font size", letterSp: "Letter spacing", lineSp: "Line spacing",
      syllables: "Syllables", off: "Off", color: "Colour", arcs: "Arcs", both: "Both",
      sylColors: "Syllable colours", cBlueRed: "Blue and red", cBlueBlack: "Blue and black", cRedBlack: "Red and black", cPurpleGreen: "Purple and green", syl1: "1st syllable", syl2: "2nd syllable", view: "View", viewPage: "Book page", viewText: "Text only", hyph: "Hyphens in the book", hyphNormal: "Normal", hyphBook: "Syllable breaks", hyphHint: "Choose “Syllable breaks” if the book itself splits words with hyphens, e.g. “gar-den”.",
      background: "Background", bWhite: "White", bCream: "Cream", bYellow: "Yellow", bBlue: "Light blue", bGreen: "Light green",
      original: "Original page", show: "Show", hide: "Hide", origAlt: "Original page",
      editSummary: "Check and correct the text",
      editHint: "Empty line = new paragraph. Set your own syllable breaks with ·, e.g. <b>gar·den</b>. Bold: *word*.",
      foot: "Everything happens on your own phone or computer. Your photos are not sent anywhere.",
      noText: "No text was found on this page.<br>Open “Check and correct the text” and type it in yourself.",
      ocrFailed: "Recognition failed.",
      waiting: "Waiting for recognition …", recognizing: "Recognising text …", recognizing2: "Double-checking the text …", loadingCore: "Loading text recognition …",
      loadingLang: "Loading language data …", preparing: "Getting ready …",
      imgError: "The photo could not be opened.", noSpeech: "Reading aloud is not supported in this browser.",
      example: "Sample", addPages: "Add pages", toStart: "Back to start", shelfTitle: "Your books", pagesN: "{n} pages", page1: "1 page", untitled: "Untitled book", titlePh: "Book title", editPages: "Edit pages", done: "Done", deleteBook: "Delete book", confirmDelete: "Tap again to delete the book", moveLeft: "Move left", moveRight: "Move right", deletePage: "Delete page", evTitle: "What does the research say?", evText: "More space between letters <i>and</i> words helps many children with dyslexia read faster. Short lines help some children, but not all. Reading aloud helps comprehension, and listening to a text and then reading it yourself several times makes reading more fluent.<br><br>Coloured syllables help some children at the start, others not. Try what your child likes, and switch them off once reading is fluent.<br><br>Special dyslexia fonts such as OpenDyslexic and coloured backgrounds have shown no effect in studies. Use them if your child finds them pleasant, but not as a treatment. <a href=\"https://github.com/eikrad/laesehjaelper/blob/main/README.en.md#what-does-the-research-say\">Sources</a>", rateLabel: "Reading aloud", rateSlow: "Slow", rateNormal: "Normal", turnLabel: "After reading aloud", turnOn: "Your turn", turnOff: "Just listen", yourTurn: "Now it's your turn. Read the page yourself.", again: "Listen again", linesLabel: "Lines", linesNormal: "Normal", linesShort: "Short", linesHint: "Short lines with a few words help some children. Only applies when the text is shown on its own.", reader: "Reader", reader1: "Reader 1", addReader: "Add", newReaderPh: "Name of new reader", removeReader: "Delete reader", confirmReader: "Tap again to delete", readerHint: "Each reader has their own settings for font, spacing, syllables and reading aloud.", sylHint: "Once your child reads fluently, you can switch the syllables off.", togetherLabel: "Read together", togetherOn: "On", togetherOff: "Off", togetherHint: "Shows a few open questions for the adult reading along. Not a quiz – let the child do the talking.", togetherTitle: "Talk about the page", ownQ: "Own question", ownQPh: "Write a question for this page", save: "Save", moveBoxes: "Move text boxes", moveDone: "Done moving", resetPlace: "Reset position", moveHint: "Drag a box to move it, or drag its corner to resize it.", morf: "Word parts", morfOnlyDa: "Word parts are only available for Danish so far.", morfFail: "The word list could not be loaded.", aboutTitle: "About Læsehjælper and disclaimer", aboutText: "Læsehjælper is a free hobby project, not a finished product. Text recognition and syllable splitting make mistakes, so always check the text before a child reads it. The app does not replace teaching, reading support or a dyslexia assessment.<br><br>Photos and books are processed and stored only on your own device and are never sent to a server. Books are protected by copyright: only use Læsehjælper for books you have access to, and only for private use. Do not share converted books unless you hold the rights.<br><br>Use at your own risk and without warranty. The source code is open: <a href=\"https://github.com/eikrad/laesehjaelper\">github.com/eikrad/laesehjaelper</a>", noStorage: "Books cannot be saved in this browser.", cropTitle: "Adjust the page", cropFound: "Page found. Drag the corners if it doesn't fit.", cropNone: "Drag the corners to the edges of the page.", cropLoading: "Looking for the page …", cropUse: "Use", cropWhole: "Whole photo", cropAgain: "Crop the page again", ocrAgain: "Recognise the text again", cropOf: "Photo {a} of {b}", exportBook: "Save as e-book", importBook: "Open a Læsehjælper e-book (EPUB)", exporting: "Creating the e-book …", exported: "E-book saved: {name}", importFail: "This file is not a Læsehjælper e-book.", importing: "Loading the e-book …", notReady: "Wait until all pages have been recognised.", install: "Install as an app on this device", compare: "Show the original text", compareOff: "Show the new text",
    },
    de: {
      brand1: "Lese", brand2: "helfer", docTitle: "Lesehelfer",
      startTitle: "Buchseiten leichter lesbar machen",
      heroWord: "Le·se·hel·fer", startIntro: "Kinderbücher so gesetzt, dass sie leichter zu lesen sind: große Schrift, viel Luft und farbige Silben.",
      dropMain: "Eine Seite fotografieren",
      dropSub: "oder mehrere Bilder auf einmal wählen",
      bookLangColon: "Das Buch ist auf", bookLang: "Sprache des Buchs",
      langDaFlag: "🇩🇰 Dänisch", langDeFlag: "🇩🇪 Deutsch", langDa: "Dänisch", langDe: "Deutsch", langEn: "Englisch",
      demo: "Mit einer Beispielseite ausprobieren",
      how1t: "Foto machen", how1: "Seite gerade und hell fotografieren, möglichst ohne Schatten.",
      how2t: "Text prüfen", how2: "Erkannte Wörter kurz kontrollieren und Fehler korrigieren.",
      how3t: "Lesen", how3: "Wort antippen zum Vorlesen. Schrift und Farben anpassen.",
      prevPage: "Vorherige Seite", nextPage: "Nächste Seite", page: "Seite", pageOf: "{a} / {b}",
      read: "Vorlesen", stop: "Stopp", adjust: "Anpassen", focus: "Lesemodus", close: "Lesemodus schließen",
      font: "Schrift", andika: "Andika (für Leseanfänger)", size: "Schriftgröße", letterSp: "Buchstabenabstand", lineSp: "Zeilenabstand",
      syllables: "Silben", off: "Aus", color: "Farbe", arcs: "Bögen", both: "Beides",
      sylColors: "Silbenfarben", cBlueRed: "Blau und Rot", cBlueBlack: "Blau und Schwarz", cRedBlack: "Rot und Schwarz", cPurpleGreen: "Lila und Grün", syl1: "1. Silbe", syl2: "2. Silbe", view: "Ansicht", viewPage: "Buchseite", viewText: "Nur Text", hyph: "Bindestriche im Buch", hyphNormal: "Normal", hyphBook: "Silbentrennung", hyphHint: "„Silbentrennung“ wählen, wenn das Buch Wörter selbst mit Bindestrich trennt, z. B. „Scho-ko-la-de“.",
      background: "Hintergrund", bWhite: "Weiß", bCream: "Creme", bYellow: "Gelb", bBlue: "Hellblau", bGreen: "Hellgrün",
      original: "Originalseite", show: "Zeigen", hide: "Verbergen", origAlt: "Originalseite",
      editSummary: "Text prüfen und korrigieren",
      editHint: "Leere Zeile = neuer Absatz. Eigene Silbengrenzen mit · setzen, z.&nbsp;B. <b>O·ma</b>. Fett: *Wort*.",
      foot: "Alles passiert auf deinem eigenen Handy oder Computer. Die Fotos werden nirgendwohin geschickt.",
      noText: "Auf dieser Seite wurde kein Text gefunden.<br>Öffne „Text prüfen“ und tippe ihn selbst ein.",
      ocrFailed: "Die Erkennung hat nicht geklappt.",
      waiting: "Wartet auf Erkennung …", recognizing: "Text wird erkannt …", recognizing2: "Text wird ein zweites Mal geprüft …", loadingCore: "Erkennung wird geladen …",
      loadingLang: "Sprachdaten werden geladen …", preparing: "Wird vorbereitet …",
      imgError: "Bild konnte nicht geöffnet werden.", noSpeech: "Vorlesen wird von diesem Browser nicht unterstützt.",
      example: "Beispiel", addPages: "Seiten hinzufügen", toStart: "Zur Startseite", shelfTitle: "Deine Bücher", pagesN: "{n} Seiten", page1: "1 Seite", untitled: "Buch ohne Titel", titlePh: "Titel des Buchs", editPages: "Seiten bearbeiten", done: "Fertig", deleteBook: "Buch löschen", confirmDelete: "Zum Löschen noch einmal tippen", moveLeft: "Nach links", moveRight: "Nach rechts", deletePage: "Seite löschen", evTitle: "Was sagt die Forschung?", evText: "Mehr Abstand zwischen Buchstaben <i>und</i> Wörtern hilft vielen Kindern mit Legasthenie, schneller zu lesen. Kurze Zeilen helfen manchen Kindern, aber nicht allen. Vorlesen hilft beim Verstehen, und einen Text erst zu hören und dann mehrmals selbst zu lesen macht das Lesen flüssiger.<br><br>Farbige Silben helfen manchen Kindern am Anfang, anderen nicht. Probiere aus, was deinem Kind gefällt, und schalte sie ab, sobald es flüssig liest.<br><br>Spezielle Legasthenie-Schriften wie OpenDyslexic und farbige Hintergründe haben in Studien keine Wirkung gezeigt. Nutze sie gern, wenn dein Kind sie angenehm findet, aber nicht als Behandlung. <a href=\"https://github.com/eikrad/laesehjaelper/blob/main/README.de.md#was-sagt-die-forschung\">Quellen</a>", rateLabel: "Vorlesen", rateSlow: "Langsam", rateNormal: "Normal", turnLabel: "Nach dem Vorlesen", turnOn: "Du bist dran", turnOff: "Nur zuhören", yourTurn: "Jetzt bist du dran. Lies die Seite selbst.", again: "Noch mal hören", linesLabel: "Zeilen", linesNormal: "Normal", linesShort: "Kurz", linesHint: "Kurze Zeilen mit wenigen Wörtern helfen manchen Kindern. Gilt nur, wenn der Text allein angezeigt wird.", reader: "Leser", reader1: "Leser 1", addReader: "Hinzufügen", newReaderPh: "Name des neuen Lesers", removeReader: "Leser löschen", confirmReader: "Zum Löschen noch einmal tippen", readerHint: "Jeder Leser hat eigene Einstellungen für Schrift, Abstände, Silben und Vorlesen.", sylHint: "Sobald dein Kind flüssig liest, kannst du die Silben ausschalten.", togetherLabel: "Gemeinsam lesen", togetherOn: "An", togetherOff: "Aus", togetherHint: "Zeigt ein paar offene Fragen für den Erwachsenen, der mitliest. Kein Quiz – lass das Kind erzählen.", togetherTitle: "Sprecht über die Seite", ownQ: "Eigene Frage", ownQPh: "Frage zu dieser Seite schreiben", save: "Speichern", moveBoxes: "Textfelder verschieben", moveDone: "Verschieben beenden", resetPlace: "Position zurücksetzen", moveHint: "Zieh ein Feld, um es zu verschieben, oder an seiner Ecke, um die Größe zu ändern.", morf: "Wortteile", morfOnlyDa: "Wortteile gibt es bisher nur für Dänisch.", morfFail: "Die Wortliste konnte nicht geladen werden.", aboutTitle: "Über Læsehjælper und Haftungsausschluss", aboutText: "Læsehjælper ist ein kostenloses Hobbyprojekt und kein fertiges Produkt. Texterkennung und Silbentrennung machen Fehler – prüfe den Text deshalb immer, bevor ein Kind ihn liest. Die App ersetzt keinen Unterricht, keine Leseförderung und keine Diagnostik bei Legasthenie.<br><br>Fotos und Bücher werden nur auf deinem eigenen Gerät verarbeitet und gespeichert und an keinen Server geschickt. Bücher sind urheberrechtlich geschützt: Nutze Læsehjælper nur für Bücher, auf die du selbst Zugriff hast, und nur privat. Gib umgewandelte Bücher nicht weiter, außer du hast die Rechte dazu.<br><br>Nutzung auf eigene Verantwortung und ohne Gewähr. Der Quellcode ist offen: <a href=\"https://github.com/eikrad/laesehjaelper\">github.com/eikrad/laesehjaelper</a>", noStorage: "In diesem Browser können keine Bücher gespeichert werden.", cropTitle: "Seite zuschneiden", cropFound: "Seite gefunden. Zieh an den Ecken, falls es nicht passt.", cropNone: "Zieh die Ecken an die Ränder der Seite.", cropLoading: "Seite wird gesucht …", cropUse: "Übernehmen", cropWhole: "Ganzes Bild", cropAgain: "Seite neu zuschneiden", ocrAgain: "Text neu erkennen", cropOf: "Bild {a} von {b}", exportBook: "Als E-Book speichern", importBook: "E-Book (EPUB) aus Læsehjælper laden", exporting: "E-Book wird erstellt …", exported: "E-Book gespeichert: {name}", importFail: "Die Datei ist kein E-Book aus Læsehjælper.", importing: "E-Book wird geladen …", notReady: "Warte, bis alle Seiten erkannt sind.", install: "Als App auf diesem Gerät installieren", compare: "Originaltext anzeigen", compareOff: "Neuen Text anzeigen",
    },
  };
  const t = (k: string, vars: Record<string, string | number> = {}): string =>
    (T[S.ui] || T.da)[k]?.replace(/\{(\w+)\}/g, (_, v: string) => String(vars[v])) ?? k;
  try { prof = initProfiles(localStorage.getItem(PROFILES), S, t("reader1")); } catch (e) { prof = initProfiles(null, S, t("reader1")); }

  // ---------- Profile (Leseeinstellungen pro Kind) ----------
  function renderProfiles() {
    if (!prof) return;
    const sel = $<HTMLSelectElement>("profileSel");
    sel.innerHTML = "";
    for (const p of prof.list) { const o = document.createElement("option"); o.value = p.id; o.textContent = p.name; sel.append(o); }
    sel.value = prof.active;
    const del = $<HTMLButtonElement>("profileDel");
    del.hidden = prof.list.length <= 1; del.classList.remove("armed"); del.textContent = t("removeReader");
  }
  function profileChanged() { applySettings(); renderProfiles(); if (pages[cur]) render(); }
  $<HTMLSelectElement>("profileSel").onchange = e => { prof = switchProfile(prof!, val(e), S); profileChanged(); };
  $<HTMLButtonElement>("profileAdd").onclick = () => {
    const inp = $<HTMLInputElement>("profileName"); const name = inp.value.trim();
    if (!name) { inp.focus(); return; }
    prof = addProfile(prof!, name, S); inp.value = ""; profileChanged();
  };
  $<HTMLInputElement>("profileName").onkeydown = e => { if (e.key === "Enter") $<HTMLButtonElement>("profileAdd").click(); };
  $<HTMLButtonElement>("profileDel").onclick = () => {
    const b = $<HTMLButtonElement>("profileDel");
    if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = t("confirmReader"); return; }
    prof = removeProfile(prof!, prof!.active, S); profileChanged();
  };

  const icon = (n: string) => `<svg class="i"><use href="#i-${n}"/></svg>`;
  function setReadBtn() { $<HTMLButtonElement>("readBtn").innerHTML = icon(reading ? "stop" : "speak") + `<span>${t(reading ? "stop" : "read")}</span>`; }
  let comparing = false;   // Originalseite statt neuem Text zeigen (zum Prüfen der Erkennung)
  function setCompareBtn() {
    const b = $<HTMLButtonElement>("compareBtn");
    b.classList.toggle("on", comparing);
    b.title = t(comparing ? "compareOff" : "compare"); b.setAttribute("aria-label", b.title);
  }
  function setFocusBtn() {
    const on = document.body.classList.contains("focus");
    $<HTMLButtonElement>("focusBtn").innerHTML = icon(on ? "close" : "focus");
    $<HTMLButtonElement>("focusBtn").setAttribute("aria-label", t(on ? "close" : "focus")); $<HTMLButtonElement>("focusBtn").title = t(on ? "close" : "focus");
  }
  function applyTexts() {
    document.documentElement.lang = S.ui;
    document.title = t("docTitle");
    document.querySelectorAll<HTMLElement>("[data-t]").forEach(el => { el.textContent = t(el.dataset.t!); });
    document.querySelectorAll<HTMLElement>("[data-th]").forEach(el => { el.innerHTML = t(el.dataset.th!); });
    document.querySelectorAll<HTMLElement>("[data-ta]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.ta!)); el.title = t(el.dataset.ta!); });
    $<HTMLImageElement>("origImg").alt = t("origAlt");
    setReadBtn(); setFocusBtn(); setCompareBtn(); renderProfiles();
    const hw = $("heroWord"); hw.innerHTML = "";
    t("heroWord").split("·").forEach((x, i) => { const s = document.createElement("span"); s.className = "s s" + (i % 2); s.textContent = x; hw.append(s); });
    hw.setAttribute("aria-label", t("docTitle"));
    document.querySelectorAll<HTMLInputElement>("[data-tp]").forEach(el => { el.placeholder = t(el.dataset.tp!); });
    $<HTMLButtonElement>("editPagesBtn").textContent = t(document.body.classList.contains("editing") ? "done" : "editPages");
    if (!$("start").hidden) renderShelf();
    if (pages.length) render();
  }

  const CHOICES: [string, ChoiceKey][] = [["mode", "mode"], ["colors", "colors"], ["bg", "bg"], ["origToggle", "orig"], ["langStart", "lang"], ["langSet", "lang"], ["uiLang", "ui"], ["viewSet", "view"], ["hyphSet", "hyph"], ["rateSet", "rate"], ["turnSet", "turn"], ["linesSet", "lines"], ["togetherSet", "together"]];
  function applySettings() {
    const r = document.documentElement.style;
    r.setProperty("--font", S.font);
    r.setProperty("--size", S.size + "px");
    r.setProperty("--ls", S.ls + "em");
    r.setProperty("--ws", wordSpacing(S.ls, WORD_BASE_FLOW) + "em");
    r.setProperty("--ws-box", wordSpacing(S.ls, WORD_BASE_BOX) + "em");
    r.setProperty("--lh", String(S.lh));
    const [c0, c1] = S.colors.split(",");
    r.setProperty("--s0", c0); r.setProperty("--s1", c1);
    $in("c0").value = c0; $in("c1").value = c1;
    r.setProperty("--page-bg", S.bg);
    const rd = $("reader");
    rd.classList.toggle("mode-farbe", S.mode === "farbe" || S.mode === "beides");
    rd.classList.toggle("mode-boegen", S.mode === "boegen" || S.mode === "beides");
    rd.classList.toggle("mode-morf", S.mode === "morf");
    $<HTMLSelectElement>("font").value = S.font; $in("size").value = String(S.size); $in("ls").value = String(S.ls); $in("lh").value = String(S.lh);
    for (const [id, key] of CHOICES)
      $(id).querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.v === S[key]));
    $("orig").classList.toggle("hidden", S.orig === "aus" || !pages[cur]?.img || isPageMode(pages[cur]));
    // „Originalseite zeigen/verbergen“ wirkt nur in der Textansicht; in der Buchseiten-Ansicht ist die
    // Seite selbst das Bild (dort vergleicht man mit dem Augen-Knopf).
    $("origToggle").closest<HTMLElement>(".field")!.hidden = S.view === "side";
    if ($("reader").classList.contains("pagemode")) requestAnimationFrame(() => fitBoxes());
    save();
  }
  $("font").onchange = e => { S.font = val(e); applySettings(); };
  for (const k of ["size", "ls", "lh"] as const) $(k).oninput = e => { S[k] = parseFloat(val(e)); applySettings(); };
  for (const [id, key] of CHOICES)
    $(id).onclick = e => { const b = (e.target as HTMLElement).closest("button"); if (b) {
      S[key] = b.dataset.v!; applySettings();
      if (key === "ui") applyTexts();
      if ((key === "view" || key === "lines") && pages[cur]) render();
      if (key === "together") renderTogether();
      if (key === "hyph") { pages.forEach(pg => { if (pg.status === "done") retext(pg); }); if (pages[cur]) render(); }
      if (key === "lang" && pages[cur] && pages[cur].lang !== S.lang) relang(pages[cur]);
      if (key === "mode" || key === "lang") morphCheck();
    } };
  $<HTMLButtonElement>("compareBtn").onclick = () => { comparing = !comparing; setCompareBtn(); render(); };
  $<HTMLButtonElement>("setBtn").onclick = () => $<HTMLButtonElement>("setBtn").classList.toggle("on", $("settings").classList.toggle("open"));
  for (const [i, id] of ["c0", "c1"].entries())
    $(id).oninput = e => { const c = S.colors.split(","); c[i] = val(e); S.colors = c.join(","); applySettings(); };
  $<HTMLButtonElement>("focusBtn").onclick = () => {
    const on = document.body.classList.toggle("focus");
    setFocusBtn();
    window.scrollTo(0, 0);
  };

  let toastTimer = 0;
  function toast(msg: string, ms = 2600) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = window.setTimeout(() => t.classList.remove("show"), ms);
  }

  // ---------- Seiten ----------
  const pages: Page[] = [];
  let cur = 0;

  // ---------- Bücher speichern (IndexedDB, nur auf diesem Gerät) ----------
  let storageWarned = false;
  const storageFail = (e: unknown) => { console.error(e); if (!storageWarned) { storageWarned = true; toast(t("noStorage")); } };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const ctx2d = (c: HTMLCanvasElement) => c.getContext("2d")!;
  const canvasBlob = (c: HTMLCanvasElement, q = 0.85) => new Promise<Blob | null>(r => c.toBlob(r, "image/jpeg", q));
  const blobToCanvas = (blob: Blob) => new Promise<HTMLCanvasElement>((res, rej) => {
    const url = URL.createObjectURL(blob), img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; ctx2d(c).drawImage(img, 0, 0); URL.revokeObjectURL(url); res(c); };
    img.onerror = rej; img.src = url;
  });

  let book: Book | null = null;
  function newBook(demo = false) {
    book = { id: uid(), title: "", pageIds: [], lastPage: 0, cover: null, created: Date.now(), demo };
    pages.length = 0; cur = 0;
    document.body.classList.remove("editing");
  }

  let persistAsked = false;
  async function saveBook() {
    if (!book || book.demo || !pages.length) return;
    book.pageIds = pages.map(p => p.id).filter((id): id is string => !!id);
    book.lastPage = cur;
    book.updated = Date.now();
    const first = pages[0];
    if (first && first.canvas && !book.cover) {
      const c = document.createElement("canvas"), k = 240 / Math.max(first.canvas.width, first.canvas.height);
      c.width = Math.round(first.canvas.width * k); c.height = Math.round(first.canvas.height * k);
      c.getContext("2d")!.drawImage(first.canvas, 0, 0, c.width, c.height);
      book.cover = c.toDataURL("image/jpeg", 0.8);
    }
    try { await DB.put("books", { ...book }); } catch (e) { storageFail(e); }
    // Browser bitten, die Bücher nicht automatisch zu löschen, wenn Speicher knapp wird
    if (!persistAsked && navigator.storage?.persist) { persistAsked = true; navigator.storage.persist().catch(() => {}); }
  }

  /** So steht eine Seite im Speicher (ohne Canvas und Anzeige-URLs). */
  type PageRecord = Pick<Page, "id" | "bookId" | "lang" | "status" | "text" | "rawText" | "paras" | "workW" | "workH" | "corners" | "question" | "inputBlob" | "photoBlob" | "cleanBlob">;

  async function savePage(pg: Page | undefined) {
    if (!pg) return;
    const bookId = pg.bookId || (book && !book.demo ? (pg.bookId = book.id) : null);
    if (!bookId) return;
    pg.id = pg.id || uid();
    try {
      if (pg.canvas && !pg.inputBlob) pg.inputBlob = await canvasBlob(pg.canvas);
      if (pg.photo && !pg.photoBlob) pg.photoBlob = await canvasBlob(pg.photo, 0.8);
      await DB.put<PageRecord>("pages", {
        id: pg.id, bookId, lang: pg.lang, status: pg.status === "done" ? "done" : "wait",
        text: pg.text, rawText: pg.rawText, paras: pg.paras || null, workW: pg.workW, workH: pg.workH,
        corners: pg.corners || null, question: pg.question || "", inputBlob: pg.inputBlob || null, photoBlob: pg.photoBlob || null, cleanBlob: pg.cleanBlob || null,
      });
    } catch (e) { storageFail(e); }
  }

  function pageFromRecord(r: PageRecord): Page {
    return {
      ...r,
      progress: 0,
      status: r.status === "done" ? "done" : "wait",
      img: r.inputBlob ? URL.createObjectURL(r.inputBlob) : null,
      clean: r.cleanBlob ? URL.createObjectURL(r.cleanBlob) : null,
    };
  }

  async function openBook(b: Book) {
    newBook();
    book = b;
    let recs: PageRecord[] = [];
    try { recs = await DB.pagesOf<PageRecord>(b.id); } catch (e) { storageFail(e); }
    const byId: Record<string, PageRecord> = Object.fromEntries(recs.map(r => [r.id, r]));
    const ordered = (b.pageIds || []).map(id => byId[id]).filter(Boolean);
    recs.forEach(r => { if (!ordered.includes(r)) ordered.push(r); });
    pages.push(...ordered.map(pageFromRecord));
    cur = Math.min(b.lastPage || 0, Math.max(0, pages.length - 1));
    pages.filter(p => p.status === "wait").forEach(p => queue.push(p));
    showApp(); render(); runQueue();
  }

  async function renderShelf() {
    let books: Book[] = [];
    try { books = await DB.all<Book>("books"); } catch (e) { /* kein Speicher: Regal bleibt leer */ }
    books.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    $("shelf").hidden = !books.length;
    const box = $("books"); box.innerHTML = "";
    for (const b of books) {
      const el = document.createElement("button");
      el.className = "book";
      const n = (b.pageIds || []).length;
      const title = b.title || t("untitled");
      el.innerHTML = `<div class="cover"></div><b></b><span>${n === 1 ? t("page1") : t("pagesN", { n })}</span>`;
      if (b.cover) el.querySelector<HTMLElement>(".cover")!.style.backgroundImage = `url(${b.cover})`;
      el.querySelector("b")!.textContent = title;
      el.onclick = () => openBook(b);
      box.append(el);
    }
  }

  async function deletePage(i: number) {
    const [pg] = pages.splice(i, 1);
    if (pg && pg.id && book && !book.demo) { try { await DB.del("pages", pg.id); } catch (e) { storageFail(e); } }
    if (i === 0 && book) book.cover = null;
    if (!pages.length) { await deleteBook(); return; }
    cur = Math.min(cur, pages.length - 1);
    await saveBook(); render();
  }
  function movePage(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= pages.length) return;
    [pages[i], pages[j]] = [pages[j], pages[i]];
    if (cur === i) cur = j; else if (cur === j) cur = i;
    if ((i === 0 || j === 0) && book) book.cover = null;
    saveBook(); render();
  }
  async function deleteBook() {
    if (book && !book.demo) {
      try { for (const pg of pages) if (pg.id) await DB.del("pages", pg.id); await DB.del("books", book.id); } catch (e) { storageFail(e); }
    }
    pages.length = 0; book = null; showStart();
  }

  let titleTimer = 0;
  $<HTMLInputElement>("bookTitle").oninput = e => { if (book) { book.title = val(e).trim(); clearTimeout(titleTimer); titleTimer = window.setTimeout(saveBook, 400); } };
  $<HTMLButtonElement>("editPagesBtn").onclick = () => {
    const on = document.body.classList.toggle("editing");
    $<HTMLButtonElement>("editPagesBtn").textContent = t(on ? "done" : "editPages");
    $<HTMLButtonElement>("delBookBtn").classList.remove("armed"); $<HTMLButtonElement>("delBookBtn").textContent = t("deleteBook");
    renderThumbs();
  };
  $<HTMLButtonElement>("delBookBtn").onclick = () => {
    const b = $<HTMLButtonElement>("delBookBtn");
    if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = t("confirmDelete"); return; }
    deleteBook();
  };

  // Text -> HTML mit Wort- und Silben-Spans. Gleichzeitig Zeichenpositionen für das Vorlesen merken.
  const WORD = /[\p{L}\p{M}·]+(?:-[\p{L}\p{M}·]+)*/gu;
  // Silben eines Wortes: „·“ = feste Silbengrenze (vom Buch oder selbst gesetzt), „-“ = echter Bindestrich.
  // Jedes Stück wird zusätzlich automatisch getrennt.
  function wordSyllables(raw: string, lang: string): string[] {
    const out: string[] = [];
    raw.split("-").forEach((piece, k, all) => {
      const sy = piece.split("·").filter(Boolean).flatMap(x => Silben.silben(x, lang));
      if (k < all.length - 1 && sy.length) sy[sy.length - 1] += "-";
      out.push(...sy);
    });
    return out;
  }
  function buildText(text: string, lang: string): { ps: HTMLParagraphElement[]; speech: Speech } {
    const ps: HTMLParagraphElement[] = [];
    const plainParts: string[] = [];
    let wordIndex = 0;
    const wordPos: Speech["wordPos"] = [];
    text.split(/\n\s*\n/).forEach((marked) => {
      const p = document.createElement("p");
      let last = 0;
      // *fett* markierte Stellen: Sternchen entfernen, Positionen merken
      const bold: boolean[] = [];
      let para = "", on = false;
      for (const ch of marked) { if (ch === "*") { on = !on; continue; } para += ch; bold.push(on); }
      const plain = para.replace(/\n/g, " ").replace(/·/g, "");
      for (const m of para.replace(/\n/g, " ").matchAll(WORD)) {
        if (m.index! > last) p.append(para.replace(/\n/g, " ").slice(last, m.index));
        const raw = m[0];
        const word = raw.replace(/·/g, "");
        const morph = S.mode === "morf" ? wordSet(lang) : null;
        const mparts = morph ? morphParts(raw.replace(/·/g, ""), w => morph.has(w)) : null;
        const parts = mparts ? mparts.map(x => x.text) : wordSyllables(raw, lang);
        const w = document.createElement("span");
        w.className = "w" + (bold[m.index!] ? " b" : ""); w.dataset.word = word; w.dataset.i = String(wordIndex++);
        parts.forEach((sil, i) => {
          const s = document.createElement("span");
          s.className = "s s" + (i % 2) + (sil.length < 2 ? " tiny" : "") + (mparts?.[i].suffix ? " suf" : ""); s.textContent = sil;
          w.append(s);
        });
        p.append(w);
        last = m.index! + raw.length;
      }
      if (last < para.length) p.append(para.slice(last));
      ps.push(p);
      plainParts.push(plain);
    });
    // Zeichenpositionen im Vorlesetext
    const full = plainParts.join("\n");
    let idx = 0;
    for (const m of full.matchAll(/[\p{L}\p{M}]+/gu)) wordPos.push({ start: m.index!, end: m.index! + m[0].length, i: idx++ });
    return { ps, speech: { full, wordPos } };
  }

  /** Modus „kurze Zeilen“: Zeilenumbrüche zwischen die Wörter eines Absatzes setzen. */
  function shortLines(p: HTMLParagraphElement) {
    const ws = [...p.querySelectorAll<HTMLElement>(".w")];
    const sepOf = (w: HTMLElement) => (w.nextSibling && w.nextSibling.nodeType === Node.TEXT_NODE ? w.nextSibling.textContent || "" : "");
    const breaks = shortLineBreaks(ws.map(sepOf));
    ws.forEach((w, i) => {
      if (!breaks[i]) return;
      const tn = w.nextSibling;
      if (tn && tn.nodeType === Node.TEXT_NODE) {
        const m = (tn.textContent || "").match(/^(\S*)\s*([\s\S]*)$/)!;
        tn.textContent = m[1];
        (tn as Text).after(document.createElement("br"), ...(m[2] ? [document.createTextNode(m[2])] : []));
      } else w.after(document.createElement("br"));
    });
    p.classList.add("short");
  }
  // ---------- Gemeinsam lesen: offene Fragen für den Erwachsenen ----------
  function renderTogether() {
    const pg = pages[cur];
    const box = $("together");
    box.hidden = S.together !== "an" || !pg || pg.status !== "done";
    if (box.hidden) return;
    const ul = $("togetherQs"); ul.innerHTML = "";
    for (const q of pageQuestions(pg.lang, cur, pg.question)) { const li = document.createElement("li"); li.textContent = q; ul.append(li); }
    $<HTMLInputElement>("ownQ").value = pg.question || "";
    $("ownQRow").hidden = true;
  }
  $<HTMLButtonElement>("ownQBtn").onclick = () => {
    const row = $("ownQRow"); row.hidden = !row.hidden;
    if (!row.hidden) $<HTMLInputElement>("ownQ").focus();
  };
  function saveOwnQ() {
    const pg = pages[cur]; if (!pg) return;
    pg.question = $<HTMLInputElement>("ownQ").value.trim();
    savePage(pg); renderTogether();
  }
  $<HTMLInputElement>("ownQ").onkeydown = e => { if (e.key === "Enter") saveOwnQ(); };
  $<HTMLButtonElement>("ownQSave").onclick = saveOwnQ;

  // ---------- Wortteile (Morpheme), vorerst nur Dänisch ----------
  const MORPH_LANGS = ["da"];
  const wordSets: Record<string, Set<string>> = {};
  let wordsLoading: Promise<void> | null = null;
  /** Wortliste der Sprache, falls schon geladen (sonst null; Laden über morphCheck) */
  function wordSet(lang: string): Set<string> | null { return wordSets[lang] || null; }
  /** Im Modus „Wortteile“: Wortliste laden und neu zeichnen; Hinweis, wenn die Sprache fehlt. */
  function morphCheck(notify = true) {
    if (S.mode !== "morf") return;
    const lang = pages[cur]?.lang || S.lang;
    if (!MORPH_LANGS.includes(lang)) { if (notify) toast(t("morfOnlyDa")); return; }
    if (wordSets[lang] || wordsLoading) return;
    wordsLoading = loadScript(`lang/${lang}-words.js`).then(() => {
      wordSets[lang] = new Set((window.WORDS?.[lang] || "").split("\n"));
      if (pages[cur]) render();
    }).catch(() => toast(t("morfFail"))).finally(() => { wordsLoading = null; });
  }

  const isPageMode = (pg: Page | undefined): boolean => !!(S.view === "side" && pg && pg.clean && pg.paras && pg.paras.length > 0);

  // Inhalt einer fertig erkannten Seite zeigen: als Buchseite oder als reiner Text.
  let speech: Speech | null = null;   // Vorlesedaten der angezeigten Seite
  function renderContent(pg: Page) {
    const rd = $("reader");
    const built = buildText(pg.text, pg.lang);
    const ps = built.ps;
    rd.innerHTML = ""; speech = built.speech;
    const page = isPageMode(pg);
    rd.classList.toggle("pagemode", page);
    if (!page) { ps.forEach(p => { if (S.lines === "kort") shortLines(p); rd.append(p); }); return; }

    const pv = buildPageView(pg, ps);
    const img = pv.querySelector("img")!;
    rd.append(pv);
    const go = () => requestAnimationFrame(() => fitBoxes());
    if (moving) addGrips();
    if (img.complete) go(); else img.onload = go;
    if (document.fonts) document.fonts.ready.then(go);
  }


  // Buchseite als Bild (alte Schrift übermalt) mit Textfeldern an den Stellen der alten Schrift
  function buildPageView(pg: Page, ps: HTMLParagraphElement[]): HTMLDivElement {
    const W = pg.workW!, H = pg.workH!, paras = pg.paras!;
    const pv = document.createElement("div"); pv.className = "pageview";
    const img = new Image(); img.src = pg.clean!; img.alt = ""; pv.append(img);
    paras.forEach((pa, i) => {
      const box = document.createElement("div");
      box.className = "tbox" + (pa.busy ? " busy" : "");
      const pad = pa.place ? 0 : pa.lh * 0.3, g = pa.place || pa.grow || pa.bbox;
      box.dataset.i = String(i);
      const x0 = Math.max(0, g.x0 - pad), y0 = Math.max(0, g.y0 - pad);
      const x1 = Math.min(W, g.x1 + pad), y1 = Math.min(H, g.y1 + pad);
      box.dataset.lh = String(pa.lh / H);
      Object.assign(box.style, { left: x0 / W * 100 + "%", top: y0 / H * 100 + "%", width: (x1 - x0) / W * 100 + "%", height: (y1 - y0) / H * 100 + "%" });
      if (pa.busy && pa.bg) box.style.background = pa.bg;
      const own = i === paras.length - 1 ? ps.slice(i) : ps.slice(i, i + 1);
      own.forEach(p => box.append(p));
      pv.append(box);
    });
    return pv;
  }

  // ---------- Textfelder verschieben (unter „Rediger tekst“) ----------
  let moving = false;
  function addGrips() {
    $("reader").querySelectorAll<HTMLElement>(".pageview .tbox").forEach(b => {
      if (!b.querySelector(".grip")) { const g = document.createElement("span"); g.className = "grip"; b.append(g); }
    });
  }
  function setMoving(on: boolean) {
    moving = on;
    $("reader").classList.toggle("moving", on);
    if (on) addGrips(); else $("reader").querySelectorAll(".grip").forEach(g => g.remove());
    $<HTMLButtonElement>("moveBtn").querySelector("span")!.textContent = t(on ? "moveDone" : "moveBoxes");
    $<HTMLButtonElement>("moveBtn").classList.toggle("on", on);
  }
  $<HTMLButtonElement>("moveBtn").onclick = () => {
    setMoving(!moving);
    if (moving) { stopSpeech(); toast(t("moveHint"), 4000); }
  };
  $<HTMLButtonElement>("resetPlaceBtn").onclick = () => {
    const pg = pages[cur]; if (!pg?.paras) return;
    pg.paras.forEach(pa => { delete pa.place; });
    savePage(pg); render();
  };
  /** aktuelle Fläche eines Felds in Bildkoordinaten (aus seiner Position in Prozent) */
  function boxRect(el: HTMLElement, W: number, H: number) {
    const pc = (v: string) => parseFloat(v) / 100;
    const x0 = pc(el.style.left) * W, y0 = pc(el.style.top) * H;
    return { x0, y0, x1: x0 + pc(el.style.width) * W, y1: y0 + pc(el.style.height) * H };
  }
  $("reader").addEventListener("pointerdown", e => {
    if (!moving) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>(".pageview .tbox");
    const pg = pages[cur];
    if (!el || !pg?.paras || !pg.workW || !pg.workH) return;
    e.preventDefault();
    const W = pg.workW, H = pg.workH, pa = pg.paras[Number(el.dataset.i)];
    const pv = el.parentElement!;
    const mode = (e.target as HTMLElement).classList.contains("grip") ? "resize" : "move";
    const start = boxRect(el, W, H), sx = e.clientX, sy = e.clientY;
    let cur0 = start;
    el.setPointerCapture(e.pointerId); el.classList.add("dragging");
    const onMove = (ev: PointerEvent) => {
      const k = W / pv.clientWidth;
      cur0 = dragBox(start, (ev.clientX - sx) * k, (ev.clientY - sy) * k, mode, { W, H });
      Object.assign(el.style, { left: cur0.x0 / W * 100 + "%", top: cur0.y0 / H * 100 + "%", width: (cur0.x1 - cur0.x0) / W * 100 + "%", height: (cur0.y1 - cur0.y0) / H * 100 + "%" });
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onUp);
      el.classList.remove("dragging");
      if (pa && (cur0.x0 !== start.x0 || cur0.y0 !== start.y0 || cur0.x1 !== start.x1 || cur0.y1 !== start.y1)) {
        pa.place = cur0; savePage(pg);
        $<HTMLButtonElement>("resetPlaceBtn").hidden = false;
        fitBoxes();
      }
    };
    el.addEventListener("pointermove", onMove); el.addEventListener("pointerup", onUp); el.addEventListener("pointercancel", onUp);
  });

  // Schriftgröße je Textfeld so wählen, dass der Text genau in die Fläche der alten Schrift passt.
  function fitBoxes(root: ParentNode = document) {
    const sizes = new Map<HTMLElement, number>();
    const boxes = [...root.querySelectorAll<HTMLElement>(".pageview .tbox")];
    boxes.forEach(box => {
      const h = box.clientHeight, w = box.clientWidth;
      if (!h || !w) return;
      // höchstens gut doppelt so groß wie die Originalschrift
      const maxFs = parseFloat(box.dataset.lh || "1") * (box.parentElement?.clientHeight || h) * 2.4;
      let lo = 4, hi = Math.max(8, Math.min(h, maxFs));
      for (let k = 0; k < 12; k++) {
        const mid = (lo + hi) / 2;
        box.style.fontSize = mid + "px";
        if (box.scrollHeight <= h + 1 && box.scrollWidth <= w + 1) lo = mid; else hi = mid;
      }
      box.style.fontSize = lo + "px";
      sizes.set(box, lo);
    });
    // Größenverhältnisse des Originals erhalten: gleich groß bleibt gleich groß, Überschriften bleiben größer.
    const fitted = harmonizeSizes(boxes.map(b => ({ lh: parseFloat(b.dataset.lh || "0"), fit: sizes.get(b) || 0 })));
    boxes.forEach((b, i) => { if (sizes.has(b)) b.style.fontSize = fitted[i] + "px"; });
  }
  let fitT = 0;
  new ResizeObserver(() => { clearTimeout(fitT); fitT = window.setTimeout(() => fitBoxes(), 60); }).observe($("reader"));

  /** Fettdruck messen (Tesseract liefert keine Schriftmerkmale) und an den Wörtern vermerken. */
  function markBold(data: OcrData, canvas: HTMLCanvasElement) {
    const paras = (data.blocks || []).flatMap(b => b.paragraphs || []);
    const words = paras.flatMap(p => (p.lines || []).flatMap(l => l.words || []));
    // Bezugsgröße: mittlere Zeilenhöhe des Absatzes (einzelne Wörter oder kurze Zeilen ohne
    // Ober-/Unterlängen sind niedriger und wirkten sonst dicker)
    const lineH = new Map<object, number>();
    for (const p of paras) {
      const hs = (p.lines || []).map(l => l.bbox.y1 - l.bbox.y0).sort((x, y) => x - y);
      const med = hs[hs.length >> 1] || 0;
      for (const l of p.lines || []) for (const w of l.words || []) lineH.set(w, med);
    }
    if (!words.length) return;
    const W = canvas.width, H = canvas.height;
    const px = canvas.getContext("2d")!.getImageData(0, 0, W, H).data;
    const ratios = words.map(w => {
      if (!/\p{L}{2,}/u.test(w.text) || w.confidence < 60) return NaN;
      const x0 = Math.max(0, Math.round(w.bbox.x0)), y0 = Math.max(0, Math.round(w.bbox.y0));
      const x1 = Math.min(W, Math.round(w.bbox.x1)), y1 = Math.min(H, Math.round(w.bbox.y1));
      const cw = x1 - x0, ch = y1 - y0;
      if (cw < 4 || ch < 6) return NaN;
      const g = new Uint8ClampedArray(cw * ch);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const i = ((y0 + y) * W + x0 + x) * 4;
        g[y * cw + x] = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
      }
      return strokeWidth(g, cw, ch) / (lineH.get(w) || ch);
    });
    boldFlags(ratios).forEach((b, i) => { words[i].bold = b; });
  }

  // Alte Schrift aus dem Foto entfernen: jede Zeile mit der Hintergrundfarbe drumherum übermalen.
  function eraseText(canvas: HTMLCanvasElement, paras: Para[]): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = canvas.width; c.height = canvas.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0);
    const W = c.width, H = c.height;
    const px = canvas.getContext("2d")!.getImageData(0, 0, W, H).data;
    const med = (a: number[]): number => { a.sort((x, y) => x - y); return a[a.length >> 1]; };
    // Zeilenenden: Tinte, die direkt an eine erkannte Zeile anschließt (unsicher erkannte Wortendung,
    // Komma), gehört mit zum Text und wird mit übermalt.
    const lum = (x: number, y: number): number => { const i = (y * W + x) * 4; return 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]; };
    function tails(l: Box, h: number): Box[] {
      const out: Box[] = [];
      const y0 = Math.max(0, Math.round(l.y0)), y1 = Math.min(H - 1, Math.round(l.y1));
      let bg = 0, n = 0;
      for (let y = y0; y <= y1; y += 2) for (const x of [l.x0, l.x1]) { if (x >= 0 && x < W) { bg = Math.max(bg, lum(Math.round(x), y)); n++; } }
      const inkCol = (x: number): boolean => { for (let y = y0; y <= y1; y += 2) if (lum(x, y) < bg - 70) return true; return false; };
      for (const dir of [1, -1]) {
        let x = dir > 0 ? Math.round(l.x1) + 1 : Math.round(l.x0) - 1, gap = 0, last: number | null = null;
        while (x > 0 && x < W - 1 && gap < 0.6 * h && Math.abs(x - (dir > 0 ? l.x1 : l.x0)) < 2.5 * h) {
          if (inkCol(x)) { last = x; gap = 0; } else gap++;
          x += dir;
        }
        if (last != null) out.push(dir > 0 ? { x0: l.x1, y0: l.y0, x1: last, y1: l.y1 } : { x0: last, y0: l.y0, x1: l.x0, y1: l.y1 });
      }
      return out;
    }
    for (const pa of paras) {
      let spreadMax = 0, bgs = [];
      const extraBoxes = (pa.lines || []).flatMap(l => tails(l, pa.lh));
      for (const l of [...(pa.words || pa.lines), ...extraBoxes]) {
        const pad = Math.round(pa.lh * 0.28) + 3;
        const x0 = Math.max(0, l.x0 - pad), y0 = Math.max(0, l.y0 - pad);
        const x1 = Math.min(W - 1, l.x1 + pad), y1 = Math.min(H - 1, l.y1 + pad);
        // Farbe links und rechts vom Wort getrennt messen und mit einem Verlauf übermalen,
        // damit bei ungleichmäßigem Licht keine hellen/dunklen Kästen entstehen.
        const ring = (sx0: number, sx1: number) => {
          const R: number[] = [], G: number[] = [], B: number[] = [];
          const take = (x: number, y: number) => { const i = (y * W + x) * 4; R.push(px[i]); G.push(px[i + 1]); B.push(px[i + 2]); };
          for (let x = sx0; x <= sx1; x += 2) { take(x, y0); take(x, y1); }
          if (sx0 === x0) for (let y = y0; y <= y1; y += 2) take(x0, y);
          if (sx1 === x1) for (let y = y0; y <= y1; y += 2) take(x1, y);
          const m = [med(R.slice()), med(G.slice()), med(B.slice())];
          let dev = 0;
          for (let i = 0; i < R.length; i++) dev += Math.abs(R[i] - m[0]) + Math.abs(G[i] - m[1]) + Math.abs(B[i] - m[2]);
          return { m, dev: dev / R.length / 3 };
        };
        const mid = (x0 + x1) >> 1;
        const L = ring(x0, mid), Rr = ring(mid, x1);
        const m = L.m.map((v, k) => Math.round((v + Rr.m[k]) / 2));
        spreadMax = Math.max(spreadMax, Math.min(L.dev, Rr.dev));
        bgs.push(m);
        const grad = ctx.createLinearGradient(x0, 0, x1, 0);
        grad.addColorStop(0, `rgb(${L.m})`); grad.addColorStop(1, `rgb(${Rr.m})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
      }
      // Unruhiger Hintergrund (Text auf einer Illustration): Textfeld bekommt eine eigene Fläche.
      const avg = [0, 1, 2].map(k => Math.round(bgs.reduce((a, b) => a + b[k], 0) / bgs.length));
      pa.busy = spreadMax > 26;
      pa.bg = `rgba(${avg[0]},${avg[1]},${avg[2]},.94)`;
      pa.rgb = avg;
    }
    growBoxes(ctx.getImageData(0, 0, W, H).data, W, H, paras);
    return c;
  }

  // Textfelder auf ruhigem Hintergrund in den freien Platz daneben und darunter wachsen lassen,
  // damit die neue (breitere, größere) Schrift Raum bekommt. Bilder werden dabei nicht überdeckt.
  function growBoxes(px: Uint8ClampedArray, W: number, H: number, paras: Para[]) {
    const plain = (x0: number, y0: number, x1: number, y1: number, rgb: number[]): boolean => {
      x0 = Math.max(0, Math.round(x0)); y0 = Math.max(0, Math.round(y0));
      x1 = Math.min(W - 1, Math.round(x1)); y1 = Math.min(H - 1, Math.round(y1));
      if (x1 <= x0 || y1 <= y0) return false;
      let n = 0, bad = 0;
      for (let y = y0; y <= y1; y += 3) for (let x = x0; x <= x1; x += 3) {
        const i = (y * W + x) * 4; n++;
        if (Math.abs(px[i] - rgb[0]) + Math.abs(px[i + 1] - rgb[1]) + Math.abs(px[i + 2] - rgb[2]) > 60) bad++;
      }
      return bad / n < 0.01;
    };
    paras.forEach((pa, i) => {
      pa.grow = { ...pa.bbox };
      if (pa.busy) return;
      const b = pa.grow, gap = pa.lh * 0.8;
      // nach rechts: höchstens bis zum gleichen Rand wie links
      const right = Math.max(b.x1, W - b.x0);
      if (right > b.x1 && plain(b.x1 + 2, b.y0, right, b.y1, pa.rgb!)) b.x1 = right;
      // nach unten: schrittweise, bis Bild, nächster Text oder Seitenrand kommt
      const others = paras.filter((o, j) => j !== i && o.bbox.y0 > b.y1 && o.bbox.x0 < b.x1 && o.bbox.x1 > b.x0);
      const limit = Math.min(H - Math.max(b.x0 * 0.6, gap), ...others.map(o => o.bbox.y0 - gap));
      const step = pa.lh * 0.5;
      while (b.y1 + step <= limit && plain(b.x0, b.y1 + 2, b.x1, b.y1 + step, pa.rgb!)) b.y1 += step;
    });
  }

  const ocrOpts = () => ({ bookSyllables: S.hyph === "bog" });
  // Text einer Seite aus dem OCR-Rohtext neu aufbauen (z. B. nach Änderung der Bindestrich-Einstellung).
  function retext(pg: Page) {
    if (pg.paras && pg.paras.length) {
      pg.paras.forEach(pa => { pa.text = Layout.cleanOcr(pa.raw, ocrOpts()); });
      pg.text = pg.paras.map(pa => pa.text).join("\n\n");
    } else if (pg.rawText != null) {
      pg.text = Layout.cleanOcr(pg.rawText, ocrOpts());
    }
  }
  const toCanvas = (src: string) => new Promise<HTMLCanvasElement>((res, rej) => {
    const img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d")!.drawImage(img, 0, 0); res(c); };
    img.onerror = rej; img.src = src;
  });

  // Nach dem Korrigieren: Absätze wieder den Textfeldern auf der Seite zuordnen.
  function syncParas(pg: Page) {
    if (!pg.paras) return;
    const parts = pg.text.split(/\n\s*\n/);
    pg.paras.forEach((pa, i) => { pa.text = parts[i] || ""; });
  }

  function showStatus(html: string) {
    $("reader").classList.remove("pagemode", "comparing");
    $("reader").innerHTML = `<div class="status">${html}</div>`;
    speech = null;
  }

  function render() {
    const pg = pages[cur];
    $("count").textContent = t("pageOf", { a: cur + 1, b: pages.length });
    if (document.activeElement !== $<HTMLInputElement>("bookTitle")) $<HTMLInputElement>("bookTitle").value = (book && book.title) || "";
    $<HTMLButtonElement>("editPagesBtn").hidden = !book || !!book.demo;
    $<HTMLButtonElement>("exportBtn").hidden = !book || !!book.demo;
    $<HTMLButtonElement>("prev").disabled = cur === 0; $<HTMLButtonElement>("next").disabled = cur >= pages.length - 1;
    if (pg.img) $<HTMLImageElement>("origImg").src = pg.img;
    $<HTMLButtonElement>("recropBtn").hidden = !(pg.photo || pg.photoBlob);
    const pageView = pg.status === "done" && isPageMode(pg) && !comparing;
    if (!pageView) setMoving(false);
    $<HTMLButtonElement>("moveBtn").hidden = !pageView;
    $<HTMLButtonElement>("resetPlaceBtn").hidden = !pageView || !(pg.paras || []).some(pa => pa.place);
    $<HTMLButtonElement>("reocrBtn").hidden = !(pg.canvas || pg.inputBlob) || pg.status === "wait" || pg.status === "ocr";
    stopSpeech();
    renderTogether();
    morphCheck(false);
    $<HTMLButtonElement>("compareBtn").hidden = !pg.img;
    if (pg.status === "done" && comparing && pg.img) {
      const rd = $("reader");
      rd.classList.remove("pagemode"); rd.classList.add("comparing");
      rd.innerHTML = ""; speech = null;
      const im = new Image(); im.className = "origfull"; im.src = pg.img; im.alt = t("origAlt"); rd.append(im);
      $<HTMLTextAreaElement>("text").value = pg.text;
      $<HTMLButtonElement>("readBtn").disabled = true;
    } else if (pg.status === "done") {
      $("reader").classList.remove("comparing");
      renderContent(pg);
      $<HTMLTextAreaElement>("text").value = pg.text;
      $<HTMLDetailsElement>("edit").hidden = false;
      $<HTMLButtonElement>("readBtn").disabled = !pg.text;
      if (!pg.text) showStatus(t("noText"));
    } else if (pg.status === "error") {
      showStatus(t("ocrFailed") + "<br>" + (pg.error || ""));
      $<HTMLTextAreaElement>("text").value = ""; $<HTMLButtonElement>("readBtn").disabled = true;
    } else {
      const pct = Math.round((pg.progress || 0) * 100);
      showStatus(`<span>${t(pg.status === "wait" ? "waiting" : pg.stage || "recognizing")}</span><div class="bar"><i style="width:${pct}%"></i></div>`);
      $<HTMLButtonElement>("readBtn").disabled = true;
    }
    applySettings();
    renderThumbs();
  }

  function renderThumbs() {
    const box = $("thumbs"); box.innerHTML = "";
    pages.forEach((pg, i) => {
      const wrap = document.createElement("div"); wrap.className = "thumb";
      const b = document.createElement("button");
      b.className = i === cur ? "on" : ""; b.title = t("page") + " " + (i + 1);
      b.innerHTML = pg.img ? `<img src="${pg.img}" alt="">` : `<span class="demo">${t("example")}</span>`;
      b.onclick = () => { cur = i; render(); saveBook(); };
      const ctl = document.createElement("div"); ctl.className = "ctl";
      ctl.innerHTML = `<button title="${t("moveLeft")}">‹</button><button class="x" title="${t("deletePage")}">×</button><button title="${t("moveRight")}">›</button>`;
      const [l, x, r] = ctl.querySelectorAll("button");
      l.onclick = () => movePage(i, -1); r.onclick = () => movePage(i, 1); x.onclick = () => deletePage(i);
      wrap.append(b, ctl);
      box.append(wrap);
    });
    const add = document.createElement("label");
    add.className = "add"; add.title = t("addPages"); add.innerHTML = icon("plus") + `<input type="file" accept="image/*" multiple hidden>`;
    add.querySelector("input")!.onchange = e => addFiles((e.target as HTMLInputElement).files);
    box.append(add);
  }

  $<HTMLButtonElement>("prev").onclick = () => { if (cur > 0) { cur--; render(); saveBook(); } };
  $<HTMLButtonElement>("next").onclick = () => { if (cur < pages.length - 1) { cur++; render(); saveBook(); } };
  document.addEventListener("keydown", e => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    if (e.key === "ArrowLeft") $<HTMLButtonElement>("prev").click();
    if (e.key === "ArrowRight") $<HTMLButtonElement>("next").click();
    if (e.key === "Escape" && document.body.classList.contains("focus")) $<HTMLButtonElement>("focusBtn").click();
  });

  let editT = 0;
  $<HTMLTextAreaElement>("text").oninput = e => {
    clearTimeout(editT);
    editT = window.setTimeout(() => { pages[cur].text = val(e); syncParas(pages[cur]); renderContent(pages[cur]); savePage(pages[cur]); }, 250);
  };

  // ---------- Bilder laden ----------
  function loadImage(file: File) {
    return new Promise<{ canvas: HTMLCanvasElement }>((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        // Große Handyfotos verkleinern: schneller und für die Erkennung völlig ausreichend.
        const max = 2200, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res({ canvas: c });
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error(t("imgError"))); };
      img.src = url;
    });
  }

  const queue: Page[] = [];
  async function addFiles(files: FileList | File[] | null) {
    const list = [...(files || [])].filter(f => f.type.startsWith("image/"));
    if (!list.length) return;
    showApp();
    const first = pages.length;
    for (const [n, f] of list.entries()) {
      try {
        const { canvas: photo } = await loadImage(f);
        const { canvas, corners } = await cropFlow(photo, null, list.length > 1 ? t("cropOf", { a: n + 1, b: list.length }) : "");
        const pg: Page = { bookId: book && !book.demo ? book.id : null, photo, corners, img: canvas.toDataURL("image/jpeg", 0.88), canvas, lang: S.lang, text: "", status: "wait", progress: 0 };
        pages.push(pg); queue.push(pg);
        if (n === 0) { cur = pages.length - 1; render(); }
        await savePage(pg); await saveBook();
        runQueue();
      } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    }
    if (!pages.length) return;
    cur = Math.min(first, pages.length - 1);
    render();
  }


  // ---------- E-Book (EPUB) ----------
  const blobBytes = async (b: Blob | null | undefined) => (b ? new Uint8Array(await b.arrayBuffer()) : null);
  const urlBytes = async (u: string | null | undefined) => (u ? new Uint8Array(await (await fetch(u)).arrayBuffer()) : null);
  const EXPORT_W = 1000;

  // Schrift(en) für das EPUB einbetten: OpenDyslexic steckt schon in der Seite, Google-Schriften laden wir.
  async function exportFonts(): Promise<EpubFont[]> {
    const family = (S.font.match(/"([^"]+)"/) || [])[1];
    if (!family) return [];
    const fonts: EpubFont[] = [];
    try {
      if (family === "OpenDyslexic") {
        const css = [...document.querySelectorAll("style")].map(x => x.textContent || "").join("\n");
        for (const m of css.matchAll(/font-family: "OpenDyslexic"; font-weight: (\d+); src: url\((data:font\/woff2;base64,[^)]+)\)/g)) {
          const data = await urlBytes(m[2]);
          if (data) fonts.push({ family, weight: Number(m[1]), file: `opendyslexic-${m[1]}.woff2`, data, type: "font/woff2" });
        }
      } else {
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;700&display=swap`)).text();
        let i = 0;
        for (const block of css.split("@font-face").slice(1)) {
          if (!/U\+0000-00FF/.test(block)) continue;   // nur lateinische Zeichen (inkl. æ ø å ä ö ü ß)
          const url = (block.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
          const weight = Number((block.match(/font-weight: (\d+)/) || [])[1] || 400);
          if (!url) continue;
          const data = await urlBytes(url);
          if (data) fonts.push({ family, weight, file: `font${i++}.woff2`, data, type: "font/woff2" });
        }
      }
    } catch (e) { console.warn("Schrift nicht eingebettet", e); }
    return fonts;
  }

  function exportCss(): string {
    const [c0, c1] = S.colors.split(",");
    const colors = S.mode === "farbe" || S.mode === "beides" || S.mode === "morf";
    const arcs = S.mode === "boegen" || S.mode === "beides";
    return `@page { margin: 0; }
html, body { margin: 0; padding: 0; }
.page { position: relative; overflow: hidden; background: ${S.bg}; color: #1d1d1f; font-family: ${S.font}; }
.bg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.tbox { position: absolute; overflow: hidden; line-height: ${Math.min(S.lh, 1.6)}; letter-spacing: ${S.ls}em; word-spacing: ${wordSpacing(S.ls, WORD_BASE_BOX)}em; }
.tbox p, .flow p { margin: 0 0 .35em; }
.busy { border-radius: 12px; padding: 0 .3em; }
.flow { position: absolute; left: 70px; right: 70px; top: 70px; line-height: ${S.lh}; letter-spacing: ${S.ls}em; word-spacing: ${wordSpacing(S.ls, WORD_BASE_FLOW)}em; }
.flow p { margin-bottom: .8em; }
.w { white-space: nowrap; }
.w.b { font-weight: 700; }
${colors ? `.s0 { color: ${c0}; } .s1 { color: ${c1}; }` : ""}
${S.mode === "morf" ? ".w .s.suf { color: #7c8190; }" : ""}
${arcs ? `.s { position: relative; display: inline-block; padding-bottom: .12em; }
.s::after { content: ""; position: absolute; left: 6%; right: 6%; bottom: -.02em; height: .28em; border: .07em solid ${colors ? c0 : "#555"}; border-top: 0; border-radius: 0 0 50% 50% / 0 0 100% 100%; }
${colors ? `.s1::after { border-color: ${c1}; }` : ""}` : ""}`;
  }

  // Seiten unsichtbar setzen und vermessen, damit die Schriftgrößen im EPUB genau passen
  async function exportPages(host: HTMLDivElement): Promise<EpubPage[]> {
    const ser = new XMLSerializer();
    const out: EpubPage[] = [];
    for (const pg of pages) {
      const { ps } = buildText(pg.text, pg.lang);
      host.innerHTML = "";
      if (pg.clean && pg.paras && pg.paras.length && pg.workW && pg.workH) {
        const pv = buildPageView(pg, ps);
        host.append(pv);
        const img = pv.querySelector("img")!;
        try { await img.decode(); } catch { /* Bild fehlt: Textfelder trotzdem setzen */ }
        fitBoxes(host);
        img.remove();
        const boxes = [...pv.querySelectorAll<HTMLElement>(".tbox")].map(b => { b.removeAttribute("data-lh"); return ser.serializeToString(b); });
        out.push({ width: EXPORT_W, height: Math.round(EXPORT_W * pg.workH / pg.workW), image: (await blobBytes(pg.cleanBlob)) || (await urlBytes(pg.clean)), bodyHtml: boxes.join("\n") });
      } else {
        // reine Textseite: Schrift so groß wie möglich, aber die Seite darf nicht überlaufen
        const height = Math.round(EXPORT_W * 1.414);
        const flow = document.createElement("div"); flow.className = "flow";
        Object.assign(flow.style, { position: "absolute", left: "70px", right: "70px", top: "70px" });
        ps.forEach(p => flow.append(p));
        host.append(flow);
        let lo = 16, hi = 90;
        for (let k = 0; k < 10; k++) { const mid = (lo + hi) / 2; flow.style.fontSize = mid + "px"; if (flow.scrollHeight <= height - 140) lo = mid; else hi = mid; }
        flow.style.fontSize = lo + "px";
        flow.removeAttribute("style"); flow.setAttribute("style", `font-size:${lo.toFixed(1)}px`);
        out.push({ width: EXPORT_W, height, image: null, bodyHtml: ser.serializeToString(flow) });
      }
    }
    return out;
  }

  async function exportBook() {
    if (!book || book.demo) return;
    if (pages.some(p => p.status !== "done")) { toast(t("notReady")); return; }
    toast(t("exporting"), 60000);
    const host = document.createElement("div");
    host.className = $("reader").className.replace(/\b(comparing|moving)\b/g, "") + " pagemode exporthost";
    Object.assign(host.style, { position: "fixed", left: "-20000px", top: "0", width: EXPORT_W + "px", fontSize: "32px" });
    document.body.append(host);
    try {
      const epPages = await exportPages(host);
      const data: DataPage[] = [];
      for (const pg of pages) {
        data.push({
          lang: pg.lang, text: pg.text, rawText: pg.rawText, paras: pg.paras, workW: pg.workW, workH: pg.workH, corners: pg.corners, question: pg.question || "",
          input: (await blobBytes(pg.inputBlob)) || (pg.canvas ? await blobBytes(await canvasBlob(pg.canvas)) : null),
          clean: (await blobBytes(pg.cleanBlob)) || (await urlBytes(pg.clean)),
        });
      }
      const title = book.title || t("untitled");
      const bytes = buildEpub({ id: book.id, title, lang: pages[0]?.lang || S.lang, css: exportCss(), fonts: await exportFonts(), pages: epPages, data: { title, pages: data }, pageLabel: t("page") });
      const name = (title.replace(/[\\/:*?"<>|]+/g, "").trim() || "laesehjaelper") + ".epub";
      const blob = new Blob([bytes as BlobPart], { type: "application/epub+zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      toast(t("exported", { name }), 4000);
    } catch (e) {
      console.error(e); toast(e instanceof Error ? e.message : String(e));
    } finally { host.remove(); }
  }
  $<HTMLButtonElement>("exportBtn").onclick = () => { exportBook(); };

  async function importBook(file: File) {
    toast(t("importing"), 60000);
    try {
      const d = readEpub(new Uint8Array(await file.arrayBuffer()));
      if (!d || !d.pages.length) { toast(t("importFail")); return; }
      const b: Book = { id: uid(), title: d.title, pageIds: [], lastPage: 0, cover: null, created: Date.now(), updated: Date.now() };
      for (const p of d.pages) {
        const id = uid();
        const rec: PageRecord = {
          id, bookId: b.id, lang: p.lang, status: "done", text: p.text, rawText: p.rawText, paras: p.paras || null,
          workW: p.workW, workH: p.workH, corners: p.corners || null, question: p.question || "",
          inputBlob: p.input ? new Blob([p.input as BlobPart], { type: "image/jpeg" }) : null,
          photoBlob: null,
          cleanBlob: p.clean ? new Blob([p.clean as BlobPart], { type: "image/jpeg" }) : null,
        };
        await DB.put<PageRecord>("pages", rec);
        b.pageIds.push(id);
      }
      const first = d.pages[0].input;
      if (first) {
        const c = await blobToCanvas(new Blob([first as BlobPart], { type: "image/jpeg" }));
        const k = 240 / Math.max(c.width, c.height), sm = document.createElement("canvas");
        sm.width = Math.round(c.width * k); sm.height = Math.round(c.height * k);
        ctx2d(sm).drawImage(c, 0, 0, sm.width, sm.height);
        b.cover = sm.toDataURL("image/jpeg", 0.8);
      }
      await DB.put("books", b);
      toast(d.title || t("untitled"), 2000);
      await renderShelf();
      openBook(b);
    } catch (e) {
      console.error(e); toast(t("importFail"));
    }
  }
  $<HTMLInputElement>("importFile").onchange = e => { const inp = e.target as HTMLInputElement; if (inp.files?.[0]) importBook(inp.files[0]); inp.value = ""; };

  // ---------- Seite zuschneiden ----------
  // OpenCV (ca. 13 MB) wird erst beim ersten Foto geladen und dann vom Browser zwischengespeichert.
  let cvP: Promise<CV> | null = null;
  function getCv(): Promise<CV> {
    if (!cvP) cvP = loadScript("opencv.js").then(async () => {
      let cv: CV = window.cv;
      if (cv instanceof Promise) cv = await cv;
      else if (!cv.Mat) await new Promise<void>(r => { cv.onRuntimeInitialized = r; });
      return cv;
    });
    cvP.catch(() => { cvP = null; });
    return cvP;
  }

  // Dialog: Ecken zeigen (automatischer Vorschlag oder Bildrand), verschieben lassen, entzerren.
  type CropResult = { canvas: HTMLCanvasElement; corners: Frame | null };
  // Dialog: Rahmen zeigen (automatischer Vorschlag oder Bildrand), verschieben lassen, entzerren.
  // Vier Ecken plus je ein Punkt auf jeder Kante: Mit den Kantenpunkten lassen sich gewölbte
  // Seiten (z. B. zur Buchmitte hin) nachzeichnen.
  function cropFlow(photo: HTMLCanvasElement, start: Frame | null, counter: string): Promise<CropResult> {
    return new Promise(async (resolve) => {
      const W = photo.width, H = photo.height;
      const full = frameFromCorners([[0, 0], [W, 0], [W, H], [0, H]]);
      const init = start || full;
      // Punkte in Reihenfolge: 4 Ecken, dann 4 Kantenmitten (oben, rechts, unten, links)
      let pts: Point[] = [...init.corners, ...init.mids].map((p): Point => [p[0], p[1]]);
      // Kantenmitten, die noch nicht von Hand bewegt wurden, wandern mit den Ecken mit
      const midMoved = [false, false, false, false];
      if (start) start.mids.forEach((m, i) => {
        const a = start.corners[i], b = start.corners[(i + 1) % 4];
        midMoved[i] = Math.hypot(m[0] - (a[0] + b[0]) / 2, m[1] - (a[1] + b[1]) / 2) > 2;
      });
      const followMids = () => {
        for (let i = 0; i < 4; i++) if (!midMoved[i]) {
          const a = pts[i], b = pts[(i + 1) % 4];
          pts[4 + i] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        }
      };
      const dlg = $("crop"), stage = $("cropStage"), cnv = $<HTMLCanvasElement>("cropCanvas");
      dlg.hidden = false;
      // Höhe auf den sichtbaren Bildschirm begrenzen. In eingebetteten Ansichten, die so hoch wie der
      // Inhalt werden, wäre der Dialog sonst höher als der Bildschirm und die Knöpfe unsichtbar.
      const visibleH = Math.min(window.innerHeight, window.visualViewport?.height || Infinity, screen.availHeight || Infinity);
      dlg.style.height = visibleH + "px";
      dlg.style.top = (window.innerHeight > visibleH * 1.15 ? window.scrollY : 0) + "px";
      const msg = (k: string) => { $("cropMsg").textContent = (counter ? counter + " · " : "") + t(k); };
      msg("cropLoading");
      let scale = 1, ox = 0, oy = 0;
      const handles = pts.map((_, i) => { const h = document.createElement("div"); h.className = i < 4 ? "h" : "h mid"; stage.append(h); return h; });
      function layout() {
        const sw = stage.clientWidth, sh = stage.clientHeight;
        scale = Math.min(sw / W, sh / H);
        const dw = W * scale, dh = H * scale; ox = (sw - dw) / 2; oy = (sh - dh) / 2;
        cnv.width = Math.round(dw * devicePixelRatio); cnv.height = Math.round(dh * devicePixelRatio);
        Object.assign(cnv.style, { left: ox + "px", top: oy + "px", width: dw + "px", height: dh + "px" });
        ctx2d(cnv).drawImage(photo, 0, 0, cnv.width, cnv.height);
        draw();
      }
      const sc = (p: Point) => `${(ox + p[0] * scale).toFixed(1)},${(oy + p[1] * scale).toFixed(1)}`;
      function draw() {
        pts.forEach(([x, y], i) => { handles[i].style.left = ox + x * scale + "px"; handles[i].style.top = oy + y * scale + "px"; });
        // Kanten als Kurven durch die Mittelpunkte (gleiche Kurve wie beim Entzerren)
        let d = `M${sc(pts[0])}`;
        for (let i = 0; i < 4; i++) {
          const a = pts[i], b = pts[(i + 1) % 4], m = pts[4 + i];
          const c: Point = [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];
          d += ` Q${sc(c)} ${sc(b)}`;
        }
        $("cropPoly").setAttribute("d", d + " Z");
      }
      handles.forEach((h, i) => {
        h.onpointerdown = (e) => {
          h.setPointerCapture(e.pointerId);
          const r = stage.getBoundingClientRect();
          h.onpointermove = (ev: PointerEvent) => {
            pts[i] = [Math.min(W, Math.max(0, (ev.clientX - r.left - ox) / scale)), Math.min(H, Math.max(0, (ev.clientY - r.top - oy) / scale))];
            if (i >= 4) midMoved[i - 4] = true; else followMids();
            draw();
          };
          h.onpointerup = () => { h.onpointermove = null; };
        };
      });
      const ro = new ResizeObserver(layout); ro.observe(stage);
      layout();

      let cv: CV = null;
      try {
        cv = await getCv();
        if (!start) {
          const found = Lib.detectPage(cv, photo);
          if (found) { pts = [...found, ...frameFromCorners(found).mids]; draw(); }
          msg(found ? "cropFound" : "cropNone");
        } else msg("cropNone");
      } catch (e) {
        console.error(e);
        msg("cropNone");
      }
      const finish = (frame: Frame | null) => {
        ro.disconnect(); handles.forEach(h => h.remove()); dlg.hidden = true;
        $<HTMLButtonElement>("cropOk").onclick = $<HTMLButtonElement>("cropWhole").onclick = null;
        const all = (f: Frame) => [...f.corners, ...f.mids];
        const isFull = !frame || all(frame).every((p, i) => Math.hypot(p[0] - all(full)[i][0], p[1] - all(full)[i][1]) < 2);
        if (isFull || !cv) return resolve({ canvas: photo, corners: null });
        resolve({ canvas: Lib.warpPage(cv, photo, frame!), corners: frame });
      };
      $<HTMLButtonElement>("cropOk").onclick = () => finish({ corners: pts.slice(0, 4) as Corners, mids: pts.slice(4, 8) as Corners });
      $<HTMLButtonElement>("cropWhole").onclick = () => finish(null);
    });
  }

  $<HTMLButtonElement>("recropBtn").onclick = async () => {
    const pg = pages[cur];
    if (!pg || !(pg.photo || pg.photoBlob)) return;
    if (!pg.photo) pg.photo = await blobToCanvas(pg.photoBlob!);
    const { canvas, corners } = await cropFlow(pg.photo, toFrame(pg.corners), "");
    Object.assign(pg, { canvas, corners, img: canvas.toDataURL("image/jpeg", 0.88), status: "wait", progress: 0, paras: null, clean: null, inputBlob: null, cleanBlob: null });
    if (pg === pages[0] && book) book.cover = null;
    savePage(pg); saveBook();
    queue.push(pg); render(); runQueue();
  };

  // Text der aktuellen Seite neu erkennen (z. B. nach einem App-Update mit besserer Erkennung).
  // Eigene Korrekturen an dieser Seite gehen dabei verloren.
  $<HTMLButtonElement>("reocrBtn").onclick = () => {
    const pg = pages[cur];
    if (!pg || !(pg.canvas || pg.inputBlob) || pg.status === "wait" || pg.status === "ocr") return;
    Object.assign(pg, { status: "wait", progress: 0, paras: null, clean: null, cleanBlob: null });
    savePage(pg);
    queue.push(pg); render(); runQueue();
  };

  // ---------- Texterkennung ----------
  const workers: Record<string, Promise<TessWorker>> = {}; let active: Page | null = null;
  const OCR_LANG: Record<string, string> = { da: "dan", de: "deu", en: "eng" };
  const loadScript = (src: string) => new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error("Datei fehlt: " + src));
    document.head.append(s);
  });
  const STAGES: Record<string, string> = { "loading tesseract core": "loadingCore", "loading language traineddata": "loadingLang", "initializing api": "preparing", "recognizing text": "recognizing" };
  function getWorker(lang: string): Promise<TessWorker> {
    const code = OCR_LANG[lang] || "dan";
    if (!workers[code]) {
      const p = workers[code] = loadScript(`lang/${code}.js`)
        .then(() => Uint8Array.from(atob(window.TRAINEDDATA[code]), c => c.charCodeAt(0)))
        .then(bytes => Tesseract.createWorker([{ code, data: bytes }], 1, {
        workerPath: abs("worker.min.js"),
        corePath: abs("core"),
        workerBlobURL: false,
        cacheMethod: "none",
        logger: (m: { status: string; progress: number }) => {
          if (!active) return;
          const second = active.stage === "recognizing2";
          if (!second) active.stage = STAGES[m.status] || active.stage;
          if (m.status === "recognizing text") active.progress = second ? 0.5 + m.progress / 2 : m.progress / 2;
          if (pages[cur] === active) {
            const bar = document.querySelector<HTMLElement>(".status .bar i");
            const st = document.querySelector(".status");
            if (st && st.firstChild) st.firstChild.textContent = t(active.stage || "recognizing");
            if (bar) bar.style.width = Math.round(active.progress * 100) + "%";
          }
        },
      })).then(async w => { await w.setParameters({ preserve_interword_spaces: "1" }); return w; });
      p.catch(() => { delete workers[code]; });
    }
    return workers[code];
  }

  let running = false;
  async function runQueue() {
    if (running) return; running = true;
    while (queue.length) {
      const pg = queue.shift()!;
      active = pg; pg.status = "ocr"; pg.stage = "loadingCore";
      if (pages[cur] === pg) render();
      try {
        const w = await getWorker(pg.lang);
        // rotateAuto: schräg fotografierte Seiten gerade drehen; die Positionen beziehen sich dann
        // auf das gedrehte Bild, das wir als imageColor zurückbekommen.
        const input = pg.canvas || await blobToCanvas(pg.inputBlob!);
        // Erkennung auf dem Bild mit ausgeglichenem Hintergrund; Anzeige und Übermalen auf dem Farbbild,
        // das wir genauso drehen wie Tesseract.
        // Zwei Läufe: das gerade gedrehte Originalbild und dieselbe Seite mit ausgeglichenem Hintergrund
        // (hilft bei Text auf getönten Bildern oder ungleichmäßigem Licht). Pro Zeile gewinnt der sicherere.
        const { data } = await w.recognize(input, { rotateAuto: true }, { text: true, blocks: true });
        const work = rotateLike(input, data.rotateRadians || 0);
      markBold(data, work);
        pg.stage = "recognizing2";
        const { data: flat } = await w.recognize(flattenBackground(work), {}, { blocks: true });
        pg.workW = work.width; pg.workH = work.height;
        pg.paras = transferPlaces(pg.paras, Layout.parasFromOcr(data, flat));
        pg.rawText = data.text || "";
        retext(pg);
        const cleanCanvas = pg.paras.length ? eraseText(work, pg.paras) : null;
        pg.clean = cleanCanvas ? cleanCanvas.toDataURL("image/jpeg", 0.9) : null;
        pg.cleanBlob = cleanCanvas ? await canvasBlob(cleanCanvas) : null;
        pg.status = "done";
        savePage(pg);
      } catch (e) {
        console.error(e);
        pg.status = "error"; pg.error = e instanceof Error ? e.message : String(e);
      }
      active = null;
      if (pages[cur] === pg) render(); else renderThumbs();
    }
    running = false;
  }

  // ---------- Vorlesen ----------
  const synth = window.speechSynthesis;
  const SPEECH: Record<string, string> = { da: "da-DK", de: "de-DE", en: "en-GB" };
  function pickVoice(lang: string): SpeechSynthesisVoice | null {
    if (!synth) return null;
    const vs = synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().replace("_", "-").startsWith(lang));
    return vs.find(v => /google|premium|enhanced|natural/i.test(v.name)) || vs[0] || null;
  }
  if (synth) synth.getVoices();

  function speak(text: string, onBoundary: ((ev: SpeechSynthesisEvent) => void) | null, onEnd?: () => void, slow = false) {
    if (!synth) { toast(t("noSpeech")); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const lang = pages[cur]?.lang || S.lang;
    u.lang = SPEECH[lang]; const voice = pickVoice(lang); if (voice) u.voice = voice;
    u.rate = speechRate(S.rate);
    if (slow) u.rate *= 0.75;
    if (onBoundary) u.onboundary = onBoundary;
    u.onend = u.onerror = () => onEnd && onEnd();
    synth.speak(u);
  }
  function clearHighlight() { document.querySelectorAll(".w.speaking, .s.speaking").forEach(x => x.classList.remove("speaking")); }
  let readId = 0;   // verwirft onend von abgebrochenen Vorlese-Durchgängen
  function stopSpeech() { readId++; if (synth) synth.cancel(); clearHighlight(); reading = false; setReadBtn(); $("yourTurn").hidden = true; }

  $("reader").onclick = e => {
    if (moving) return;   // im Verschiebe-Modus nicht vorlesen
    if ($("settings").classList.contains("open")) { $("settings").classList.remove("open"); $<HTMLButtonElement>("setBtn").classList.remove("on"); return; }
    const w = (e.target as HTMLElement).closest<HTMLElement>(".w"); if (!w) return;
    stopSpeech();
    sayWord(w);
  };
  /** Angetipptes Wort: ganz, dann langsam in Silben (jeweils markiert), dann wieder ganz. */
  function sayWord(w: HTMLElement) {
    const parts = [...w.querySelectorAll<HTMLElement>(".s")];
    const steps = wordSteps(w.dataset.word || "", parts.map(p => p.textContent || ""));
    const my = readId;
    const step = (i: number) => {
      clearHighlight();
      if (my !== readId || i >= steps.length) return;
      const st = steps[i];
      (st.part === null ? w : parts[st.part]).classList.add("speaking");
      speak(st.text, null, () => { if (my === readId) step(i + 1); }, st.slow);
    };
    step(0);
  }

  let reading = false;
  function readPage() {
    const sp = speech; if (!sp) return;
    stopSpeech();
    const my = readId;
    const spans = [...$("reader").querySelectorAll(".w")];
    reading = true; setReadBtn();
    speak(sp.full, (ev: SpeechSynthesisEvent) => {
      if (ev.name && ev.name !== "word") return;
      const hit = sp.wordPos.find(p => ev.charIndex >= p.start && ev.charIndex < p.end) || sp.wordPos.find(p => p.start >= ev.charIndex);
      clearHighlight();
      if (hit && spans[hit.i]) spans[hit.i].classList.add("speaking");
    }, () => {
      if (my !== readId) return;
      const finished = reading;
      reading = false; clearHighlight(); setReadBtn();
      $("yourTurn").hidden = !showYourTurn(finished ? "end" : "stop", S.turn);
    });
  }
  $<HTMLButtonElement>("readBtn").onclick = () => { if (reading) stopSpeech(); else readPage(); };
  $<HTMLButtonElement>("againBtn").onclick = readPage;

  const DEMO: Record<string, string> = {
    da: "Det lille pindsvin bor under et stort æbletræ.\n\n" +
        "Hver morgen snuser det til blomsterne. Så leder det efter biller og orme i haven.\n\n" +
        "I dag regner det. Pindsvinet ruller sig sammen og falder i søvn.",
    de: "Der kleine Igel wohnt unter einem großen Apfelbaum.\n\n" +
        "Jeden Morgen schnuppert er an den Blumen. Dann sucht er Käfer und Würmer im Garten.\n\n" +
        "Heute regnet es. Der Igel rollt sich zusammen und schläft ein.",
    en: "The little hedgehog lives under a big apple tree.\n\n" +
        "Every morning it sniffs the flowers. Then it looks for beetles and worms in the garden.\n\n" +
        "Today it is raining. The hedgehog rolls up into a ball and falls asleep.",
  };

  // Sprache einer Seite nachträglich ändern: Fotoseiten neu erkennen, Beispielseite austauschen.
  function relang(pg: Page) {
    pg.lang = S.lang;
    if (pg.canvas || pg.inputBlob) { pg.status = "wait"; pg.progress = 0; pg.cleanBlob = null; queue.push(pg); render(); runQueue(); }
    else { if (Object.values(DEMO).includes(pg.text)) pg.text = DEMO[pg.lang]; render(); }
  }

  // ---------- Start ----------
  // Zurück-Taste des Browsers/Tablets: Beim Öffnen eines Buchs legen wir einen Verlaufseintrag (#bog) an.
  // „Zurück“ führt dann zur Startseite statt aus der Seite hinaus.
  function showApp() {
    $("start").hidden = true; $("app").hidden = false; $("dock").hidden = false; window.scrollTo(0, 0);
    if (location.hash !== "#bog") { try { history.pushState(null, "", "#bog"); } catch (e) {} }
  }
  window.addEventListener("popstate", () => {
    if (!$("crop").hidden) return;
    if (location.hash !== "#bog" && $("start").hidden) showStart(true);
  });
  if (location.hash === "#bog") { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
  function showStart(fromHistory = false) {
    if (!fromHistory && location.hash === "#bog") { history.back(); return; } // popstate ruft uns wieder auf
    stopSpeech();
    if (document.body.classList.contains("focus")) $<HTMLButtonElement>("focusBtn").click();
    $("app").hidden = true; $("start").hidden = false; $("dock").hidden = true; $("settings").classList.remove("open");
    document.body.classList.remove("editing");
    saveBook();
    renderShelf();
    window.scrollTo(0, 0);
  }
  $<HTMLButtonElement>("homeBtn").onclick = () => showStart();
  $("home").onclick = () => showStart();
  $("home").onkeydown = e => { if (e.key === "Enter") showStart(); };

  const drop = $("drop");
  $<HTMLInputElement>("file").onchange = e => { const inp = e.target as HTMLInputElement; newBook(); addFiles(inp.files ? [...inp.files] : null); inp.value = ""; };
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => { newBook(); addFiles(e.dataTransfer?.files ?? null); });
  document.addEventListener("paste", e => { const f = [...(e.clipboardData?.files || [])]; if (f.length) { if ($("app").hidden) newBook(); addFiles(f); } });

  $<HTMLButtonElement>("demoBtn").onclick = () => {
    newBook(true);
    pages.push({ img: null, status: "done", progress: 1, lang: S.lang, text: DEMO[S.lang] });
    cur = 0; showApp(); render();
    getWorker(S.lang); // Erkennung im Hintergrund schon vorladen
  };

  // „Installieren“-Knopf, sobald der Browser die Installation anbietet (Chrome, Edge, Samsung Internet)
  interface InstallPrompt extends Event { prompt(): Promise<void> }
  let installEvt: InstallPrompt | null = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e as InstallPrompt; $("installRow").hidden = false; });
  window.addEventListener("appinstalled", () => { $("installRow").hidden = true; });
  $<HTMLButtonElement>("installBtn").onclick = async () => { if (installEvt) { await installEvt.prompt(); installEvt = null; $("installRow").hidden = true; } };

  // Offline-Nutzung und Installation („Zum Startbildschirm“). In eingebetteten Vorschauen nicht möglich.
  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* z. B. in Vorschau-Fenstern nicht erlaubt */ });
  }

  applySettings();
  applyTexts();
