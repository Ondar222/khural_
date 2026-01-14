import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { Select, Button, Dropdown } from "antd";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { PersonsApi } from "../api/client.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

const CONVOCATION_ORDER = ["VIII", "VII", "VI", "V", "IV", "III", "II", "I", "Все"];
const STORAGE_KEY = "khural_deputies_overrides_v1";

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
    out.push(patch ? { ...d, ...patch } : d);
    seen.add(id);
  }

  for (const d of created) {
    const id = String(d?.id ?? "");
    if (!id) continue;
    if (deleted.has(id)) continue;
    if (seen.has(id)) continue;
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
  const district = toText(p.electoralDistrict || p.electoral_district || p.district);
  const faction = toText(p.faction);
  const convocation = toText(p.convocationNumber || p.convocation || p.convocation_number);
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

  for (const d of base) {
    const id = String(d?.id ?? "");
    if (!id) continue;
    const apiD = apiById.get(id);
    out.push(apiD ? { ...d, ...apiD } : d);
    seen.add(id);
  }
  for (const d of api) {
    const id = String(d?.id ?? "");
    if (!id) continue;
    if (seen.has(id)) continue;
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

  // Filters per structure
  const [convocation, setConvocation] = React.useState("Все");
  const [committeeId, setCommitteeId] = React.useState("Все");
  const [faction, setFaction] = React.useState("Все");
  const [district, setDistrict] = React.useState("Все");
  const [openConv, setOpenConv] = React.useState(false);

  React.useEffect(() => {
    if (convocation === "Все") return;
    if (!Array.isArray(deputies) || deputies.length === 0) return;
    const hasAny = deputies.some((d) => d?.convocation === convocation);
    if (!hasAny) setConvocation("Все");
  }, [convocation, deputies]);

  const districts = React.useMemo(() => {
    const items = Array.isArray(structureDistricts) ? structureDistricts : [];
    const stringItems = items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
        return String(item || "");
      })
      .filter((item) => item && item.trim() !== "");
    return ["Все", ...stringItems];
  }, [structureDistricts]);

  const convocations = React.useMemo(() => {
    const items = Array.isArray(structureConvocations) ? structureConvocations : [];
    const stringItems = items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
        return String(item || "");
      })
      .filter((item) => item && item.trim() !== "");
    return ["Все", ...stringItems];
  }, [structureConvocations]);

  const factions = React.useMemo(() => {
    const items = Array.isArray(structureFactions) ? structureFactions : [];
    const stringItems = items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
        return String(item || "");
      })
      .filter((item) => item && item.trim() !== "");
    return ["Все", ...stringItems];
  }, [structureFactions]);

  const convMenuItems = React.useMemo(() => {
    const av = Array.from(new Set(convocations));
    const ordered = CONVOCATION_ORDER.filter((x) => av.includes(x));
    return ordered.map((c) => ({
      key: c,
      label: c === "Все" ? "Все созывы" : `${c} созыв`,
      onClick: () => {
        setConvocation(c);
        setOpenConv(false);
      },
    }));
  }, [convocations]);

  const committeeOptions = React.useMemo(() => ["Все", ...(committees || []).map((c) => c.id)], [committees]);

  const committeeMatcher = React.useMemo(() => {
    if (committeeId === "Все") return null;
    const c = (committees || []).find((x) => x.id === committeeId);
    if (!c) return null;
    const ids = new Set();
    const names = new Set();
    (c.members || []).forEach((m) => {
      if (!m) return;
      if (m.id) ids.add(m.id);
      if (m.name) names.add(m.name);
    });
    return { ids, names };
  }, [committeeId, committees]);

  const filtered = React.useMemo(() => {
    return deputies.filter((d) => {
      if (convocation !== "Все" && d.convocation !== convocation) return false;
      if (faction !== "Все" && d.faction !== faction) return false;
      if (district !== "Все" && d.district !== district) return false;
      if (committeeMatcher) {
        if (committeeMatcher.ids.has(d.id)) return true;
        if (committeeMatcher.names.has(d.name)) return true;
        return false;
      }
      return true;
    });
  }, [deputies, convocation, faction, district, committeeMatcher]);

  React.useEffect(() => {
    const applyFromHash = () => {
      const sp = new URLSearchParams(window.location.search || "");
      const f = sp.get("faction");
      const d = sp.get("district");
      const cv = sp.get("convocation");
      const cm = sp.get("committee");
      if (f) setFaction(decodeURIComponent(f));
      if (d) setDistrict(decodeURIComponent(d));
      if (cv) setConvocation(decodeURIComponent(cv));
      if (cm) setCommitteeId(decodeURIComponent(cm));
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
            <DataState
              loading={Boolean(loading?.deputies) && (!deputies || deputies.length === 0)}
              error={errors?.deputies}
              onRetry={reload}
              empty={!loading?.deputies && (!deputies || deputies.length === 0)}
              emptyDescription="Список депутатов пуст"
            >
              <div className="filters filters--deputies">
                <Dropdown open={openConv} onOpenChange={setOpenConv} menu={{ items: convMenuItems }}>
                  <Button size="large">
                    <span className="filters__btnText">
                      {convocation === "Все" ? "Все созывы" : `${convocation} созыв`}
                    </span>
                    <span className="filters__btnCaret" aria-hidden="true">
                      ▾
                    </span>
                  </Button>
                </Dropdown>
                <Select
                  value={committeeId}
                  onChange={setCommitteeId}
                  dropdownMatchSelectWidth={false}
                  options={committeeOptions.map((id) =>
                    id === "Все"
                      ? { value: "Все", label: "По комитетам: Все" }
                      : {
                          value: id,
                          label: `По комитетам: ` + ((committees || []).find((c) => c.id === id)?.title || id),
                        }
                  )}
                />
                <Select
                  value={faction}
                  onChange={setFaction}
                  dropdownMatchSelectWidth={false}
                  options={factions.map((x) => ({
                    value: x,
                    label: x === "Все" ? "По фракциям: Все" : `По фракциям: ${x}`,
                  }))}
                  placeholder="Фракция"
                />
                <Select
                  value={district}
                  onChange={setDistrict}
                  dropdownMatchSelectWidth={false}
                  options={districts.map((x) => ({
                    value: x,
                    label: x === "Все" ? "По округам: Все" : `По округам: ${x}`,
                  }))}
                  placeholder="Округ"
                />
              </div>

              <DataState
                loading={apiBusy && filtered.length === 0}
                error={null}
                empty={filtered.length === 0}
                emptyDescription="По выбранным фильтрам ничего не найдено"
              >
                <div className="grid cols-3">
                  {filtered.map((d) => {
                    const photoRaw =
                      typeof d.photo === "string"
                        ? d.photo
                        : d.photo?.link || d.photo?.url || (d.image && (d.image.link || d.image.url)) || "";
                    const photo = normalizeFilesUrl(photoRaw);
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
                            {d.reception && (
                              <li>
                                <span>⏰</span>
                                <span>Приём: {toDisplay(d.reception)}</span>
                              </li>
                            )}
                            {d.district && (
                              <li>
                                <span>🏛️</span>
                                <span>{toDisplay(d.district)}</span>
                              </li>
                            )}
                            {d.faction && (
                              <li>
                                <span>👥</span>
                                <span>{toDisplay(d.faction)}</span>
                              </li>
                            )}
                            {d.convocation && (
                              <li>
                                <span>🎖️</span>
                                <span>Созыв: {toDisplay(d.convocation)}</span>
                              </li>
                            )}
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


