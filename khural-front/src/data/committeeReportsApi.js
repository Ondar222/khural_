import { CommitteesApi } from "../api/client.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

function extractYears(payload) {
  const data = payload?.data ?? payload;
  const rawYears = Array.isArray(data)
    ? data
    : Array.isArray(data?.years)
      ? data.years
      : Array.isArray(data?.items)
        ? data.items
        : Object.keys(data || {}).filter((key) => /^\d{4}$/.test(key));
  return [...new Set(rawYears.map((value) => {
    const raw = typeof value === "object" && value !== null
      ? value.year ?? value.value
      : value;
    const year = Number(raw);
    return Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : null;
  }).filter(Boolean))].sort((a, b) => b - a);
}

function extractDocuments(payload, category) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const candidate =
    data[category] ??
    data.items ??
    data.documents ??
    data.files ??
    data.report ??
    data.agenda;
  if (Array.isArray(candidate)) return candidate;
  if (candidate && typeof candidate === "object") return [candidate];
  if (data.id != null || data.fileId || data.url || data.fileUrl) return [data];
  return [];
}

function normalizeDocument(doc, year, index, category) {
  const fileId = doc?.fileId ?? doc?.file?.id ?? doc?.pdfFile?.id;
  const rawUrl =
    doc?.url ??
    doc?.fileUrl ??
    doc?.downloadUrl ??
    doc?.fileLink ??
    doc?.file?.url ??
    doc?.pdfFile?.url ??
    (fileId ? `/files/v2/${fileId}` : "");
  const url = rawUrl ? normalizeFilesUrl(rawUrl) : "";
  const title =
    doc?.title ??
    doc?.name ??
    doc?.fileName ??
    doc?.filename ??
    `${category === "reports" ? "Отчёт" : "Повестка"} за ${year} год`;
  return {
    id: String(doc?.id ?? doc?.reportId ?? doc?.agendaId ?? `${year}-${index}-${title}`),
    title: String(title),
    date: String(doc?.year ?? doc?.date ?? year),
    fileId: fileId == null ? "" : String(fileId),
    url,
    fileLink: url,
    category: category === "reports" ? "report" : "agenda",
  };
}

export async function loadCommitteeApiDocuments(committeeId, convocationId) {
  const id = Number(committeeId);
  const convId = Number(convocationId);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(convId) || convId <= 0) {
    return { reports: [], agendas: [], years: [] };
  }

  const [reportYearsPayload, agendaYearsPayload] = await Promise.all([
    CommitteesApi.getReportYears(id, convId),
    CommitteesApi.getAgendaYears(id, convId),
  ]);
  const reportYears = extractYears(reportYearsPayload);
  const agendaYears = extractYears(agendaYearsPayload);
  const yearsByCategory = {
    reports: reportYears,
    agendas: agendaYears,
  };
  const documents = { reports: [], agendas: [] };
  await Promise.all(
    Object.entries(yearsByCategory).flatMap(([category, years]) =>
      years.map(async (year) => {
        const payload = category === "reports"
          ? await CommitteesApi.getReport(id, convId, year)
          : await CommitteesApi.getAgenda(id, convId, year);
        documents[category].push(
          ...extractDocuments(payload, category)
            .map((doc, index) => normalizeDocument(doc, year, index, category))
        );
      })
    )
  );
  return {
    ...documents,
    years: [...new Set([...reportYears, ...agendaYears])].sort((a, b) => b - a),
  };
}
