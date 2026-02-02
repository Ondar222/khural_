#!/usr/bin/env node
/**
 * Копирует TinyMCE из node_modules в public/tinymce для self-hosted загрузки.
 * Это устраняет зависимость от Tiny Cloud CDN и проблему с отсутствием редактора
 * на других устройствах/доменах (проверка Referer в Tiny Cloud).
 */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "node_modules", "tinymce");
const dest = join(root, "public", "tinymce");

if (!existsSync(src)) {
  console.warn("[copy-tinymce] node_modules/tinymce не найден, пропуск.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[copy-tinymce] TinyMCE скопирован в public/tinymce");
