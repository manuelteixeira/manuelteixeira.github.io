// Connects the "Que serviço preciso?" chooser UI
// (src/ferramentas/que-servico-preciso.md) to the decision table in
// service-chooser.js. Loaded as a module on that page only. The picker is a
// native <select> so it works with keyboard and screen readers; the result is
// an aria-live region. State lives in memory; nothing here throws on input.
import { situations, recommend } from "./service-chooser.js";

const chooser = document.getElementById("service-chooser");
const select = document.getElementById("situation");
const result = document.getElementById("chooser-result");
const list = document.getElementById("chooser-services");
const phaseLine = document.getElementById("chooser-phase");

// Fill the picker from the single source of truth, so the options can never
// drift from the decision table.
for (const situation of situations) {
  const option = document.createElement("option");
  option.value = situation.id;
  option.textContent = situation.label;
  select.append(option);
}

function render() {
  const recommendation = recommend(select.value);
  if (!recommendation) {
    result.hidden = true;
    list.replaceChildren();
    phaseLine.textContent = "";
    return;
  }

  phaseLine.textContent = recommendation.phase;
  list.replaceChildren();
  for (const name of recommendation.services) {
    const item = document.createElement("li");
    item.textContent = name;
    list.append(item);
  }
  result.hidden = false;
}

select.addEventListener("change", render);

render();
chooser.hidden = false;
