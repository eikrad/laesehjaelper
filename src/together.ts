/**
 * Modus „gemeinsam lesen“: ein, zwei offene Fragen pro Seite für den Erwachsenen.
 *
 * Dialogisches Lesen – das Kind erzählt, der Erwachsene fragt offen nach – verbessert
 * den aktiven Wortschatz (d = 0,59; Mol et al. 2008, Early Education and Development,
 * doi:10.1080/10409280701838603). Die Fragen sind allgemein (keine Inhaltsanalyse),
 * folgen den Fragearten des dialogischen Lesens (offen, W-Fragen, Vorhersage, Erinnern,
 * Bezug zum eigenen Leben) und sind bewusst kein Quiz.
 */

export const QUESTIONS: Record<string, string[]> = {
  da: [
    "Hvad sker der på billedet?",
    "Hvad tror du, der sker nu?",
    "Hvem er med på denne side?",
    "Hvordan tror du, de har det lige nu?",
    "Kan du huske, hvad der skete før?",
    "Har du selv prøvet noget lignende?",
    "Hvilket ord på siden vil du gerne vide mere om?",
    "Hvad ville du have gjort?",
  ],
  de: [
    "Was passiert auf dem Bild?",
    "Was glaubst du, passiert jetzt?",
    "Wer ist auf dieser Seite dabei?",
    "Wie fühlen sie sich gerade, was meinst du?",
    "Weißt du noch, was vorher passiert ist?",
    "Hast du selbst schon mal so etwas erlebt?",
    "Über welches Wort auf der Seite möchtest du mehr wissen?",
    "Was hättest du gemacht?",
  ],
  en: [
    "What is happening in the picture?",
    "What do you think happens next?",
    "Who is on this page?",
    "How do you think they feel right now?",
    "Can you remember what happened before?",
    "Have you ever done something like this?",
    "Which word on the page would you like to know more about?",
    "What would you have done?",
  ],
};

/** Fragen für eine Seite: die eigene Frage (falls vorhanden) zuerst, dann allgemeine, reihum. */
export function pageQuestions(lang: string, pageIndex: number, own?: string, n = 2): string[] {
  const qs = QUESTIONS[lang] || QUESTIONS.da;
  const out: string[] = [];
  const mine = own?.trim();
  if (mine) out.push(mine);
  for (let k = 0; out.length < n; k++) out.push(qs[(pageIndex * n + k) % qs.length]);
  return out;
}
