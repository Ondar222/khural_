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


