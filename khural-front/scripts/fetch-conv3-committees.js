/**
 * Сбор документов (повестки/отчёты) по годам для комитетов 3 созыва (индексы 1–7).
 * Комитет 0 уже заполнен в committeeReportsConv3.js.
 * Запуск: node scripts/fetch-conv3-committees.js
 * Результат выводится в stdout (JSON). Сохранить в файл и вручную перенести в CONV3_DOCUMENTS_BY_COMMITTEE.
 */
import * as cheerio from "cheerio";

const BASE = "https://khural.rtyva.ru";

function normalizeUrl(href) {
  if (!href || typeof href !== "string") return "";
  const s = href.trim();
  if (!s) return "";
  if (s.startsWith("//")) return "https:" + s;
  if (s.startsWith("/")) return BASE + s;
  if (/^https?:\/\//i.test(s)) return s;
  return BASE + "/" + s.replace(/^\/+/, "");
}

function isDocLink(href) {
  if (!href) return false;
  return /\.(pdf|doc|docx)$/i.test(href) || /\/upload\/iblock\//i.test(href);
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
}

/**
 * Из страницы activity/ID извлекаем ссылки на документы: { title, url }.
 * Title берём из текста ссылки или из <b> внутри <a>, иначе из имени файла.
 */
function parseDocLinksFromPage(html) {
  const $ = cheerio.load(html);
  const docs = [];
  const seen = new Set();
  $('a[href*="/upload/iblock/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href || !isDocLink(href)) return;
    const fullUrl = normalizeUrl(href);
    const key = fullUrl.split("?")[0];
    if (seen.has(key)) return;
    seen.add(key);
    let title = $(el).find("b").length ? $(el).find("b").first().text().trim() : $(el).text().trim();
    title = title.replace(/\s+/g, " ").trim();
    if (!title) title = decodeURIComponent(fullUrl.split("/").pop() || "Документ");
    docs.push({ title, url: fullUrl });
  });
  return docs;
}

/**
 * Со страницы раздела (Повестки/Отчеты) получаем год -> id подстраницы.
 * Формат: ссылки вида /activity/ID/">YYYY год
 */
