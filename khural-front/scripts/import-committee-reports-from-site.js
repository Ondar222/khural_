/**
 * Импорт отчётов и повесток комитетов с сайта khural.rtyva.ru.
 * Источники:
 *   https://khural.rtyva.ru/struct/committees/
 *   https://khural.rtyva.ru/activity/445/  — Отчет о деятельности комитетов 4 созыва
 *   https://khural.rtyva.ru/activity/313/  — Отчеты о деятельности комитетов 3 созыва
 *   https://khural.rtyva.ru/activity/320/  — и т.д.
 * Запуск: npm run import-committee-reports
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "public", "data");
const BASE = "https://khural.rtyva.ru";

/** Страницы «Отчеты о деятельности комитетов N созыва» и структура комитетов */
const ACTIVITY_SOURCES = [
  { url: `${BASE}/struct/committees/`, label: "Комитеты (структура)", convocationNumber: null },
  { url: `${BASE}/activity/313/`, label: "Отчеты о деятельности комитетов 3 созыва", convocationNumber: 3 },
  { url: `${BASE}/activity/320/`, label: "Отчеты о деятельности комитетов (320)", convocationNumber: null },
  { url: `${BASE}/activity/445/`, label: "Отчет о деятельности комитетов 4 созыва", convocationNumber: 4 },
];

/** Заседания сессий — возможный источник повесток */
const SESSIONS_URL = `${BASE}/activity/sessions/`;

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
  return /\.(pdf|doc|docx|xls|xlsx)$/i.test(href) || /\/upload\/iblock\//i.test(href);
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
}

/**
 * Из страницы activity/XXX извлекаем:
 * - заголовок (для определения созыва, если не задан),
 * - список комитетов (маркированный список),
 * - ссылки на PDF/документы (отчёты, постановления).
 */
function parseActivityPage(html, pageUrl, convocationNumber) {
  const $ = cheerio.load(html);
  const committees = [];
  const documents = [];
  const seenUrls = new Set();

  const title = $("h1").first().text().trim() || $("title").text().trim();
  const convMatch = title.match(/(\d+)\s*созыв/i) || title.match(/([IVX]+)\s*созыв/i);
  const resolvedConv = convocationNumber ?? (convMatch ? (convMatch[1].match(/^\d+$/) ? parseInt(convMatch[1], 10) : convMatch[1]) : null);

  // Списки комитетов: ul li, .content ul li, или элементы с буллетами
  $(".content ul li, .content li, article ul li, main ul li").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length < 10) return;
    if (/^Комитет\s+по\s+/i.test(text) || /^Комитет\s+\./i.test(text) || text.includes("комитет")) {
      committees.push(text);
    }
  });

  // Если не нашли по "Комитет", берём все непустые li из основного контента
  if (committees.length === 0) {
    $(".content li, article li, main li").each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (text.length > 15 && !isDocLink($(el).find("a").attr("href"))) {
        committees.push(text);
      }
    });
  }

  // Документы: ссылки на PDF и /upload/
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!isDocLink(href)) return;
    const fullUrl = normalizeUrl(href);
    const urlKey = fullUrl.split("?")[0];
    if (seenUrls.has(urlKey)) return;
    seenUrls.add(urlKey);

    let title = $(el).text().trim().replace(/\s+/g, " ");
    if (!title) title = $(el).closest("tr").find("td").first().text().trim() || fullUrl.split("/").pop() || "Документ";
    if (!title) title = "Документ";

    const isAgenda = /повестк|заседан/i.test(title);
    documents.push({
      title,
      fileLink: fullUrl,
      category: isAgenda ? "agenda" : "report",
      date: "",
      size: $(el).text().match(/[\d,]+\s*[КМ]?Б/i)?.[0]?.trim() || null,
      convocationNumber: resolvedConv,
    });
  });

  return {
    pageUrl,
    title,
    convocationNumber: resolvedConv,
    committees: [...new Set(committees)],
    documents,
  };
}

/**
 * Парсинг страницы struct/committees — список комитетов и ссылки на отчёты/документы.
 */
