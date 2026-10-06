// Connects the weekly tracker form (src/ferramentas/acompanhamento-semanal.md)
// to the week logic in weekly-tracker.js and the date logic in due-date.js.
// Loaded as a module on that page only. Messages are shown inline and
// announced through aria-live regions; nothing here throws on user input.
import { calculateDueDate, formatGestationalAge, gestationalAge } from "./due-date.js";
import { weekInfo } from "./weekly-tracker.js";

const form = document.getElementById("weekly-tracker");
const input = document.getElementById("tracker-date");
const label = form.querySelector(`label[for="${input.id}"]`);
const error = document.getElementById("tracker-date-error");
const result = document.getElementById("weekly-tracker-result");
const template = document.getElementById("weekly-tracker-result-template");

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

const OUT_OF_RANGE =
  "Estas datas dão uma semana fora do intervalo de uma gravidez (1 a 42 semanas). Confirma a data introduzida.";

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
}

function show() {
  const from = form.elements.from.value;
  const today = localToday();
  // A half-typed date reads as "" in the input: report it as invalid.
  const outcome = input.validity.badInput
    ? { error: "invalid" }
    : calculateDueDate({ from, date: input.value, today });
  if (outcome.error) {
    setError(ERRORS[outcome.error]);
    result.replaceChildren();
    input.focus();
    return;
  }
  setError("");
  const age = gestationalAge(outcome.dueDate, today);
  const card = template.content.cloneNode(true);
  if (age.outOfRange) {
    // Still show the week's clamped text, but lead with a warning.
    const info = weekInfo(NaN);
    card.querySelector('[data-field="heading"]').textContent = OUT_OF_RANGE;
    card.querySelector('[data-field="trimester"]').textContent = "";
    card.querySelector('[data-field="text"]').textContent = info.text;
  } else {
    const info = weekInfo(age.weeks);
    card.querySelector('[data-field="heading"]').textContent =
      `Estás na semana ${info.week} (${formatGestationalAge(age)}).`;
    card.querySelector('[data-field="trimester"]').textContent = `Estás no ${info.trimester}.`;
    card.querySelector('[data-field="text"]').textContent = info.text;
  }
  result.replaceChildren(card);
}

form.addEventListener("change", (event) => {
  if (event.target.name === "from") setMode(event.target.value);
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  show();
});

setMode(form.elements.from.value);
form.hidden = false;
