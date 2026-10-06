// DPP (data provável do parto) and idade gestacional: the pure date logic of
// the DPP calculator (#17, #28). Code names are English: DPP is `dueDate`, the
// DUM is `lastPeriod`. No DOM access, so it runs in the browser as a
// static ES module and in Node for the unit tests.
//
// Dates are calendar dates as "YYYY-MM-DD" strings (what <input type="date">
// gives). Arithmetic is on whole days since the epoch in UTC, so daylight
// saving can never shift a result by a day.

const DAY_MS = 86_400_000;

/** Days from each kind of start date to the DPP. */
const DAYS_TO_DUE_DATE = { lastPeriod: 280, conception: 266 };

/** A 1st-trimester ultrasound dates the pregnancy between 11+0 and 13+6. */
const MIN_ULTRASOUND_DAYS = 11 * 7; // 77
const MAX_ULTRASOUND_DAYS = 13 * 7 + 6; // 97

/**
 * Whole days since 1970-01-01 for a "YYYY-MM-DD" string, or NaN if it is not
 * a real calendar date (e.g. "2026-02-30").
 */
export const toDays = (iso) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return NaN;
  const days = Date.UTC(match[1], match[2] - 1, match[3]) / DAY_MS;
  // Date.UTC rolls 30 February over into March: reject any rollover.
  return fromDays(days) === iso ? days : NaN;
};

/** The "YYYY-MM-DD" string for whole days since 1970-01-01. */
export const fromDays = (days) => new Date(days * DAY_MS).toISOString().slice(0, 10);

/**
 * The DPP from a DUM, a conception date, or a 1st-trimester ultrasound.
 *
 * For the ultrasound mode the scan date and the measured idade gestacional
 * (`weeks` + `days`) date the DUM — DUM = scan date − (weeks·7 + days) — and
 * the DPP is that DUM plus 280 days. The measured idade gestacional must fall
 * in the plausible 1st-trimester window of 11+0 to 13+6 weeks.
 * @param {{ from: "lastPeriod" | "conception" | "ultrasound", date: string, weeks?: number, days?: number, today: string }} input
 * @returns {{ dueDate: string } | { error: string }}
 */
export function calculateDueDate({ from, date, weeks, days, today }) {
  if (!date) return { error: "empty" };
  const start = toDays(date);
  if (Number.isNaN(start)) return { error: "invalid" };
  if (start > toDays(today)) return { error: "future" };
  if (from === "ultrasound") {
    if (!Number.isInteger(weeks) || !Number.isInteger(days) || days < 0 || days > 6) return { error: "invalid" };
    const gestation = weeks * 7 + days;
    if (gestation < MIN_ULTRASOUND_DAYS || gestation > MAX_ULTRASOUND_DAYS) return { error: "gestationalAgeRange" };
    return { dueDate: fromDays(start - gestation + DAYS_TO_DUE_DATE.lastPeriod) };
  }
  return { dueDate: fromDays(start + DAYS_TO_DUE_DATE[from]) };
}

/** Idade gestacional beyond this many days is implausible: 42 weeks. */
const MAX_GESTATION = 42 * 7;

/**
 * The idade gestacional on `today` for a pregnancy with this DPP, counted
 * from the DUM (DPP − 280 days). Outside 0–42 weeks the dates entered are
 * almost certainly wrong, so it is reported as out of range instead.
 * @param {string} dueDate
 * @param {string} today
 * @returns {{ weeks: number, days: number } | { outOfRange: true }}
 */
export function gestationalAge(dueDate, today) {
  const elapsed = toDays(today) - (toDays(dueDate) - DAYS_TO_DUE_DATE.lastPeriod);
  if (!(elapsed >= 0 && elapsed <= MAX_GESTATION)) return { outOfRange: true };
  return { weeks: Math.floor(elapsed / 7), days: elapsed % 7 };
}

// Read in UTC, like the arithmetic, so the date shown is the date computed.
const LONG_DATE = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeZone: "UTC" });

/** A "YYYY-MM-DD" date in pt-PT long form, e.g. "8 de outubro de 2026". */
export const formatDate = (iso) => LONG_DATE.format(new Date(toDays(iso) * DAY_MS));

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** An idade gestacional as words, e.g. "27 semanas e 3 dias". */
export const formatGestationalAge = ({ weeks, days }) =>
  `${plural(weeks, "semana", "semanas")} e ${plural(days, "dia", "dias")}`;
