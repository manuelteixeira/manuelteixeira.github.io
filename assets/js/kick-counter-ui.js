// Connects the kick counter UI (src/ferramentas/contador-de-movimentos.md)
// to the movement-counting logic in kick-counter.js. Loaded as a module on
// that page only. State lives in memory for the session; nothing here throws
// on a click.
import { REFERENCE_COUNT, summarize, formatElapsed } from "./kick-counter.js";

const counter = document.getElementById("kick-counter");
const status = document.getElementById("kick-status");
const kickBtn = document.getElementById("kick-record");
const reset = document.getElementById("kick-reset");
const result = document.getElementById("kick-result");
const countDisplay = result.querySelector('[data-field="count"]');
const remainingDisplay = result.querySelector('[data-field="remaining"]');
const elapsedDisplay = result.querySelector('[data-field="elapsed"]');
const reachedDisplay = result.querySelector('[data-field="reached"]');

/** Recorded movement timestamps this session (ms since the epoch). */
const movements = [];

/** Running elapsed-time display, updated every second while counting. */
let ticker = null;

function render() {
  const summary = summarize(movements);
  const started = summary.count > 0;

  reset.hidden = !started;
  result.hidden = !started;

  if (started) {
    countDisplay.textContent = String(summary.count);
    remainingDisplay.textContent = String(summary.remaining);

    if (summary.reached) {
      elapsedDisplay.textContent = formatElapsed(summary.elapsed);
      reachedDisplay.hidden = false;
      status.textContent = `Chegaste aos ${REFERENCE_COUNT} movimentos!`;
      stopTicker();
    } else {
      // Show live elapsed since the first movement.
      elapsedDisplay.textContent = formatElapsed(Date.now() - movements[0]);
      reachedDisplay.hidden = true;
      status.textContent = `${summary.count} de ${REFERENCE_COUNT} movimentos registados.`;
    }
  }
}

function startTicker() {
  if (ticker) return;
  ticker = setInterval(() => {
    if (movements.length > 0) {
      const summary = summarize(movements);
      if (!summary.reached) {
        elapsedDisplay.textContent = formatElapsed(Date.now() - movements[0]);
      }
    }
  }, 1000);
}

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function onKick() {
  const summary = summarize(movements);
  if (summary.reached) return; // already done
  movements.push(Date.now());
  if (movements.length === 1) startTicker();
  render();
}

function onReset() {
  movements.length = 0;
  stopTicker();
  reachedDisplay.hidden = true;
  result.hidden = true;
  reset.hidden = true;
  status.textContent = "Pronta a começar.";
}

kickBtn.addEventListener("click", onKick);
reset.addEventListener("click", onReset);

render();
counter.hidden = false;
