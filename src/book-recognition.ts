/** Unknown provenance in older books is protected: text corrections used to replace rawText too. */
export interface RecognitionCandidate { source: boolean; manualEdits?: boolean; busy?: boolean }

export function planRecognition<T extends RecognitionCandidate>(pages: readonly T[], includeManual: boolean) {
  const plan = { pages: [] as T[], manual: 0, missing: 0, busy: 0 };
  for (const page of pages) {
    if (!page.source) plan.missing++;
    else if (page.busy) plan.busy++;
    else if (!includeManual && page.manualEdits !== false) plan.manual++;
    else plan.pages.push(page);
  }
  return plan;
}

export type RecognitionOutcome = "done" | "failed" | "changed";
export interface BatchProgress { completed: number; done: number; failed: number; changed: number; remaining: number }

/** Process one page at a time, finishing the current page when cancellation is requested. */
export async function runRecognitionBatch<T>(pages: readonly T[], actions: {
  cancelled(): boolean;
  process(page: T): Promise<RecognitionOutcome>;
  progress(state: BatchProgress): void;
}): Promise<BatchProgress> {
  const state: BatchProgress = { completed: 0, done: 0, failed: 0, changed: 0, remaining: pages.length };
  actions.progress({ ...state });
  for (const page of pages) {
    if (actions.cancelled()) break;
    let outcome: RecognitionOutcome;
    try { outcome = await actions.process(page); } catch { outcome = "failed"; }
    state[outcome]++; state.completed++; state.remaining--;
    actions.progress({ ...state });
  }
  return state;
}
