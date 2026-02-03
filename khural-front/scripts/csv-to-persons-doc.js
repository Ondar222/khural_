/**
 * Конвертирует CSV из persons_info/documents в JSON для persons_doc.
 * Заменяет текущие zakony.json, zakony2.json, postamovleniya_VH.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "public", "persons_info", "documents");
const outDir = path.join(root, "public", "persons_doc");

const NUMERIC_KEYS = ["IE_XML_ID", "IE_ID", "IE_SORT"];
const URL_KEYS = ["IP_PROP28", "IP_PROP59"];

/** Убираем все слои %25. */
function decodeMultiEncoded(str) {
  let s = String(str ?? "");
  for (let i = 0; i < 15; i++) {
    const next = s.replace(/%25([0-9A-Fa-f]{2})/gi, "%$1");
    if (next === s) break;
    s = next;
  }
  return s;
}

/** Декодируем сегмент пути до «сырой» строки (без %). */
function fullyDecodeSegment(seg) {
  let decoded = String(seg ?? "");
  for (let i = 0; i < 15; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return decoded;
      decoded = next;
    } catch {
      return decoded;
    }
  }
  return decoded;
}

/** Путь /upload/.../файл.pdf в сыром виде: только /upload до .pdf, полностью декодировано (без %). */
function toRawUploadPath(str) {
  const s = String(str ?? "").trim().replace(/#.*$/, "").replace(/\?.*$/, "").trim();
  const decoded = decodeMultiEncoded(s);
  const m = decoded.match(/\/upload\/iblock\/[^#?]*?\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|rtf|txt)/i);
  const pathOnly = m ? m[0] : decoded;
  return pathOnly
    .split("/")
    .map((seg) => (seg === "" ? "" : fullyDecodeSegment(seg)))
    .join("/");
}

function coerceRow(raw) {
  const row = {};
  for (const [k, v] of Object.entries(raw)) {
    let val = v == null ? "" : String(v).trim();
    if (URL_KEYS.includes(k)) val = toRawUploadPath(val) || val;
    if (NUMERIC_KEYS.includes(k)) {
      const n = Number(val);
      row[k] = Number.isFinite(n) ? n : (val || "");
    } else {
      row[k] = val;
    }
  }
  return row;
}

function csvToJson(csvPath) {
  const text = fs.readFileSync(csvPath, "utf8");
  const records = parse(text, {
    delimiter: ";",
    columns: true,
    relax_column_count: true,
    bom: true,
  });
  return records.map((r) => coerceRow(r));
}

fs.mkdirSync(outDir, { recursive: true });

// 1) Конвертируем zakony.csv → zakony.json
const zakonyPath = path.join(sourceDir, "zakony.csv");
const zakony = csvToJson(zakonyPath);
fs.writeFileSync(
  path.join(outDir, "zakony.json"),
  JSON.stringify(zakony, null, 2),
  "utf8"
);
console.log("Written persons_doc/zakony.json:", zakony.length, "rows");

// 2) zakony2 на сайте — пустой массив (в папке только один файл законов)
fs.writeFileSync(
  path.join(outDir, "zakony2.json"),
  "[]",
  "utf8"
);
console.log("Written persons_doc/zakony2.json: []");

// 3) Конвертируем postamovleniya_VH.csv → postamovleniya_VH.json
const postPath = path.join(sourceDir, "postamovleniya_VH.csv");
const postamovleniya = csvToJson(postPath);
fs.writeFileSync(
  path.join(outDir, "postamovleniya_VH.json"),
  JSON.stringify(postamovleniya, null, 2),
  "utf8"
);
console.log("Written persons_doc/postamovleniya_VH.json:", postamovleniya.length, "rows");

console.log("Done. Documents on site replaced with data from persons_info/documents/.");
