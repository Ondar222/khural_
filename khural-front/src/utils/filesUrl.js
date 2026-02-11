const KHURAL_UPLOAD_BASE = "https://khural.rtyva.ru";

/**
 * Оставляем только путь к файлу: /upload/iblock/.../имя.расширение — без query, hash и символов после .pdf (и т.д.).
 */
function onlyUploadPathToFile(str) {
  const s = String(str || "").trim();
  if (!s) return "";
  const noHash = s.replace(/#.*$/, "").trim();
  const noQuery = noHash.replace(/\?.*$/, "").trim();
  const m = noQuery.match(/\/upload\/iblock\/[^#?]*?\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|rtf|txt)/i);
  return m ? m[0] : noQuery;
}

/** Убираем двойные слэши в пути: //upload -> /upload, путь всегда с одним ведущим /. */
function normalizePathSlashes(path) {
  const p = String(path || "").trim().replace(/\/+/g, "/");
  return p.startsWith("/") ? p : `/${p}`;
}

/** Весь путь по сегментам доводим до «сырой» строки (убираем любое кол-во слоёв %-кодирования). */
function fullyDecodePath(path) {
  return String(path || "")
    .split("/")
    .map((seg) => (seg === "" ? "" : fullyDecodeSegment(seg)))
    .join("/");
}

/** Ссылка = только https://khural.rtyva.ru + путь /upload/.../файл.pdf (путь декодирован в «сырой» вид, без %). */
function buildUploadUrl(pathOnly) {
  const path = normalizePathSlashes(onlyUploadPathToFile(pathOnly));
  const pathRaw = fullyDecodePath(path);
  const base = KHURAL_UPLOAD_BASE.replace(/\/+$/, "");
  return base + pathRaw;
}

/** Декодируем до «сырой» строки (убираем любое количество слоёв percent-encoding). */
function fullyDecodeSegment(segment) {
  let decoded = String(segment || "");
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

const encodeSegment = (segment) => {
  const raw = String(segment || "");
  try {
    const decoded = fullyDecodeSegment(raw);
    return encodeURIComponent(decoded);
  } catch {
    return encodeURIComponent(raw);
  }
};

const encodePathname = (pathname) =>
  String(pathname || "")
    .split("/")
    .map((seg) => (seg === "" ? "" : encodeSegment(seg)))
    .join("/");

/** Убираем все слои %25 (двойное/тройное кодирование), пока не останется один уровень %. */
const decodeMultiEncoded = (raw) => {
  let current = String(raw || "");
  for (let i = 0; i < 15; i += 1) {
    const next = current.replace(/%25([0-9A-Fa-f]{2})/g, "%$1");
    if (next === current) break;
    current = next;
  }
  return current;
};

/** Для upload-ссылок: только https://khural.rtyva.ru + сырой путь /upload/.../файл.pdf (без %). Работает и для полного URL, и для пути. */
function ensureNoDoubleEncodingInUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return urlStr;
  const pathPart = urlStr.replace(/^https?:\/\/[^/]+/i, "").trim() || urlStr;
  if (!pathPart.startsWith("/upload/")) return urlStr;
  const decoded = decodeMultiEncoded(pathPart);
  const pathRaw = normalizePathSlashes(fullyDecodePath(onlyUploadPathToFile(decoded) || decoded));
  const base = KHURAL_UPLOAD_BASE.replace(/\/+$/, "");
  return base + pathRaw;
}

const encodeUrlSafe = (value) => {
  try {
    const raw = String(value || "");
    // Убираем двойное кодирование (%25XX -> %XX), чтобы не получить %25 в итоге
    const deDoubled = decodeMultiEncoded(raw);
    if (/^(data|blob):/i.test(deDoubled)) return deDoubled;

    try {
      const url = new URL(deDoubled);
      const encodedPath = encodePathname(url.pathname);
      return `${url.origin}${encodedPath}${url.search}${url.hash}`;
    } catch {
      // new URL() может выбросить при пробелах/кириллице в пути — кодируем только path
    }

    let base = deDoubled;
    let hash = "";
    let search = "";
    const hashIndex = base.indexOf("#");
    if (hashIndex >= 0) {
      hash = base.slice(hashIndex);
      base = base.slice(0, hashIndex);
    }
    const searchIndex = base.indexOf("?");
    if (searchIndex >= 0) {
      search = base.slice(searchIndex);
      base = base.slice(0, searchIndex);
    }

    // Если это полный URL (https?://...), кодируем только pathname, иначе сломаем ссылку
    const fullUrlMatch = base.match(/^(https?:\/\/[^/]+)(\/.*)?$/i);
    if (fullUrlMatch) {
      const origin = fullUrlMatch[1];
      const pathPart = normalizePathSlashes(fullUrlMatch[2] || "/");
      return `${origin}${encodePathname(pathPart)}${search}${hash}`;
    }

    return `${encodePathname(base)}${search}${hash}`;
  } catch {
    return String(value || "");
  }
};

export function normalizeFilesUrl(src) {
  const s = String(src || "").trim();
  if (!s || s === "undefined" || s === "null") return "";

  // Если в строке есть %25 и путь /upload/ — сразу возвращаем только base + сырой путь (такие ссылки не открываются)
  if (s.includes("%25") && s.includes("/upload/")) {
    return ensureNoDoubleEncodingInUrl(s);
  }

  const sClean = onlyUploadPathToFile(s) || s;
  let out = "";

  // Если уже полный URL, проверяем, не является ли он путем через другой домен для /upload/
  if (/^https?:\/\//i.test(sClean) || sClean.startsWith("//")) {
    if (sClean.includes("/upload/iblock/") || sClean.includes("/upload/")) {
      const unDouble = decodeMultiEncoded(sClean);
      const pathOnly = onlyUploadPathToFile(unDouble) || unDouble.replace(/^https?:\/\/[^/]+/i, "") || unDouble;
      if (pathOnly && pathOnly.startsWith("/upload/")) {
        out = buildUploadUrl(pathOnly);
      } else {
        try {
          const url = new URL(unDouble);
          if (url.pathname.startsWith("/upload/")) {
            out = buildUploadUrl(onlyUploadPathToFile(url.pathname) || url.pathname);
          }
        } catch {
          const uploadMatch = unDouble.match(/(\/upload\/iblock\/[^#?]*?\.(?:pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|rtf|txt))/i);
          if (uploadMatch) out = buildUploadUrl(uploadMatch[1].trim());
        }
      }
    }
    if (!out) out = encodeUrlSafe(sClean);
  } else if (/^(data|blob):/i.test(sClean)) {
    return sClean;
  } else if (sClean.startsWith("/upload/") || sClean.startsWith("upload/")) {
    out = buildUploadUrl(sClean.startsWith("/") ? sClean : `/${sClean}`);
  } else {
    const uploadMatch = sClean.match(/(\/upload\/iblock\/[^#?]*?\.(?:pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|rtf|txt))/i);
    if (uploadMatch) {
      out = buildUploadUrl(uploadMatch[1].trim());
    } else {
      const filesBase = String(import.meta?.env?.VITE_FILES_BASE_URL || "https://someshit.yurta.site")
        .trim()
        .replace(/\/+$/, "");
      const isFileLike =
        sClean.startsWith("/files") || sClean.startsWith("files/") || sClean.startsWith("/uploads") ||
        sClean.startsWith("uploads/") || sClean.startsWith("/media") || sClean.startsWith("media/");
      out = isFileLike
        ? encodeUrlSafe(sClean.startsWith("/") ? `${filesBase}${sClean}` : `${filesBase}/${sClean}`)
        : encodeUrlSafe(sClean);
    }
  }

  return ensureNoDoubleEncodingInUrl(out || sClean);
}

const OFFICE_VIEWER_EXT = /\.(doc|docx|xls|xlsx|ppt|pptx|rtf)$/i;

/**
 * Для .doc/.docx и др. — ссылка на просмотр через Google Docs Viewer (корректная кодировка, без «кракозябр» в WPS).
 * Для остальных (в т.ч. PDF) — обычная ссылка на файл.
 */
export function getDocumentOpenUrl(fileUrl) {
  const url = String(fileUrl || "").trim();
  if (!url) return "";
  const normalized = normalizeFilesUrl(url);
  if (!normalized) return url;
  if (OFFICE_VIEWER_EXT.test(normalized)) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(normalized)}&embedded=true`;
  }
  return normalized;
}

/** true, если по URL лучше открывать в просмотрщике, а не скачивать (офисные форматы). */
export function shouldOpenInViewer(fileUrl) {
  return OFFICE_VIEWER_EXT.test(String(fileUrl || ""));
}
