// Connects the contraction timer UI (src/ferramentas/cronometro-de-contracoes.md)
// to the pattern logic in contraction-timer.js. Loaded as a module on that page
// only. State lives in memory for the session; nothing here throws on a click.
import { contractionDuration, intervals, summarize, formatDuration, formatInterval } from "./contraction-timer.js";

const timer = document.getElementById("contraction-timer");
const status = document.getElementById("timer-status");
const toggle = document.getElementById("timer-toggle");
const reset = document.getElementById("timer-reset");
const summary = document.getElementById("timer-summary");
const history = document.getElementById("timer-history");
const tbody = history.querySelector("tbody");
const rowTemplate = document.getElementById("timer-row-template");

// Average the pattern over the most recent few contractions, like the 5-1-1
// rule looks at the last hour rather than any single contraction.
const SUMMARY_WINDOW = 5;

/** Recorded contractions this session: { start, end } in ms since the epoch. */
const contractions = [];
/** The start time of the contraction in progress, or null between them. */
let openStart = null;

const CLOCK = new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" });
const clockTime = (ms) => CLOCK.format(new Date(ms));

/** Set the toggle button to one of its two states. */
function setToggle(state) {
  toggle.dataset.state = state;
  toggle.textContent = state === "running" ? "Terminar contração" : "Começar contração";
}

function render() {
  const started = contractions.length > 0 || openStart !== null;
  reset.hidden = !started;

  // The history table: one row per finished contraction, newest last.
  const gaps = intervals(contractions);
  tbody.replaceChildren();
  contractions.forEach((contraction, i) => {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector('[data-field="index"]').textContent = String(i + 1);
    row.querySelector('[data-field="start"]').textContent = clockTime(contraction.start);
    row.querySelector('[data-field="duration"]').textContent = formatDuration(contractionDuration(contraction));
    // The interval sits with the later of the two contractions it separates.
    row.querySelector('[data-field="interval"]').textContent = i === 0 ? "—" : formatInterval(gaps[i - 1]);
    tbody.append(row);
  });
  history.hidden = contractions.length === 0;

  // The rolling summary, once there is something to summarise.
  const pattern = summarize(contractions, SUMMARY_WINDOW);
  summary.hidden = pattern.count === 0;
  if (pattern.count > 0) {
    summary.querySelector('[data-field="window"]').textContent = String(pattern.count);
    summary.querySelector('[data-field="average-duration"]').textContent = formatDuration(pattern.averageDuration);
    summary.querySelector('[data-field="average-interval"]').textContent =
      pattern.averageInterval == null ? "—" : formatInterval(pattern.averageInterval);
  }
}

function onToggle() {
  if (openStart === null) {
    openStart = Date.now();
    setToggle("running");
    status.textContent = "Contração a decorrer. Marca o fim quando passar.";
  } else {
    const end = Date.now();
    // A double-tap could end before any time passes; keep end >= start.
    contractions.push({ start: openStart, end: Math.max(end, openStart) });
    openStart = null;
    setToggle("idle");
    status.textContent = "Contração registada. Marca a próxima quando começar.";
  }
  render();
}

function onReset() {
  contractions.length = 0;
  openStart = null;
  setToggle("idle");
  status.textContent = "Pronta a começar.";
  render();
}

toggle.addEventListener("click", onToggle);
reset.addEventListener("click", onReset);

render();
timer.hidden = false;
