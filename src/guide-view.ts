import { readingLines, type GuideLine } from "./guide";
import { swipeDirection } from "./swipe";

type Texts = (key: string, values?: Record<string, string | number>) => string;

/** A reading guide owns measurement and its overlay; the reader remains the source of truth. */
export class ReadingGuide {
  private lines: GuideLine[] = [];
  private active = 0;
  private anchor = 0;
  private key = "";
  private mode = "aus";
  private tools = document.createElement("div");
  private window = document.createElement("div");
  private prev = document.createElement("button");
  private next = document.createElement("button");
  private count = document.createElement("span");
  private strip = document.createElement("div");
  private lineText = document.createElement("div");
  private measure = document.createElement("div");
  private source: HTMLElement;

  constructor(private reader: HTMLElement, private text: Texts, private stop: () => void, private speakWord: (word: HTMLElement) => void) {
    this.source = reader;
    this.tools.id = "guideTools"; this.tools.className = "guide-tools"; this.tools.hidden = true;
    this.tools.setAttribute("role", "group");
    this.prev.id = "guidePrev"; this.next.id = "guideNext"; this.count.id = "guideCount";
    this.prev.textContent = "↑"; this.next.textContent = "↓";
    for (const b of [this.prev, this.next]) { b.type = "button"; b.className = "btn-ghost"; b.setAttribute("aria-controls", reader.id); }
    this.prev.onclick = () => this.move(-1); this.next.onclick = () => this.move(1);
    this.tools.append(this.prev, this.count, this.next);
    this.strip.id = "guideLine"; this.strip.hidden = true; this.lineText.id = "guideLineText"; this.strip.append(this.lineText);
    this.measure.className = "reader guide-measure"; this.measure.setAttribute("aria-hidden", "true");
    reader.after(this.strip, this.tools, this.measure);
    this.strip.onclick = e => {
      const word = (e.target as HTMLElement).closest<HTMLElement>(".w");
      if (word) { this.follow(Number(word.dataset.i)); this.speakWord(word); }
    };
    this.window.id = "guideWindow"; this.window.className = "guide-window"; this.window.setAttribute("aria-hidden", "true");
    new ResizeObserver(() => requestAnimationFrame(() => this.refresh())).observe(reader.parentElement!);
    document.fonts.addEventListener("loadingdone", () => this.refresh());
    for (const region of [this.tools, this.strip]) {
      let start: { x: number; y: number; time: number; id: number } | null = null;
      let suppressClickUntil = 0;
      region.addEventListener("pointerdown", e => {
        start = e.pointerType !== "mouse" && e.isPrimary ? { x: e.clientX, y: e.clientY, time: e.timeStamp, id: e.pointerId } : null;
        if (start) {
          // Retain the original button/word as the click target for an ordinary tap.
          try { (e.target as Element).setPointerCapture(e.pointerId); } catch { /* Pointer already cancelled. */ }
        }
      });
      region.addEventListener("pointerup", e => {
        if (!start || e.pointerId !== start.id) return;
        const direction = swipeDirection(e.clientY - start.y, e.clientX - start.x, e.timeStamp - start.time);
        start = null;
        if (direction) { suppressClickUntil = performance.now() + 250; this.move(direction === "next" ? 1 : -1); }
      });
      region.addEventListener("pointercancel", () => { start = null; });
      region.addEventListener("click", e => {
        if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); }
      }, true);
    }
    document.addEventListener("keydown", e => {
      if (this.tools.hidden || this.tools.closest("[hidden]")) return;
      const target = e.target as HTMLElement;
      if (!this.tools.contains(target) && target.closest("input,textarea,select,button,[contenteditable=true]")) return;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); this.move(e.key === "ArrowDown" ? 1 : -1); }
    });
  }

  configure(mode: string, key: string) {
    if (key !== this.key) { this.key = key; this.anchor = 0; }
    this.mode = mode === "ruler" || mode === "line" ? mode : "aus";
    this.reader.classList.toggle("guide-ruler", mode === "ruler");
    this.refresh();
  }

  refresh() {
    this.tools.hidden = true; this.window.remove(); this.strip.hidden = true;
    const single = this.mode === "line" && !!this.reader.querySelector(".w");
    this.reader.classList.toggle("guide-single", single); this.reader.parentElement!.classList.toggle("guide-single", single);
    if (this.mode === "aus") { this.measure.replaceChildren(); this.lineText.replaceChildren(); return; }
    this.source = this.reader;
    if (single) {
      const classes = this.reader.className.replace(/\b(pagemode|comparing|moving|guide-ruler|guide-single)\b/g, "");
      this.strip.className = classes + " guide-line"; this.strip.hidden = false;
      this.measure.className = classes + " guide-measure";
      const style = getComputedStyle(this.strip);
      Object.assign(this.measure.style, { width: Math.max(1, this.strip.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) + "px", fontSize: style.fontSize });
      this.measure.replaceChildren(...[...this.reader.querySelectorAll("p")].map(p => p.cloneNode(true)));
      this.measure.querySelectorAll(".speaking").forEach(w => w.classList.remove("speaking"));
      this.source = this.measure;
    }
    const origin = this.source.getBoundingClientRect();
    const paragraphs = [...this.source.querySelectorAll("p")];
    const words = [...this.source.querySelectorAll<HTMLElement>(".w")].map(w => {
      const r = w.getBoundingClientRect();
      const trailing = w.nextSibling;
      const punctuation = trailing?.nodeType === Node.TEXT_NODE ? trailing.textContent?.match(/^\S+/)?.[0] : undefined;
      let right = r.right;
      if (punctuation) {
        const range = document.createRange();
        range.setStart(trailing!, 0); range.setEnd(trailing!, punctuation.length);
        right = Math.max(right, range.getBoundingClientRect().right);
      }
      return { index: Number(w.dataset.i), block: paragraphs.indexOf(w.closest("p")!), left: r.left - origin.left,
        right: right - origin.left, top: r.top - origin.top, bottom: r.bottom - origin.top };
    }).filter(w => w.right > w.left && w.bottom > w.top);
    this.lines = readingLines(words);
    if (!this.lines.length) return;
    this.active = Math.max(0, this.lines.findIndex(line => line.words.includes(this.anchor)));
    if (!single) this.reader.append(this.window);
    this.tools.hidden = false; this.draw();
  }

  private move(delta: number) {
    const next = Math.max(0, Math.min(this.lines.length - 1, this.active + delta));
    if (next === this.active) return;
    this.stop(); this.active = next; this.anchor = this.lines[next].words[0]; this.draw();
    this.reader.querySelector<HTMLElement>(`.w[data-i="${this.anchor}"]`)?.scrollIntoView({ block: "nearest" });
  }

  follow(word: number) {
    if (this.mode === "aus") return;
    const next = this.lines.findIndex(line => line.words.includes(word));
    if (next < 0) return;
    this.anchor = word;
    if (next === this.active) return;
    this.active = next; this.draw();
    this.reader.querySelector<HTMLElement>(`.w[data-i="${word}"]`)?.scrollIntoView({ block: "nearest" });
  }

  private draw() {
    const line = this.lines[this.active];
    if (this.mode === "line") {
      const first = this.source.querySelector(`.w[data-i="${line.words[0]}"]`)!, last = this.source.querySelector(`.w[data-i="${line.words.at(-1)}"]`)!;
      const range = document.createRange(); range.setStartBefore(first);
      range.setEndAfter(last.nextSibling?.nodeType === Node.TEXT_NODE ? last.nextSibling : last);
      this.lineText.replaceChildren(range.cloneContents());
    } else Object.assign(this.window.style, { left: Math.max(0, line.left - 4) + "px", top: Math.max(0, line.top - 4) + "px",
      width: line.right - line.left + 8 + "px", height: line.bottom - line.top + 8 + "px" });
    this.count.textContent = this.text("guideCount", { a: this.active + 1, b: this.lines.length });
    this.prev.setAttribute("aria-label", this.text("guidePrev")); this.next.setAttribute("aria-label", this.text("guideNext"));
    this.tools.setAttribute("aria-label", this.text("guideLabel"));
    for (const b of [this.prev, this.next]) b.setAttribute("aria-controls", this.mode === "line" ? this.strip.id : this.reader.id);
    this.prev.disabled = this.active === 0; this.next.disabled = this.active === this.lines.length - 1;
  }
}
