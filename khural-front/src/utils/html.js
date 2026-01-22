export function decodeHtmlEntities(input) {
  const s = String(input || "");
  if (!s) return "";
  if (!s.includes("&lt;") && !s.includes("&gt;") && !s.includes("&amp;")) return s;
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  }
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Удаляет HTML теги из текста, оставляя только чистый текст
 */
export function stripHtmlTags(input) {
  const s = String(input || "");
  if (!s) return "";
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = s;
    return el.textContent || el.innerText || "";
  }
  // Fallback для серверной стороны
  return s.replace(/<[^>]*>/g, "").trim();
}


