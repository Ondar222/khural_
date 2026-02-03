/**
 * Убирает двойное кодирование (%25 -> %) в полях URL документов (IP_PROP28, IP_PROP59)
 * в persons_doc/*.json, чтобы ссылки открывались.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "persons_doc");

const URL_KEYS = ["IP_PROP28", "IP_PROP59"];

function fixDoubleEncoding(str) {
  if (typeof str !== "string") return str;
  let s = str;
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/%25([0-9A-Fa-f]{2})/gi, "%$1");
    if (next === s) break;
    s = next;
  }
  return s;
}

function processFile(fileName) {
  const filePath = path.join(outDir, fileName);
  if (!fs.existsSync(filePath)) return 0;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(data)) return 0;
  let count = 0;
  for (const row of data) {
    for (const key of URL_KEYS) {
      if (row[key] && typeof row[key] === "string" && row[key].includes("%25")) {
        row[key] = fixDoubleEncoding(row[key]);
        count += 1;
      }
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return count;
}

const files = ["zakony.json", "zakony2.json", "postamovleniya_VH.json"];
let total = 0;
for (const f of files) {
  const n = processFile(f);
  if (n) {
    console.log(`${f}: исправлено ${n} URL`);
    total += n;
  }
}
console.log(total ? `Всего исправлено: ${total}` : "Двойное кодирование в URL не найдено.");
