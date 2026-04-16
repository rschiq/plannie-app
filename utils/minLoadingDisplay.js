const DEFAULT_MIN_MS = 4000;

/**
 * Waits until at least `minMs` have passed since `startTime` (for intentional loader UX).
 * Does not slow down the work that happens before this is awaited.
 */
export async function minLoadingDisplaySince(startTime, minMs = DEFAULT_MIN_MS) {
  const elapsed = Date.now() - startTime;
  if (elapsed < minMs) {
    await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
  }
}
