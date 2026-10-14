// Connects the shopping-list checklist UI
// (src/ferramentas/mala-da-maternidade.md) to the persistence logic in
// checklist-storage.js. Loaded as a module on that page only. State is saved
// to localStorage under its own key, separate from the hospital-bag
// checklist, so the two lists keep independent progress (#39).
import { load, save, toggle, progress } from "./checklist-storage.js";

const STORAGE_KEY = "shopping-list";
const widget = document.getElementById("shopping-list-checklist");
const progressEl = document.getElementById("shopping-progress");
const checkboxes = widget.querySelectorAll('input[type="checkbox"][data-key]');

/** All item keys, in DOM order. */
const allKeys = [...checkboxes].map((cb) => cb.dataset.key);

let state = load(localStorage, STORAGE_KEY);

function render() {
  for (const cb of checkboxes) {
    cb.checked = state[cb.dataset.key] === true;
  }
  const { checked, total } = progress(state, allKeys);
  progressEl.textContent = `${checked} de ${total} itens prontos.`;
}

widget.addEventListener("change", (e) => {
  const cb = e.target.closest('input[type="checkbox"][data-key]');
  if (!cb) return;
  state = toggle(state, cb.dataset.key);
  save(localStorage, STORAGE_KEY, state);
  render();
});

render();
widget.hidden = false;
