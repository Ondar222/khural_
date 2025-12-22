import React from "react";
import { tryApiFetch, SliderApi, AboutApi } from "../api/client.js";

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

function pick(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    return v;
  }
  return undefined;
}

function firstFileLink(maybeFile) {
  if (!maybeFile) return "";
  // Possible shapes:
  // - { link }
  // - { file: { link } }
  // - { id } or { file: { id } } (backend may expose only id)
  const link =
    maybeFile?.link || maybeFile?.url || maybeFile?.file?.link || maybeFile?.file?.url || "";
  if (link) return String(link);
  const id = maybeFile?.id || maybeFile?.file?.id;
  if (!id) return "";
  return `/files/v2/${String(id)}`;
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

export default function DataProvider({ children }) {
  const [slides, setSlides] = React.useState([]);
  const [news, setNews] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [deputies, setDeputies] = React.useState([]);
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
              image: firstFileLink(s.image) || "",
            }))
            .filter((s) => s.title && s.image)
        );
      } else {
        fetchJson("/data/slides.json")
          .then(setSlides)
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
      const apiEvents = await tryApiFetch("/calendar", { auth: false });
      if (Array.isArray(apiEvents) && apiEvents.length) {
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
      } else {
        fetchJson("/data/events.json")
          .then(setEvents)
          .catch((e) => markError("events", e));
      }
      markLoading("events", false);
    })();
    // Try API for persons first, fallback to local JSON
    (async () => {
      markLoading("deputies", true);
      markError("deputies", null);
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
            position: local?.position || pick(p.description, p.role) || "",
            bio: local?.bio || "",
            district:
              local?.district ||
              pick(p.electoralDistrict, p.electoral_district) ||
              (Array.isArray(p.districts) && p.districts[0]?.name) ||
              p.city ||
              p.district ||
              "",
            faction:
              local?.faction ||
              pick(p.faction, p.committee) ||
              (Array.isArray(p.factions) && p.factions[0]?.name) ||
              "",
            convocation:
              local?.convocation ||
              pick(p.convocation) ||
              (Array.isArray(p.convocations) && p.convocations[0]?.name) ||
              "",
            reception: local?.reception || pick(p.receptionSchedule, p.reception_schedule) || "",
            address: local?.address || "",
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
            laws: Array.isArray(local?.laws) ? local.laws : [],
            incomeDocs: Array.isArray(local?.incomeDocs) ? local.incomeDocs : [],
            schedule: Array.isArray(local?.schedule) ? local.schedule : [],
          };
        });
        setDeputies(mapped);
      } else {
        fetchJson("/data/deputies.json")
          .then(setDeputies)
          .catch((e) => markError("deputies", e));
      }

      // Documents from API (laws, resolutions, etc) - fallback to local JSON
      markLoading("documents", true);
      markError("documents", null);
      const apiDocs = await tryApiFetch("/documents", { auth: false });
      if (Array.isArray(apiDocs) && apiDocs.length) {
        const typeLabels = {
          laws: "Законы",
          resolutions: "Постановления",
          initiatives: "Инициативы",
          bills: "Законопроекты",
          civic: "Обращения",
          constitution: "Конституция",
        };
        setDocuments(
          apiDocs.map((d) => ({
            id: d.id,
            title: d.title,
            desc: d.description || "",
            date: pick(d.date, d.createdAt, d.created_at) || "",
            number: d.number || "",
            category:
              d?.category?.name || d.category || typeLabels[d.type] || d.type || "Документы",
            type: d.type || "other",
            url: d.url || firstFileLink(d.pdfFile) || firstFileLink(d.file) || "",
          }))
        );
      } else {
        fetchJson("/data/documents.json")
          .then(setDocuments)
          .catch((e) => markError("documents", e));
      }

      // Fetch filters from API if available
      const [apiFactions, apiDistricts, apiConvocations] = await Promise.all([
        tryApiFetch("/persons/factions/all", { auth: false }),
        tryApiFetch("/persons/districts/all", { auth: false }),
        tryApiFetch("/persons/convocations/all", { auth: false }),
      ]);
      if (Array.isArray(apiFactions) && apiFactions.length) setFactions(apiFactions);
      if (Array.isArray(apiDistricts) && apiDistricts.length) setDistricts(apiDistricts);
      if (Array.isArray(apiConvocations) && apiConvocations.length)
        setConvocations(apiConvocations);

      markLoading("documents", false);
      markLoading("deputies", false);
    })();
    // Structure-derived lists
    markLoading("structure", true);
    fetchJson("/data/structure.json")
      .then((s) => {
        if (!factions.length) setFactions(s.factions || []);
        if (!districts.length) setDistricts(s.districts || []);
        if (!convocations.length) setConvocations(s.convocations || []);
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
      setDeputies,
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
      setDeputies,
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
