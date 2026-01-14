export function normalizeFilesUrl(src) {
  const s = String(src || "").trim();
  if (!s) return "";
  // keep already-absolute urls intact
  if (/^https?:\/\//i.test(s) || s.startsWith("//") || /^(data|blob):/i.test(s)) return s;

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
    return s.startsWith("/") ? `${filesBase}${s}` : `${filesBase}/${s}`;
  }

  return s;
}


