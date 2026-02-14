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
  if (name.includes("3") && name.includes("созыв")) return 3;
  if (name.includes("4") && name.includes("созыв")) return 4;
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
