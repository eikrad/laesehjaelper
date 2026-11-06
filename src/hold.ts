/** Visible progress for a deliberate two-second press. */
export function holdProgress(elapsed: number): number {
  return Math.max(0, Math.min(1, elapsed / 2000));
}
