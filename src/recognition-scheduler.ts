interface RecognitionWork<P> {
  /** Is the page still waiting, before requesting and after acquiring its execution slot? */
  ready(page: P): boolean;
  process(page: P): Promise<void>;
  /** No attempt for this page remains in the scheduler; the caller may release its images. */
  released(page: P): void;
  failed(error: unknown): void;
}

/** One execution slot for page and book jobs; OCR, result validity and storage stay in adapters. */
export function createRecognitionScheduler<P>(work: RecognitionWork<P>) {
  let waiting: P[] = [];
  let pending: P | undefined;
  let running = false;
  let pipeline: Promise<unknown> = Promise.resolve();
  function exclusive<T>(process: () => Promise<T>): Promise<T> {
    const job = pipeline.then(process);
    pipeline = job.catch(() => {});
    return job;
  }

  return {
    // Repeated requests share a waiting attempt. An active page may queue its replacement attempt.
    enqueue(page: P) { if (!waiting.includes(page)) waiting.push(page); },
    // A running attempt finishes; only work still in the queue is discarded.
    discard(page: P) { waiting = waiting.filter(p => p !== page); },
    /** Pages whose images must stay available, also while awaiting a book job's execution slot. */
    pages: () => pending === undefined ? [...waiting] : [pending, ...waiting],
    /** Run a complete book job in order with page jobs. Its result or failure belongs to its caller. */
    exclusive,
    /** Start draining queued pages; repeated starts while running are harmless. */
    async run() {
      if (running) return;
      running = true;
      try {
        while (waiting.length) {
          const page = waiting.shift()!;
          try {
            if (work.ready(page)) {
              pending = page;
              await exclusive(async () => {
                if (work.ready(page)) await work.process(page);
              });
            }
          }
          catch (error) { work.failed(error); }
          finally {
            pending = undefined;
            if (!waiting.includes(page)) work.released(page);
          }
        }
      } finally { running = false; }
    },
  };
}
