// The pure logic of the "Que serviço preciso?" chooser (#22): a data-driven
// decision table that maps the user's situation to the right service(s) from
// the existing catalogue in src/_data/services.js. Code names are English and
// there is no DOM access, so it runs in the browser as a static ES module and
// in Node for the unit tests. The CTA ("Marcar consulta" → /contactos/) is the
// page's job; this module only decides *which* services to point at.
//
// Service names are kept in step with src/_data/services.js by hand (the data
// file is Eleventy/Node-side only); the unit test guards against drift.

/**
 * The questionnaire, in the order the page shows it. Each situation is one
 * answer the user can pick: a short pt-PT `label` (the thing they'd say about
 * themselves) mapped to a phase and the service(s) that fit it.
 * @type {{ id: string, label: string, phase: string, services: string[] }[]}
 */
export const situations = [
  {
    id: "gravida",
    label: "Estou grávida e quero acompanhamento na gravidez",
    phase: "Gravidez",
    services: ["Consulta de vigilância da gravidez"],
  },
  {
    id: "preparar-parto",
    label: "Quero preparar-me para o parto e para a parentalidade",
    phase: "Gravidez",
    services: ["Preparação para o parto e parentalidade"],
  },
  {
    id: "parto",
    label: "Estou a decidir onde e como quero ter o meu bebé",
    phase: "Parto",
    services: [
      "Parto na Casa de Saúde da Boavista",
      "Parto no Hospital da Póvoa",
      "Parto no domicílio",
    ],
  },
  {
    id: "amamentacao",
    label: "Preciso de ajuda com a amamentação",
    phase: "Pós-parto",
    services: ["Consulta de apoio à amamentação"],
  },
  {
    id: "sono",
    label: "O sono do meu bebé preocupa-me",
    phase: "Pós-parto",
    services: ["Consulta de sono"],
  },
  {
    id: "recuperacao",
    label: "Estou no pós-parto e quero apoio na recuperação",
    phase: "Pós-parto",
    services: ["Laserterapia"],
  },
  {
    id: "alimentacao",
    label: "Vou começar a introduzir alimentação ao meu bebé",
    phase: "Outros",
    services: ["Consulta de introdução de alimentação complementar"],
  },
  {
    id: "fraldas",
    label: "Quero usar fraldas reutilizáveis e preciso de orientação",
    phase: "Outros",
    services: ["Consultoria em fraldas reutilizáveis"],
  },
];

const BY_ID = new Map(situations.map((s) => [s.id, s]));

/**
 * The services recommended for a situation id, with its phase. An unknown or
 * empty id has no recommendation and returns null — nothing throws.
 * @param {string} [id]
 * @returns {{ phase: string, services: string[] } | null}
 */
export function recommend(id) {
  const situation = BY_ID.get(id);
  if (!situation) return null;
  return { phase: situation.phase, services: [...situation.services] };
}

/**
 * Every distinct service the chooser can recommend, in catalogue order with no
 * duplicates. Useful for a no-JS fallback that lists them all.
 * @returns {string[]}
 */
export function serviceNames() {
  const seen = [];
  for (const s of situations) {
    for (const name of s.services) {
      if (!seen.includes(name)) seen.push(name);
    }
  }
  return seen;
}
