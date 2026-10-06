// Theme preview panel (dev server only, never in the production build).
// Loaded as a classic blocking script in <head> so the saved choice is
// applied before first paint (no flash of the default theme), then builds
// the panel once the DOM is ready. Choices persist in localStorage.
(() => {
  const OPTIONS = {
    palette: { label: "Paleta", values: { atual: "Atual (violeta vivo)", violeta: "Violeta clássico", linho: "Linho (terracota)", salvia: "Sálvia", marinho: "Marinho", rosa: "Rosa antigo" } },
    heading: { label: "Títulos", values: { sistema: "Sistema (atual)", cormorant: "Cormorant Garamond", "eb-garamond": "EB Garamond", lora: "Lora", baskerville: "Libre Baskerville" } },
    body: { label: "Texto", values: { sistema: "Sistema (atual)", "source-sans": "Source Sans 3", inter: "Inter", lora: "Lora" } },
    shape: { label: "Cantos", values: { suave: "Suaves (atual)", discreto: "Discretos", reto: "Retos" } },
    style: { label: "Estilo", values: { atual: "Atual (cartões)", classico: "Clássico (filetes)" } },
    logo: { label: "Logótipo", values: { imagem: "Imagem (atual)", monograma: "Monograma tipográfico" } },
  };
  const KEY = "theme-preview";
  const root = document.documentElement;
  const defaults = Object.fromEntries(Object.entries(OPTIONS).map(([k, o]) => [k, Object.keys(o.values)[0]]));

  let state;
  try {
    state = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    state = { ...defaults };
  }

  const apply = () => {
    for (const [key, value] of Object.entries(state)) {
      if (value === defaults[key]) delete root.dataset[key];
      else root.dataset[key] = value;
    }
    localStorage.setItem(KEY, JSON.stringify(state));
  };
  apply();

  const summary = () =>
    Object.entries(OPTIONS).map(([k, o]) => `${o.label}: ${o.values[state[k]]}`).join(" · ");

  const build = () => {
    const panel = document.createElement("details");
    panel.className = "theme-panel";
    panel.innerHTML = `<summary>Temas (pré-visualização)</summary><form></form>`;
    const form = panel.querySelector("form");

    for (const [key, option] of Object.entries(OPTIONS)) {
      const id = `theme-${key}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = option.label;
      const select = document.createElement("select");
      select.id = id;
      for (const [value, text] of Object.entries(option.values)) {
        select.add(new Option(text, value, false, state[key] === value));
      }
      select.addEventListener("change", () => {
        state[key] = select.value;
        apply();
      });
      form.append(label, select);
    }

    const actions = document.createElement("div");
    actions.className = "theme-actions";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copiar escolha";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Repor";
    const status = document.createElement("output");
    status.setAttribute("aria-live", "polite");
    actions.append(copy, reset);
    form.append(actions, status);

    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(summary());
        status.textContent = "Copiado: " + summary();
      } catch {
        status.textContent = summary();
      }
    });
    reset.addEventListener("click", () => {
      state = { ...defaults };
      apply();
      for (const [key, value] of Object.entries(state)) form.querySelector(`#theme-${key}`).value = value;
      status.textContent = "Reposto.";
    });

    panel.open = sessionStorage.getItem(KEY + "-open") !== "0";
    panel.addEventListener("toggle", () => sessionStorage.setItem(KEY + "-open", panel.open ? "1" : "0"));
    document.body.append(panel);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
