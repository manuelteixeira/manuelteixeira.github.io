// Calendário de consultas/exames (#20): the pure logic of the appointment
// calendar. From a DPP it computes, for each pregnancy ultrasound and group of
// laboratory tests, the all-day WINDOW (a span of gestational weeks) in which
// it is done, and builds a single .ics (VCALENDAR with one VEVENT per window)
// for the user to download.
//
// No DOM access, so it runs in the browser as a static ES module and in Node
// for the unit tests. Code names are English; DPP is `dueDate`. The date maths
// (toDays/fromDays) is reused from due-date.js — we do not reimplement it here,
// so the calendar inherits its calendar-validity/rollover rejection. Dates are
// calendar dates as "YYYY-MM-DD" strings.
//
// Idade gestacional counts from the DUM, which is DPP − 280 days (40 weeks).
// So gestational offset "W weeks + D days" falls on DUM + W×7 + D days.
//
// The list follows the Portuguese DGS guidance for low-risk pregnancy:
//   • ecografias — Norma DGS nº 023/2011 (3 routine scans, exact windows);
//   • análises  — Norma DGS nº 037/2011 (laboratory tests, grouped per window).
// Each ecografia is an exact interval ending "+6 days" (obstetric convention:
// "22 semanas e 6 dias" = up to 22+6, the eve of 23+0). Laboratory tests are
// grouped into one window-event per DGS block, with the exams listed in the
// DESCRIPTION; conditional exams are shown with their condition in the text,
// never filtered — the calendar is indicative and general.
import { formatDate, toDays, fromDays } from "./due-date.js";

/** Days from the DUM (gestational week 0) to the DPP. */
const GESTATION_DAYS = 280;

/**
 * DEFAULT appointment list — DGS normas 023/2011 (ecografias) and 037/2011
 * (análises), for a low-risk pregnancy. Approved from issue #20 (comment
 * "Lista de consultas/exames aprovada", with Inês's correction to the exact
 * ecografia intervals). Every event is still marked "indicativo — a confirmar
 * com a tua parteira" and framed as low-risk guidance, not a prescription.
 *
 * Each item is an all-day WINDOW: `startWeek`/`startDay` and `endWeek`/`endDay`
 * are gestational offsets from the DUM (week + day). `id` is a stable key used
 * to build each VEVENT's UID. `note` lists what the window covers; `condition`,
 * when present, is the clinical "só se…" caveat kept in the text.
 *
 * Window conventions (issue #20 modelling rules):
 *   • Ecografias: exact intervals (11+0→13+6, 20+0→22+6, 30+0→32+6).
 *   • Week bands ("24–28", "35–37"): startWeek = min+0, endWeek = max+6.
 *   • 1º-trimestre análises ("< 13 semanas", no lower bound given): placed as
 *     an indicative 8+0→12+6 window (first booking visit to end of week 12),
 *     pending confirmation like everything else.
 */
export const DEFAULT_APPOINTMENTS = [
  {
    id: "analises-1t",
    title: "Análises do 1º trimestre",
    startWeek: 8,
    startDay: 0,
    endWeek: 12,
    endDay: 6,
    note:
      "Citologia cervical; tipagem ABO e fator Rh; pesquisa de aglutininas irregulares (Coombs indireto); " +
      "hemograma completo; glicémia em jejum; VDRL; serologias Rubéola e Toxoplasmose (IgG e IgM); " +
      "Ac VIH 1 e 2; AgHBs; urocultura com eventual TSA.",
  },
  {
    id: "eco-1t",
    title: "Ecografia do 1º trimestre",
    startWeek: 11,
    startDay: 0,
    endWeek: 13,
    endDay: 6,
    note: "Ecografia das 11+0 às 13+6 semanas (rastreio do 1º trimestre).",
  },
  {
    id: "serologia-18-20",
    title: "Serologia Rubéola (2º trimestre)",
    startWeek: 18,
    startDay: 0,
    endWeek: 20,
    endDay: 6,
    note: "Serologia Rubéola (IgG e IgM) às 18–20 semanas.",
    condition: "só nas mulheres não imunes",
  },
  {
    id: "eco-morfologica",
    title: "Ecografia morfológica (2º trimestre)",
    startWeek: 20,
    startDay: 0,
    endWeek: 22,
    endDay: 6,
    note: "Ecografia morfológica das 20+0 às 22+6 semanas.",
  },
  {
    id: "analises-24-28",
    title: "Análises das 24–28 semanas",
    startWeek: 24,
    startDay: 0,
    endWeek: 28,
    endDay: 6,
    note:
      "Hemograma completo; PTGO com 75 g (colheitas às 0h, 1h e 2h) — rastreio da diabetes gestacional; " +
      "pesquisa de aglutininas irregulares (Coombs indireto); serologia Toxoplasmose (IgG e IgM).",
    condition: "a serologia Toxoplasmose só nas não imunes",
  },
  {
    id: "eco-3t",
    title: "Ecografia do 3º trimestre",
    startWeek: 30,
    startDay: 0,
    endWeek: 32,
    endDay: 6,
    note: "Ecografia das 30+0 às 32+6 semanas (crescimento do 3º trimestre).",
  },
  {
    id: "analises-32-34",
    title: "Análises das 32–34 semanas",
    startWeek: 32,
    startDay: 0,
    endWeek: 34,
    endDay: 6,
    note:
      "Hemograma completo; VDRL; serologia Toxoplasmose (IgG e IgM); Ac VIH 1 e 2; AgHBs.",
    condition:
      "a serologia Toxoplasmose só nas não imunes; o AgHBs só nas não vacinadas com rastreio negativo no 1º trimestre",
  },
  {
    id: "sgb-35-37",
    title: "Pesquisa de Streptococcus do grupo B",
    startWeek: 35,
    startDay: 0,
    endWeek: 37,
    endDay: 6,
    note:
      "Colheita (1/3 externo da vagina e ano-retal) para pesquisa de streptococcus β-hemolítico do grupo B, às 35–37 semanas.",
  },
];

