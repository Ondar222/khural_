import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { Select } from "antd";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { PersonsApi, CommitteesApi } from "../api/client.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

const CONVOCATION_ORDER = ["VIII", "VII", "VI", "V", "IV", "III", "II", "I", "Все"];
const STORAGE_KEY = "khural_deputies_overrides_v1";
const STATUS_OPTIONS = [
  { value: "active", label: "Действующие" },
  { value: "ended", label: "Прекратившие полномочия" },
  { value: "all", label: "Все" },
];

function normalizeConvocationToken(raw) {
  const s = String(raw || "").replace(/\u00A0/g, " ").trim();
  if (!s) return "";
  if (s.toLowerCase() === "все") return "Все";
  // Strip common words to avoid "VIII созыв созыв"
  const cleaned = s
    .replace(/\(.*?\)/g, " ")
    .replace(/архив/gi, " ")
    .replace(/созыв(а|ы)?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const roman = cleaned.match(/\b([IVX]{1,8})\b/i);
  if (roman) return roman[1].toUpperCase();
  const num = cleaned.match(/\b(\d{1,2})\b/);
  if (num) return num[1];
  return cleaned;
}

function formatConvocationLabel(token) {
  if (token === "Все") return "Все созывы";
  if (!token) return "Без созыва";
  return `${token} созыв`;
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readOverrides() {
  if (typeof window === "undefined") return { created: [], updatedById: {}, deletedIds: [] };
  const raw = window.localStorage?.getItem(STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById: parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

function mergeDeputies(base, overrides) {
  const list = Array.isArray(base) ? base : [];
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById = overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
  const deleted = new Set((overrides?.deletedIds || []).map((x) => String(x)));

  const out = [];
  const seen = new Set();

  for (const d of list) {
    const id = String(d?.id ?? "");
    if (!id) continue;
    if (deleted.has(id)) continue;
    const patch = updatedById[id];
    const merged = patch ? { ...d, ...patch } : d;
    // Ensure status fields are preserved as booleans
    merged.mandateEnded = Boolean(merged.mandateEnded ?? merged.mandate_ended);
    merged.isDeceased = Boolean(merged.isDeceased ?? merged.is_deceased);
    out.push(merged);
    seen.add(id);
  }

  for (const d of created) {
    const id = String(d?.id ?? "");
    if (!id) continue;
    if (deleted.has(id)) continue;
    if (seen.has(id)) continue;
    // Ensure status fields are preserved as booleans
    d.mandateEnded = Boolean(d.mandateEnded ?? d.mandate_ended);
    d.isDeceased = Boolean(d.isDeceased ?? d.is_deceased);
    out.push(d);
    seen.add(id);
  }

  return out;
}

function toDisplay(v) {
  if (v === undefined || v === null) return "";
  const stripTags = (s) => String(s || "").replace(/<[^>]*>/g, "").trim();
  if (typeof v === "string") return stripTags(v);
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    // receptionSchedule may be stored as object with notes
    if (typeof v?.notes === "string") return stripTags(v.notes);
    return stripTags(v.name || v.title || v.label || v.fullName || String(v));
  }
  return stripTags(String(v));
}

/** Извлекает адрес, время работы и кабинет из reception */
function extractReceptionInfo(v) {
  const raw =
    typeof v === "string"
      ? v
      : v && typeof v === "object" && typeof v.notes === "string"
        ? v.notes
        : "";
  let plain = String(raw || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  // Если текст слишком длинный (более 150 символов) или содержит ключевые слова биографии, не показываем его в карточке
  const isBiography = plain.length > 150 || 
    /родился|родилась|окончил|окончила|работал|работала|награды|награжден|избран|назначен/i.test(plain);
  
  if (isBiography) {
    return { address: "", workTime: "", office: "" };
  }
  
  let address = "";
  let workTime = "";
  let office = "";
  
  if (plain) {
    // Ищем адрес (г. Кызыл, ул. Ленина, д. 32)
    const addressMatch = plain.match(/(г\.\s*[^,\n]+(?:,\s*ул\.\s*[^,\n]+(?:,\s*д\.\s*\d+)?)?)/i);
    if (addressMatch) {
      address = addressMatch[1].trim();
    }
    // Ищем кабинет
    const officeMatch = plain.match(/кабинет\s*(\d+)/i);
    if (officeMatch) {
      office = `кабинет ${officeMatch[1]}`;
    }
    // Ищем время работы (09:00-11:00 или "третий понедельник месяца, 09:00-11:00")
    const timeMatch = plain.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/);
    if (timeMatch) {
      workTime = timeMatch[1];
    } else {
      // Ищем описание времени типа "третий понедельник месяца"
      const dayMatch = plain.match(/((?:первый|второй|третий|четвертый|последний)\s+(?:понедельник|вторник|среда|четверг|пятница)\s+месяца)/i);
      if (dayMatch) {
        workTime = dayMatch[1];
      }
    }
  }
  
  return { address, workTime, office };
}

function normalizeApiDeputy(p) {
  const toText = (v) => {
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v.trim();
    if (typeof v === "object") return String(v?.name || v?.title || v?.label || "").trim();
    return String(v).trim();
  };
  const toLink = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v.trim();
    if (Array.isArray(v)) {
      for (const item of v) {
        const got = toLink(item);
        if (got) return got;
      }
      return "";
    }
    if (typeof v === "object") {
      const direct =
        v.link ||
        v.url ||
        v.src ||
        v.path ||
        v.file?.link ||
        v.file?.url ||
        v.image?.link ||
        v.image?.url ||
        "";
      if (direct) return String(direct).trim();
      const id = v.id || v.file?.id || v.imageId || v.image_id || v.photoId || v.photo_id || v.avatarId || v.avatar_id;
      if (id) return `/files/v2/${String(id).trim()}`;
    }
    return "";
  };
  if (!p || typeof p !== "object") return null;
  const id = String(p.id ?? p._id ?? p.personId ?? "");
  if (!id) return null;
  const name = toText(p.fullName || p.full_name || p.name);
  const district = toText(
    p.electoralDistrict ||
      p.electoral_district ||
      (Array.isArray(p.districts) && p.districts[0]?.name) ||
      p.district
  );
  const faction = toText(p.faction || (Array.isArray(p.factions) && p.factions[0]?.name));
  const convocations = (() => {
    const arr = Array.isArray(p.convocations) ? p.convocations : [];
    const names = arr
      .map((c) => (c && typeof c === "object" ? c.name : c))
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    const single = toText(p.convocationNumber || p.convocation || p.convocation_number);
    const merged = [...new Set([...names, ...(single ? [single] : [])])];
    return merged;
  })();
  const convocation = convocations[0] || toText(p.convocationNumber || p.convocation || p.convocation_number);
  const biography = p.biography || p.bio || p.description || "";
  const contacts = {
    phone: toText(p.phoneNumber || p.phone_number || p.phone || p.contacts?.phone),
    email: toText(p.email || p.contacts?.email),
  };
  const photo = normalizeFilesUrl(
    toLink(p?.image) ||
      toLink(p?.photo) ||
      toLink(p?.avatar) ||
      toLink(p?.media) ||
      toLink(p?.files) ||
      toLink(p?.attachments) ||
      toText(p?.photoUrl || p?.photo_url) ||
      ""
  );
  const position = toText(p.position || p.role);

  return {
    ...p,
    id,
    name: name || p.name || "",
    fullName: name,
    district,
    electoralDistrict: district,
    faction,
    convocation,
    convocationNumber: convocation,
    convocations,
    mandateEnded: Boolean(p.mandateEnded ?? p.mandate_ended),
    isDeceased: Boolean(p.isDeceased ?? p.is_deceased),
    contacts,
    photo,
    position,
    biography,
    bio: p.bio || biography,
    description: p.description || biography,
  };
}

function mergeByIdPreferApi(baseDeputies, apiDeputies) {
  const base = Array.isArray(baseDeputies) ? baseDeputies : [];
  const api = Array.isArray(apiDeputies) ? apiDeputies : [];
  const apiById = new Map(api.map((d) => [String(d.id), d]));
  const out = [];
  const seen = new Set();
  const hasValue = (v) => {
    if (v === undefined || v === null) return false;
    const s = String(v).trim();
    return s !== "" && s !== "undefined" && s !== "null";
  };

  for (const d of base) {
    const id = String(d?.id ?? "");
    if (!id) continue;
    const apiD = apiById.get(id);
    const merged = apiD ? { ...d, ...apiD } : d;
    if (apiD && !hasValue(apiD.photo) && hasValue(d.photo)) {
      merged.photo = d.photo;
    }
    // Ensure status fields are preserved as booleans (prefer API values)
    merged.mandateEnded = Boolean(merged.mandateEnded ?? merged.mandate_ended);
    merged.isDeceased = Boolean(merged.isDeceased ?? merged.is_deceased);
    out.push(merged);
    seen.add(id);
  }
  for (const d of api) {
    const id = String(d?.id ?? "");
    if (!id) continue;
    if (seen.has(id)) continue;
    // Ensure status fields are preserved as booleans
    d.mandateEnded = Boolean(d.mandateEnded ?? d.mandate_ended);
    d.isDeceased = Boolean(d.isDeceased ?? d.is_deceased);
    out.push(d);
    seen.add(id);
  }
  return out;
}

export default function DeputiesV2() {
  const {
    deputies: baseDeputies,
    committees,
    factions: structureFactions,
    districts: structureDistricts,
    convocations: structureConvocations,
    loading,
    errors,
    reload,
  } = useData();
  const { t } = useI18n();

  const [overrides, setOverrides] = React.useState(() => readOverrides());
  const [apiDeputies, setApiDeputies] = React.useState([]);
  const [apiBusy, setApiBusy] = React.useState(false);
  
  // Filter options from API
  const [apiFactions, setApiFactions] = React.useState([]);
  const [apiDistricts, setApiDistricts] = React.useState([]);
  const [apiConvocations, setApiConvocations] = React.useState([]);
  const [apiCommittees, setApiCommittees] = React.useState([]);
  const [filtersLoading, setFiltersLoading] = React.useState(false);

  // Load filters from API
  React.useEffect(() => {
    let alive = true;
    const loadFilters = async () => {
      setFiltersLoading(true);
      try {
        const [factionsRes, districtsRes, convocationsRes, committeesRes] = await Promise.all([
          PersonsApi.listFactionsAll().catch(() => []),
          PersonsApi.listDistrictsAll().catch(() => []),
          PersonsApi.listConvocationsAll().catch(() => []),
          CommitteesApi.list({ all: true }).catch(() => []),
        ]);

        if (!alive) return;

        // Normalize factions
        const factions = Array.isArray(factionsRes) ? factionsRes : [];
        const normalizedFactions = factions
          .map((f) => {
            if (typeof f === "string") return f;
            if (f && typeof f === "object") return f.name || f.title || f.label || String(f);
            return String(f || "");
          })
          .filter((f) => f && f.trim() !== "");
        setApiFactions(normalizedFactions);

        // Normalize districts
        const districts = Array.isArray(districtsRes) ? districtsRes : [];
        const normalizedDistricts = districts
          .map((d) => {
            if (typeof d === "string") return d;
            if (d && typeof d === "object") return d.name || d.title || d.label || String(d);
            return String(d || "");
          })
          .filter((d) => d && d.trim() !== "");
        setApiDistricts(normalizedDistricts);

        // Normalize convocations
        const convocations = Array.isArray(convocationsRes) ? convocationsRes : [];
        const normalizedConvocations = convocations
          .map((c) => {
            if (typeof c === "string") return normalizeConvocationToken(c);
            if (c && typeof c === "object") {
              const name = c.name || c.title || c.label || String(c);
              return normalizeConvocationToken(name);
            }
            return normalizeConvocationToken(String(c || ""));
          })
          .filter((c) => c && c !== "Все");
        setApiConvocations(normalizedConvocations);

        // Normalize committees
        const committees = Array.isArray(committeesRes) ? committeesRes : [];
        setApiCommittees(committees);
      } catch (error) {
        console.error("Failed to load filters from API:", error);
      } finally {
        if (alive) setFiltersLoading(false);
      }
    };

    loadFilters();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    let alive = true;
    const loadApi = async () => {
      setApiBusy(true);
      try {
        const res = await PersonsApi.list().catch(() => null);
        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        const mapped = arr.map(normalizeApiDeputy).filter(Boolean);
        if (alive) setApiDeputies(mapped);
      } finally {
        if (alive) setApiBusy(false);
      }
    };

    const onCustom = () => {
      setOverrides(readOverrides());
      loadApi();
      // Also trigger a DataContext reload for cases when API is available publicly
      reload();
    };
    const onStorage = (e) => {
      if (e?.key === STORAGE_KEY) {
        setOverrides(readOverrides());
        loadApi();
        reload();
      }
    };
    window.addEventListener("khural:deputies-updated", onCustom);
    window.addEventListener("storage", onStorage);
    loadApi();
    return () => {
      alive = false;
      window.removeEventListener("khural:deputies-updated", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload]);

  const deputies = React.useMemo(() => {
    const withApi = mergeByIdPreferApi(baseDeputies, apiDeputies);
    return mergeDeputies(withApi, overrides);
  }, [baseDeputies, apiDeputies, overrides]);

  const getDeputyConvocations = React.useCallback((d) => {
    const list = Array.isArray(d?.convocations) ? d.convocations : [];
    const stringItems = list
      .map((x) => (typeof x === "string" ? x : x?.name || x?.title || x?.label || ""))
      .map((x) => normalizeConvocationToken(x))
      .filter(Boolean);
    const fallback = normalizeConvocationToken(d?.convocation || d?.convocationNumber || d?.convocation_number || "");
    const out = [...new Set([...stringItems, ...(fallback ? [fallback] : [])])].filter(Boolean);
    return out;
  }, []);

  const isEndedDeputy = React.useCallback((d) => Boolean(d?.mandateEnded || d?.isDeceased), []);

  // Filters per structure
  // Default: show all deputies (all convocations, all statuses).
  const [convocation, setConvocation] = React.useState("Все");
  const [committeeId, setCommitteeId] = React.useState("Все");
  const [faction, setFaction] = React.useState("Все");
  const [district, setDistrict] = React.useState("Все");
  // Public default: hide ended/deceased deputies (they are available in /deputies/ended)
  const [status, setStatus] = React.useState("active");

  const districts = React.useMemo(() => {
    // Prefer API data, fallback to structure data
    const apiItems = Array.isArray(apiDistricts) && apiDistricts.length > 0 ? apiDistricts : [];
    const structureItems = Array.isArray(structureDistricts) ? structureDistricts : [];
    const items = apiItems.length > 0 ? apiItems : structureItems;
    
    const stringItems = items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
        return String(item || "");
      })
      .filter((item) => item && item.trim() !== "");
    return ["Все", ...stringItems];
  }, [apiDistricts, structureDistricts]);

  const convocations = React.useMemo(() => {
    // Prefer API data, fallback to structure data and deputies
    const apiItems = Array.isArray(apiConvocations) && apiConvocations.length > 0 ? apiConvocations : [];
    const structureItems = Array.isArray(structureConvocations) ? structureConvocations : [];
    
    const fromApi = apiItems.length > 0 ? apiItems : [];
    
    const fromStructure = structureItems
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
        return String(item || "");
      })
      .map((x) => normalizeConvocationToken(x))
      .filter((x) => x && x !== "Все");

    const fromDeputies = [];
    const list = Array.isArray(deputies) ? deputies : [];
    for (const d of list) {
      const ds = getDeputyConvocations(d);
      ds.forEach((c) => {
        const tok = normalizeConvocationToken(c);
        if (tok && tok !== "Все") fromDeputies.push(tok);
      });
    }

    const set = new Set([...fromApi, ...fromStructure, ...fromDeputies]);
    const preferred = CONVOCATION_ORDER.filter((c) => c !== "Все" && set.has(c));
    const rest = Array.from(set).filter((c) => !preferred.includes(c)).sort();
    return ["Все", ...preferred, ...rest];
  }, [apiConvocations, structureConvocations, deputies, getDeputyConvocations]);

  // Ensure selected convocation exists in data; otherwise fallback gracefully.
  // Стабилизируем зависимости через длину массивов для предотвращения бесконечных циклов
  const deputiesLength = Array.isArray(deputies) ? deputies.length : 0;
  const convocationsLength = Array.isArray(convocations) ? convocations.length : 0;
  
  React.useEffect(() => {
    if (deputiesLength === 0) return;
    if (convocation === "Все") return;
    const hasAny = deputies.some((d) => getDeputyConvocations(d).includes(convocation));
    if (hasAny) return;

    const available = (Array.isArray(convocations) ? convocations : []).filter((c) => c && c !== "Все");
    const fallback = available.includes("VIII") ? "VIII" : available[0] || "Все";
    setConvocation(fallback);
  }, [convocation, deputiesLength, convocationsLength, getDeputyConvocations, deputies, convocations]);

  const factions = React.useMemo(() => {
    // Prefer API data, fallback to structure data
    const apiItems = Array.isArray(apiFactions) && apiFactions.length > 0 ? apiFactions : [];
    const structureItems = Array.isArray(structureFactions) ? structureFactions : [];
    const items = apiItems.length > 0 ? apiItems : structureItems;
    
    const stringItems = items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
        return String(item || "");
      })
      .filter((item) => item && item.trim() !== "");
    return ["Все", ...stringItems];
  }, [apiFactions, structureFactions]);

  const committeeOptions = React.useMemo(() => {
    // Prefer API data, fallback to structure data
    const apiItems = Array.isArray(apiCommittees) && apiCommittees.length > 0 ? apiCommittees : [];
    const structureItems = Array.isArray(committees) ? committees : [];
    const items = apiItems.length > 0 ? apiItems : structureItems;
    return ["Все", ...items.map((c) => c.id)];
  }, [apiCommittees, committees]);

  const committeeMatcher = React.useMemo(() => {
    if (committeeId === "Все") return null;
    // Use API committees if available, otherwise fallback to structure committees
    const apiItems = Array.isArray(apiCommittees) && apiCommittees.length > 0 ? apiCommittees : [];
    const structureItems = Array.isArray(committees) ? committees : [];
    const allCommittees = apiItems.length > 0 ? apiItems : structureItems;
    
    const c = allCommittees.find((x) => x.id === committeeId);
    if (!c) return null;
    const ids = new Set();
    const names = new Set();
    (c.members || []).forEach((m) => {
      if (!m) return;
      if (m.id) ids.add(m.id);
      if (m.name) names.add(m.name);
    });
    return { ids, names };
  }, [committeeId, apiCommittees, committees]);

  const filtered = React.useMemo(() => {
    const base = Array.isArray(deputies) ? deputies : [];
    return base.filter((d) => {
      const ended = isEndedDeputy(d);
      if (status === "active" && ended) return false;
      if (status === "ended" && !ended) return false;

      if (faction !== "Все" && d.faction !== faction) return false;
      if (district !== "Все" && d.district !== district) return false;
      if (committeeMatcher) {
        if (committeeMatcher.ids.has(d.id)) return true;
        if (committeeMatcher.names.has(d.name)) return true;
        return false;
      }
      return true;
    });
  }, [deputies, status, faction, district, committeeMatcher, isEndedDeputy]);

  const filteredByConvocation = React.useMemo(() => {
    const base = Array.isArray(filtered) ? filtered : [];
    const list = convocation === "Все" ? base : base.filter((d) => getDeputyConvocations(d).includes(convocation));

    // Stable, nice ordering: by convocation (VIII..I), then by name.
    const order = CONVOCATION_ORDER.filter((x) => x !== "Все");
    const rankOf = (c) => {
      const idx = order.indexOf(String(c || ""));
      return idx === -1 ? 999 : idx;
    };
    const getBestConv = (d) => {
      const ds = getDeputyConvocations(d);
      if (!ds || ds.length === 0) return "";
      // pick best (highest in order)
      let best = ds[0];
      for (const c of ds) {
        if (rankOf(c) < rankOf(best)) best = c;
      }
      return best;
    };

    return [...list].sort((a, b) => {
      // When showing all convocations, group implicitly by order (but without headers)
      if (convocation === "Все") {
        const ra = rankOf(getBestConv(a));
        const rb = rankOf(getBestConv(b));
        if (ra !== rb) return ra - rb;
        // Put "Без созыва" to the bottom
        if (ra === 999) return 1;
      }
      const na = String(a?.name || a?.fullName || "").toLowerCase();
      const nb = String(b?.name || b?.fullName || "").toLowerCase();
      return na.localeCompare(nb, "ru");
    });
  }, [filtered, convocation, getDeputyConvocations]);

  React.useEffect(() => {
    const applyFromHash = () => {
      const sp = new URLSearchParams(window.location.search || "");
      const f = sp.get("faction");
      const d = sp.get("district");
      const cv = sp.get("convocation");
      const cm = sp.get("committee");
      const st = sp.get("status");
      if (f) setFaction(decodeURIComponent(f));
      if (d) setDistrict(decodeURIComponent(d));
      if (cv) setConvocation(normalizeConvocationToken(decodeURIComponent(cv)));
      if (cm) setCommitteeId(decodeURIComponent(cm));
      if (st) {
        const val = String(st).toLowerCase();
        if (val === "active" || val === "ended" || val === "all") setStatus(val);
      }
    };
    applyFromHash();
    window.addEventListener("popstate", applyFromHash);
    window.addEventListener("app:navigate", applyFromHash);
    return () => {
      window.removeEventListener("popstate", applyFromHash);
      window.removeEventListener("app:navigate", applyFromHash);
    };
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <h1>{t("deputies")}</h1>
            <div style={{ marginTop: -6, marginBottom: 14, color: "var(--muted, #6b7280)" }}>
              {status === "ended"
                ? "Раздел: Депутаты прекратившие полномочия"
                : status === "active"
                  ? "Раздел: Действующие депутаты"
                  : "Раздел: Все депутаты"}
            </div>
            <DataState
              loading={Boolean(loading?.deputies) && (!deputies || deputies.length === 0)}
              error={errors?.deputies}
              onRetry={reload}
              empty={!loading?.deputies && (!deputies || deputies.length === 0)}
              emptyDescription="Список депутатов пуст"
            >
              <div className="filters filters--deputies">
                <Select
                  value={convocation}
                  onChange={setConvocation}
                  popupMatchSelectWidth={false}
                  options={(Array.isArray(convocations) ? convocations : []).map((c) => ({
                    value: c,
                    label: formatConvocationLabel(c),
                  }))}
                />
                <Select
                  value={status}
                  onChange={setStatus}
                  popupMatchSelectWidth={false}
                  options={STATUS_OPTIONS.map((x) => ({
                    value: x.value,
                    label: `Статус: ${x.label}`,
                  }))}
                />
                <Select
                  value={committeeId}
                  onChange={setCommitteeId}
                  popupMatchSelectWidth={false}
                  loading={filtersLoading}
                  options={committeeOptions.map((id) => {
                    if (id === "Все") {
                      return { value: "Все", label: "По комитетам: Все" };
                    }
                    // Use API committees if available, otherwise fallback to structure committees
                    const apiItems = Array.isArray(apiCommittees) && apiCommittees.length > 0 ? apiCommittees : [];
                    const structureItems = Array.isArray(committees) ? committees : [];
                    const allCommittees = apiItems.length > 0 ? apiItems : structureItems;
                    const committee = allCommittees.find((c) => c.id === id);
                    return {
                      value: id,
                      label: `По комитетам: ` + (committee?.title || committee?.name || id),
                    };
                  })}
                />
                <Select
                  value={faction}
                  onChange={setFaction}
                  popupMatchSelectWidth={false}
                  options={factions.map((x) => ({
                    value: x,
                    label: x === "Все" ? "По фракциям: Все" : `По фракциям: ${x}`,
                  }))}
                  placeholder="Фракция"
                />
                <Select
                  value={district}
                  onChange={setDistrict}
                  popupMatchSelectWidth={false}
                  options={districts.map((x) => ({
                    value: x,
                    label: x === "Все" ? "По округам: Все" : `По округам: ${x}`,
                  }))}
                  placeholder="Округ"
                />
              </div>

              <DataState
                loading={apiBusy && filteredByConvocation.length === 0}
                error={null}
                empty={filteredByConvocation.length === 0}
                emptyDescription="По выбранным фильтрам ничего не найдено"
              >
                <div className="grid cols-3">
                  {filteredByConvocation.map((d) => {
                    const photoRaw =
                      typeof d.photo === "string"
                        ? d.photo
                        : d.photo?.link || d.photo?.url || (d.image && (d.image.link || d.image.url)) || "";
                    const photo = normalizeFilesUrl(photoRaw);
                    const ended = isEndedDeputy(d);
                    const convs = getDeputyConvocations(d);
                    return (
                      <div key={d.id} className="gov-card">
                        <div className="gov-card__top">
                          {photo ? (
                            <img 
                              className="gov-card__avatar" 
                              src={photo} 
                              alt="" 
                              loading="lazy" 
                              decoding="async"
                              onError={(e) => {
                                // Если фото не загрузилось, заменяем на placeholder
                                const img = e.target;
                                const currentSrc = img.src || photo;
                                
                                // Если это URL с khural.rtyva.ru и мы еще не пробовали прокси
                                if (currentSrc.includes("khural.rtyva.ru") && !img.dataset.proxyTried) {
                                  img.dataset.proxyTried = "true";
                                  const proxyUrl = currentSrc.replace("https://khural.rtyva.ru", "/img-proxy");
                                  img.src = proxyUrl;
                                } else {
                                  // Если прокси не помог, заменяем на placeholder
                                  img.style.display = "";
                                  img.removeAttribute("src");
                                  img.classList.remove("gov-card__avatar");
                                  img.classList.add("gov-card__avatar-placeholder");
                                }
                              }}
                            />
                          ) : (
                            <div className="gov-card__avatar" aria-hidden="true" />
                          )}
                        </div>
                        <div className="gov-card__body">
                          <div className="gov-card__name">{toDisplay(d.name)}</div>
                          {d.position ? (
                            <div className="gov-card__role">{toDisplay(d.position)}</div>
                          ) : (
                            <div className="gov-card__role">Депутат</div>
                          )}
                          <ul className="gov-meta">
                            {(() => {
                              const receptionInfo = extractReceptionInfo(d.reception);
                              const address = d.address || receptionInfo.address;
                              return address || receptionInfo.office ? (
                                <li>
                                  <span>📍</span>
                                  <span>{address}{receptionInfo.office ? (address ? `, ${receptionInfo.office}` : receptionInfo.office) : ""}</span>
                                </li>
                              ) : null;
                            })()}
                            {(() => {
                              const receptionInfo = extractReceptionInfo(d.reception);
                              return receptionInfo.workTime ? (
                                <li>
                                  <span>⏰</span>
                                  <span>Время работы: {receptionInfo.workTime}</span>
                                </li>
                              ) : null;
                            })()}
                            {d.contacts?.phone && (
                              <li>
                                <span>📞</span>
                                <span>{toDisplay(d.contacts.phone)}</span>
                              </li>
                            )}
                            {d.contacts?.email && (
                              <li>
                                <span>✉️</span>
                                <span>{toDisplay(d.contacts.email)}</span>
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="gov-card__actions">
                          <a className="gov-card__btn" href={`/government?type=dep&id=${d.id}`}>
                            Подробнее
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DataState>
            </DataState>
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}


