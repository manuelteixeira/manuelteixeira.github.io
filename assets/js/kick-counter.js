// The pure logic of the fetal-movement counter (#19): movement count, elapsed
// time to reach a reference threshold, and the session summary. Code names are
// English. No DOM access, so it runs in the browser as a static ES module and
// in Node for the unit tests.
//
// A session is a list of timestamps (milliseconds since the epoch, what
// Date.now() gives) in the order the movements were felt. The reference count
// is the number of movements the common guidance looks for — typically ten,
// "Count to Ten" — and the elapsed time measures first-movement to the Nth.

/** The reference movement count the common guidance uses. */
export const REFERENCE_COUNT = 10;

/** How many movements have been recorded. */
export const movementCount = (movements) => movements.length;

/**
 * The elapsed time (milliseconds) from the first movement to the Nth.
 * Returns null if the session has fewer than `n` movements.
 * @param {number[]} movements - timestamps in epoch ms
 * @param {number} n - target count
 * @returns {number | null}
 */
export function elapsedToReach(movements, n) {
  if (movements.length < n || n < 1) return null;
  return movements[n - 1] - movements[0];
}

/**
 * Session summary: count, whether the reference was reached, how many
 * remain, and the elapsed time (to the reference count if reached, or
 * since the first movement if still counting).
 * @param {number[]} movements
 * @param {number} [referenceCount]
 * @returns {{ count: number, reached: boolean, remaining: number, elapsed: number | null }}
 */
export function summarize(movements, referenceCount = REFERENCE_COUNT) {
  const count = movementCount(movements);
  const reached = count >= referenceCount;
  const remaining = reached ? 0 : referenceCount - count;
  let elapsed;
  if (count === 0) {
    elapsed = null;
  } else if (reached) {
    elapsed = elapsedToReach(movements, referenceCount);
  } else {
    // Still counting: time since the first movement to the latest.
    elapsed = movements[count - 1] - movements[0];
  }
  return { count, reached, remaining, elapsed };
}

const pad = (n) => String(n).padStart(2, "0");

/**
 * An elapsed time in words: whole minutes under an hour ("27 min"), or
 * "h:mm min" from an hour up. null has no written form. Rounds to the nearest
 * whole minute.
 * @param {number | null} ms
 * @returns {string}
 */
export function formatElapsed(ms) {
  if (ms == null) return "";
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${pad(minutes)} min`;
}
