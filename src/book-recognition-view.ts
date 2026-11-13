import type { BatchProgress, RecognitionOutcome } from "./book-recognition";

type Texts = (key: string, values?: Record<string, string | number>) => string;
type Plan = { pages: readonly unknown[]; manual: number; missing: number; busy: number };

/** Book-level recognition options live in the adult workshop. */
export class BookRecognitionView {
  private dialog = document.createElement("dialog");
  running = false;
  cancelled = false;
  constructor(private t: Texts, private plan: (includeManual: boolean) => Plan, private start: (include: boolean, detect: boolean) => Promise<void>) {
    this.dialog.id = "bookRecognition"; this.dialog.className = "practice-dialog";
    this.dialog.setAttribute("aria-labelledby", "batchTitle");
    this.dialog.innerHTML = '<h2 id="batchTitle" tabindex="-1" data-b="batchTitle"></h2><label><input id="batchIncludeManual" type="checkbox"><span data-b="batchInclude"></span></label><p data-b="batchWarning"></p><label><input id="batchDetect" type="checkbox"><span data-b="batchDetect"></span></label><p data-b="batchDetectHint"></p><p id="batchPlan" role="status"></p><p id="batchProgress" role="status"></p><ol id="batchResults"></ol><button id="batchStart" data-b="batchStart"></button><button id="batchCancel" data-b="batchCancel" hidden></button><button id="batchClose" data-b="practiceClose"></button>';
    this.dialog.querySelectorAll("button").forEach(b => { b.className = "btn-ghost"; });
    document.body.append(this.dialog);
    this.el("batchIncludeManual").onchange = () => this.preview();
    this.el("batchClose").onclick = () => this.dialog.close();
    this.el("batchCancel").onclick = () => { this.cancelled = true; this.el<HTMLButtonElement>("batchCancel").disabled = true; };
    this.el("batchStart").onclick = async () => {
      if (this.running) return;
      this.running = true; this.cancelled = false;
      this.el("batchResults").replaceChildren();
      this.controls();
      try { await this.start(this.el<HTMLInputElement>("batchIncludeManual").checked, this.el<HTMLInputElement>("batchDetect").checked); }
      finally {
        this.running = false;
        const message = this.t(this.cancelled ? "batchCancelled" : "batchFinished") + " · " + this.el("batchProgress").textContent;
        this.el("batchProgress").textContent = message;
        document.getElementById("batchNotice")!.textContent = message;
        this.el<HTMLInputElement>("batchIncludeManual").checked = false;
        this.controls();
      }
    };
  }
  private el<E extends HTMLElement = HTMLElement>(id: string): E { return this.dialog.querySelector<E>(`#${id}`)!; }
  open() {
    this.dialog.querySelectorAll<HTMLElement>("[data-b]").forEach(e => { e.textContent = this.t(e.dataset.b!); });
    if (!this.running) {
      this.el<HTMLInputElement>("batchIncludeManual").checked = false;
      this.el<HTMLInputElement>("batchDetect").checked = false;
      this.preview();
    }
    this.dialog.showModal(); this.el("batchTitle").focus();
  }
  progress(state: BatchProgress) {
    const message = this.t("batchProgress", { ...state });
    this.el("batchProgress").textContent = message;
    document.getElementById("batchNotice")!.textContent = message;
  }
  result(page: number, outcome: RecognitionOutcome, fallback = false) {
    const li = document.createElement("li");
    li.textContent = this.t("batchPage", { n: page }) + ": " + this.t("batch" + outcome) + (fallback ? " · " + this.t("batchFallback") : "");
    this.el("batchResults").append(li);
  }
  private controls() {
    this.el<HTMLInputElement>("batchIncludeManual").disabled = this.running;
    this.el<HTMLInputElement>("batchDetect").disabled = this.running;
    this.el("batchStart").hidden = this.running;
    this.el("batchCancel").hidden = !this.running;
    this.el<HTMLButtonElement>("batchCancel").disabled = false;
    if (!this.running) this.preview();
  }
  private preview() {
    const plan = this.plan(this.el<HTMLInputElement>("batchIncludeManual").checked);
    this.el("batchPlan").textContent = this.t("batchPlan", { n: plan.pages.length, manual: plan.manual, missing: plan.missing, busy: plan.busy });
    this.el<HTMLButtonElement>("batchStart").disabled = !plan.pages.length;
  }
}
