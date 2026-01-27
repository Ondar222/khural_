import React from "react";
import { API_BASE_URL, tryApiFetch, SliderApi, AboutApi, EventsApi, CommitteesApi } from "../api/client.js";
import {
  readNewsOverrides,
  NEWS_OVERRIDES_EVENT_NAME,
  NEWS_OVERRIDES_STORAGE_KEY,
} from "../utils/newsOverrides.js";
import {
  readEventsOverrides,
  EVENTS_OVERRIDES_EVENT_NAME,
  EVENTS_OVERRIDES_STORAGE_KEY,
} from "../utils/eventsOverrides.js";
import {
  readSliderOverrides,
  SLIDER_OVERRIDES_EVENT_NAME,
  SLIDER_OVERRIDES_STORAGE_KEY,
} from "../utils/sliderOverrides.js";
import {
  readDocumentsOverrides,
  DOCUMENTS_OVERRIDES_EVENT_NAME,
  DOCUMENTS_OVERRIDES_STORAGE_KEY,
} from "../utils/documentsOverrides.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

const DataContext = React.createContext({
  slides: [],
  news: [],
  events: [],
  deputies: [],
  factions: [],
  districts: [],
  convocations: [],
  commissions: [],
  councils: [],
  government: [],
  authorities: [],
  documents: [],
  committees: [],
  aboutPages: [],
  aboutStructure: [],
  loading: {
    slides: false,
    news: false,
    events: false,
    deputies: false,
    documents: false,
    structure: false,
    government: false,
    authorities: false,
    committees: false,
    about: false,
  },
  errors: {
    slides: null,
    news: null,
    events: null,
    deputies: null,
    documents: null,
    structure: null,
    government: null,
    authorities: null,
    committees: null,
    about: null,
  },
  reload: () => {},
  // Setters for Admin (optional to use)
  setSlides: () => {},
  setNews: () => {},
  setEvents: () => {},
  setDeputies: () => {},
  setFactions: () => {},
  setDistricts: () => {},
  setConvocations: () => {},
  setCommissions: () => {},
  setCouncils: () => {},
  setGovernment: () => {},
  setAuthorities: () => {},
  setDocuments: () => {},
  setCommittees: () => {},
  setAboutPages: () => {},
  setAboutStructure: () => {},
});
export function useData() {
  return React.useContext(DataContext);
}

const DEPUTIES_OVERRIDES_KEY = "khural_deputies_overrides_v1";

function pick(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    return v;
  }
  return undefined;
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readDeputiesOverrides() {
  if (typeof window === "undefined") return { created: [], updatedById: {}, deletedIds: [] };
  const raw = window.localStorage?.getItem(DEPUTIES_OVERRIDES_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById: parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

function mergeDeputiesWithOverrides(base, overrides) {
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById = overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
  const deletedIds = new Set(Array.isArray(overrides?.deletedIds) ? overrides.deletedIds.map(String) : []);

  const out = [];
  const seen = new Set();

  for (const it of Array.isArray(base) ? base : []) {
    const id = String(it?.id ?? "");
    if (!id) continue;
    if (deletedIds.has(id)) continue;
    const override = updatedById[id];
    if (override) {
      // Умное слияние: сохраняем важные поля из базового объекта, если они отсутствуют в override
      const merged = { ...it, ...override };
      // Восстанавливаем фото, если оно было в базовом объекте, но отсутствует в override
      if (!override.photo && it.photo) {
        merged.photo = it.photo;
      }
      // Восстанавливаем изображение, если оно было в базовом объекте
      if (!override.image && it.image) {
        merged.image = it.image;
      }
      out.push(merged);
    } else {
      out.push(it);
    }
    seen.add(id);
  }

  for (const it of created) {
    const id = String(it?.id ?? "");
    if (!id) continue;
    if (deletedIds.has(id)) continue;
    if (seen.has(id)) continue;
    out.push(it);
    seen.add(id);
  }

  return out;
}

function joinApiBase(path) {
  const p = String(path || "");
  if (!p) return "";
  // Keep browser-managed URLs intact
  if (/^(data|blob):/i.test(p)) return p;
  // already absolute: try to convert file URLs to same-origin to avoid CORP/CORS blocks
  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      const isFileLike =
        u.pathname.startsWith("/files") ||
        u.pathname.startsWith("/uploads") ||
        u.pathname.startsWith("/media");
      if (typeof window !== "undefined" && window.location && isFileLike) {
        // If resource is cross-origin, prefer same-origin path (expects reverse proxy in prod / vite proxy in dev)
        if (u.origin !== window.location.origin) {
          return u.pathname + u.search + u.hash;
        }
      }
    } catch {
      // ignore url parse errors
    }
    return p;
  }
  const base = String(API_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return p;
  if (p.startsWith("/")) return `${base}${p}`;
  return `${base}/${p}`;
}

function firstFileLink(maybeFile) {
  if (!maybeFile) return "";
  // Possible shapes:
  // - { link }
  // - { file: { link } }
  // - { id } or { file: { id } } (backend may expose only id)
  const link =
    maybeFile?.link || maybeFile?.url || maybeFile?.file?.link || maybeFile?.file?.url || "";
  if (link) return joinApiBase(String(link));
  // Проверяем все возможные варианты ID (imageId, photoId, avatarId и т.д.)
  const id =
    maybeFile?.id ||
    maybeFile?.file?.id ||
    maybeFile?.imageId ||
    maybeFile?.image_id ||
    maybeFile?.photoId ||
    maybeFile?.photo_id ||
    maybeFile?.avatarId ||
    maybeFile?.avatar_id;
  if (!id) return "";
  return joinApiBase(`/files/v2/${String(id)}`);
}

function firstImageLink(images) {
  if (!Array.isArray(images) || !images.length) return "";
  return firstFileLink(images[0]);
}

function allImageLinks(images) {
  if (!Array.isArray(images) || !images.length) return [];
  return images.map((img) => firstFileLink(img)).filter((url) => url && url.trim());
}

function ensureUniqueIds(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).map((item, idx) => {
    const base =
      String(item?.id ?? item?._id ?? "").trim() ||
      `${String(item?.date || "").trim()}-${String(item?.title || "").trim()}-${idx}`;
    let id = base;
    let n = 1;
    while (seen.has(id)) {
      n += 1;
      id = `${base}-${n}`;
    }
    seen.add(id);
    return { ...item, id };
  });
}

function mergeEventsWithOverrides(base, overrides) {
  const list = Array.isArray(base) ? base : [];
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById =
    overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
  const deleted = new Set((overrides?.deletedIds || []).map((x) => String(x)));
  const out = [];
  const seen = new Set();
  for (const e of list) {
    const id = String(e?.id ?? "").trim();
    if (!id) continue;
    if (deleted.has(id)) continue;
    if (seen.has(id)) continue;
    const patch = updatedById[id];
    out.push(patch ? { ...e, ...patch, id } : e);
    seen.add(id);
  }
  for (const e of created) {
    const id = String(e?.id ?? "").trim();
    if (!id) continue;
    if (deleted.has(id)) continue;
    if (seen.has(id)) continue;
    const patch = updatedById[id];
    out.push(patch ? { ...e, ...patch, id } : e);
    seen.add(id);
  }
  return out;
}

async function fetchJson(path) {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed " + path);
    return await res.json();
  } catch (e) {
    console.warn("Data load error", path, e);
    return [];
  }
}

function normalizeLocaleKey(v) {
  return String(v || "").trim().toLowerCase();
}

function normalizeNewsDateKey(raw) {
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "number") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^\d{10,13}$/.test(s)) {
    const ms = s.length === 10 ? Number(s) * 1000 : Number(s);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  }
  // allow "YYYY-MM-DD" and ISO strings as-is
  return s;
}

function pickNewsKey(n) {
  const key =
    pick(
      n?.newsId,
      n?.news_id,
      n?.parentId,
      n?.parent_id,
      n?.entityId,
      n?.entity_id,
      n?.slug,
      n?.newsSlug,
      n?.news_slug
    ) || "";
  if (String(key).trim()) return `news:${String(key).trim()}`;

  const date = normalizeNewsDateKey(pick(n?.publishedAt, n?.published_at, n?.createdAt, n?.created_at));
  const category =
    pick(n?.category?.name, n?.category, n?.category_name) || "";
  const contentArr = Array.isArray(n?.content) ? n.content : [];
  const ru =
    contentArr.find((c) => normalizeLocaleKey(c?.locale || c?.lang) === "ru") ||
    contentArr[0] ||
    null;
  const title = String(ru?.title || n?.title || "").trim();

  // fallback: stable key by visible fields (works when backend flattens joins and returns per-language/per-file rows)
  return `news:${normalizeLocaleKey(title)}|${normalizeLocaleKey(category)}|${normalizeLocaleKey(date)}`;
}

function mergeApiNewsRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const byKey = new Map();

  for (const n of list) {
    const k = pickNewsKey(n);
    if (!k) continue;
    const prev = byKey.get(k);
    if (!prev) {
      byKey.set(k, n);
      continue;
    }

    // Merge common join-duplication shapes: content + images/gallery + coverImage
    const merged = {
      ...prev,
      ...n,
      content: (() => {
        const a = Array.isArray(prev.content) ? prev.content : [];
        const b = Array.isArray(n.content) ? n.content : [];
        const out = [];
        const seen = new Set();
        for (const c of [...a, ...b]) {
          if (!c || typeof c !== "object") continue;
          const lk = normalizeLocaleKey(c.locale || c.lang || "");
          const ck = lk || Math.random().toString(36).slice(2);
          if (seen.has(ck)) continue;
          seen.add(ck);
          out.push(c);
        }
        return out.length ? out : (a.length ? a : b);
      })(),
      images: (() => {
        const a = Array.isArray(prev.images) ? prev.images : [];
        const b = Array.isArray(n.images) ? n.images : [];
        return [...a, ...b];
      })(),
      gallery: (() => {
        const a = Array.isArray(prev.gallery) ? prev.gallery : [];
        const b = Array.isArray(n.gallery) ? n.gallery : [];
        return [...a, ...b];
      })(),
      coverImage: prev.coverImage || n.coverImage,
    };
    byKey.set(k, merged);
  }

  return Array.from(byKey.values());
}

function mergeByIdPreferFirst(primary, secondary) {
  const a = Array.isArray(primary) ? primary : [];
  const b = Array.isArray(secondary) ? secondary : [];
  const seen = new Set();
  const out = [];
  for (const it of a) {
    const id = String(it?.id ?? "").trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    out.push(it);
    seen.add(id);
  }
  for (const it of b) {
    const id = String(it?.id ?? "").trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    out.push(it);
    seen.add(id);
  }
  return out;
}

function normalizeStringList(list) {
  const items = Array.isArray(list) ? list : [];
  const normalized = items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
      return String(item || "");
    })
    .map((s) => String(s || "").trim())
    .filter((s) => s);
  return Array.from(new Set(normalized));
}

function normalizeDeputyItem(d) {
  const toText = (v) => {
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v.trim();
    if (typeof v === "object") return String(v?.name || v?.title || v?.label || "").trim();
    return String(v).trim();
  };
  if (!d || typeof d !== "object") return d;
  
  // Проверяем все возможные источники фото
  const photoSources = [];
  if (d.photo) photoSources.push(d.photo);
  if (d.image?.link) photoSources.push(d.image.link);
  if (d.image?.url) photoSources.push(d.image.url);
  if (d.photoUrl) photoSources.push(d.photoUrl);
  if (d.photo_url) photoSources.push(d.photo_url);

  // Если прямых URL нет, пробуем собрать URL по идентификатору файла (как в Government.jsx / normalizeApiDeputyForDetail)
  if (!photoSources.length) {
    const mediaId =
      d.imageId ||
      d.image_id ||
      d.photoId ||
      d.photo_id ||
      d.avatarId ||
      d.avatar_id ||
      d.image?.id ||
      d.image?.imageId ||
      d.image?.image_id;
    if (mediaId) {
      photoSources.push(`/files/v2/${String(mediaId).trim()}`);
    }
  }

  // Нормализуем фото, чтобы оно всегда было полным URL
  const photoRaw =
    photoSources.length > 0
      ? photoSources[0]
      : (d.photo || (d.image && d.image.link) || "");
  const photo = normalizePhotoUrl(photoRaw);
  
  return {
    ...d,
    id: String(d.id ?? d._id ?? d.personId ?? ""),
    photo: photo, // Гарантируем нормализованное фото
    faction: toText(d.faction),
    district: toText(d.district),
    convocation: toText(d.convocation),
    // Гарантируем наличие contacts объекта
    contacts: d.contacts || {},
    // Гарантируем наличие address
    address: d.address || "",
  };
}