function parseCommitteesStructPage(html, pageUrl) {
  const $ = cheerio.load(html);
  const committees = [];
  const documents = [];
  const seenUrls = new Set();

  $(".content a[href], article a[href], main a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (isDocLink(href)) {
      const fullUrl = normalizeUrl(href);
      const urlKey = fullUrl.split("?")[0];
      if (!seenUrls.has(urlKey)) {
        seenUrls.add(urlKey);
        const isAgenda = /повестк|заседан/i.test(text);
        documents.push({
          title: text || fullUrl.split("/").pop() || "Документ",
          fileLink: fullUrl,
          category: isAgenda ? "agenda" : "report",
          date: "",
          convocationNumber: null,
        });
      }
    } else if (text.length > 15 && (text.includes("Комитет") || text.includes("комитет"))) {
      committees.push(text);
    }
  });

  return {
    pageUrl,
    title: $("h1").first().text().trim() || "Комитеты",
    convocationNumber: null,
    committees: [...new Set(committees)],
    documents,
  };
}

/**
 * Парсинг страницы заседаний сессий — ссылки на повестки/протоколы.
 */
function parseSessionsPage(html, pageUrl) {
  const $ = cheerio.load(html);
  const documents = [];
  const seenUrls = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!isDocLink(href)) return;
    const fullUrl = normalizeUrl(href);
    const urlKey = fullUrl.split("?")[0];
    if (seenUrls.has(urlKey)) return;
    seenUrls.add(urlKey);
    const title = $(el).text().trim().replace(/\s+/g, " ") || fullUrl.split("/").pop() || "Документ";
    documents.push({
      title,
      fileLink: fullUrl,
      category: "agenda",
      date: "",
      source: "sessions",
      convocationNumber: null,
    });
  });

  return { pageUrl, title: "Заседания сессий", documents };
}

async function main() {
  const results = {
    meta: {
      source: "https://khural.rtyva.ru",
      fetchedAt: new Date().toISOString(),
      urls: {
        committees: `${BASE}/struct/committees/`,
        activity: ACTIVITY_SOURCES.filter((s) => s.convocationNumber != null).map((s) => s.url),
        sessions: SESSIONS_URL,
      },
    },
    pages: [],
    byConvocation: {},
    allDocuments: [],
  };

  for (const source of ACTIVITY_SOURCES) {
    try {
      console.log("Fetching:", source.url);
      const html = await fetchHtml(source.url);
      const isStruct = source.url.includes("/struct/committees");
      const parsed = isStruct
        ? parseCommitteesStructPage(html, source.url)
        : parseActivityPage(html, source.url, source.convocationNumber);
      results.pages.push(parsed);
      parsed.documents.forEach((d) => {
        results.allDocuments.push({ ...d, pageUrl: source.url });
        const conv = d.convocationNumber ?? "other";
        if (!results.byConvocation[conv]) results.byConvocation[conv] = [];
        results.byConvocation[conv].push(d);
      });
      console.log(`  → комитетов: ${parsed.committees.length}, документов: ${parsed.documents.length}`);
    } catch (e) {
      console.error("  Ошибка:", e.message);
      results.pages.push({
        pageUrl: source.url,
        error: e.message,
        title: source.label,
        committees: [],
        documents: [],
      });
    }
  }

  try {
    console.log("Fetching sessions (повестки):", SESSIONS_URL);
    const html = await fetchHtml(SESSIONS_URL);
    const parsed = parseSessionsPage(html, SESSIONS_URL);
    results.pages.push(parsed);
    parsed.documents.forEach((d) => {
      results.allDocuments.push({ ...d, pageUrl: SESSIONS_URL });
      if (!results.byConvocation.sessions) results.byConvocation.sessions = [];
      results.byConvocation.sessions.push(d);
    });
    console.log(`  → документов: ${parsed.documents.length}`);
  } catch (e) {
    console.error("  Ошибка:", e.message);
    results.pages.push({ pageUrl: SESSIONS_URL, error: e.message, documents: [] });
  }

  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "committee_reports_from_site.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log("\nЗаписано:", outPath);
  console.log("Всего документов (отчёты + повестки):", results.allDocuments.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
