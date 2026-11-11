import { phraseBoundaries, phraseCues, renderPhraseCues, type PhraseCues } from "./phrases";
import { READING_WORD, readingText } from "./practice";

/** Adult-only preparation; the saved source spelling stays unchanged. */
export class PhraseEditor {
  private dialog = document.createElement("dialog");
  private selected: number[] = [];
  private text = "";
  private commit: (cues: PhraseCues) => void = () => {};
  constructor(private t: (key: string, values?: Record<string, string | number>) => string, private stop: () => void) {
    this.dialog.id = "phraseEditor"; this.dialog.className = "practice-dialog";
    this.dialog.setAttribute("aria-labelledby", "phraseTitle");
    this.dialog.innerHTML = '<h2 id="phraseTitle" data-p="phraseEdit"></h2><p data-p="phraseHint"></p><div id="phraseChoices"></div><h3 data-p="phrasePreview"></h3><div id="phrasePreview" class="phrase-preview"></div><p data-p="phraseModel"></p><button id="phraseClear" data-p="phraseClear"></button><button id="phraseSave" data-p="save"></button><button id="phraseCancel" data-p="practiceClose"></button>';
    this.dialog.querySelectorAll("button").forEach(b => { b.className = "btn-ghost"; });
    document.body.append(this.dialog);
    this.el("phraseCancel").onclick = () => this.close();
    this.el("phraseClear").onclick = () => { this.selected = []; this.draw(); };
    this.el("phraseSave").onclick = () => { this.close(); this.commit(phraseCues(this.text, this.selected)); };
    this.el("phraseChoices").onclick = e => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-after]"); if (!b) return;
      const i = Number(b.dataset.after);
      this.selected = this.selected.includes(i) ? this.selected.filter(x => x !== i) : [...this.selected, i];
      this.draw();
    };
  }
  private el(id: string) { return this.dialog.querySelector<HTMLElement>(`#${id}`)!; }
  close() { this.dialog.close(); }
  open(text: string, lang: string, cues: unknown, commit: (cues: PhraseCues) => void) {
    this.stop(); this.text = text; this.commit = commit; this.selected = phraseBoundaries(text, cues);
    this.dialog.querySelectorAll<HTMLElement>("[data-p]").forEach(e => { e.textContent = this.t(e.dataset.p!); });
    this.el("phraseChoices").lang = lang; this.el("phrasePreview").lang = lang;
    const source = readingText(text), words = [...source.matchAll(READING_WORD)];
    const valid = phraseCues(text, words.map((_, i) => i)).after;
    const choices = this.el("phraseChoices"); choices.replaceChildren();
    let start = 0;
    words.forEach((word, i) => {
      const end = words[i + 1]?.index ?? source.length;
      choices.append(source.slice(start, end)); start = end;
      if (!valid.includes(i)) return;
      const b = document.createElement("button"); b.type = "button"; b.dataset.after = String(i); b.textContent = "│";
      b.setAttribute("aria-label", this.t("phraseAfter", { word: word[0] })); choices.append(b);
    });
    choices.append(source.slice(start)); this.draw(); this.dialog.showModal();
  }
  private draw() {
    this.el("phraseChoices").querySelectorAll<HTMLButtonElement>("button").forEach(b => {
      const on = this.selected.includes(Number(b.dataset.after)); b.setAttribute("aria-pressed", String(on)); b.classList.toggle("on", on);
    });
    const preview = this.el("phrasePreview"); preview.replaceChildren();
    let index = 0;
    const ps = readingText(this.text).split("\n").map(text => {
      const p = document.createElement("p"); let start = 0;
      for (const w of text.matchAll(READING_WORD)) {
        p.append(text.slice(start, w.index)); const word = document.createElement("span"); word.className = "w";
        word.dataset.i = String(index++); word.textContent = w[0]; p.append(word); start = w.index! + w[0].length;
      }
      p.append(text.slice(start)); preview.append(p); return p;
    });
    renderPhraseCues(ps, this.selected);
  }
}
