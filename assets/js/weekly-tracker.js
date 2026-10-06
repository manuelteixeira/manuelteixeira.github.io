// Weekly pregnancy tracker: the pure logic of the acompanhamento semanal (#23).
// Given an idade gestacional in whole weeks (as `due-date.js` reports it), it
// returns a short, educational pt-PT blurb for that week — "estás na semana X,
// isto está a acontecer". No DOM access, so it runs in the browser as a static
// ES module and in Node for the unit tests. The week number itself is computed
// by `due-date.js` (gestationalAge); this module only maps a week to its text.
//
// The content is deliberately indicative and educational, grouped into bands
// so the whole 1–42 range is covered without over-claiming week-by-week
// precision. It is always "a confirmar com a tua parteira".

/** The plausible idade gestacional range, in whole weeks. */
const MIN_WEEK = 1;
const MAX_WEEK = 42;

/** The trimester a gestational week falls in, by the usual convention. */
function trimesterOf(week) {
  if (week <= 13) return "primeiro trimestre";
  if (week <= 27) return "segundo trimestre";
  return "terceiro trimestre";
}

/**
 * Educational blurbs by week band. Each entry is [firstWeek, lastWeek, text];
 * the bands are contiguous and together cover MIN_WEEK..MAX_WEEK. Text is
 * concise pt-PT, framed as what is typically happening, never as a diagnosis.
 */
const BANDS = [
  [1, 4, "O início conta-se a partir da última menstruação, por isso nas primeiras semanas ainda não há bebé a crescer: o corpo prepara-se e a conceção acontece por volta da semana 2 a 3. Um teste pode já dar positivo no fim desta fase."],
  [5, 6, "O embrião é minúsculo mas o coração começa a formar-se e a bater. Podes sentir cansaço, náuseas ou os seios mais sensíveis. É boa altura para marcar a primeira consulta e começar o ácido fólico, se ainda não começaste."],
  [7, 8, "Formam-se os primeiros esboços de braços e pernas e os traços do rosto. As náuseas e a fadiga costumam ser mais intensas nesta fase. Come pouco e muitas vezes se o enjoo apertar."],
  [9, 10, "O embrião passa a chamar-se feto e já tem a forma humana reconhecível. Os órgãos principais estão a desenvolver-se depressa. Muitas pessoas fazem a ecografia do primeiro trimestre por esta altura."],
  [11, 13, "Fecha o primeiro trimestre. O risco de enjoos costuma começar a aliviar e muita gente ganha energia. A ecografia das 12 semanas e os rastreios do primeiro trimestre fazem-se nesta janela."],
  [14, 16, "Começa o segundo trimestre, muitas vezes o mais confortável. A barriga começa a notar-se e o apetite tende a voltar. O bebé já mexe, embora ainda não o sintas."],
  [17, 20, "Por volta das 18 a 20 semanas costuma fazer-se a ecografia morfológica, que observa a anatomia do bebé em detalhe. Muitas pessoas sentem os primeiros movimentos nesta fase."],
  [21, 24, "O bebé cresce depressa e os movimentos tornam-se mais claros e regulares. Podes notar inchaço nos pés e azia. É boa altura para pensar no plano de parto com a tua parteira."],
  [25, 27, "Fecha o segundo trimestre. O bebé reage a sons e a luz e tem ciclos de sono e vigília. Costuma fazer-se o rastreio da diabetes gestacional por esta altura."],
  [28, 31, "Começa o terceiro trimestre e as consultas tornam-se mais frequentes. O bebé ganha peso e as reservas de gordura. Contar os movimentos fetais ao longo do dia ajuda a conhecer o padrão do teu bebé."],
  [32, 35, "O bebé continua a crescer e muitas vezes já se vira de cabeça para baixo. Podes sentir falta de ar e contrações de treino (Braxton Hicks), que são irregulares e passam. Boa altura para preparar a mala da maternidade."],
  [36, 37, "O bebé é considerado quase de termo. Pode encaixar-se na bacia e podes sentir mais pressão em baixo e vontade frequente de urinar. Revê os sinais de trabalho de parto com a tua parteira."],
  [38, 40, "O bebé está de termo e pode nascer a qualquer momento. Fica atenta a contrações regulares que aumentam de intensidade, à perda de líquido ou do rolhão mucoso. A data provável do parto é só uma estimativa."],
  [41, 42, "Passaste a data provável sem o parto começar, o que é comum e não quer dizer que algo esteja errado. A tua parteira ou equipa vai acompanhar-te mais de perto e falar contigo sobre as opções a partir daqui."],
];

/** The band text for an in-range week (MIN_WEEK..MAX_WEEK). */
function textFor(week) {
  const band = BANDS.find(([first, last]) => week >= first && week <= last);
  return band[2];
}

/**
 * The weekly information for a gestational week.
 * @param {number} week whole weeks of idade gestacional
 * @returns {{ week: number, trimester: string, text: string, outOfRange: boolean }}
 *   For 1..42, the week's own band text. Outside that (or for a non-integer
 *   input) the week is clamped to the nearest end and flagged `outOfRange`, so
 *   the caller can still show something but mark the dates as suspect.
 */
export function weekInfo(week) {
  const valid = typeof week === "number" && Number.isInteger(week);
  const clamped = valid ? Math.min(Math.max(week, MIN_WEEK), MAX_WEEK) : MIN_WEEK;
  return {
    week: clamped,
    trimester: trimesterOf(clamped),
    text: textFor(clamped),
    outOfRange: !valid || week < MIN_WEEK || week > MAX_WEEK,
  };
}
