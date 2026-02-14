/**
 * Данные «Отчеты комитетов 4 созыва»: комитеты, повестки и отчёты по годам.
 * Ссылки только на документы. Импорт с khural.rtyva.ru/activity/445/, 485/, 486/, 487/.
 */

const DOC_BASE = "https://khural.rtyva.ru";

/** Список комитетов 4 созыва (порядок как на сайте) */
export const CONV4_COMMITTEES = [
  "Комитет по конституционно-правовой политике и местному самоуправлению",
];

/** Документы по комитетам 4 созыва: индекс = номер комитета. Пока один комитет. */
const CONV4_DOCUMENTS_BY_COMMITTEE = [
  {
    agendas: {
      2024: [],
      2025: [
        {
          title: "Повестка заседания 24.04.2025 посл",
          url: `${DOC_BASE}/upload/iblock/cef/m98kmxncbgnhzsftunkedoywp3c36qkq/Повестка%20заседания%2024.04.2025%20посл.docx`,
        },
      ],
    },
    reports: {
      2024: [],
      2025: [
        {
          title: "Отчет КППиМСУ за 2025 г.",
          url: `${DOC_BASE}/upload/iblock/97e/hi8k69m7ebt7dqjrf67q3x7pbnkpoe7w/Отчет%20КППиМСУ%20за%202025%20г.docx`,
        },
      ],
    },
  },
];

const CONV4_YEARS = [2025, 2024];

/**
 * Документы по комитету 4 созыва: agendas[year], reports[year] для годов 2024–2025.
 */
export function getConv4DocsByCommittee(committeeIndex) {
  const data = CONV4_DOCUMENTS_BY_COMMITTEE[committeeIndex];
  if (!data) {
    return {
      agendas: Object.fromEntries(CONV4_YEARS.map((y) => [y, []])),
      reports: Object.fromEntries(CONV4_YEARS.map((y) => [y, []])),
    };
  }
  const agendas = {};
  const reports = {};
  CONV4_YEARS.forEach((y) => {
    agendas[y] = data.agendas[y] || [];
    reports[y] = data.reports[y] || [];
  });
  return { agendas, reports };
}