function normalizePersonName(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeCommitteeTitle(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mergeCommitteesPreferApi(apiList, staticList) {
  const api = Array.isArray(apiList) ? apiList : [];
  const fallback = Array.isArray(staticList) ? staticList : [];
  const out = api.map((c) => ({ ...c }));
  const byId = new Map();
  const byName = new Map();

  for (const c of out) {
    const id = String(c?.id ?? "");
    if (id) byId.set(id, c);
    const nameKey = normalizeCommitteeTitle(c?.title || c?.name || c?.label || c?.description);
    if (nameKey) byName.set(nameKey, c);
  }

  for (const c of fallback) {
    const id = String(c?.id ?? "");
    const nameKey = normalizeCommitteeTitle(c?.title || c?.name || c?.label || c?.description);
    const target = (id && byId.get(id)) || (nameKey && byName.get(nameKey)) || null;
    if (target) {
      if (!target.title && c?.title) target.title = c.title;
      if (!target.name && c?.name) target.name = c.name;
      if (!target.description && c?.description) target.description = c.description;
      if (!Array.isArray(target.members) && Array.isArray(c?.members)) target.members = c.members;
      if (!Array.isArray(target.staff) && Array.isArray(c?.staff)) target.staff = c.staff;
      if (!target.convocation && c?.convocation) target.convocation = c.convocation;
      continue;
    }
    out.push(c);
  }

  return out;
}

const KHURAL_UPLOAD_BASE = "https://khural.rtyva.ru";

/** Вспомогательная функция для кодирования сегмента пути */
function encodePathSegment(segment) {
  const raw = String(segment || "");
  try {
    // Декодируем несколько раз на случай множественного кодирования
    let decoded = raw;
    for (let i = 0; i < 3; i++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      } catch {
        break;
      }
    }
    return encodeURIComponent(decoded);
  } catch {
    return encodeURIComponent(raw);
  }
}

/** Кодирует pathname URL, правильно обрабатывая каждый сегмент */
function encodeUrlPathname(pathname) {
  return String(pathname || "")
    .split("/")
    .map((seg) => (seg === "" ? "" : encodePathSegment(seg)))
    .join("/");
}

/** Преобразует путь фото в полный URL через khural.rtyva.ru */
function normalizePhotoUrl(pic) {
  if (!pic) return "";
  const s = String(pic).trim();
  if (!s || s === "undefined" || s === "null") return "";
  
  // Если уже полный URL, проверяем, не является ли он путем через другой домен для /upload/
  if (/^https?:\/\//i.test(s) || s.startsWith("//")) {
    // Если это URL содержит /upload/iblock/ или /upload/, преобразуем в khural.rtyva.ru и кодируем
    if (s.includes("/upload/iblock/") || s.includes("/upload/")) {
      try {
        const url = new URL(s);
        if (url.pathname.startsWith("/upload/")) {
          const encodedPath = encodeUrlPathname(url.pathname);
          return `${KHURAL_UPLOAD_BASE}${encodedPath}${url.search}${url.hash}`;
        }
      } catch {
        // Если не удалось распарсить, извлекаем путь вручную
        const uploadMatch = s.match(/(\/upload\/iblock\/[^\s"']*)/i) || s.match(/(\/upload\/[^\s"']*)/i);
        if (uploadMatch) {
          const encodedPath = encodeUrlPathname(uploadMatch[1]);
          return `${KHURAL_UPLOAD_BASE}${encodedPath}`;
        }
      }
    }
    // Если это URL с khural.rtyva.ru, кодируем pathname
    if (s.includes("khural.rtyva.ru")) {
      try {
        const url = new URL(s);
        const encodedPath = encodeUrlPathname(url.pathname);
        return `${url.origin}${encodedPath}${url.search}${url.hash}`;
      } catch {
        return s;
      }
    }
    return s;
  }
  
  // Если путь начинается с /upload/ или upload/, преобразуем в полный URL
  if (s.startsWith("/upload/") || s.startsWith("upload/")) {
    const path = s.startsWith("/") ? s : `/${s}`;
    const encodedPath = encodeUrlPathname(path);
    return `${KHURAL_UPLOAD_BASE}${encodedPath}`;
  }
  
  // Если путь содержит /upload/iblock/ где-то внутри, извлекаем его
  const uploadMatch = s.match(/(\/upload\/iblock\/[^\s"']*)/i) || s.match(/(\/upload\/[^\s"']*)/i);
  if (uploadMatch) {
    const encodedPath = encodeUrlPathname(uploadMatch[1]);
    return `${KHURAL_UPLOAD_BASE}${encodedPath}`;
  }
  
  // Для других путей добавляем / если нужно
  return s.startsWith("/") ? s : `/${s}`;
}

/** Извлекает телефон из текста (например, из IE_PREVIEW_TEXT) */
function extractPhoneFromText(text) {
  if (!text) return "";
  // Убираем HTML entities и теги
  const cleanText = text.replace(/&nbsp;/g, " ").replace(/<[^>]*>/g, " ");
  // Ищем паттерны типа "тел. +7(39422) - 21632", "тел. 8-983-590-99-97", "тел: 8-923-263-75-53"
  // Сначала ищем после "тел." или "тел:"
  const telMatch = cleanText.match(/тел[.:]\s*([+\d\s\-(),]+)/i);
  if (telMatch) {
    // Берем первый номер телефона (до запятой или конца строки)
    const phones = telMatch[1].split(",")[0].trim();
    // Очищаем от лишних пробелов и символов
    const phone = phones.replace(/\s+/g, "").replace(/[^\d+\-()]/g, "");
    if (phone.length >= 8) return phone;
  }
  // Если не нашли через "тел.", ищем любой номер телефона
  const phonePattern = /(\+?\d[\d\s\-()]{8,})/g;
  const match = cleanText.match(phonePattern);
  if (match) {
    const phone = match[0].replace(/\s+/g, "").replace(/[^\d+\-()]/g, "");
    if (phone.length >= 8) return phone;
  }
  return "";
}

/** Извлекает email из текста */
function extractEmailFromText(text) {
  if (!text) return "";
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/gi;
  const match = text.match(emailPattern);
  return match ? match[0] : "";
}

function normalizeConvocationText(raw) {
  const s = String(raw || "").replace(/\u00A0/g, " ").trim();
  if (!s) return "";
  const cleaned = s
    .replace(/\(.*?\)/g, " ")
    .replace(/архив/gi, " ")
    .replace(/созыв(а|ы)?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const roman = cleaned.match(/\b([IVX]{1,8})\b/i);
  if (roman) return roman[1].toUpperCase();
  const num = cleaned.match(/\b(\d{1,2})\b/);
  if (num) return num[1];
  const ordMap = {
    первый: "I",
    второй: "II",
    третий: "III",
    четвертый: "IV",
    пятый: "V",
    шестой: "VI",
    седьмой: "VII",
    восьмой: "VIII",
    девятый: "IX",
    десятый: "X",
  };
  const ordKey = cleaned.toLowerCase().replace(/ё/g, "е");
  if (ordMap[ordKey]) return ordMap[ordKey];
  return cleaned;
}

/** Извлекает поля из одной записи (deputaty.json или deputaty_vseh_sozyvov.json) */
function parsePersonInfoRow(row) {
  const id = row?.IE_ID ?? row?.IE_XML_ID;
  if (id == null) return null;
  const name = String(row?.IE_NAME ?? "").trim();
  if (!name) return null;
  const pic = String(row?.IE_PREVIEW_PICTURE ?? "").trim();
  const bio = String(row?.IE_DETAIL_TEXT ?? "").trim();
  const preview = String(row?.IE_PREVIEW_TEXT ?? "").trim();
  // Телефон может быть в IP_PROP8 или в IE_PREVIEW_TEXT
  const phoneFromProp = String(row?.IP_PROP8 ?? "").trim();
  const phoneFromText = extractPhoneFromText(preview);
  const phone = phoneFromProp || phoneFromText || "";
  // Email может быть в IP_PROP9 или в IE_PREVIEW_TEXT
  const emailFromProp = String(row?.IP_PROP9 ?? "").trim();
  const emailFromText = extractEmailFromText(preview);
  const email = emailFromProp || emailFromText || "";
  const convPrimary = normalizeConvocationText(row?.IP_PROP15);
  const convGroup = normalizeConvocationText(row?.IC_GROUP0 || row?.IC_GROUP1 || row?.IC_GROUP2);
  const conv = convPrimary || convGroup;
  const pos = String(row?.IP_PROP22 ?? "").trim();
  const pos128 = String(row?.IP_PROP128 ?? "").trim();
  const pos132 = String(row?.IP_PROP132 ?? "").trim();
  const position = pos || pos128 || pos132 || "";
  return {
    ieId: String(id),
    name,
    photo: normalizePhotoUrl(pic),
    bio: bio || "",
    reception: preview || "",
    phone: phone || "",
    email: email || "",
    convocation: conv || "",
    position: position || "",
  };
}

/** Строит Map(нормализованное имя -> { photo, bio, ... }) из массива записей */
function buildPersonInfoMap(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const byId = new Map();
  for (const row of arr) {
    const v = parsePersonInfoRow(row);
    if (!v) continue;
    if (byId.has(v.ieId)) continue;
    byId.set(v.ieId, v);
  }
  const byName = new Map();
  for (const v of byId.values()) {
    const n = normalizePersonName(v.name);
    if (!n) continue;
    if (!byName.has(n)) byName.set(n, v);
  }
  return { byName, byId };
}

/** Объединяет две персон-мапы по имени: base — база, overlay заполняет пустые поля */
function mergePersonInfoMaps(base, overlay) {
  const byName = new Map(base.byName);
  for (const [n, ov] of overlay.byName) {
    const cur = byName.get(n);
    if (!cur) {
      byName.set(n, { ...ov });
      continue;
    }
    const merged = { ...cur };
    if (!merged.photo && ov.photo) merged.photo = ov.photo;
    if (!merged.bio && ov.bio) merged.bio = ov.bio;
    if (!merged.reception && ov.reception) merged.reception = ov.reception;
    if (!merged.phone && ov.phone) merged.phone = ov.phone;
    if (!merged.email && ov.email) merged.email = ov.email;
    if (!merged.convocation && ov.convocation) merged.convocation = ov.convocation;
    if (!merged.position && ov.position) merged.position = ov.position;
    byName.set(n, merged);
  }
  const byId = new Map();
  for (const v of byName.values()) {
    byId.set(v.ieId, v);
  }
  return { byName, byId };
}

function enrichDeputyWithPersonInfo(dep, info) {
  if (!info || !dep) return dep;
  const out = { ...dep };
  // Гарантируем наличие contacts объекта
  if (!out.contacts) out.contacts = {};
  
          // Проверяем все возможные источники фото в dep (включая imageId)
          const depPhotoSources = [];
          if (out.photo) depPhotoSources.push(out.photo);
          if (out.image?.link) depPhotoSources.push(out.image.link);
          if (out.image?.url) depPhotoSources.push(out.image.url);
          if (out.photoUrl) depPhotoSources.push(out.photoUrl);
          if (out.photo_url) depPhotoSources.push(out.photo_url);
          
          // Если прямых URL нет, проверяем imageId из API
          if (!depPhotoSources.length) {
            const mediaId =
              out.imageId ||
              out.image_id ||
              out.photoId ||
              out.photo_id ||
              out.avatarId ||
              out.avatar_id ||
              out.image?.id ||
              out.image?.imageId ||
              out.image?.image_id;
            if (mediaId) {
              depPhotoSources.push(`/files/v2/${String(mediaId).trim()}`);
            }
          }
          
          // Проверяем, что фото действительно отсутствует (пустая строка или undefined/null)
          const currentPhoto = depPhotoSources.length > 0 
            ? String(depPhotoSources[0]).trim() 
            : String(out.photo || "").trim();
          const hasPhoto = currentPhoto !== "" && currentPhoto !== "undefined" && currentPhoto !== "null" && !currentPhoto.startsWith("http://localhost");
          
          // Проверяем фото из info
          const infoPhoto = String(info.photo || "").trim();
          const hasInfoPhoto = infoPhoto !== "" && infoPhoto !== "undefined" && infoPhoto !== "null";
          
          // Приоритет: если есть фото в dep (из API), используем его, иначе берем из info (из JSON)
          if (hasPhoto) {
            out.photo = normalizePhotoUrl(currentPhoto); // Нормализуем существующее фото
          } else if (hasInfoPhoto) {
            out.photo = normalizePhotoUrl(infoPhoto); // Нормализуем фото при добавлении из info
          } else {
            // Если фото нет нигде, убеждаемся, что поле пустое
            out.photo = "";
          }
  
  // Биография только из IE_DETAIL_TEXT, не из reception
  if (!out.bio && !out.biography && info.bio) {
    out.bio = info.bio;
    out.biography = info.bio;
  }
  
  // Reception (график приема) из IE_PREVIEW_TEXT, но только если это не биография
  const receptionPlain = String(info.reception || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  const isReceptionBiography = receptionPlain.length > 200 || 
    /родился|родилась|окончил|окончила|работал|работала|награды|награжден|избран|назначен/i.test(receptionPlain);
  if (!out.reception && info.reception && !isReceptionBiography) {
    out.reception = info.reception;
  }
  if (!out.receptionSchedule && info.reception && !isReceptionBiography) {
    out.receptionSchedule = info.reception;
  }
  
  // Извлекаем адрес из reception для карточек (если адрес еще не установлен)
  if (!out.address || String(out.address).trim() === "") {
    if (info.reception && !isReceptionBiography) {
      const addressMatch = receptionPlain.match(/(г\.\s*[^,\n]+(?:,\s*ул\.\s*[^,\n]+(?:,\s*д\.\s*\d+)?)?)/i);
      if (addressMatch) {
        out.address = addressMatch[1].trim();
      }
    }
  }
  
  // Контакты - добавляем только если их еще нет
  if (!out.contacts.phone && info.phone && String(info.phone).trim() !== "") {
    out.contacts = { ...out.contacts, phone: info.phone };
  }
  if (!out.contacts.email && info.email && String(info.email).trim() !== "") {
    out.contacts = { ...out.contacts, email: info.email };
  }
  
  if (!out.convocation && info.convocation) out.convocation = info.convocation;
  if (!out.district && info.position) out.district = info.position;
  if (!out.position && info.position) out.position = info.position;
  
  return out;
}

/** Экспортируемая функция для обогащения депутата из JSON файлов (используется в Government.jsx) */
export async function enrichDeputyFromPersonInfo(dep) {
  if (!dep || !dep.name) return dep;
  try {
    const [personInfoVseh, personInfoDeputaty] = await Promise.all([
      fetch("/persons_info/deputaty_vseh_sozyvov.json").then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch("/persons_info/deputaty.json").then((r) => r.ok ? r.json() : []).catch(() => []),
    ]);
    const mapVseh = buildPersonInfoMap(personInfoVseh);
    const mapDep = buildPersonInfoMap(personInfoDeputaty);
    const personInfoMap = mergePersonInfoMaps(mapDep, mapVseh);
    const info = personInfoMap.byName.get(normalizePersonName(dep.name));
    return enrichDeputyWithPersonInfo(dep, info);
  } catch (e) {
    console.warn("Failed to enrich deputy from person info:", e);
    return dep;
  }
}

function addMissingDeputiesFromPersonInfo(list, personInfoMap) {
  const { byName, byId } = personInfoMap;
  const existing = new Set((list || []).map((d) => normalizePersonName(d?.name ?? "")));
  const added = [];
  for (const v of byId.values()) {
    const n = normalizePersonName(v.name);
    if (!n || existing.has(n)) continue;
    existing.add(n);
    
    // Извлекаем адрес из reception, если это не биография
    const receptionPlain = String(v.reception || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    const isReceptionBiography = receptionPlain.length > 200 || 
      /родился|родилась|окончил|окончила|работал|работала|награды|награжден|избран|назначен/i.test(receptionPlain);
    let address = "";
    if (!isReceptionBiography && receptionPlain) {
      const addressMatch = receptionPlain.match(/(г\.\s*[^,\n]+(?:,\s*ул\.\s*[^,\n]+(?:,\s*д\.\s*\d+)?)?)/i);
      if (addressMatch) {
        address = addressMatch[1].trim();
      }
    }
    
    added.push({
      id: `json-${v.ieId}`,
      name: v.name,
      photo: normalizePhotoUrl(v.photo || ""), // Нормализуем фото
      bio: v.bio || "",
      biography: v.bio || "",
      reception: !isReceptionBiography ? v.reception : "",
      receptionSchedule: !isReceptionBiography ? v.reception : "",
      convocation: v.convocation || "",
      district: v.position || "",
      position: v.position || "Депутат",
      address: address, // Добавляем адрес
      contacts: { phone: v.phone || "", email: v.email || "" },
    });
  }
  return [...(list || []), ...added];
}

function mergeSlidesWithOverrides(baseSlides, overrides) {
  const list = Array.isArray(baseSlides) ? baseSlides : [];
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById =
    overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
  const deleted = new Set((overrides?.deletedIds || []).map((x) => String(x)));
  // NOTE: orderIds handled in code below (avoids babel ambiguity in older configs)
  const order = Array.isArray(overrides?.orderIds) ? overrides.orderIds.map(String) : [];
  const out = [];
  const seen = new Set();

  const pushSlide = (s) => {
    const id = String(s?.id ?? "").trim();
    if (!id) return;
    if (deleted.has(id)) return;
    if (seen.has(id)) return;
    const patchRaw = updatedById[id];
    // IMPORTANT: keep backward compatibility with older stored overrides that accidentally
    // overwrote `image` with empty string (which makes the slide disappear).
    const patch =
      patchRaw && typeof patchRaw === "object"
        ? (() => {
            const p = { ...patchRaw };
            if (
              Object.prototype.hasOwnProperty.call(p, "image") &&
              String(p.image || "").trim() === "" &&
              String(s?.image || "").trim() !== ""
            ) {
              delete p.image;
            }
            return p;
          })()
        : patchRaw;
    const merged = patch ? { ...s, ...(patch || {}), id } : { ...s, id };
    out.push(merged);
    seen.add(id);
  };

  list.forEach(pushSlide);
  created.forEach(pushSlide);

  // Apply explicit order if provided
  if (order.length) {
    const byId = new Map(out.map((s) => [String(s.id), s]));
    const ordered = [];
    const used = new Set();
    for (const id of order) {
      const it = byId.get(String(id));
      if (it) {
        ordered.push(it);
        used.add(String(id));
      }
    }
    for (const it of out) {
      if (!used.has(String(it.id))) ordered.push(it);
    }
    return ordered;
  }

  return out;
}

export default function DataProvider({ children }) {
  const [slides, setSlides] = React.useState([]);
  const [news, setNews] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [deputiesBase, setDeputiesBase] = React.useState([]);
  const [factions, setFactions] = React.useState([]);
  const [districts, setDistricts] = React.useState([]);
  const [convocations, setConvocations] = React.useState([]);
  const [commissions, setCommissions] = React.useState([]);
  const [councils, setCouncils] = React.useState([]);
  const [government, setGovernment] = React.useState([]);
  const [authorities, setAuthorities] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [committees, setCommittees] = React.useState([]);
  const [aboutPages, setAboutPages] = React.useState([]);
  const [aboutStructure, setAboutStructure] = React.useState([]);
  const [loading, setLoading] = React.useState({
    slides: false,
    news: false,
    events: false,
    deputies: false,
    documents: false,
    structure: false,
    government: false,
    authorities: false,
    committees: false,
    about: false,
  });
  const [errors, setErrors] = React.useState({
    slides: null,
    news: null,
    events: null,
    deputies: null,
    documents: null,
    structure: null,
    government: null,
    authorities: null,
    committees: null,
    about: null,
  });
  const [reloadSeq, setReloadSeq] = React.useState(0);
  const [deputiesOverrides, setDeputiesOverrides] = React.useState(() => readDeputiesOverrides());
  const [eventsOverrides, setEventsOverrides] = React.useState(() => readEventsOverrides());
  const [slidesOverrides, setSlidesOverrides] = React.useState(() => readSliderOverrides());

  const markLoading = React.useCallback((key, value) => {
    setLoading((s) => ({ ...s, [key]: Boolean(value) }));
  }, []);
  const markError = React.useCallback((key, error) => {
    setErrors((s) => ({ ...s, [key]: error || null }));
  }, []);

  const reload = React.useCallback(() => {
    setReloadSeq((x) => x + 1);
  }, []);

  React.useEffect(() => {
    // Try API for slider first, fallback to local JSON
    (async () => {
      markLoading("slides", true);
      markError("slides", null);
      const apiSlides = await SliderApi.list({ all: false }).catch(() => null);
      if (Array.isArray(apiSlides)) {
        // If API returns empty array, use code defaults (public/data/slides.json) for now.
        if (apiSlides.length === 0) {
          const local = await fetchJson("/data/slides.json").catch(() => []);
          const mappedLocal = (Array.isArray(local) ? local : [])
            .slice(0, 5)
            .map((s, i) => ({
              id: String(s?.id ?? `imp-${i + 1}`),
              title: String(s?.title || ""),
              desc: String(s?.desc || s?.description || ""),
              link: String(s?.link || s?.url || s?.href || "/news"),
              image: String(s?.image || ""),
              isActive: true,
              order: i + 1,
            }));
          setSlides(mappedLocal);
        } else {
          const mapped = apiSlides
            .filter((s) => s) // keep even inactive; we'll filter after overrides
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            .map((s) => ({
              id: String(s.id ?? ""),
              title: s.title || "",
              desc: pick(s.desc, s.description, s.subtitle) || "",
              link: pick(s.link, s.url, s.href) || "",
              image: firstFileLink(s.image) || "",
              isActive: s.isActive !== false,
              order: Number(s.order || 0),
            }));
          setSlides(mapped);
        }
      } else {
        fetchJson("/data/slides.json")
          .then((arr) => setSlides((Array.isArray(arr) ? arr : []).slice(0, 5)))
          .catch((e) => markError("slides", e));
      }
      markLoading("slides", false);
    })();
    // Try API for news first, fallback to local JSON
    (async () => {
      markLoading("news", true);
      markError("news", null);
      // Добавляем timestamp для обхода кэша при перезагрузке
      const cacheBuster = reloadSeq > 0 ? `?t=${Date.now()}` : "";
      console.log(`[DataContext] Loading news data (reloadSeq: ${reloadSeq})...`);
      const [apiNewsRaw, localNewsRaw] = await Promise.all([
        tryApiFetch(`/news${cacheBuster}`, { auth: false }),
        fetchJson("/data/news.json"),
      ]);
      
      console.log(`[DataContext] News API response:`, {
        isArray: Array.isArray(apiNewsRaw),
        length: Array.isArray(apiNewsRaw) ? apiNewsRaw.length : 0,
        firstItem: Array.isArray(apiNewsRaw) && apiNewsRaw.length > 0 ? apiNewsRaw[0] : null,
      });

      const apiNewsArr = Array.isArray(apiNewsRaw)
        ? apiNewsRaw
        : Array.isArray(apiNewsRaw?.items)
          ? apiNewsRaw.items
          : Array.isArray(apiNewsRaw?.data?.items)
            ? apiNewsRaw.data.items
            : null;

      const mappedApi = Array.isArray(apiNewsArr)
        ? mergeApiNewsRows(apiNewsArr).map((n) => {
            // Backend returns localized content array; admin sends { locale }, older backends may use { lang }.
            const ru =
              (Array.isArray(n.content) &&
                n.content.find((c) => normalizeLocaleKey(c?.locale || c?.lang) === "ru")) ||
              (Array.isArray(n.content) ? n.content[0] : null) ||
              null;

            // Извлекаем данные из локализованного контента
            const title = String(ru?.title || n.title || "").trim();
            const excerpt = String(
              ru?.shortDescription ||
                ru?.description ||
                n.shortDescription ||
                n.description ||
                ""
            ).trim();
            const contentHtml = String(
              ru?.content || 
              n.contentHtml || 
              n.contentText || 
              ""
            ).trim();
            
            // Логируем для отладки, если данные пустые
            if (!title && !excerpt && !contentHtml) {
              console.warn("News item with empty content:", {
                id: n.id,
                hasContentArray: Array.isArray(n.content),
                contentArrayLength: Array.isArray(n.content) ? n.content.length : 0,
                ruContent: ru,
                rawNews: n,
              });
            }

            const img = firstImageLink(n.images || n.gallery) || firstFileLink(n.coverImage);
            // Collect all images: gallery first, then images, then coverImage if not already included
            const allImages = [
              ...allImageLinks(n.gallery || []),
              ...allImageLinks(n.images || []),
            ];
            const coverImg = firstFileLink(n.coverImage);
            if (coverImg && !allImages.includes(coverImg)) {
              allImages.unshift(coverImg); // Put cover image first
            }

            // Обрабатываем дату публикации
            const rawDate = pick(n.publishedAt, n.published_at, n.createdAt, n.created_at);
            let dateStr = normalizeNewsDateKey(rawDate);
            // Если дата не установлена или невалидна, используем дату создания или текущую дату
            if (!dateStr || dateStr === "1970-01-01T00:00:00.000Z") {
              const createdAt = pick(n.createdAt, n.created_at);
              dateStr = normalizeNewsDateKey(createdAt);
              if (!dateStr || dateStr === "1970-01-01T00:00:00.000Z") {
                dateStr = new Date().toISOString();
              }
            }

            const dedupKey = pickNewsKey(n);
            const id = String(
              pick(
                n.id,
                n._id,
                n.newsId,
                n.news_id,
                n.parentId,
                n.parent_id,
                dedupKey
              ) || Math.random().toString(36).slice(2)
            );

            return {
              id,
              title,
              category: pick(n?.category?.name, n.category, n.category_name) || "Новости",
              date: dateStr,
              excerpt,
              // Keep both: rich HTML and plain content array (for legacy JSON)
              contentHtml: contentHtml || "",
              content: [],
              image: img, // Keep for backward compatibility
              images: allImages, // All images for carousel
            };
          })
        : [];

      const mappedLocal = ensureUniqueIds(Array.isArray(localNewsRaw) ? localNewsRaw : []);
      const merged = mergeByIdPreferFirst(ensureUniqueIds(mappedApi), mappedLocal);
      const deleted = new Set((readNewsOverrides()?.deletedIds || []).map(String));
      const filtered = merged.filter((n) => !deleted.has(String(n?.id ?? "")));
      setNews(ensureUniqueIds(filtered));
      markLoading("news", false);
    })();
    // Try API for events first, fallback to local JSON
    (async () => {
      markLoading("events", true);
      markError("events", null);
      try {
        // Используем EventsApi.list() для получения событий с поддержкой фильтрации
        const apiEvents = await EventsApi.list();
        if (Array.isArray(apiEvents)) {
          // Если массив пустой, все равно используем его (не fallback на JSON)
          if (apiEvents.length === 0) {
            console.log("Calendar API вернул пустой массив событий");
            setEvents(mergeEventsWithOverrides([], readEventsOverrides()));
            markLoading("events", false);
            return;
          }
          const mapped = apiEvents.map((e) => ({
              id: String(e.id ?? e.externalId ?? Math.random().toString(36).slice(2)),
              date: (() => {
                const d = pick(e.date, e.date_of_event);
                if (d) return String(d);
                const start = pick(e.startDate, e.start_date);
                if (!start) return "";
                const dt = new Date(Number(start));
                return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
              })(),
              title: String(pick(e.title, e.event_title) || ""),
              time: (() => {
                const t = pick(e.time, e.event_time);
                if (t) return String(t);
                const start = pick(e.startDate, e.start_date);
                if (!start) return "";
                const dt = new Date(Number(start));
                if (isNaN(dt.getTime())) return "";
                return dt.toISOString().slice(11, 16);
              })(),
              place: String(pick(e.place, e.event_place, e.location) || ""),
              desc: String(pick(e.desc, e.description) || ""),
              isImportant: Boolean(
                pick(e.isImportant, e.is_important, e.important, e.featured, e.pinned, e.is_featured)
              ),
            }));
          setEvents(mergeEventsWithOverrides(mapped, readEventsOverrides()));
          markLoading("events", false);
          return;
        }
      } catch (e) {
        // API недоступен, используем fallback
        console.warn("Calendar API недоступен, используем локальные данные", e);
      }
      // Fallback to local JSON
      fetchJson("/data/events.json")
        .then((arr) => setEvents(mergeEventsWithOverrides(arr, readEventsOverrides())))
        .catch((e) => markError("events", e))
        .finally(() => markLoading("events", false));
    })();
    // Try API for persons first, fallback to local JSON
    (async () => {
      markLoading("deputies", true);
      markError("deputies", null);
      const [personInfoVseh, personInfoDeputaty] = await Promise.all([
        fetchJson("/persons_info/deputaty_vseh_sozyvov.json").catch(() => []),
        fetchJson("/persons_info/deputaty.json").catch(() => []),
      ]);
      const mapVseh = buildPersonInfoMap(personInfoVseh);
      const mapDep = buildPersonInfoMap(personInfoDeputaty);
      const personInfoMap = mergePersonInfoMaps(mapDep, mapVseh);

      try {
        const apiPersons = await tryApiFetch("/persons", { auth: false });
        if (Array.isArray(apiPersons) && apiPersons.length) {
        // Merge rich profile fields from local JSON (bio/laws/schedule/etc)
        const localDeps = await fetchJson("/data/deputies.json");
        const localByExternalId = new Map((localDeps || []).map((d) => [String(d.id ?? ""), d]));
        const localByName = new Map();
        (Array.isArray(localDeps) ? localDeps : []).forEach((d) => {
          const key = normalizePersonName(d?.name ?? "");
          if (!key) return;
          if (!localByName.has(key)) localByName.set(key, d);
        });

        const mapped = apiPersons.map((p) => {
          const externalKey = p?.externalId ? String(p.externalId) : "";
          const apiNameRaw = pick(p.fullName, p.full_name, p.name) || "";
          const local = externalKey ? localByExternalId.get(externalKey) : null;
          const localByNameMatch =
            !local && apiNameRaw ? localByName.get(normalizePersonName(apiNameRaw)) : null;
          const localResolved = local || localByNameMatch || null;

          // IMPORTANT: keep id as STRING to match URLSearchParams id (Government.jsx uses ===)
          const id = String(p.id ?? p.personId ?? Math.random().toString(36).slice(2));

          return {
            ...(localResolved || {}),
            id,
            externalId: externalKey || (localResolved?.id ? String(localResolved.id) : undefined),
            name: apiNameRaw || localResolved?.name || "",
            // PersonDetail expects "position" field for deputy
            position: (() => {
              const apiVal = pick(p.description, p.role) || "";
              const val = apiVal || localResolved?.position || "";
              return typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
            })(),
            // Биография - из API или локальных данных
            bio: pick(p.biography, p.bio) || localResolved?.bio || "",
            biography: pick(p.biography, p.bio) || localResolved?.biography || "",
            district: (() => {
              const apiVal =
                pick(p.electoralDistrict, p.electoral_district) ||
                (Array.isArray(p.districts) && p.districts[0]?.name) ||
                p.city ||
                p.district ||
                "";
              const val = apiVal || localResolved?.district || "";
              const s = typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
              return String(s || "").trim();
            })(),
            faction: (() => {
              const apiVal =
                pick(p.faction, p.committee) ||
                (Array.isArray(p.factions) && p.factions[0]?.name) ||
                "";
              const val = apiVal || localResolved?.faction || "";
              const s = typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
              return String(s || "").trim();
            })(),
            convocation: (() => {
              const apiVal =
                pick(p.convocationNumber, p.convocation, p.convocation_number) ||
                (Array.isArray(p.convocations) && p.convocations[0]?.name) ||
                "";
              const val = apiVal || localResolved?.convocation || "";
              const s = typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
              return String(s || "").trim();
            })(),
            convocationNumber: (() => {
              const val =
                pick(p.convocationNumber, p.convocation, p.convocation_number) ||
                localResolved?.convocationNumber ||
                localResolved?.convocation ||
                "";
              return typeof val === "string" ? val : String(val || "");
            })(),
            reception: localResolved?.reception || pick(p.receptionSchedule, p.reception_schedule) || "",
            receptionSchedule:
              pick(p.receptionSchedule, p.reception_schedule) || localResolved?.receptionSchedule || "",
            address: (() => {
              const val = pick(p.address) || localResolved?.address || "";
              return typeof val === "string" ? val : String(val || "");
            })(),
            // Prefer stored image link, fallback to seeded photoUrl or old JSON photo
            // Важно: нормализуем каждый источник отдельно, чтобы не потерять фото
            photo: (() => {
              const imgLink = firstFileLink(p.image);
              const photoUrl = pick(p.photoUrl, p.photo_url);
              const localPhoto = localResolved?.photo;
              const pPhoto = p.photo;
              
              // Пробуем каждый источник по очереди и нормализуем сразу
              let photo = "";
              if (imgLink && String(imgLink).trim() !== "" && String(imgLink).trim() !== "undefined" && String(imgLink).trim() !== "null") {
                photo = normalizePhotoUrl(imgLink);
              } else if (photoUrl && String(photoUrl).trim() !== "" && String(photoUrl).trim() !== "undefined" && String(photoUrl).trim() !== "null") {
                photo = normalizePhotoUrl(photoUrl);
              } else if (localPhoto && String(localPhoto).trim() !== "" && String(localPhoto).trim() !== "undefined" && String(localPhoto).trim() !== "null") {
                photo = normalizePhotoUrl(localPhoto);
              } else if (pPhoto && String(pPhoto).trim() !== "" && String(pPhoto).trim() !== "undefined" && String(pPhoto).trim() !== "null") {
                photo = normalizePhotoUrl(pPhoto);
              } else {
                // Если прямых URL нет, пробуем собрать URL по идентификатору файла из API
                const mediaId =
                  p.imageId ||
                  p.image_id ||
                  p.photoId ||
                  p.photo_id ||
                  p.avatarId ||
                  p.avatar_id ||
                  p.image?.id ||
                  p.image?.imageId ||
                  p.image?.image_id;
                if (mediaId) {
                  photo = normalizePhotoUrl(`/files/v2/${String(mediaId).trim()}`);
                }
              }
              
              return photo;
            })(),
            contacts: {
              phone:
                pick(p.phoneNumber, p.phone_number, p.phone) || localResolved?.contacts?.phone || "",
              email: p.email || localResolved?.contacts?.email || "",
            },
            // Законодательная деятельность - из API или локальных данных
            laws: Array.isArray(p.legislativeActivity)
              ? p.legislativeActivity
              : (Array.isArray(localResolved?.laws) ? localResolved.laws : []),
            legislativeActivity: Array.isArray(p.legislativeActivity)
              ? p.legislativeActivity
              : (Array.isArray(localResolved?.legislativeActivity) ? localResolved.legislativeActivity : []),
            // Сведения о доходах - из API или локальных данных
            incomeDocs: Array.isArray(p.incomeDeclarations)
              ? p.incomeDeclarations
              : (Array.isArray(localResolved?.incomeDocs) ? localResolved.incomeDocs : []),
            incomeDeclarations: Array.isArray(p.incomeDeclarations)
              ? p.incomeDeclarations
              : (Array.isArray(localResolved?.incomeDeclarations) ? localResolved.incomeDeclarations : []),
            // График приема - из API или локальных данных
            schedule: Array.isArray(p.receptionSchedule)
              ? p.receptionSchedule
              : (Array.isArray(localResolved?.schedule) ? localResolved.schedule : []),
            committeeIds: Array.isArray(p.committeeIds)
              ? p.committeeIds
              : (Array.isArray(localResolved?.committeeIds) ? localResolved.committeeIds : undefined),
            // Дополнительные поля
            structureType: (() => {
              const val = pick(p.structureType, p.structure_type) || localResolved?.structureType || "";
              return typeof val === "string" ? val : String(val || "");
            })(),
            role: (() => {
              const val = pick(p.role) || localResolved?.role || "";
              return typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
            })(),
            // Сохраняем imageId и другие ID для последующей обработки
            imageId: p.imageId || p.image_id || p.image?.id || p.image?.imageId || p.image?.image_id || undefined,
            image_id: p.image_id || p.imageId || undefined,
            photoId: p.photoId || p.photo_id || undefined,
            photo_id: p.photo_id || p.photoId || undefined,
            avatarId: p.avatarId || p.avatar_id || undefined,
            avatar_id: p.avatar_id || p.avatarId || undefined,
            // Сохраняем объект image для доступа к вложенным полям
            image: p.image || undefined,
          };
        });
        const enriched = mapped.map((d) => {
          const info = personInfoMap.byName.get(normalizePersonName(d.name));
          const enrichedDep = enrichDeputyWithPersonInfo(d, info);
          // Гарантируем нормализацию фото после обогащения
          // Проверяем все возможные источники фото (включая imageId из API)
          const photoSources = [];
          if (enrichedDep.photo) photoSources.push(enrichedDep.photo);
          if (enrichedDep.image?.link) photoSources.push(enrichedDep.image.link);
          if (enrichedDep.image?.url) photoSources.push(enrichedDep.image.url);
          if (enrichedDep.photoUrl) photoSources.push(enrichedDep.photoUrl);
          if (enrichedDep.photo_url) photoSources.push(enrichedDep.photo_url);
          
          // Если прямых URL нет, пробуем собрать URL по идентификатору файла (как в normalizeDeputyItem)
          if (!photoSources.length) {
            const mediaId =
              enrichedDep.imageId ||
              enrichedDep.image_id ||
              enrichedDep.photoId ||
              enrichedDep.photo_id ||
              enrichedDep.avatarId ||
              enrichedDep.avatar_id ||
              enrichedDep.image?.id ||
              enrichedDep.image?.imageId ||
              enrichedDep.image?.image_id ||
              d.imageId ||
              d.image_id ||
              d.photoId ||
              d.photo_id;
            if (mediaId) {
              photoSources.push(`/files/v2/${String(mediaId).trim()}`);
            }
          }
          
          if (photoSources.length > 0) {
            // Берем первое доступное фото и нормализуем
            const photoToUse = photoSources[0];
            if (photoToUse && String(photoToUse).trim() !== "" && String(photoToUse).trim() !== "undefined" && String(photoToUse).trim() !== "null") {
              enrichedDep.photo = normalizePhotoUrl(photoToUse);
            } else {
              enrichedDep.photo = "";
            }
          } else {
            enrichedDep.photo = "";
          }
          // Сохраняем imageId и другие ID для последующей обработки в normalizeDeputyItem
          if (!enrichedDep.imageId && !enrichedDep.image_id) {
            const mediaId =
              d.imageId ||
              d.image_id ||
              d.photoId ||
              d.photo_id ||
              d.avatarId ||
              d.avatar_id ||
              d.image?.id ||
              d.image?.imageId ||
              d.image?.image_id;
            if (mediaId) {
              enrichedDep.imageId = mediaId;
            }
          }
          return enrichedDep;
        });
        const withMissing = addMissingDeputiesFromPersonInfo(enriched, personInfoMap);
          setDeputiesBase(withMissing.map(normalizeDeputyItem));
          markLoading("deputies", false);
        } else {
          // API вернул пустой массив или невалидные данные - используем локальные данные
          const localDeps = await fetchJson("/data/deputies.json").catch(() => []);
          const base = Array.isArray(localDeps) ? localDeps : [];
          // Нормализуем фото и контакты из локальных данных перед обогащением
          const normalizedBase = base.map((d) => ({
            ...d,
            photo: normalizePhotoUrl(d?.photo || ""),
            contacts: d?.contacts || { phone: "", email: "" },
            address: d?.address || "",
          }));
          const enriched = normalizedBase.map((d) => {
            const info = personInfoMap.byName.get(normalizePersonName(d?.name ?? ""));
            return enrichDeputyWithPersonInfo(d, info);
          });
          const withMissing = addMissingDeputiesFromPersonInfo(enriched, personInfoMap);
          setDeputiesBase(withMissing.map(normalizeDeputyItem));
          markLoading("deputies", false);
        }
      } catch (e) {
        // API недоступен - используем локальные данные
        console.warn("Persons API недоступен, используем локальные данные", e);
        const localDeps = await fetchJson("/data/deputies.json").catch(() => []);
        const base = Array.isArray(localDeps) ? localDeps : [];
        // Нормализуем фото и контакты из локальных данных перед обогащением
        const normalizedBase = base.map((d) => ({
          ...d,
          photo: normalizePhotoUrl(d?.photo || ""),
          contacts: d?.contacts || { phone: "", email: "" },
          address: d?.address || "",
        }));
        const enriched = normalizedBase.map((d) => {
          const info = personInfoMap.byName.get(normalizePersonName(d?.name ?? ""));
          return enrichDeputyWithPersonInfo(d, info);
        });
        const withMissing = addMissingDeputiesFromPersonInfo(enriched, personInfoMap);
        setDeputiesBase(withMissing.map(normalizeDeputyItem));
        markLoading("deputies", false);
      }

      // Documents from API (laws, resolutions, etc)
      markLoading("documents", true);
      markError("documents", null);
      try {
        const apiDocsResponse = await tryApiFetch("/documents", { auth: false });
        const apiDocs = apiDocsResponse?.items || (Array.isArray(apiDocsResponse) ? apiDocsResponse : []);
        
        const typeLabels = {
          law: "Законы",
          resolution: "Постановления",
          decision: "Законопроекты",
          order: "Инициативы",
          other: "Другое",
        };
        
        const typeMapping = {
          law: "laws",
          resolution: "resolutions",
          decision: "bills",
          order: "initiatives",
          other: "other",
        };
        
        const deletedDocs = new Set((readDocumentsOverrides()?.deletedIds || []).map(String));
        const apiDocsList = apiDocs
          .filter((d) => !deletedDocs.has(String(d?.id ?? "")))
          .map((d) => {
            const raw =
              d.metadata?.url ||
              firstFileLink(d.pdfFile) ||
              (d.metadata?.pdfFileTyLink ? String(d.metadata.pdfFileTyLink) : "") ||
              "";
            const url = raw
              ? /\/upload\//i.test(raw) || String(raw).includes("khural.rtyva.ru")
                ? normalizeFilesUrl(raw)
                : raw
              : "";
            if (!url) {
              console.warn("[Documents] Missing file URL (API)", {
                id: d?.id,
                title: d?.title,
                rawUrl: raw,
              });
            }
            return {
              id: d.id,
              title: d.title,
              desc: d.content || d.description || "",
              date: d.publishedAt || d.createdAt || "",
              number: d.number || "",
              category:
                d?.category?.name || typeLabels[d.type] || d.type || "Документы",
              type: typeMapping[d.type] || d.type || "other",
              url,
            };
          });
        
        // Загружаем документы из JSON файлов в persons_doc
        const [zakonyData, zakony2Data, postamovleniyaData] = await Promise.all([
          fetchJson("/persons_doc/zakony.json").catch(() => []),
          fetchJson("/persons_doc/zakony2.json").catch(() => []),
          fetchJson("/persons_doc/postamovleniya_VH.json").catch(() => []),
        ]);
        
        // Парсим документы из zakony.json и zakony2.json
        const parseZakonyDoc = (row) => {
          if (!row || !row.IE_NAME) return null;
          const fileUrl = String(row.IP_PROP28 || "").trim();
          if (!fileUrl) {
            console.warn("[Documents] Missing file URL (zakony)", {
              id: row?.IE_ID || row?.IE_XML_ID,
              title: row?.IE_NAME,
            });
            return null;
          }
          
          // Нормализуем URL файла (включая кодирование пробелов/кириллицы)
          const normalizedUrl = normalizeFilesUrl(
            fileUrl.startsWith("http") ? fileUrl : `/upload/${fileUrl.replace(/^\/?upload\//i, "")}`
          );
          if (!normalizedUrl) {
            console.warn("[Documents] Failed to normalize URL (zakony)", {
              id: row?.IE_ID || row?.IE_XML_ID,
              title: row?.IE_NAME,
              rawUrl: fileUrl,
            });
            return null;
          }
          
          return {
            id: `zakony-${row.IE_ID || row.IE_XML_ID || Math.random()}`,
            title: String(row.IE_NAME || "").trim(),
            desc: "", // Описание не нужно по требованию пользователя
            date: String(row.IP_PROP27 || "").trim(),
            number: String(row.IP_PROP26 || "").trim(),
            category: "Законы Республики Тыва",
            type: "laws",
            url: normalizedUrl,
          };
        };
        
        // Парсим документы из postamovleniya_VH.json
        const parsePostamovleniyaDoc = (row) => {
          if (!row || !row.IE_NAME) return null;
          const fileUrl = String(row.IP_PROP59 || "").trim();
          if (!fileUrl) {
            console.warn("[Documents] Missing file URL (postamovleniya)", {
              id: row?.IE_ID || row?.IE_XML_ID,
              title: row?.IE_NAME,
            });
            return null;
          }
          
          // Нормализуем URL файла (включая кодирование пробелов/кириллицы)
          const normalizedUrl = normalizeFilesUrl(
            fileUrl.startsWith("http") ? fileUrl : `/upload/${fileUrl.replace(/^\/?upload\//i, "")}`
          );
          if (!normalizedUrl) {
            console.warn("[Documents] Failed to normalize URL (postamovleniya)", {
              id: row?.IE_ID || row?.IE_XML_ID,
              title: row?.IE_NAME,
              rawUrl: fileUrl,
            });
            return null;
          }
          
          return {
            id: `postamovleniya-${row.IE_ID || row.IE_XML_ID || Math.random()}`,
            title: String(row.IE_NAME || "").trim(),
            desc: "", // Описание не нужно по требованию пользователя
            date: String(row.IP_PROP58 || "").trim(),
            number: String(row.IP_PROP57 || "").trim(),
            category: "Постановления ВХ РТ",
            type: "resolutions",
            url: normalizedUrl,
          };
        };
        
        const zakonyDocs = (Array.isArray(zakonyData) ? zakonyData : [])
          .map(parseZakonyDoc)
          .filter(Boolean);
        
        const zakony2Docs = (Array.isArray(zakony2Data) ? zakony2Data : [])
          .map(parseZakonyDoc)
          .filter(Boolean);
        
        const postamovleniyaDocs = (Array.isArray(postamovleniyaData) ? postamovleniyaData : [])
          .map(parsePostamovleniyaDoc)
          .filter(Boolean);
        
        // Объединяем все документы: сначала из API, затем из JSON файлов
        setDocuments([...apiDocsList, ...zakonyDocs, ...zakony2Docs, ...postamovleniyaDocs]);
      } catch (e) {
        markError("documents", e);
        setDocuments([]);
      } finally {
        markLoading("documents", false);
      }

      // Fetch filters from API if available
      const [apiFactions, apiDistricts, apiConvocations] = await Promise.all([
        tryApiFetch("/persons/factions/all", { auth: false }),
        tryApiFetch("/persons/districts/all", { auth: false }),
        tryApiFetch("/persons/convocations/all", { auth: false }),
      ]);
      if (Array.isArray(apiFactions) && apiFactions.length)
        setFactions(normalizeStringList(apiFactions));
      if (Array.isArray(apiDistricts) && apiDistricts.length)
        setDistricts(normalizeStringList(apiDistricts));
      if (Array.isArray(apiConvocations) && apiConvocations.length)
        setConvocations(normalizeStringList(apiConvocations));

      markLoading("documents", false);
      markLoading("deputies", false);
    })();
    // Structure-derived lists
    markLoading("structure", true);
    fetchJson("/data/structure.json")
      .then((s) => {
        // Merge (API can be incomplete; structure.json is our baseline)
        setFactions((prev) =>
          normalizeStringList([...(Array.isArray(prev) ? prev : []), ...(s?.factions || [])])
        );
        setDistricts((prev) =>
          normalizeStringList([...(Array.isArray(prev) ? prev : []), ...(s?.districts || [])])
        );
        setConvocations((prev) =>
          normalizeStringList([...(Array.isArray(prev) ? prev : []), ...(s?.convocations || [])])
        );
        setCommissions(s.commissions || []);
        setCouncils(s.councils || []);
      })
      .catch((e) => markError("structure", e))
      .finally(() => markLoading("structure", false));

    markLoading("government", true);
    fetchJson("/data/government.json")
      .then(setGovernment)
      .catch((e) => markError("government", e))
      .finally(() => markLoading("government", false));

    markLoading("authorities", true);
    fetchJson("/data/authorities.json")
      .then(setAuthorities)
      .catch((e) => markError("authorities", e))
      .finally(() => markLoading("authorities", false));

    // Committees: сначала пробуем загрузить из API, затем fallback на статический файл
    markLoading("committees", true);
    (async () => {
      try {
        // Пробуем загрузить из API
        const apiCommittees = await CommitteesApi.list({ all: true }).catch(() => null);
        const staticCommittees = await fetchJson("/data/committees.json").catch(() => null);
        const merged = mergeCommitteesPreferApi(apiCommittees, staticCommittees);
        if (Array.isArray(merged) && merged.length > 0) {
          const apiCount = Array.isArray(apiCommittees) ? apiCommittees.length : 0;
          const staticCount = Array.isArray(staticCommittees) ? staticCommittees.length : 0;
          console.log(
            "[DataContext] Загружено комитетов (API + структура):",
            merged.length,
            "API:",
            apiCount,
            "Статические:",
            staticCount
          );
          setCommittees(merged);
        } else if (Array.isArray(apiCommittees)) {
          setCommittees(apiCommittees);
        } else if (Array.isArray(staticCommittees)) {
          setCommittees(staticCommittees);
        }
      } catch (e) {
        console.error("[DataContext] Ошибка загрузки комитетов:", e);
        markError("committees", e);
        setCommittees([]);
      } finally {
        markLoading("committees", false);
      }
    })();

    // About pages/structure are API-first (if backend filled), otherwise keep empty and use page fallbacks.
    (async () => {
      markLoading("about", true);
      markError("about", null);
      const [pages, structure] = await Promise.all([
        AboutApi.listPages({ locale: "ru" }).catch(() => null),
        AboutApi.listStructure().catch(() => null),
      ]);
      if (Array.isArray(pages)) setAboutPages(pages);
      if (Array.isArray(structure)) setAboutStructure(structure);
      markLoading("about", false);
    })();
  }, [reloadSeq]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep slider overrides in sync (admin writes them to localStorage and dispatches this event)
  React.useEffect(() => {
    const onLocal = () => setSlidesOverrides(readSliderOverrides());
    const onStorage = (e) => {
      if (e?.key === SLIDER_OVERRIDES_STORAGE_KEY) onLocal();
    };
    window.addEventListener(SLIDER_OVERRIDES_EVENT_NAME, onLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SLIDER_OVERRIDES_EVENT_NAME, onLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Keep events overrides in sync (admin writes them to localStorage and dispatches this event)
  React.useEffect(() => {
    const onLocal = () => setEventsOverrides(readEventsOverrides());
    window.addEventListener(EVENTS_OVERRIDES_EVENT_NAME, onLocal);
    window.addEventListener("storage", (e) => {
      if (e?.key === EVENTS_OVERRIDES_STORAGE_KEY) onLocal();
    });
    return () => {
      window.removeEventListener(EVENTS_OVERRIDES_EVENT_NAME, onLocal);
    };
  }, []);

  // Apply local "news deleted" overrides (admin can delete locally when API is unavailable)
  React.useEffect(() => {
    const apply = () => {
      const deleted = new Set((readNewsOverrides()?.deletedIds || []).map(String));
      if (!deleted.size) return;
      setNews((prev) =>
        (Array.isArray(prev) ? prev : []).filter((n) => !deleted.has(String(n?.id ?? "")))
      );
    };
    const onCustom = () => apply();
    const onStorage = (e) => {
      if (e?.key === NEWS_OVERRIDES_STORAGE_KEY) apply();
    };
    window.addEventListener(NEWS_OVERRIDES_EVENT_NAME, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(NEWS_OVERRIDES_EVENT_NAME, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Apply local "documents deleted" overrides (admin can delete locally when API is unavailable)
  React.useEffect(() => {
    const apply = () => {
      const deleted = new Set((readDocumentsOverrides()?.deletedIds || []).map(String));
      if (!deleted.size) return;
      setDocuments((prev) =>
        (Array.isArray(prev) ? prev : []).filter((d) => !deleted.has(String(d?.id ?? "")))
      );
    };
    const onCustom = () => apply();
    const onStorage = (e) => {
      if (e?.key === DOCUMENTS_OVERRIDES_STORAGE_KEY) apply();
    };
    window.addEventListener(DOCUMENTS_OVERRIDES_EVENT_NAME, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DOCUMENTS_OVERRIDES_EVENT_NAME, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Keep deputies overrides in sync (admin writes them to localStorage and dispatches this event)
  React.useEffect(() => {
    const onLocal = () => setDeputiesOverrides(readDeputiesOverrides());
    window.addEventListener("khural:deputies-updated", onLocal);
    window.addEventListener("storage", onLocal);
    return () => {
      window.removeEventListener("khural:deputies-updated", onLocal);
      window.removeEventListener("storage", onLocal);
    };
  }, []);

  const deputies = React.useMemo(() => {
    return mergeDeputiesWithOverrides(deputiesBase, deputiesOverrides);
  }, [deputiesBase, deputiesOverrides]);

  const eventsWithOverrides = React.useMemo(() => {
    return mergeEventsWithOverrides(events, eventsOverrides);
  }, [events, eventsOverrides]);

  const slidesWithOverrides = React.useMemo(() => {
    const merged = mergeSlidesWithOverrides(slides, slidesOverrides);
    return (Array.isArray(merged) ? merged : [])
      .filter((s) => s && s.isActive !== false)
      .filter((s) => String(s.title || "").trim() && String(s.image || "").trim())
      .slice(0, 5);
  }, [slides, slidesOverrides]);

  // Используем ref для loading и errors, чтобы они были доступны без ререндера
  const loadingRef = React.useRef(loading);
  const errorsRef = React.useRef(errors);
  loadingRef.current = loading;
  errorsRef.current = errors;
  
  const value = React.useMemo(
    () => ({
      slides: slidesWithOverrides,
      news,
      events: eventsWithOverrides,
      deputies,
      factions,
      districts,
      convocations,
      commissions,
      councils,
      government,
      authorities,
      documents,
      committees,
      aboutPages,
      aboutStructure,
      get loading() { return loadingRef.current; },
      get errors() { return errorsRef.current; },
      reload,
      // Setters (for Admin)
      setSlides,
      setNews,
      setEvents,
      setDeputies: setDeputiesBase,
      setFactions,
      setDistricts,
      setConvocations,
      setCommissions,
      setCouncils,
      setGovernment,
      setAuthorities,
      setDocuments,
      setCommittees,
      setAboutPages,
      setAboutStructure,
    }),
    [
      slidesWithOverrides,
      news,
      eventsWithOverrides,
      deputies,
      factions,
      districts,
      convocations,
      commissions,
      councils,
      government,
      authorities,
      documents,
      committees,
      aboutPages,
      aboutStructure,
      // loading и errors намеренно НЕ в зависимостях - они обновляются через ref в value
      // reload НЕ меняется (useCallback с [])
      // Сеттеры НЕ нужны в зависимостях - они стабильны от React.useState
    ] // eslint-disable-line react-hooks/exhaustive-deps
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
