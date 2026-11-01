/**
 * Вспомогательные данные для админки «Отчеты комитетов»: списки комитетов и годы по номеру созыва.
 * Используется для инициализации и отображения в админке.
 */

import {
  CONV3_COMMITTEES,
  getConv3DocsByCommittee,
} from "./committeeReportsConv3.js";
import {
  CONV4_COMMITTEES,
  getConv4DocsByCommittee,
} from "./committeeReportsConv4.js";

/** Годы для 3 созыва (от новых к старым) */
export const CONV3_YEARS = [2023, 2022, 2021, 2020, 2019];

/** Годы для 4 созыва */
export const CONV4_YEARS = [2025, 2024];

const COMMITTEE_ARCHIVE_MATCHERS = {
  3: [
    /аграр|земел|эколог/,
    /безопас|правопоряд/,
    /бюджет|налог|эконом|предприним/,
    /федерал|самоуправ|обществен|информацион|межрегион|международ|средств.*массов/,
    /здравоохран|здоров|социаль|занятост/,
    /конституцион|государственн|самоуправ/,
    /образован|культур|молодеж|наук|спорт/,
    /энергет|строительств|транспорт|жилищ|инфраструктур|промышлен/,
  ],
  4: [/конституцион|местному самоуправ/],
};

export function normalizeCommitteeReportName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[ёЁ]/g, "е")
    .replace(/[‐‑‒–—-]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getArchivedCommitteeReportIndexes(convocationNumber, committeeName) {
  const matchers = COMMITTEE_ARCHIVE_MATCHERS[Number(convocationNumber)] || [];
  const normalizedName = normalizeCommitteeReportName(committeeName);
  if (!normalizedName) return [];
  return matchers.flatMap((matcher, index) =>
    matcher.test(normalizedName) ? [index] : []
  );
}

/**
 * По номеру созыва (3 или 4) возвращает { committees, years }.
 */
export function getCommitteeReportsMeta(convocationNumber) {
  const num = Number(convocationNumber);
  if (num === 3) {
    return { committees: CONV3_COMMITTEES, years: CONV3_YEARS };
  }
  if (num === 4) {
    return { committees: CONV4_COMMITTEES, years: CONV4_YEARS };
  }
  return { committees: [], years: [] };
}

/**
 * Формат документа в committeeReports: { id, title, url?, fileId? }
 */
function docWithId(doc, id) {
  return {
    id: doc.id || id,
    title: doc.title || "Без названия",
    ...(doc.url != null && doc.url !== "" && { url: doc.url }),
    ...(doc.fileId != null && doc.fileId !== "" && { fileId: doc.fileId }),
  };
}

/**
 * Собрать начальные данные «отчеты комитетов» из статических модулей для созыва 3 или 4.
 * Возвращает объект в формате API: { committees, documentsByCommittee }.
 * documentsByCommittee[i].agendas[year] и .reports[year] — массивы { id, title, url?, fileId? }.
 */
export function buildInitialCommitteeReports(convocationNumber) {
  const { committees, years } = getCommitteeReportsMeta(convocationNumber);
  const num = Number(convocationNumber);
  const getDocs = num === 3 ? getConv3DocsByCommittee : getConv4DocsByCommittee;
  const documentsByCommittee = committees.map((_, committeeIndex) => {
    const { agendas, reports } = getDocs(committeeIndex);
    const agendasByYear = {};
    const reportsByYear = {};
    years.forEach((y) => {
      agendasByYear[y] = (agendas[y] || []).map((d, i) =>
        docWithId(d, `static-${committeeIndex}-${y}-ag-${i}`)
      );
      reportsByYear[y] = (reports[y] || []).map((d, i) =>
        docWithId(d, `static-${committeeIndex}-${y}-rep-${i}`)
      );
    });
    return { agendas: agendasByYear, reports: reportsByYear };
  });
  return { committees: [...committees], documentsByCommittee };
}

function mergeDocumentLists(primary, fallback) {
  const result = [];
  const seen = new Set();
  for (const doc of [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(fallback) ? fallback : [])]) {
    if (!doc || typeof doc !== "object") continue;
    const key = String(doc.fileId || doc.url || doc.title || doc.id || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(doc);
  }
  return result;
}

export function mergeCommitteeReportsWithDefaults(apiData, defaults) {
  if (
    !apiData ||
    !Array.isArray(apiData.committees) ||
    !Array.isArray(apiData.documentsByCommittee)
  ) {
    return defaults;
  }

  const names = [...apiData.committees];
  const normalizedIndexes = new Map(
    names.map((name, index) => [normalizeCommitteeReportName(name), index])
  );
  for (const name of defaults.committees) {
    const key = normalizeCommitteeReportName(name);
    if (!normalizedIndexes.has(key)) {
      normalizedIndexes.set(key, names.length);
      names.push(name);
    }
  }

  const documentsByCommittee = names.map((name) => {
    const key = normalizeCommitteeReportName(name);
    const apiIndex = normalizedIndexes.get(key);
    const defaultIndex = defaults.committees.findIndex(
      (defaultName) => normalizeCommitteeReportName(defaultName) === key
    );
    const apiDocuments = apiData.documentsByCommittee[apiIndex] || {};
    const defaultDocuments =
      defaultIndex >= 0 ? defaults.documentsByCommittee[defaultIndex] || {} : {};
    const mergeByYear = (category) => {
      const byYear = {};
      const yearSet = new Set([
        ...Object.keys(defaultDocuments[category] || {}),
        ...Object.keys(apiDocuments[category] || {}),
      ]);
      for (const year of yearSet) {
        byYear[year] = mergeDocumentLists(
          apiDocuments[category]?.[year],
          defaultDocuments[category]?.[year]
        );
      }
      return byYear;
    };
    return { agendas: mergeByYear("agendas"), reports: mergeByYear("reports") };
  });

  return { committees: names, documentsByCommittee };
}

/**
 * Определить номер созыва по объекту созыва из API (number или name).
 */
export function getConvocationNumber(convocation) {
  if (!convocation) return null;
  const n = convocation?.number;
  if (n !== undefined && n !== null) {
    const num = Number(n);
    if (num === 3 || num === 4) return num;
  }
  const name = String(convocation.name || convocation?.title || "").toLowerCase();
  if (
    (name.includes("3") && name.includes("созыв")) ||
    name.includes("трет") ||
    name.includes("iii")
  ) return 3;
  if (
    (name.includes("4") && name.includes("созыв")) ||
    name.includes("четвер") ||
    name.includes("iv")
  ) return 4;
  return null;
}

/**
 * Преобразовать документ из API (id, title, url?, fileId?) в формат для публичной страницы { title, url }.
 * url строится из doc.url или из /files/v2/{fileId} (вызывающий код подставит base URL).
 */
export function docToPublic(doc, fileUrlFromId) {
  const url = doc.url || (doc.fileId && fileUrlFromId ? fileUrlFromId(doc.fileId) : null);
  return { title: doc.title || "Документ", ...(url && { url }) };
}

/**
 * Из API committeeReports получить для комитета с индексом i данные в формате
 * { agendas: { [year]: [{ title, url }] }, reports: { [year]: [...] } }.
 * fileUrlFromId(id) — функция, возвращающая полный URL файла по fileId (например через normalizeFilesUrl).
 */
export function getCommitteeReportsFromApiData(committeeReports, committeeIndex, years, fileUrlFromId) {
  if (!committeeReports?.documentsByCommittee?.[committeeIndex] || !fileUrlFromId) {
    return null;
  }
  const block = committeeReports.documentsByCommittee[committeeIndex];
  const agendas = {};
  const reports = {};
  years.forEach((y) => {
    agendas[y] = (block.agendas?.[y] || []).map((d) => docToPublic(d, fileUrlFromId)).filter((d) => d.url);
    reports[y] = (block.reports?.[y] || []).map((d) => docToPublic(d, fileUrlFromId)).filter((d) => d.url);
  });
  return { agendas, reports };
}
