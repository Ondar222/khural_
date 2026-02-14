/**
 * Читает /tmp/conv3_committees_1_7.json и выводит JS-код для CONV3_DOCUMENTS_BY_COMMITTEE (индексы 1–7).
 * Комитет 0 остаётся в CONV3_DOCUMENTS. URL кодируются для использования в ссылках.
 */
import fs from "fs";

const DOC_BASE = "https://khural.rtyva.ru";

function encodeDocUrl(url) {
  if (!url || !url.startsWith(DOC_BASE)) return url;
  const path = url.slice(DOC_BASE.length);
  return DOC_BASE + path.split("/").map((s) => encodeURIComponent(s)).join("/").replace(/%2F/g, "/");
}

const raw = fs.readFileSync("/tmp/conv3_committees_1_7.json", "utf8");
const data = JSON.parse(raw);

const years = [2019, 2020, 2021, 2022, 2023];

function formatDoc(d) {
  const url = encodeDocUrl(d.url);
  return `      { title: ${JSON.stringify(d.title)}, url: ${JSON.stringify(url)} }`;
}

function formatYearArr(arr) {
  if (!arr || arr.length === 0) return "[]";
  return "[\n" + arr.map((d) => formatDoc(d)).join(",\n") + "\n    ]";
}

const out = [];
for (let c = 0; c < data.length; c++) {
  const block = data[c];
  const agendas = {};
  const reports = {};
  years.forEach((y) => {
    agendas[y] = formatYearArr(block.agendas[String(y)]);
    reports[y] = formatYearArr(block.reports[String(y)]);
  });
  out.push(`
  // Committee ${c + 1}
  {
    agendas: {
      ${years.map((y) => `${y}: ${agendas[y]}`).join(",\n      ")},
    },
    reports: {
      ${years.map((y) => `${y}: ${reports[y]}`).join(",\n      ")},
    },
  },`);
}

console.log("// CONV3_DOCUMENTS_BY_COMMITTEE indices 1–7 (committee 0 uses CONV3_DOCUMENTS)");
console.log("const CONV3_DOCUMENTS_BY_COMMITTEE_1_7 = [" + out.join("") + "\n];");
console.log("export { CONV3_DOCUMENTS_BY_COMMITTEE_1_7 };");
