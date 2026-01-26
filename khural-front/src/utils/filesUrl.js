const KHURAL_UPLOAD_BASE = "https://khural.rtyva.ru";

const encodeUrlSafe = (value) => {
  try {
    const raw = String(value || "");
    // Collapse a single layer of percent-encoding (e.g. %2520 -> %20)
    const deDoubled = raw.replace(/%25([0-9A-Fa-f]{2})/g, "%$1");
    return encodeURI(deDoubled);
  } catch {
    return String(value || "");
  }
};

export function normalizeFilesUrl(src) {
  const s = String(src || "").trim();
  if (!s || s === "undefined" || s === "null") return "";
  
  // Если уже полный URL, проверяем, не является ли он путем через другой домен для /upload/
  if (/^https?:\/\//i.test(s) || s.startsWith("//")) {
    // Если это URL содержит /upload/iblock/, преобразуем в khural.rtyva.ru
    if (s.includes("/upload/iblock/") || s.includes("/upload/")) {
      try {
        const url = new URL(s);
        if (url.pathname.startsWith("/upload/")) {
          return encodeUrlSafe(`${KHURAL_UPLOAD_BASE}${url.pathname}${url.search}${url.hash}`);
        }
      } catch {
        // Если не удалось распарсить, извлекаем путь вручную
        const uploadMatch = s.match(/(\/upload\/[^\s"']*)/i);
        if (uploadMatch) {
          return encodeUrlSafe(`${KHURAL_UPLOAD_BASE}${uploadMatch[1]}`);
        }
      }
    }
    return encodeUrlSafe(s);
  }
  
  if (/^(data|blob):/i.test(s)) return s;

  // /upload/iblock/... — фото с khural.rtyva.ru (депутаты и т.д.)
  if (s.startsWith("/upload/") || s.startsWith("upload/")) {
    const path = s.startsWith("/") ? s : `/${s}`;
    return encodeUrlSafe(`${KHURAL_UPLOAD_BASE}${path}`);
  }
  
  // Если путь содержит /upload/iblock/ где-то внутри, извлекаем его
  const uploadMatch = s.match(/(\/upload\/iblock\/[^\s"']*)/i);
  if (uploadMatch) {
    return encodeUrlSafe(`${KHURAL_UPLOAD_BASE}${uploadMatch[1]}`);
  }

  const filesBase = String(import.meta?.env?.VITE_FILES_BASE_URL || "https://someshit.yurta.site")
    .trim()
    .replace(/\/+$/, "");

  const isFileLike =
    s.startsWith("/files") ||
    s.startsWith("files/") ||
    s.startsWith("/uploads") ||
    s.startsWith("uploads/") ||
    s.startsWith("/media") ||
    s.startsWith("media/");

  if (isFileLike) {
    return encodeUrlSafe(s.startsWith("/") ? `${filesBase}${s}` : `${filesBase}/${s}`);
  }

  return encodeUrlSafe(s);
}


