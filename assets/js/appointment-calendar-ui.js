// Connects the appointment calendar page (src/ferramentas/calendario-consultas.md)
// to the logic in appointment-schedule.js (and due-date.js for the DPP). Loaded
// as a module on that page only. Messages are shown inline and announced
// through aria-live regions; nothing here throws on user input. The .ics is
// built from a Blob in the browser and offered as a download — no network.
import { calculateDueDate } from "./due-date.js";
import { appointmentSchedule, toICS, formatWindow, formatNote, formatWeekWindow } from "./appointment-schedule.js";

const form = document.getElementById("appointment-calendar");
const input = document.getElementById("start-date");
const label = form.querySelector(`label[for="${input.id}"]`);
const error = document.getElementById("start-date-error");
const result = document.getElementById("appointment-result");
const listTemplate = document.getElementById("appointment-list-template");
const rowTemplate = document.getElementById("appointment-row-template");
// Print-only sheet and its row template: filled from the SAME schedule as the
// on-page list and the .ics, then printed with window.print() (no PDF library,
// no new build step — ADR-0003). The region lives in the page markup so its
// logo, DGS references, disclaimer and footer come from site.js.
const printRegion = document.getElementById("appointment-print");
const printList = printRegion?.querySelector("[data-field='print-list']");
const printRowTemplate = document.getElementById("appointment-print-row-template");

/** The date input's label for each input mode. */
const LABELS = {
  dueDate: "Data provável do parto (DPP)",
  lastPeriod: "Primeiro dia da última menstruação (DUM)",
};

const ERRORS = {
  empty: "Indica uma data.",
  invalid: "Esta data não é válida. Confirma o dia, o mês e o ano.",
  future: "Esta data não pode ser depois de hoje.",
};

/** Today on this device, as "YYYY-MM-DD" in local time. */
function localToday() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function setError(message) {
  error.textContent = message;
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

/** Relabel the date input for the chosen mode and start over. */
function setMode(from) {
  label.textContent = LABELS[from];
  // A DUM can't be in the future; a known DPP usually is.
  if (from === "dueDate") input.removeAttribute("max");
  else input.max = localToday();
  setError("");
  result.replaceChildren();
  revokeDownload();
  clearPrintSheet();
}

/** Empty the print-only sheet so a stale schedule is never printed. */
function clearPrintSheet() {
  if (printList) printList.replaceChildren();
}

/**
 * Fill the print-only sheet from the SAME schedule the on-page list and the
 * .ics use, so the printed PDF carries the identical titles, week windows,
 * concrete dates and notes/conditions.
 */
function fillPrintSheet(schedule) {
  if (!printList || !printRowTemplate) return;
  printList.replaceChildren();
  for (const event of schedule) {
    const row = printRowTemplate.content.cloneNode(true);
    row.querySelector("[data-field='title']").textContent = event.title;
    row.querySelector("[data-field='weeks']").textContent = formatWeekWindow(event);
    row.querySelector("[data-field='dates']").textContent = formatWindow(event.startDate, event.endDate);
    row.querySelector("[data-field='note']").textContent = formatNote(event);
    printList.append(row);
  }
}

// The object URL for the current .ics download, revoked when it is replaced.
let downloadUrl = null;
function revokeDownload() {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = null;
}

function render(schedule) {
  const card = listTemplate.content.cloneNode(true);
  const list = card.querySelector("[data-field='list']");
  for (const event of schedule) {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector("[data-field='title']").textContent = event.title;
    row.querySelector("[data-field='window']").textContent = formatWindow(event.startDate, event.endDate);
    // The note (and any clinical condition) explains what the window covers;
    // formatNote keeps it identical to the .ics DESCRIPTION.
    row.querySelector("[data-field='note']").textContent = formatNote(event);
    list.append(row);
  }
  // Build the single .ics file and point the download link at it.
  revokeDownload();
  const blob = new Blob([toICS(schedule)], { type: "text/calendar" });
  downloadUrl = URL.createObjectURL(blob);
  const download = card.querySelector("[data-field='download']");
  download.href = downloadUrl;
  download.download = "ferramentas-calendario.ics";
  // The printable sheet mirrors this schedule; the button prints it (browsers
  // offer "Save as PDF" from the print dialog). It appears only now, with JS.
  fillPrintSheet(schedule);
  const print = card.querySelector("[data-field='print']");
  if (print) print.addEventListener("click", () => window.print());
  result.replaceChildren(card);
}

function calculate() {
  const from = form.elements.from.value;
  const today = localToday();
  const outcome = input.validity.badInput
    ? { error: "invalid" }
    : calculateDueDate({ from, date: input.value, today });
  if (outcome.error) {
    setError(ERRORS[outcome.error]);
    result.replaceChildren();
    revokeDownload();
    clearPrintSheet();
    input.focus();
    return;
  }
  setError("");
  render(appointmentSchedule(outcome.dueDate));
}

form.addEventListener("change", (event) => {
  if (event.target.name === "from") setMode(event.target.value);
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

setMode(form.elements.from.value);
form.hidden = false;
