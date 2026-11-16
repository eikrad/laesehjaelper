/** Browser work stays in the adapters; the batch owns acceptance and its originating book. */
interface PhotoBatchIO<Input, Photo, Crop, Owner> {
  load(input: Input, signal: AbortSignal): Promise<Photo>;
  crop(photo: Photo, position: { index: number; total: number }, signal: AbortSignal): Promise<Crop | null>;
  /** Acceptance includes finishing the page and book writes, even after preparation stops. */
  accept(owner: Owner, photo: Photo, crop: Crop): Promise<void>;
  error(error: unknown): void;
}

export class PhotoBatches<Input, Photo, Crop, Owner> {
  private active: AbortController | null = null;

  constructor(private readonly io: PhotoBatchIO<Input, Photo, Crop, Owner>) {}

  cancel() { this.active?.abort(); this.active = null; }

  async start(owner: Owner, inputs: readonly Input[]) {
    this.cancel();
    const batch = new AbortController();
    this.active = batch;
    let accepted = 0;
    try {
      for (const [index, input] of inputs.entries()) {
        if (batch.signal.aborted) break;
        let photo: Photo, crop: Crop | null;
        try {
          photo = await this.io.load(input, batch.signal);
          if (batch.signal.aborted) break;
          crop = await this.io.crop(photo, { index, total: inputs.length }, batch.signal);
        } catch (error) {
          if (batch.signal.aborted) break;
          this.io.error(error);
          continue;
        }
        if (batch.signal.aborted) break;
        if (crop === null) continue;
        accepted++;
        try { await this.io.accept(owner, photo, crop); }
        catch (error) { this.io.error(error); }
      }
      return { status: batch.signal.aborted ? "cancelled" as const : "complete" as const, accepted };
    } finally {
      if (this.active === batch) this.active = null;
    }
  }
}
