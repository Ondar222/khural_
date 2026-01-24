import React from "react";
import { API_BASE_URL, tryApiFetch, SliderApi, AboutApi, EventsApi } from "../api/client.js";
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
    out.push(override ? { ...it, ...override } : it);
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
  const id = maybeFile?.id || maybeFile?.file?.id;
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
  return {
    ...d,
    id: String(d.id ?? d._id ?? d.personId ?? ""),
    faction: toText(d.faction),
    district: toText(d.district),
    convocation: toText(d.convocation),
  };
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
      try {
        const apiPersons = await tryApiFetch("/persons", { auth: false });
        if (Array.isArray(apiPersons) && apiPersons.length) {
        // Merge rich profile fields from local JSON (bio/laws/schedule/etc)
        const localDeps = await fetchJson("/data/deputies.json");
        const localByExternalId = new Map((localDeps || []).map((d) => [String(d.id ?? ""), d]));

        const mapped = apiPersons.map((p) => {
          const externalKey = p?.externalId ? String(p.externalId) : "";
          const local = externalKey ? localByExternalId.get(externalKey) : null;

          // IMPORTANT: keep id as STRING to match URLSearchParams id (Government.jsx uses ===)
          const id = String(p.id ?? p.personId ?? Math.random().toString(36).slice(2));

          return {
            ...(local || {}),
            id,
            externalId: externalKey || (local?.id ? String(local.id) : undefined),
            name: pick(p.fullName, p.full_name, p.name) || local?.name || "",
            // PersonDetail expects "position" field for deputy
            position: (() => {
              const val = local?.position || pick(p.description, p.role) || "";
              return typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
            })(),
            // Биография - из API или локальных данных
            bio: pick(p.biography, p.bio) || local?.bio || "",
            biography: pick(p.biography, p.bio) || local?.biography || "",
            district: (() => {
              const val = local?.district ||
                pick(p.electoralDistrict, p.electoral_district) ||
                (Array.isArray(p.districts) && p.districts[0]?.name) ||
                p.city ||
                p.district ||
                "";
              const s = typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
              return String(s || "").trim();
            })(),
            faction: (() => {
              const val = local?.faction ||
                pick(p.faction, p.committee) ||
                (Array.isArray(p.factions) && p.factions[0]?.name) ||
                "";
              const s = typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
              return String(s || "").trim();
            })(),
            convocation: (() => {
              const val = local?.convocation ||
                pick(p.convocationNumber, p.convocation, p.convocation_number) ||
                (Array.isArray(p.convocations) && p.convocations[0]?.name) ||
                "";
              const s = typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
              return String(s || "").trim();
            })(),
            convocationNumber: (() => {
              const val = pick(p.convocationNumber, p.convocation, p.convocation_number) || local?.convocationNumber || "";
              return typeof val === "string" ? val : String(val || "");
            })(),
            reception: local?.reception || pick(p.receptionSchedule, p.reception_schedule) || "",
            receptionSchedule: pick(p.receptionSchedule, p.reception_schedule) || local?.receptionSchedule || "",
            address: (() => {
              const val = pick(p.address) || local?.address || "";
              return typeof val === "string" ? val : String(val || "");
            })(),
            // Prefer stored image link, fallback to seeded photoUrl or old JSON photo
            photo:
              firstFileLink(p.image) ||
              pick(p.photoUrl, p.photo_url) ||
              local?.photo ||
              p.photo ||
              "",
            contacts: {
              phone: pick(p.phoneNumber, p.phone_number, p.phone) || local?.contacts?.phone || "",
              email: p.email || local?.contacts?.email || "",
            },
            // Законодательная деятельность - из API или локальных данных
            laws: Array.isArray(p.legislativeActivity) ? p.legislativeActivity : (Array.isArray(local?.laws) ? local.laws : []),
            legislativeActivity: Array.isArray(p.legislativeActivity) ? p.legislativeActivity : (Array.isArray(local?.legislativeActivity) ? local.legislativeActivity : []),
            // Сведения о доходах - из API или локальных данных
            incomeDocs: Array.isArray(p.incomeDeclarations) ? p.incomeDeclarations : (Array.isArray(local?.incomeDocs) ? local.incomeDocs : []),
            incomeDeclarations: Array.isArray(p.incomeDeclarations) ? p.incomeDeclarations : (Array.isArray(local?.incomeDeclarations) ? local.incomeDeclarations : []),
            // График приема - из API или локальных данных
            schedule: Array.isArray(p.receptionSchedule) ? p.receptionSchedule : (Array.isArray(local?.schedule) ? local.schedule : []),
            // Дополнительные поля
            structureType: (() => {
              const val = pick(p.structureType, p.structure_type) || local?.structureType || "";
              return typeof val === "string" ? val : String(val || "");
            })(),
            role: (() => {
              const val = pick(p.role) || local?.role || "";
              return typeof val === "string" ? val : (val?.name || val?.title || String(val || ""));
            })(),
          };
        });
          setDeputiesBase(mapped.map(normalizeDeputyItem));
          markLoading("deputies", false);
        } else {
          // API вернул пустой массив или невалидные данные - используем локальные данные
          const localDeps = await fetchJson("/data/deputies.json").catch(() => []);
          setDeputiesBase((Array.isArray(localDeps) ? localDeps : []).map(normalizeDeputyItem));
          markLoading("deputies", false);
        }
      } catch (e) {
        // API недоступен - используем локальные данные
        console.warn("Persons API недоступен, используем локальные данные", e);
        const localDeps = await fetchJson("/data/deputies.json").catch(() => []);
        setDeputiesBase((Array.isArray(localDeps) ? localDeps : []).map(normalizeDeputyItem));
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
        setDocuments(
          apiDocs
            .filter((d) => !deletedDocs.has(String(d?.id ?? "")))
            .map((d) => ({
            id: d.id,
            title: d.title,
            desc: d.content || d.description || "",
            date: d.publishedAt || d.createdAt || "",
            number: d.number || "",
            category:
              d?.category?.name || typeLabels[d.type] || d.type || "Документы",
            type: typeMapping[d.type] || d.type || "other",
            url: d.metadata?.url || firstFileLink(d.pdfFile) || (d.metadata?.pdfFileTyLink ? String(d.metadata.pdfFileTyLink) : "") || "",
          }))
        );
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

    // Committees are a static structure file (with members/staff); always load them.
    markLoading("committees", true);
    fetchJson("/data/committees.json")
      .then(setCommittees)
      .catch((e) => markError("committees", e))
      .finally(() => markLoading("committees", false));

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
      loading,
      errors,
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
      loading,
      errors,
      reload,
      setSlides,
      setNews,
      setEvents,
      setDeputiesBase,
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
    ]
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
