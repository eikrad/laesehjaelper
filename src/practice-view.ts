import { forgetPractice, loadPracticeWords, practiceContext, practiceKey, practiceWord, reviewWords, savePracticeWord, updatePracticeWord, type PracticePage, type PracticeWord } from "./practice";

interface Context { reader: string; book: string; pages: PracticePage[]; current: number }
/** Explicit, local practice. Ordinary pronunciation never adds a word. */
export class PracticeView {
  private words: PracticeWord[] = [];
  private selected: PracticeWord | null = null;
  private index = 0;
  private readonly help: HTMLDialogElement;
  private readonly review: HTMLDialogElement;
  private readonly key = "laesehjaelper-word-practice";
  constructor(private t: (key: string) => string, private context: () => Context,
    private stop: () => void, private hear: (word: string, lang: string) => void,
    private navigate: (index: number) => void, private failed: (error: unknown) => void) {
    try { this.words = loadPracticeWords(localStorage.getItem(this.key)); } catch {}
    const dialog = (id: string, body: string) => {
      const d = document.createElement("dialog"); d.id = id; d.className = "practice-dialog";
      d.innerHTML = body; d.querySelectorAll("button").forEach(b => { b.className = "btn-ghost"; }); d.onclose = () => this.stop(); document.body.append(d); return d;
    };
    this.help = dialog("wordHelp", '<h2 id="chosenWord"></h2><p data-p="practiceChoose"></p><button id="chosenHear" data-p="practiceHear"></button><button id="savePracticeWord" data-p="practiceSave"></button><button id="wordHelpClose" data-p="practiceClose"></button>');
    this.help.setAttribute("aria-labelledby", "chosenWord");
    this.review = dialog("practiceReview", '<h2 data-p="practiceTitle" id="practiceTitle"></h2><p id="practiceEmpty" data-p="practiceEmpty"></p><div id="practiceItem"><p data-p="practiceTry"></p><p id="practiceWord" class="practice-word"></p><button id="practiceHear" data-p="practiceHear"></button><button id="practiceContext" data-p="practiceContext"></button><p id="practiceSentence" hidden></p><button id="practicePage" data-p="practicePage"></button><p id="practiceUnavailable" data-p="practiceUnavailable" hidden></p><div class="practice-nav"><button id="practicePrev" data-p="practicePrev"></button><span id="practiceCount"></span><button id="practiceNext" data-p="practiceNext"></button></div><details><summary data-p="practiceAdult"></summary><p data-p="practiceAdultHint"></p><label><input type="checkbox" id="practiceFamiliar"><span data-p="practiceFamiliar"></span></label><button id="practiceRemove" data-p="practiceRemove"></button></details></div><button id="practiceClose" data-p="practiceClose"></button>');
    this.review.setAttribute("aria-labelledby", "practiceTitle");
    this.el("wordHelpClose").onclick = () => this.help.close();
    this.el("practiceClose").onclick = () => this.review.close();
    this.el("chosenHear").onclick = () => { if (this.selected) this.hear(this.selected.word, this.selected.lang); };
    this.el("savePracticeWord").onclick = () => {
      if (!this.selected) return;
      this.words = savePracticeWord(this.words, this.selected); this.persist(); this.help.close();
    };
    this.el("practiceHear").onclick = () => { const w = this.item(); if (w) this.hear(w.word, w.lang); };
    this.el("practiceContext").onclick = () => { this.el("practiceSentence").hidden = false; };
    this.el("practicePage").onclick = () => {
      const w = this.item(), c = this.context(); if (!w) return;
      const i = c.pages.findIndex(p => p.id === w.pageId);
      if (practiceContext(w, c.pages[i]) === null) return;
      this.review.close(); this.navigate(i);
    };
    for (const [id, step] of [["practicePrev", -1], ["practiceNext", 1]] as const)
      this.el(id).onclick = () => { this.stop(); this.index += step; this.draw(); };
    this.el<HTMLInputElement>("practiceFamiliar").onchange = e => {
      const w = this.item(); if (w) { this.words = updatePracticeWord(this.words, practiceKey(w), (e.target as HTMLInputElement).checked); this.persist(); }
    };
    this.el("practiceRemove").onclick = () => {
      const w = this.item(); if (w) { this.stop(); this.words = updatePracticeWord(this.words, practiceKey(w), null); this.persist(); this.draw(); }
    };
  }
  private el<E extends HTMLElement = HTMLElement>(id: string): E { return document.getElementById(id) as E; }
  private labels() {
    for (const d of [this.help, this.review]) d.querySelectorAll<HTMLElement>("[data-p]").forEach(e => { e.textContent = this.t(e.dataset.p!); });
  }
  private list() { const c = this.context(); return reviewWords(this.words, c.reader, c.book); }
  private item() { return this.list()[this.index]; }
  private persist() { try { localStorage.setItem(this.key, JSON.stringify(this.words)); } catch (e) { this.failed(e); } }
  forget(owner: "reader" | "book", id: string) { this.words = forgetPractice(this.words, owner, id); this.persist(); }
  close() { this.help.close(); this.review.close(); this.selected = null; }
  choose(index: number) {
    const c = this.context(); this.stop();
    this.selected = practiceWord(c.reader, c.book, c.pages[c.current], index);
    if (!this.selected) return;
    this.labels(); this.el("chosenWord").textContent = this.selected.word; this.help.showModal();
  }
  open() { this.stop(); this.index = 0; this.labels(); this.draw(); this.review.showModal(); }
  private draw() {
    this.review.querySelector("details")!.open = false;
    const list = this.list(); this.index = Math.max(0, Math.min(this.index, list.length - 1));
    const w = this.item(); this.el("practiceEmpty").hidden = !!w; this.el("practiceItem").hidden = !w;
    if (!w) return;
    const sentence = practiceContext(w, this.context().pages.find(p => p.id === w.pageId));
    this.el("practiceWord").textContent = w.word; this.el("practiceWord").lang = w.lang;
    this.el("practiceSentence").textContent = sentence; this.el("practiceSentence").lang = w.lang;
    this.el("practiceSentence").hidden = true;
    this.el<HTMLButtonElement>("practiceContext").disabled = sentence === null;
    this.el<HTMLButtonElement>("practicePage").disabled = sentence === null;
    this.el("practiceUnavailable").hidden = sentence !== null;
    this.el("practiceCount").textContent = `${this.index + 1} / ${list.length}`;
    this.el<HTMLButtonElement>("practicePrev").disabled = this.index === 0;
    this.el<HTMLButtonElement>("practiceNext").disabled = this.index === list.length - 1;
    this.el<HTMLInputElement>("practiceFamiliar").checked = w.familiar;
  }
}
