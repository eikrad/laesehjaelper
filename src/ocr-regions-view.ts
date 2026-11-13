import { normaliseRegions, type OcrRegion } from "./ocr-regions";

type Texts = (key: string, values?: Record<string, string | number>) => string;
/** Adult-only editing on a preview of the cropped input, never on the book's stored pixels. */
export class OcrRegionsEditor {
  private dialog = document.createElement("dialog");
  private regions: OcrRegion[] = [];
  private draft: OcrRegion | null = null;
  private start: { x: number; y: number } | null = null;
  private commit: (regions: OcrRegion[]) => void = () => {};
  constructor(private t: Texts, private stop: () => void) {
    this.dialog.id = "ocrRegionsEditor"; this.dialog.className = "practice-dialog regions-dialog";
    this.dialog.setAttribute("aria-labelledby", "regionsTitle");
    this.dialog.innerHTML = '<h2 id="regionsTitle" tabindex="-1" data-r="regionsTitle"></h2><p id="regionsHint" data-r="regionsHint"></p><div id="regionsSurface"><img id="regionsImage" alt=""><svg id="regionsOverlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg></div><fieldset><legend data-r="regionsBounds"></legend><div class="region-bounds"><label><span data-r="regionLeft"></span><input id="regionLeft" type="number" min="0" max="100" step="0.1" value="0"></label><label><span data-r="regionTop"></span><input id="regionTop" type="number" min="0" max="100" step="0.1" value="85"></label><label><span data-r="regionRight"></span><input id="regionRight" type="number" min="0" max="100" step="0.1" value="100"></label><label><span data-r="regionBottom"></span><input id="regionBottom" type="number" min="0" max="100" step="0.1" value="100"></label></div><button id="regionAdd" data-r="regionAdd"></button><p id="regionsError" data-r="regionsError" role="status" hidden></p></fieldset><div id="regionList"></div><button id="regionsClear" data-r="regionsClear"></button><p data-r="regionsReread"></p><button id="regionsSave" data-r="regionsSave"></button><button id="regionsCancel" data-r="practiceClose"></button>';
    this.dialog.querySelectorAll("button").forEach(b => { b.className = "btn-ghost"; });
    document.body.append(this.dialog);
    this.el("regionsCancel").onclick = () => this.close();
    this.el("regionsClear").onclick = () => { this.regions = []; this.draw(); };
    this.el("regionsSave").onclick = () => { this.close(); this.commit(normaliseRegions(this.regions)); };
    this.el("regionAdd").onclick = () => {
      const inputs = ["regionLeft", "regionTop", "regionRight", "regionBottom"].map(id => this.el<HTMLInputElement>(id));
      const [x0, y0, x1, y1] = inputs.map(e => e.valueAsNumber / 100);
      const valid = normaliseRegions([{ x0, y0, x1, y1 }]);
      const bad = inputs.find(e => !e.checkValidity() || !Number.isFinite(e.valueAsNumber));
      this.el("regionsError").hidden = !bad && !!valid.length;
      if (bad || !valid.length) { (bad || inputs[0]).focus(); return; }
      this.regions = normaliseRegions([...this.regions, ...valid]); this.draw();
    };
    this.el("regionList").onclick = e => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-index]");
      if (b) { this.regions.splice(Number(b.dataset.index), 1); this.draw(); }
    };
    const surface = this.el("regionsSurface");
    const point = (e: PointerEvent) => {
      const b = surface.getBoundingClientRect(), clip = (n: number) => Math.max(0, Math.min(1, n));
      return { x: clip((e.clientX - b.left) / b.width), y: clip((e.clientY - b.top) / b.height) };
    };
    surface.onpointerdown = e => {
      if (!e.isPrimary || e.button !== 0) return;
      e.preventDefault(); this.start = point(e);
      surface.setPointerCapture(e.pointerId);
    };
    surface.onpointermove = e => {
      if (!this.start) return;
      const end = point(e);
      this.draft = normaliseRegions([{ x0: this.start.x, y0: this.start.y, x1: end.x, y1: end.y }])[0] || null;
      this.draw();
    };
    surface.onpointerup = () => {
      if (this.draft) this.regions = normaliseRegions([...this.regions, this.draft]);
      this.start = null; this.draft = null; this.draw();
    };
    surface.onpointercancel = () => { this.start = null; this.draft = null; this.draw(); };
    this.dialog.onclose = () => { this.start = null; this.draft = null; this.el("regionsImage").removeAttribute("src"); };
  }
  private el<E extends Element = HTMLElement>(id: string): E { return this.dialog.querySelector<E>(`#${id}`)!; }
  close() { this.dialog.close(); }
  open(image: HTMLCanvasElement, regions: unknown, commit: (regions: OcrRegion[]) => void) {
    this.stop(); this.regions = normaliseRegions(regions); this.commit = commit;
    this.start = null; this.draft = null; this.el<HTMLElement>("regionsError").hidden = true;
    this.dialog.querySelectorAll<HTMLElement>("[data-r]").forEach(e => { e.textContent = this.t(e.dataset.r!); });
    const img = this.el<HTMLImageElement>("regionsImage"); img.src = image.toDataURL("image/jpeg", 0.85); img.alt = this.t("regionsPreview");
    this.el<HTMLElement>("regionsSurface").style.width = `min(100%, ${45 * image.width / image.height}dvh)`;
    for (const [id, value] of [["regionLeft", 0], ["regionTop", 85], ["regionRight", 100], ["regionBottom", 100]] as const) this.el<HTMLInputElement>(id).value = String(value);
    this.draw(); this.dialog.showModal(); this.el<HTMLElement>("regionsTitle").focus();
  }
  private draw() {
    const svg = this.el<SVGSVGElement>("regionsOverlay"); svg.replaceChildren();
    for (const r of [...this.regions, ...(this.draft ? [this.draft] : [])]) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      for (const [key, value] of Object.entries({ x: r.x0 * 100, y: r.y0 * 100, width: (r.x1 - r.x0) * 100, height: (r.y1 - r.y0) * 100 })) rect.setAttribute(key, String(value));
      svg.append(rect);
    }
    const list = this.el("regionList"); list.replaceChildren();
    this.regions.forEach((r, i) => {
      const b = document.createElement("button"); b.className = "btn-ghost"; b.dataset.index = String(i);
      b.textContent = this.t("regionRemove", { n: i + 1 }) + ` (${Math.round(r.x0 * 100)}, ${Math.round(r.y0 * 100)} – ${Math.round(r.x1 * 100)}, ${Math.round(r.y1 * 100)} %)`;
      list.append(b);
    });
    this.el<HTMLButtonElement>("regionsClear").disabled = !this.regions.length;
  }
}
