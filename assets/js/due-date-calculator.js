// Connects the DPP calculator form (src/ferramentas/data-provavel-do-parto.md)
// to the date logic in due-date.js. Loaded as a module on that page only. All
// messages are shown inline and announced through aria-live regions; nothing
// here throws on user input.
import { calculateDueDate, formatDate, formatGestationalAge, gestationalAge } from "./due-date.js";

const form = document.getElementById("due-date-calculator");
const input = document.getElementById("start-date");
const label = form.querySelector(`label[for="${input.id}"]`);
const error = document.getElementById("start-date-error");
const result = document.getElementById("due-date-result");
const template = document.getElementById("due-date-result-template");
const ageFieldset = document.getElementById("ultrasound-age");
const weeksInput = document.getElementById("ultrasound-weeks");
const daysInput = document.getElementById("ultrasound-days");
const ageError = document.getElementById("ultrasound-age-error");

/** The date input's label for each input mode. */
const LABELS = {
  lastPeriod: "Primeiro dia da última menstruação (DUM)",
  conception: "Data de concepção",
  ultrasound: "Data da ecografia do 1.º trimestre",
};

const ERRORS = {
  empty: "Indica uma data.",
  invalid: "Esta data não é válida. Confirma o dia, o mês e o ano.",
  future: "Esta data não pode ser depois de hoje.",
  gestationalAgeRange: "A idade gestacional da ecografia deve estar entre 11+0 e 13+6 semanas.",
};

const OUT_OF_RANGE = "Confirma a data introduzida";

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

/** Report (or clear) a problem with the measured idade gestacional fields. */
function setAgeError(message) {
  ageError.textContent = message;
  for (const field of [weeksInput, daysInput]) {
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }
}

/** Relabel the date input for the chosen mode and start over. */
function setMode(from) {
  label.textContent = LABELS[from];
  // No start date — a DUM, a conception or an ultrasound — can be in the future.
  input.max = localToday();
  // The measured idade gestacional only applies to the ultrasound mode.
  ageFieldset.hidden = from !== "ultrasound";
  setError("");
  setAgeError("");
  result.replaceChildren();
}

function calculate() {
  const from = form.elements.from.value;
  const today = localToday();
  // A half-typed date reads as "" in the input: report it as invalid.
  const outcome = input.validity.badInput
    ? { error: "invalid" }
    : calculateDueDate({
        from,
        date: input.value,
        // valueAsNumber is NaN for an empty or half-typed number field, which
        // the pure logic already rejects as invalid.
        weeks: weeksInput.valueAsNumber,
        days: daysInput.valueAsNumber,
        today,
      });
  setError("");
  setAgeError("");
  if (outcome.error) {
    if (outcome.error === "gestationalAgeRange") {
      setAgeError(ERRORS[outcome.error]);
      weeksInput.focus();
    } else {
      setError(ERRORS[outcome.error]);
      // Weeks/days are only wrong in the ultrasound mode; point there when they are.
      if (from === "ultrasound" && outcome.error === "invalid" && !input.validity.badInput && input.value) {
        setAgeError(ERRORS.invalid);
        weeksInput.focus();
      } else {
        input.focus();
      }
    }
    result.replaceChildren();
    return;
  }
  const age = gestationalAge(outcome.dueDate, today);
  const card = template.content.cloneNode(true);
  card.querySelector('[data-field="due-date"]').textContent = formatDate(outcome.dueDate);
  card.querySelector('[data-field="gestational-age"]').textContent = age.outOfRange
    ? OUT_OF_RANGE
    : formatGestationalAge(age);
  result.replaceChildren(card);
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
