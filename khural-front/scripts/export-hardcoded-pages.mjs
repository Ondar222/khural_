#!/usr/bin/env node
/**
 * Выгружает захардкоженный контент страниц в JSON для импорта в бэкенд.
 * Источники: константы PageBySlug.jsx и модули src/content/*.js.
 *
 *_usage: node scripts/export-hardcoded-pages.mjs [output.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "@babel/parser";
import * as forMedia from "../src/content/forMedia.js";
import * as corruption from "../src/content/corruption.js";
import * as personnel from "../src/content/personnel.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const output = process.argv[2]
  ? join(process.cwd(), process.argv[2])
  : join(root, "hardcoded-pages.json");

const source = readFileSync(join(root, "src/pages/PageBySlug.jsx"), "utf8");
const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
const constants = new Map();
// Идентификаторы из импортируемых модулей контента тоже могут встречаться
// в выражениях PageBySlug.jsx (например, INFO_CORRUPTION_SLUG).
for (const module of [forMedia, corruption, personnel]) {
  for (const [name, value] of Object.entries(module)) {
    if (typeof value === "string") constants.set(name, value);
  }
}

function evaluate(node) {
  if (!node) return "";
  if (node.type === "StringLiteral" || node.type === "NumericLiteral") {
    return String(node.value);
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis
      .map(
        (quasi, index) =>
          (quasi.value.cooked ?? "") +
          (index < node.expressions.length
            ? String(evaluate(node.expressions[index]))
            : ""),
      )
      .join("");
  }
  if (node.type === "Identifier") return constants.get(node.name) ?? "";
  if (node.type === "BinaryExpression" && node.operator === "+") {
    return String(evaluate(node.left)) + String(evaluate(node.right));
  }
  if (node.type === "TSAsExpression") return evaluate(node.expression);
  return "";
}

for (const statement of ast.program.body) {
  const declarationList =
    statement.type === "VariableDeclaration"
      ? statement.declarations
      : statement.type === "ExportNamedDeclaration" &&
          statement.declaration?.type === "VariableDeclaration"
        ? statement.declaration.declarations
        : [];
  for (const declaration of declarationList) {
    if (declaration.id.type !== "Identifier") continue;
    constants.set(declaration.id.name, evaluate(declaration.init));
  }
}

const groups = new Map();
function addPage(slug, title, html, htmlTyv = "") {
  if (!slug || !title || !html) return;
  const key = String(slug).replace(/^\/+|\/+$/g, "");
  const existing = groups.get(key);
  if (existing?.htmlRu && existing.htmlRu.length >= html.length) return;
  groups.set(key, {
    slug: key,
    titleRu: String(title),
    titleTyv: String(title),
    htmlRu: String(html),
    htmlTyv: String(htmlTyv || ""),
  });
}

for (const [name, value] of constants) {
  const match = name.match(/^(.*)_(SLUG|TITLE|HTML)$/);
  if (!match) continue;
  const key = match[1];
  if (!groups.has(key)) groups.set(key, {});
  const field = match[2].toLowerCase();
  groups.get(key)[field] = value;
}

// Константы из PageBySlug, у которых есть и slug, и title, и html.
for (const [key, group] of groups) {
  addPage(group.slug || key, group.title, group.html, group.htmltyv);
}

addPage(forMedia.FOR_MEDIA_SLUG, forMedia.FOR_MEDIA_TITLE, forMedia.FOR_MEDIA_HTML);

const rootPersonnel = personnel.getPersonnelPage(personnel.PERSONNEL_SLUGS[0]);
if (rootPersonnel) addPage(personnel.PERSONNEL_SLUGS[0], rootPersonnel.title, rootPersonnel.html);
for (const section of personnel.PERSONNEL_SECTIONS) {
  addPage(section.slug, section.title, section.html);
}

for (const slug of corruption.CORRUPTION_LOCAL_PAGE_SLUGS) {
  const page = corruption.getCorruptionLocalPage(slug);
  if (page) addPage(slug, page.title, page.html);
}

// В двух «кодексах» тувинский текст уже лежит внутри одной HTML-константы.
for (const page of groups.values()) {
  if (page.htmlTyv || !/Тыва дылда \(на тувинском\)/i.test(page.htmlRu)) continue;
  const marker = page.htmlRu.indexOf("<hr");
  if (marker > 0) {
    page.htmlTyv = page.htmlRu.slice(marker).replace(/^<hr\s*\/?>/i, "");
  }
}

const pages = [...groups.values()]
  .filter((page) => page.slug && page.titleRu && page.htmlRu)
  .sort((a, b) => a.slug.localeCompare(b.slug, "ru"));

writeFileSync(output, JSON.stringify(pages, null, 2), "utf8");
console.log(
  `[export-hardcoded-pages] Выгружено страниц: ${pages.length} -> ${output}`,
);
