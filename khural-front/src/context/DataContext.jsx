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
          const img =
            (Array.isArray(n.images) &&
              (n.images[0]?.file?.link || n.images[0]?.link)) ||
            "";
          return {
            id: String(n.id ?? Math.random().toString(36).slice(2)),
            title: ru?.title || "",
            category: n.category || "Новости",
            date: n.publishedAt || n.createdAt || new Date().toISOString(),
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
            date: e.date,
            title: e.title || "",
            time: e.time || "",
            place: e.place || "",
            desc: e.desc || "",
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
            name: p.fullName || p.name || local?.name || "",
            // PersonDetail expects "position" field for deputy
            position: local?.position || p.description || "",
            bio: local?.bio || "",
            district:
              local?.district ||
              p.electoralDistrict ||
              p.city ||
              p.district ||
              "",
            faction: local?.faction || p.faction || p.committee || "",
            convocation: local?.convocation || p.convocation || "",
            reception: local?.reception || p.receptionSchedule || "",
            address: local?.address || "",
            // Prefer stored image link, fallback to seeded photoUrl or old JSON photo
            photo:
              (p.image && (p.image.link || p.image.url)) ||
              p.photoUrl ||
              local?.photo ||
              p.photo ||
              "",
            contacts: {
              phone: p.phoneNumber || local?.contacts?.phone || p.phone || "",
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
            date: d.date || d.createdAt || "",
            number: d.number || "",
            category: d.category || typeLabels[d.type] || d.type || "Документы",
            type: d.type || "other",
            url: d.url || d.file?.link || "",
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
      if (Array.isArray(apiDistricts) && apiDistricts.length)
        setDistricts(apiDistricts);
      if (Array.isArray(apiConvocations) && apiConvocations.length)
        setConvocations(apiConvocations);
      if (Array.isArray(apiCategories) && apiCategories.length) {
        setCommittees(
          apiCategories.map((c) => ({
            id: c.id ?? c.value ?? c.name ?? String(c),
            title: c.title || c.name || String(c),
            members: [],
          }))
        );
      }
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
    // documents are loaded above (API first, fallback), keep local as backup only
    if (!committees.length)
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
