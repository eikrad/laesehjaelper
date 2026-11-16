interface RecognitionPage {
  lang: string;
  status: string;
  text: string;
  rawText?: string;
  changeVersion?: number;
  paras?: unknown;
  corners?: unknown;
  ocrRegions?: unknown;
  phraseCues?: unknown;
  canvas?: object;
  inputBlob?: object | null;
  photo?: object;
  photoBlob?: object | null;
}

/** Capture the page a job may update. The caller supplies its navigation/deletion ownership rule. */
export function recognitionGuard(page: RecognitionPage, owned: () => boolean): () => boolean {
  // Snapshot nested annotations too: placement, crop and exclusion arrays can change in place.
  const state = () => JSON.stringify([page.changeVersion, page.lang, page.status, page.text, page.rawText,
    page.paras, page.corners, page.ocrRegions, page.phraseCues]);
  const started = state();
  // Encoding a canvas may populate its cached blob and saved revision during recognition.
  // Only the effective source is part of this guard; storage revision checks stay with persistence.
  const input = page.canvas || page.inputBlob, photo = page.photo || page.photoBlob;
  return () => owned() && (page.canvas || page.inputBlob) === input && (page.photo || page.photoBlob) === photo && state() === started;
}
