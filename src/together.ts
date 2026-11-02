/**
 * Read-together mode: one or two open questions per page for the adult.
 *
 * Dialogic reading, where the child tells the story and the adult asks open questions, improves
 * expressive vocabulary (d = 0.59; Mol et al. 2008, Early Education and Development,
 * doi:10.1080/10409280701838603). The questions are generic (no content analysis),
 * follow dialogic-reading question types (open-ended, wh-questions, prediction, recall,
 * personal experience), and are deliberately not a quiz.
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

/** Questions for a page: the custom question first, if any, then generic questions in rotation. */
export function pageQuestions(lang: string, pageIndex: number, own?: string, n = 2): string[] {
  const qs = QUESTIONS[lang] || QUESTIONS.da;
  const out: string[] = [];
  const mine = own?.trim();
  if (mine) out.push(mine);
  for (let k = 0; out.length < n; k++) out.push(qs[(pageIndex * n + k) % qs.length]);
  return out;
}
