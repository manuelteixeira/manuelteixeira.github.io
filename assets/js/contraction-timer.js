// The pure logic of the contraction timer (#18): durations, start-to-start
// intervals and the pattern summary. Code names are English. No DOM access, so
// it runs in the browser as a static ES module and in Node for the unit tests.
//
// Times are milliseconds since the epoch (what Date.now() gives). A contraction
// is { start, end } with end >= start. Frequency follows the clinical
// convention — the interval is measured from the start of one contraction to
// the start of the next — so n contractions give n − 1 intervals.

/** How long a contraction lasted, in milliseconds. */
export const contractionDuration = ({ start, end }) => end - start;

/**
 * The start-to-start gaps between consecutive contractions, in milliseconds.
 * @param {{ start: number, end: number }[]} contractions
 * @returns {number[]}
 */
export const intervals = (contractions) =>
  contractions.slice(1).map((c, i) => c.start - contractions[i].start);

const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * The average duration and start-to-start interval over the last `window`
 * contractions (default: all of them). Averaging the recent few is what tells
 * you whether the pattern is settling into a rhythm. With fewer than two
 * contractions there is no interval, reported as null.
 * @param {{ start: number, end: number }[]} contractions
 * @param {number} [window]
 * @returns {{ count: number, averageDuration: number | null, averageInterval: number | null }}
 */
export function summarize(contractions, window = contractions.length) {
  const recent = window >= contractions.length ? contractions : contractions.slice(-window);
  const spans = recent.map(contractionDuration);
  const gaps = intervals(recent);
  return {
    count: recent.length,
    averageDuration: spans.length ? mean(spans) : null,
    averageInterval: gaps.length ? mean(gaps) : null,
  };
}

const pad = (n) => String(n).padStart(2, "0");

/** Whole seconds, rounded, as "m:ss". */
const clock = (ms) => {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
};

/**
 * A duration in words: whole seconds under a minute ("45 s"), m:ss from a
 * minute up ("1:30"). null has no written form.
 * @param {number | null} ms
 */
export const formatDuration = (ms) => {
  if (ms == null) return "";
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`;
  return clock(ms);
};

/**
 * An interval as "m:ss", rounded to whole seconds. null has no written form.
 * @param {number | null} ms
 */
export const formatInterval = (ms) => (ms == null ? "" : clock(ms));