/** The note added to every event: this schedule is indicative, not a prescription. */
export const INDICATIVE_NOTE = "indicativo — a confirmar com a tua parteira";

/** The low-risk assumption, stated briefly in every event (Normas DGS 023/2011 e 037/2011). */
export const LOW_RISK_NOTE = "Lista para gravidez de baixo risco (Normas DGS 023/2011 e 037/2011).";

/**
 * The indicative schedule for a given DPP: each item with the calendar dates
 * its window starts and ends on, derived from its gestational offsets.
 * @param {string} dueDate DPP as "YYYY-MM-DD".
 * @param {Array<object>} [appointments]
 * @returns {Array<object>} each item plus `startDate` and `endDate` ("YYYY-MM-DD").
 */
export function appointmentSchedule(dueDate, appointments = DEFAULT_APPOINTMENTS) {
  const dumDays = toDays(dueDate) - GESTATION_DAYS;
  const offset = (week, day) => fromDays(dumDays + week * 7 + day);
  return appointments.map((item) => ({
    ...item,
    startDate: offset(item.startWeek, item.startDay),
    endDate: offset(item.endWeek, item.endDay),
  }));
}

/** The same long pt-PT date form as the DPP calculator. */
export { formatDate };

/**
 * A window as a date range in words, e.g. "19 de março de 2026 – 8 de abril de
 * 2026". A single-day window (start === end) reads as one date.
 */
export const formatWindow = (startDate, endDate) =>
  startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} – ${formatDate(endDate)}`;

/**
 * A window as a gestational week band in obstetric "W+D" notation, e.g.
 * "11+0 – 13+6 semanas". Used by the printable PDF next to the concrete
 * calculated dates so the sheet reads the same way the on-page list and the
 * static reference do. A single-point window (same start and end) reads as one
 * offset. Operates on the gestational offsets, so it needs no DPP.
 * @param {{startWeek: number, startDay: number, endWeek: number, endDay: number}} event
 * @returns {string}
 */
export const formatWeekWindow = (event) => {
  const start = `${event.startWeek}+${event.startDay}`;
  const end = `${event.endWeek}+${event.endDay}`;
  return start === end ? `${start} semanas` : `${start} – ${end} semanas`;
};

// --- .ics (iCalendar, RFC 5545) ----------------------------------------------

const PRODID = "-//inesejoana.pt//Calendario de consultas//PT";

/** Escape a text value for an iCalendar property (RFC 5545 §3.3.11). */
const escapeText = (text) =>
  String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");

/** "YYYY-MM-DD" → "YYYYMMDD" for a DATE value. */
const icsDate = (iso) => iso.replace(/-/g, "");

/** A UTC DATE-TIME value "YYYYMMDDTHHMMSSZ" (RFC 5545 §3.3.5) for a Date. */
const icsDateTime = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

/** The day after an "YYYY-MM-DD" date — iCalendar DTEND for a DATE is exclusive. */
const dayAfter = (iso) => fromDays(toDays(iso) + 1);

/** A short tag appended to each SUMMARY so month views still read indicative. */
export const INDICATIVE_TAG = "(indicativo)";

/** The DESCRIPTION for one window: its note, any condition, then the standing notes. */
/**
 * The human sentence for one window: its note followed by any clinical
 * condition (capitalised, full stop). Shared by the page UI and the .ics
 * DESCRIPTION so the condition always reads the same way.
 */
export const formatNote = (event) => {
  const parts = [];
  if (event.note) parts.push(event.note);
  if (event.condition) parts.push(event.condition.charAt(0).toUpperCase() + event.condition.slice(1) + ".");
  return parts.join(" ");
};

/** The .ics DESCRIPTION: the note/condition, then the standing indicative + low-risk notes. */
const describe = (event) => [formatNote(event), `(${INDICATIVE_NOTE})`, LOW_RISK_NOTE].filter(Boolean).join(" ");

/**
 * A valid VCALENDAR string for the given windows: one all-day VEVENT each,
 * with DTSTART;VALUE=DATE at the window's first day and an exclusive
 * DTEND;VALUE=DATE at the day after its last (as RFC 5545 requires for DATE
 * values). Each VEVENT carries a mandatory DTSTAMP, a stable UID, the
 * indicative tag on the SUMMARY and the indicative + low-risk notes (and any
 * condition) in the DESCRIPTION. Lines are joined with CRLF. The `now` is the
 * DTSTAMP instant; it defaults to the current time but can be pinned.
 * @param {Array<{id: string, title: string, startDate: string, endDate: string, note?: string, condition?: string}>} events
 * @param {Date} [now] The DTSTAMP instant (defaults to new Date()).
 * @returns {string}
 */
export function toICS(events, now = new Date()) {
  const dtstamp = icsDateTime(now);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:${PRODID}`, "CALSCALE:GREGORIAN"];
  for (const event of events) {
    const summary = `${event.title} ${INDICATIVE_TAG}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}-${icsDate(event.startDate)}@inesejoana.pt`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(event.startDate)}`,
      `DTEND;VALUE=DATE:${icsDate(dayAfter(event.endDate))}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(describe(event))}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
