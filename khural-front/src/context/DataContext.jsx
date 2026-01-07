import React from "react";
import { API_BASE_URL, tryApiFetch, SliderApi, AboutApi } from "../api/client.js";

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
  // already absolute
  if (/^https?:\/\//i.test(p)) return p;
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
      if (Array.isArray(apiSlides) && apiSlides.length) {
        setSlides(
          apiSlides
            .filter((s) => s && s.isActive !== false)
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            .map((s) => ({
              title: s.title || "",
              desc: pick(s.desc, s.description, s.subtitle) || "",
              link: pick(s.link, s.url, s.href) || "",
              image: firstFileLink(s.image) || "",
            }))
            .filter((s) => s.title && s.image)
            .slice(0, 5)
        );
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
      const apiNews = await tryApiFetch("/news", { auth: false });
      if (Array.isArray(apiNews) && apiNews.length) {
        const mapped = apiNews.map((n) => {
          // Backend may return either localized content array or flat strings.
          const ru =
            (Array.isArray(n.content) && n.content.find((c) => c?.lang === "ru")) ||
            (Array.isArray(n.content) ? n.content[0] : null) ||
            null;
          const title = ru?.title || n.title || "";
          const desc = String(ru?.description || n.shortDescription || n.description || "");
          const img = firstImageLink(n.images || n.gallery) || firstFileLink(n.coverImage);
          const date =
            pick(n.publishedAt, n.published_at) ||
            pick(n.createdAt, n.created_at) ||
            new Date().toISOString();
          return {
            id: String(n.id ?? Math.random().toString(36).slice(2)),
            title,
            category: pick(n?.category?.name, n.category, n.category_name) || "Новости",
            date,
            excerpt: desc,
            content: desc ? desc.split(/\n{2,}/g).filter(Boolean) : [],
            image: img,
          };
        });
        setNews(ensureUniqueIds(mapped));
      } else {
        fetchJson("/data/news.json")
          .then((arr) => setNews(ensureUniqueIds(arr)))
          .catch((e) => markError("news", e));
      }
      markLoading("news", false);
    })();
    // Try API for events first, fallback to local JSON
    (async () => {
      markLoading("events", true);
      markError("events", null);
      try {
        const apiEvents = await tryApiFetch("/calendar", { auth: false });
        if (Array.isArray(apiEvents)) {
          // Если массив пустой, все равно используем его (не fallback на JSON)
          if (apiEvents.length === 0) {
            console.log("Calendar API вернул пустой массив событий");
            setEvents([]);
            markLoading("events", false);
            return;
          }
          setEvents(
            apiEvents.map((e) => ({
              id: String(e.id ?? e.externalId ?? Math.random().toString(36).slice(2)),
              date: (() => {
                const d = pick(e.date, e.date_of_event);
                if (d) return String(d);
                const start = pick(e.startDate, e.start_date);
                if (!start) return "";
                const dt = new Date(Number(start));
                return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
              })(),
              title: pick(e.title, e.event_title) || "",
              time: (() => {
                const t = pick(e.time, e.event_time);
                if (t) return String(t);
                const start = pick(e.startDate, e.start_date);
                if (!start) return "";
                const dt = new Date(Number(start));
                if (isNaN(dt.getTime())) return "";
                return dt.toISOString().slice(11, 16);
              })(),
              place: pick(e.place, e.event_place, e.location) || "",
              desc: pick(e.desc, e.description) || "",
            }))
          );
          markLoading("events", false);
          return;
        }
      } catch (e) {
        // API недоступен, используем fallback
        console.warn("Calendar API недоступен, используем локальные данные", e);
      }
      // Fallback to local JSON
      fetchJson("/data/events.json")
        .then(setEvents)
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
        
        setDocuments(
          apiDocs.map((d) => ({
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

  const value = React.useMemo(
    () => ({
      slides,
      news,
      events,
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
      slides,
      news,
      events,
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