async function getYearIds(sectionId) {
  const html = await fetchHtml(`${BASE}/activity/${sectionId}/`);
  const $ = cheerio.load(html);
  const map = {};
  $('a[href^="/activity/"]').each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    const m = href.match(/\/activity\/(\d+)\//) && text.match(/(\d{4})\s*год/);
    if (m) map[parseInt(m[1], 10)] = parseInt(href.match(/\/activity\/(\d+)\//)[1], 10);
  });
  return map;
}

/** Комитет 1–7: section IDs для Повестки и Отчеты (с сайта activity/314, 319, ...) */
const COMMITTEE_SECTIONS = [
  null,
  { agendas: 328, reports: 348 },
  { agendas: 379, reports: 386 },
  { agendas: 352, reports: 343 },
  { agendas: 371, reports: 356 },
  { agendas: 333, reports: 339 },
  { agendas: 377, reports: 395 },
  { agendas: 323, reports: 322 },
];

/** Год -> id страницы (заполнено по выводу get_years с сайта). Для 322 отчёты — без подстраниц. */
const YEAR_IDS = {
  1: { 328: { 2022: 331, 2021: 332, 2020: 330, 2019: 329 }, 348: { 2021: 351, 2020: 350, 2019: 349 } },
  2: { 379: { 2019: 383, 2020: 384, 2021: 385, 2022: 399 }, 386: { 2019: 387, 2020: 388, 2021: 389, 2022: 390 } },
  3: { 352: { 2022: 353 }, 343: { 2022: 347, 2021: 346, 2020: 345, 2019: 344 } },
  4: { 371: { 2023: 414, 2022: 375, 2021: 374, 2020: 373, 2019: 372 }, 356: { 2021: 361, 2022: 394, 2023: 421, 2020: 358, 2019: 357 } },
  5: { 333: { 2024: 440, 2023: 416, 2022: 337, 2021: 336, 2020: 335, 2019: 334 }, 339: { 2023: 422, 2022: 398, 2021: 342, 2020: 341, 2019: 340 } },
  6: { 377: { 2022: 378 }, 395: { 2022: 396 } },
  7: { 323: { 2022: 327, 2021: 326, 2020: 325, 2019: 324, 2023: 423 }, 322: null },
};

const YEARS = [2019, 2020, 2021, 2022, 2023];

async function fetchDocsForSection(sectionId, yearToPageId) {
  const agendas = {};
  const reports = {};
  YEARS.forEach((y) => {
    agendas[y] = [];
    reports[y] = [];
  });
  if (yearToPageId) {
    for (const [year, pageId] of Object.entries(yearToPageId)) {
      const y = parseInt(year, 10);
      if (!YEARS.includes(y)) continue;
      const html = await fetchHtml(`${BASE}/activity/${pageId}/`);
      const docs = parseDocLinksFromPage(html);
      agendas[y] = docs;
    }
  }
  return { agendas, reports };
}

async function fetchDocsForReportsSection(sectionId, yearToPageId) {
  const reports = {};
  YEARS.forEach((y) => { reports[y] = []; });
  if (yearToPageId) {
    for (const [year, pageId] of Object.entries(yearToPageId)) {
      const y = parseInt(year, 10);
      if (!YEARS.includes(y)) continue;
      const html = await fetchHtml(`${BASE}/activity/${pageId}/`);
      const docs = parseDocLinksFromPage(html);
      reports[y] = docs;
    }
  }
  return reports;
}

/** Для 322: на странице сразу список документов, без подстраниц по годам. Распределяем по году из названия. */
function assignDocsToYears(docs) {
  const reports = { 2019: [], 2020: [], 2021: [], 2022: [], 2023: [] };
  for (const d of docs) {
    const m = d.title.match(/(\d{4})/g) || d.url.match(/(\d{4})/g);
    const year = m ? parseInt(m[m.length - 1], 10) : null;
    if (year && reports[year] !== undefined) reports[year].push(d);
    else reports[2021].push(d);
  }
  return reports;
}

async function main() {
  const out = [];
  for (let c = 1; c <= 7; c++) {
    const sec = COMMITTEE_SECTIONS[c];
    if (!sec) continue;
    const yids = YEAR_IDS[c];
    const agendasByYear = {};
    const reportsByYear = {};
    YEARS.forEach((y) => {
      agendasByYear[y] = [];
      reportsByYear[y] = [];
    });

    const agSection = sec.agendas;
    const repSection = sec.reports;
    const agYearIds = yids[agSection];
    const repYearIds = yids[repSection];

    console.error(`Committee ${c}: agendas=${agSection}, reports=${repSection}`);

    if (agYearIds) {
      for (const [year, pageId] of Object.entries(agYearIds)) {
        const y = parseInt(year, 10);
        if (!YEARS.includes(y)) continue;
        const html = await fetchHtml(`${BASE}/activity/${pageId}/`);
        agendasByYear[y] = parseDocLinksFromPage(html);
        console.error(`  agendas ${y}: ${agendasByYear[y].length} docs`);
      }
    }

    if (repSection === 322) {
      const html = await fetchHtml(`${BASE}/activity/322/`);
      const docs = parseDocLinksFromPage(html);
      const byYear = assignDocsToYears(docs);
      YEARS.forEach((y) => { reportsByYear[y] = byYear[y] || []; });
      console.error(`  reports (322 direct): ${docs.length} docs total`);
    } else if (repYearIds) {
      for (const [year, pageId] of Object.entries(repYearIds)) {
        const y = parseInt(year, 10);
        if (!YEARS.includes(y)) continue;
        const html = await fetchHtml(`${BASE}/activity/${pageId}/`);
        reportsByYear[y] = parseDocLinksFromPage(html);
        console.error(`  reports ${y}: ${reportsByYear[y].length} docs`);
      }
    }

    out.push({ agendas: agendasByYear, reports: reportsByYear });
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
