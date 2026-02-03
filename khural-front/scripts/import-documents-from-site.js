/**
 * Импорт документов: с сайта khural.rtyva.ru или из локальных persons_doc (zakony + postamovleniya).
 * Запуск: npm run import-documents
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "public", "persons_doc");
const BASE = "https://khural.rtyva.ru";

const SOURCE_URLS = [
  { url: "https://khural.rtyva.ru/", category: "Сайт ВХ РТ" },
  { url: "https://khural.rtyva.ru/docs/resolutions/", category: "Постановления" },
  { url: "https://khural.rtyva.ru/docs/legislative-proposal/", category: "Законодательные инициативы" },
  { url: "https://khural.rtyva.ru/docs/konstitusia-rf/", category: "Конституция РФ" },
  { url: "https://khural.rtyva.ru/docs/bills/", category: "Законопроекты" },
];

function normalizeDocUrl(href) {
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

function extractDocsFromHtml(html, baseUrl, category) {
  const $ = cheerio.load(html);
  const docs = [];
  const seen = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!isDocLink(href)) return;
    const fullUrl = normalizeDocUrl(href);
    if (seen.has(fullUrl)) return;
    seen.add(fullUrl);
    let title = $(el).text().trim();
    if (!title) title = $(el).closest("tr").find("td").first().text().trim() || fullUrl.split("/").pop() || "Документ";
    if (!title) title = "Документ";
    docs.push({
      id: `imported-${docs.length}-${Date.now()}`,
      title: title.replace(/\s+/g, " ").trim(),
      url: fullUrl,
      category,
      date: "",
      number: "",
    });
  });

  $("tr").each((_, row) => {
    const $row = $(row);
    $row.find('a[href*=".pdf"], a[href*="/upload/"]').each((_, a) => {
      const href = $(a).attr("href");
      if (!isDocLink(href)) return;
      const fullUrl = normalizeDocUrl(href);
      if (seen.has(fullUrl)) return;
      seen.add(fullUrl);
      let title = $(a).text().trim();
      if (!title) {
        const cells = $row.find("td");
        title = cells.eq(0).text().trim() || cells.eq(1).text().trim() || fullUrl.split("/").pop() || "Документ";
      }
      docs.push({
        id: `imported-${docs.length}-${Date.now()}`,
        title: title.replace(/\s+/g, " ").trim(),
        url: fullUrl,
        category,
        date: "",
        number: "",
      });
    });
  });

  return docs;
}

/** Если с сайта 0 документов — заполняем из локальных zakony.json и postamovleniya_VH.json */
function fallbackFromLocalJson() {
  const docs = [];
  const read = (name) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(outDir, name), "utf8"));
    } catch {
      return [];
    }
  };
  const zakony = read("zakony.json");
  const zakony2 = read("zakony2.json");
  const post = read("postamovleniya_VH.json");
  const add = (row, urlKey, category, type) => {
    const fileUrl = String(row?.[urlKey] || "").trim();
    if (!fileUrl || !row?.IE_NAME) return;
    const url = fileUrl.startsWith("http") ? fileUrl : BASE + (fileUrl.startsWith("/") ? fileUrl : "/" + fileUrl);
    docs.push({
      id: `imported-${type}-${row.IE_ID ?? row.IE_XML_ID ?? docs.length}`,
      title: String(row.IE_NAME || "").trim(),
      url,
      category,
      date: type === "laws" ? String(row.IP_PROP27 || "").trim() : String(row.IP_PROP58 || "").trim(),
      number: type === "laws" ? String(row.IP_PROP26 || "").trim() : String(row.IP_PROP57 || "").trim(),
    });
  };
  (Array.isArray(zakony) ? zakony : []).forEach((r) => add(r, "IP_PROP28", "Законы Республики Тыва", "laws"));
  (Array.isArray(zakony2) ? zakony2 : []).forEach((r) => add(r, "IP_PROP28", "Законы Республики Тыва", "laws"));
  (Array.isArray(post) ? post : []).forEach((r) => add(r, "IP_PROP59", "Постановления ВХ РТ", "resolutions"));
  return docs;
}

async function main() {
  const allDocs = [];
  let fetchFailed = false;
  for (const { url, category } of SOURCE_URLS) {
    try {
      console.log("Fetching:", url);
      const html = await fetchHtml(url);
      const docs = extractDocsFromHtml(html, url, category);
      console.log(`  → ${docs.length} документов`);
      allDocs.push(...docs);
    } catch (e) {
      fetchFailed = true;
      console.error("  Ошибка:", e.message);
      if (e.cause) console.error("  Причина:", e.cause.message || e.cause);
    }
  }

  let unique = [];
  if (allDocs.length > 0) {
    const byUrl = new Map();
    for (const d of allDocs) {
      const u = d.url.split("?")[0].trim();
      if (!byUrl.has(u)) byUrl.set(u, d);
    }
    unique = Array.from(byUrl.values());
  }

  if (unique.length === 0) {
    console.log("\nС сайта документов не получено (доступ закрыт или страницы без прямых ссылок на PDF).");
    console.log("Используем локальные данные: zakony.json + postamovleniya_VH.json");
    unique = fallbackFromLocalJson();
    console.log("Добавлено из локальных файлов:", unique.length, "документов");
  }

  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "imported_documents.json");
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2), "utf8");
  console.log("\nЗаписано:", outPath, "—", unique.length, "документов");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
