import React from "react";
import { tryApiFetch } from "../api/client.js";

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
  // Setters for Admin (optional to use)
  setSlides: () => {},
  setNews: () => {},
  setEvents: () => {},
  setDeputies: () => {},
  setFactions: () => {},
  setDistricts: () => {},
  setConvocations: () => {},
  setGovernment: () => {},
  setAuthorities: () => {},
  setDocuments: () => {},
  setCommittees: () => {},
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
    maybeFile?.link ||
    maybeFile?.url ||
    maybeFile?.file?.link ||
    maybeFile?.file?.url ||
    "";
  if (link) return String(link);
  const id = maybeFile?.id || maybeFile?.file?.id;
  if (!id) return "";
  return `/files/v2/${String(id)}`;
}

function firstImageLink(images) {
  if (!Array.isArray(images) || !images.length) return "";
  return firstFileLink(images[0]);
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

  React.useEffect(() => {
    fetchJson("/data/slides.json").then(setSlides);
    // Try API for news first, fallback to local JSON
    (async () => {
      const apiNews = await tryApiFetch("/news", { auth: false });
      if (Array.isArray(apiNews) && apiNews.length) {
        const mapped = apiNews.map((n) => {
          const ru =
            (Array.isArray(n.content) &&
              n.content.find((c) => c?.lang === "ru")) ||
            (Array.isArray(n.content) ? n.content[0] : null) ||
            null;
          const desc = String(ru?.description || "");
          const img = firstImageLink(n.images);
          const date =
            pick(n.publishedAt, n.published_at) ||
            pick(n.createdAt, n.created_at) ||
            new Date().toISOString();
          return {
            id: String(n.id ?? Math.random().toString(36).slice(2)),
            title: ru?.title || "",
            category: pick(n.category, n.category_name) || "Новости",
            date,
            excerpt: desc,
            content: desc
              ? desc.split(/\n{2,}/g).filter(Boolean)
              : [],
            image: img,
          };
        });
        setNews(mapped);
      } else {
        fetchJson("/data/news.json").then(setNews);
      }
    })();
    // Try API for events first, fallback to local JSON
    (async () => {
      const apiEvents = await tryApiFetch("/events", { auth: false });
      if (Array.isArray(apiEvents) && apiEvents.length) {
        setEvents(
          apiEvents.map((e) => ({
            id: String(e.id ?? e.externalId ?? Math.random().toString(36).slice(2)),
            date: pick(e.date, e.date_of_event) || "",
            title: pick(e.title, e.event_title) || "",
            time: pick(e.time, e.event_time) || "",
            place: pick(e.place, e.event_place) || "",
            desc: pick(e.desc, e.description) || "",
          }))
        );
      } else {
        fetchJson("/data/events.json").then(setEvents);
      }
    })();
    // Try API for persons first, fallback to local JSON
    (async () => {
      const apiPersons = await tryApiFetch("/persons", { auth: false });
      if (Array.isArray(apiPersons) && apiPersons.length) {
        // Merge rich profile fields from local JSON (bio/laws/schedule/etc)
        const localDeps = await fetchJson("/data/deputies.json");
        const localByExternalId = new Map(
          (localDeps || []).map((d) => [String(d.id ?? ""), d])
        );

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
              p.city ||
              p.district ||
              "",
            faction: local?.faction || pick(p.faction, p.committee) || "",
            convocation: local?.convocation || pick(p.convocation) || "",
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
              phone:
                pick(p.phoneNumber, p.phone_number, p.phone) ||
                local?.contacts?.phone ||
                "",
              email: p.email || local?.contacts?.email || "",
            },
            laws: Array.isArray(local?.laws) ? local.laws : [],
            incomeDocs: Array.isArray(local?.incomeDocs) ? local.incomeDocs : [],
            schedule: Array.isArray(local?.schedule) ? local.schedule : [],
          };
        });
        setDeputies(mapped);
      } else {
        fetchJson("/data/deputies.json").then(setDeputies);
      }

      // Documents from API (laws, resolutions, etc) - fallback to local JSON
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
            category: d.category || typeLabels[d.type] || d.type || "Документы",
            type: d.type || "other",
            url: d.url || firstFileLink(d.file) || "",
          }))
        );
      } else {
        fetchJson("/data/documents.json").then(setDocuments);
      }

      // Fetch filters from API if available
      const [apiFactions, apiDistricts, apiConvocations, apiCategories] =
        await Promise.all([
          tryApiFetch("/persons/factions/all", { auth: false }),
          tryApiFetch("/persons/districts/all", { auth: false }),
          tryApiFetch("/persons/convocations/all", { auth: false }),
          tryApiFetch("/persons/categories/all", { auth: false }),
        ]);
      if (Array.isArray(apiFactions) && apiFactions.length) setFactions(apiFactions);
      if (Array.isArray(apiDistricts) && apiDistricts.length) setDistricts(apiDistricts);
      if (Array.isArray(apiConvocations) && apiConvocations.length) setConvocations(apiConvocations);
      // NOTE: apiCategories is not committees. Committees are loaded from /data/committees.json.
    })();
    // Structure-derived lists
    fetchJson("/data/structure.json").then((s) => {
      if (!factions.length) setFactions(s.factions || []);
      if (!districts.length) setDistricts(s.districts || []);
      if (!convocations.length) setConvocations(s.convocations || []);
      setCommissions(s.commissions || []);
      setCouncils(s.councils || []);
    });
    fetchJson("/data/government.json").then(setGovernment);
    fetchJson("/data/authorities.json").then(setAuthorities);
    // Committees are a static structure file (with members/staff); always load them.
    fetchJson("/data/committees.json").then(setCommittees);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = React.useMemo(
    () => ({
      slides,
      news,
      events,
      deputies,
      factions,
      districts,
      convocations,
      government,
      authorities,
      documents,
      committees,
      // Setters (for Admin)
      setSlides,
      setNews,
      setEvents,
      setDeputies,
      setFactions,
      setDistricts,
      setConvocations,
      setGovernment,
      setAuthorities,
      setDocuments,
      setCommittees,
    }),
    [
      slides,
      news,
      events,
      deputies,
      factions,
      districts,
      convocations,
      government,
      authorities,
      documents,
      committees,
      setSlides,
      setNews,
      setEvents,
      setDeputies,
      setFactions,
      setDistricts,
      setConvocations,
      setGovernment,
      setAuthorities,
      setDocuments,
      setCommittees,
    ]
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
