import React from "react";
import { App } from "antd";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  API_BASE_URL,
  NewsApi,
  PersonsApi,
  DocumentsApi,
  EventsApi,
  AppealsApi,
  SliderApi,
  ConvocationsApi,
  CommitteesApi,
  getAuthToken,
  apiFetch,
} from "../api/client.js";
import { addDeletedNewsId, readNewsOverrides } from "../utils/newsOverrides.js";
import { addDeletedDocumentId, readDocumentsOverrides } from "../utils/documentsOverrides.js";
import { readAdminTheme, writeAdminTheme } from "../pages/admin/adminTheme.js";
import { toPersonsApiBody } from "../api/personsPayload.js";
import { addCreatedEvent, updateEventOverride, addDeletedEventId } from "../utils/eventsOverrides.js";
import { addCreatedSlide, updateSlideOverride, addDeletedSlideId, setSliderOrder } from "../utils/sliderOverrides.js";
import {
  COMMITTEES_OVERRIDES_EVENT_NAME,
  readCommitteesOverrides,
  writeCommitteesOverrides,
  SYSTEM_COMMITTEE_IDS,
  COMMITTEE_DEFAULT_CONVOCATION,
} from "../utils/committeesOverrides.js";
import { normalizeBool } from "../utils/bool.js";
import {
  CONVOCATIONS_OVERRIDES_EVENT_NAME,
  CONVOCATIONS_OVERRIDES_STORAGE_KEY,
  readConvocationsOverrides,
  writeConvocationsOverrides,
} from "../utils/convocationsOverrides.js";

function toNewsFallback(items) {
  return (items || []).map((n) => ({
    id: n.id || n._id || Math.random().toString(36).slice(2),
    createdAt: n.date || n.createdAt || new Date().toISOString(),
    images: n.image ? [{ file: { id: "local", link: n.image } }] : [],
    content: [
      {
        lang: "ru",
        title: n.title || "",
        description: n.excerpt || "",
      },
    ],
  }));
}

function toPersonsFallback(items) {
  // Fallback should preserve rich local fields from DataContext (bio/laws/schedule/etc)
  // while normalizing to the shape AdminDeputies UI expects.
  return (items || []).map((p) => {
    const id = String(p?.id || p?._id || p?.personId || Math.random().toString(36).slice(2));
    const fullName = p?.fullName || p?.full_name || p?.name || "";
    const district = p?.electoralDistrict || p?.electoral_district || p?.district || "";
    const phone = p?.phoneNumber || p?.phone_number || p?.phone || p?.contacts?.phone || "";
    const email = p?.email || p?.contacts?.email || "";
    const image = p?.image || (p?.photo ? { link: p.photo } : null);
    return {
      ...p,
      id,
      fullName,
      name: p?.name || fullName,
      electoralDistrict: p?.electoralDistrict || district,
      district: p?.district || district,
      faction: p?.faction || "",
      phoneNumber: p?.phoneNumber || phone,
      email,
      description: p?.description || p?.position || "",
      image,
    };
  });
}

function toDocumentsFallback(items) {
  return (items || []).map((d) => ({
    id: d.id || d._id || Math.random().toString(36).slice(2),
    title: d.title || d.name || "",
    description: d.description || "",
    type: d.type || d.category || "other",
    file: d.file || (d.url ? { link: d.url } : null),
  }));
}

function toEventRow(e) {
  const start = e?.startDate ? new Date(Number(e.startDate)) : null;
  const date = start && !isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : e?.date || "";
  const time = start && !isNaN(start.getTime()) ? start.toISOString().slice(11, 16) : e?.time || "";
  return {
    id: e?.id ?? Math.random().toString(36).slice(2),
    date,
    time,
    place: e?.location || e?.place || "",
    title: e?.title || "",
    desc: e?.description || e?.desc || "",
    __raw: e,
  };
}

function pickSlideImage(s) {
  const img = s?.image;
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img?.link) return img.link;
  if (img?.file?.link) return img.file.link;
  if (img?.url) return img.url;
  return "";
}

function toSliderRow(s) {
  // Supports both API slider items and DataContext slides (title/desc/link/image).
  const fromContext = s && (s.desc !== undefined || s.link !== undefined);
  return {
    id: String(s?.id ?? Math.random().toString(36).slice(2)),
    title: String(s?.title || ""),
    description: String(s?.description ?? s?.desc ?? s?.subtitle ?? ""),
    url: String(s?.url ?? s?.link ?? s?.href ?? ""),
    isActive: s?.isActive !== false,
    order: Number(s?.order ?? 0),
    image: fromContext ? String(s?.image || "") : pickSlideImage(s),
    __raw: s,
  };
}

function normalizeServerList(payload) {
  if (Array.isArray(payload)) return payload;
  const p = payload?.data ? payload.data : payload;
  if (Array.isArray(p?.items)) return p.items;
  if (Array.isArray(p?.results)) return p.results;
  if (Array.isArray(p)) return p;
  return [];
}

function mapAppealStatusCodeToName(code) {
  const c = String(code || "").toLowerCase();
  if (c === "received") return "Принято";
  if (c === "in_progress") return "В работе";
  if (c === "responded") return "Ответ отправлен";
  if (c === "closed") return "Закрыто";
  return "";
}

function normalizeAppealStatus(status) {
  if (!status) return { name: "Принято", id: null, code: null, color: null };
  if (typeof status === "string") {
    const mapped = mapAppealStatusCodeToName(status);
    return { name: mapped || status, id: null, code: null, color: null };
  }
  if (typeof status === "number") {
    return { name: "Принято", id: status, code: null, color: null };
  }
  if (typeof status === "object") {
    const name =
      (typeof status?.name === "string" && status.name) ||
      (typeof status?.label === "string" && status.label) ||
      (typeof status?.value === "string" && status.value) ||
      mapAppealStatusCodeToName(status?.code) ||
      (typeof status?.code === "string" && status.code) ||
      "Принято";
    const id = typeof status?.id === "number" ? status.id : null;
    const code = typeof status?.code === "string" ? status.code : null;
    const color = typeof status?.color === "string" ? status.color : null;
    return { name, id, code, color };
  }
  return { name: "Принято", id: null, code: null, color: null };
}

function normalizeAppeal(a) {
  const createdAt = a?.createdAt || a?.created_at || a?.date || new Date().toISOString();
  const statusRaw = a?.status || a?.state || "Принято";
  const s = normalizeAppealStatus(statusRaw);
  const number = a?.number || a?.registrationNumber || a?.regNumber || a?.id || "";
  return {
    id: String(a?.id || a?._id || number || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    number: String(number || "").trim(),
    subject: a?.subject || a?.title || "",
    message: a?.message || a?.text || a?.content || "",
    response: a?.response || a?.adminResponse || a?.adminMessage || "",
    files: Array.isArray(a?.files) ? a.files : Array.isArray(a?.fileList) ? a.fileList : [],
    status: String(s?.name || "Принято"),
    statusId: s?.id ?? null,
    statusCode: s?.code ?? null,
    statusColor: s?.color ?? null,
    createdAt: String(createdAt),
    userEmail: a?.userEmail || a?.user?.email || a?.email || "",
    userName: a?.userName || a?.user?.name || a?.name || "",
  };
}

function toCalendarDto(values) {
  const safeString = (v) => {
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "object") {
      // Tinymce editor instance (or similar) can be circular; extract HTML safely.
      if (typeof v.getContent === "function") {
        try {
          return String(v.getContent() || "");
        } catch {
          return "";
        }
      }
      // Typical DOM/event shapes
      if (typeof v?.target?.value === "string") return v.target.value;
      // Common content shapes
      if (typeof v?.content === "string") return v.content;
      if (typeof v?.html === "string") return v.html;
      // Last resort: try JSON, then fallback to empty to avoid circular refs
      try {
        return JSON.stringify(v);
      } catch {
        return "";
      }
    }
    return String(v);
  };

  const date = safeString(values?.date);
  const time = safeString(values?.time) || "00:00";
  const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
  const dt = new Date(`${date}T00:00:00.000Z`);
  if (!isNaN(hh)) dt.setUTCHours(hh);
  if (!isNaN(mm)) dt.setUTCMinutes(mm);
  return {
    title: safeString(values?.title),
    description: safeString(values?.desc),
    location: safeString(values?.place),
    startDate: dt.getTime(),
    isPublic: true,
  };
}

function mapDocType(type) {
  const t = String(type || "").toLowerCase();
  if (t === "laws") return "law";
  if (t === "resolutions") return "resolution";
  if (t === "bills") return "decision";
  if (t === "initiatives") return "order";
  if (t === "civic") return "other";
  if (t === "constitution") return "other";
  return type || "other";
}

function normalizeCommitteeName(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mergeCommitteesPreferApi(apiList, fallbackList) {
  const api = Array.isArray(apiList) ? apiList : [];
  const fallback = Array.isArray(fallbackList) ? fallbackList : [];
  const out = api.map((c) => ({ ...c }));
  const byId = new Map();
  const byName = new Map();

  for (const c of out) {
    const id = String(c?.id ?? "");
    if (id) byId.set(id, c);
    const nameKey = normalizeCommitteeName(c?.name || c?.title || c?.label || c?.description);
    if (nameKey) byName.set(nameKey, c);
  }

  for (const c of fallback) {
    const id = String(c?.id ?? "");
    const nameKey = normalizeCommitteeName(c?.name || c?.title || c?.label || c?.description);
    const target = (id && byId.get(id)) || (nameKey && byName.get(nameKey)) || null;
    if (target) {
      if (!target.name && c?.name) target.name = c.name;
      if (!target.title && c?.title) target.title = c.title;
      if (!target.description && c?.description) target.description = c.description;
      if (!target.convocation && c?.convocation) target.convocation = c.convocation;
      if (!target.convocationId && c?.convocationId) target.convocationId = c.convocationId;
      if (!Array.isArray(target.members) && Array.isArray(c?.members)) target.members = c.members;
      continue;
    }
    out.push(c);
  }

  return out;
}

function normalizeConvocationKey(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mergeConvocationsPreferApi(apiList, fallbackList) {
  const api = Array.isArray(apiList) ? apiList : [];
  const fallback = Array.isArray(fallbackList) ? fallbackList : [];
  const out = api.map((c) => ({ ...c }));
  const byId = new Map();
  const byName = new Map();

  for (const c of out) {
    if (c == null) continue;
    if (typeof c === "string") {
      const key = normalizeConvocationKey(c);
      if (key) byName.set(key, { id: c, name: c });
      continue;
    }
    const id = String(c?.id ?? "");
    if (id) byId.set(id, c);
    const nameKey = normalizeConvocationKey(c?.name || c?.number || c?.title);
    if (nameKey) byName.set(nameKey, c);
  }

  for (const c of fallback) {
    if (c == null) continue;
    if (typeof c === "string") {
      const key = normalizeConvocationKey(c);
      if (!key) continue;
      if (byName.has(key)) continue;
      out.push({ id: c, name: c });
      byName.set(key, { id: c, name: c });
      continue;
    }
    const id = String(c?.id ?? "");
    const nameKey = normalizeConvocationKey(c?.name || c?.number || c?.title);
    const target = (id && byId.get(id)) || (nameKey && byName.get(nameKey)) || null;
    if (target) {
      if (!target.name && c?.name) target.name = c.name;
      if (!target.number && c?.number) target.number = c.number;
      if (!target.title && c?.title) target.title = c.title;
      if (target.isActive === undefined && c?.isActive !== undefined) target.isActive = c.isActive;
      continue;
    }
    out.push(c);
  }

  return out;
}

function mergeCommitteesWithOverrides(base, overrides) {
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById =
    overrides?.updatedById && typeof overrides.updatedById === "object"
      ? overrides.updatedById
      : {};
  // Удаление комитетов отключено — игнорируем deletedIds, чтобы список не исчезал.
  const deleted = new Set();

  const list = Array.isArray(base) ? base.slice() : [];
  const mergedBase = list
    .filter((c) => !deleted.has(String(c?.id ?? "")))
    .map((c) => {
      const id = String(c?.id ?? "");
      const upd = id && updatedById[id] ? updatedById[id] : null;
      return upd ? { ...c, ...upd } : c;
    });

  const createdFiltered = created.filter((c) => !deleted.has(String(c?.id ?? "")));
  const byId = new Map();
  for (const c of mergedBase) byId.set(String(c?.id ?? ""), c);
  for (const c of createdFiltered) {
    const id = String(c?.id ?? "");
    if (!id || byId.has(id)) continue;
    byId.set(id, c);
  }
  return Array.from(byId.values()).sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
}

/** Количество комитетов после дедупликации по названию (как в списке и на /committee) */
function countDeduplicatedCommittees(list) {
  const arr = Array.isArray(list) ? list : [];
  const getTitle = (c) => String(c?.title || c?.name || c?.label || c?.description || "").trim();
  const normalizeKey = (v) => String(v ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const richness = (c) => {
    let s = 0;
    if (String(c?.description ?? "").trim().length > 0) s += 2;
    const convId = c?.convocation?.id ?? c?.convocationId ?? c?.convocation_id ?? c?.convocation;
    if (convId != null && convId !== "") s += 2;
    const members = Array.isArray(c?.members) ? c.members : [];
    return s + members.length;
  };
  const byName = new Map();
  for (const c of arr) {
    const key = normalizeKey(getTitle(c));
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing || richness(c) > richness(existing)) byName.set(key, c);
  }
  return byName.size;
}

export function useAdminData() {
  const { message } = App.useApp();
  const data = useData();
  const {
    reload: reloadDataContext,
    setEvents: setDataContextEvents,
    events: dataContextEvents,
  } = data;
  const { isAuthenticated, user, logout, login } = useAuth();

  const apiBase = API_BASE_URL || "";

  // Keep latest public data for fallback without triggering fetch loops.
  const fallbackRef = React.useRef(data);
  React.useEffect(() => {
    fallbackRef.current = data;
  }, [data]);

  const [themeMode, setThemeMode] = React.useState(() => readAdminTheme());

  const [busy, setBusy] = React.useState(false);
  const [loginBusy, setLoginBusy] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [news, setNews] = React.useState([]);
  const [persons, setPersons] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [slider, setSlider] = React.useState([]);
  const [appeals, setAppeals] = React.useState([]);
  const [convocations, setConvocations] = React.useState([]);
  const [committees, setCommittees] = React.useState([]);
  const [pages, setPages] = React.useState([]);

  const canWrite = isAuthenticated;

  // Track whether committees list endpoint is healthy; if not, keep local fallback in sync.
  const committeesApiOkRef = React.useRef(true);

  const publicCommitteesFallback = React.useCallback(() => {
    const fb = fallbackRef.current || {};
    const list = Array.isArray(fb.committees) ? fb.committees : [];
    return list.map((c, idx) => {
      const title = String(c?.title || c?.name || "").trim();
      const short =
        title.length <= 255
          ? title
          : (title.split(",")[0] || title).trim().slice(0, 252).trimEnd() + "…";
      const convRaw = c?.convocation?.id ?? c?.convocationId ?? c?.convocation;
      let conv = null;
      if (convRaw && Array.isArray(convocations)) {
        conv = (() => {
          for (const it of convocations) {
            if (it == null) continue;
            if (typeof it === "string") {
              if (String(it) === String(convRaw)) return { id: it, name: it };
              continue;
            }
            const id = it?.id ?? it?.value;
            const name = it?.name ?? it?.number ?? it?.title;
            if (id != null && String(id) === String(convRaw)) return { id, name: name || id };
            if (name != null && String(name) === String(convRaw)) return { id: id ?? name, name };
          }
          return null;
        })();
      }
      return {
        id: `local-static-${String(c?.id || idx)}`,
        name: short || title || `Комитет ${idx + 1}`,
        description: title && short && title !== short ? title : "",
        convocation: conv,
        convocationId: conv?.id ?? null,
        isActive: true,
        order: idx,
        // keep original payload for potential future sync
        __source: c,
      };
    });
  }, [convocations]);

  React.useEffect(() => {
    document.body.classList.add("admin-mode");
    document.body.dataset.adminTheme = themeMode;
    return () => {
      document.body.classList.remove("admin-mode");
      delete document.body.dataset.adminTheme;
    };
  }, [themeMode]);

  const loadAll = React.useCallback(async () => {
    const fb = fallbackRef.current || {};
    const [apiNews, apiPersons, apiDocsResponse, apiSlider, apiConvocations, apiCommittees, apiPages] = await Promise.all([
      NewsApi.list().catch(() => null),
      PersonsApi.list().catch(() => null),
      DocumentsApi.listAll().catch(() => null),
      SliderApi.list({ all: true }).catch(() => null),
      ConvocationsApi.list().catch(() => null),
      CommitteesApi.list({ all: true }).catch(() => null),
      apiFetch("/pages", { method: "GET", auth: false }).catch(() => null),
    ]);
    const deletedNewsIds = new Set((readNewsOverrides()?.deletedIds || []).map(String));
    const newsList = Array.isArray(apiNews) ? apiNews : toNewsFallback(fb.news);
    setNews((newsList || []).filter((n) => !deletedNewsIds.has(String(n?.id ?? n?._id ?? ""))));
    setPersons(
      Array.isArray(apiPersons) && apiPersons.length
        ? apiPersons
        : toPersonsFallback(fb.deputies)
    );
    const apiDocs = apiDocsResponse?.items || (Array.isArray(apiDocsResponse) ? apiDocsResponse : []);
    const deletedDocs = new Set((readDocumentsOverrides()?.deletedIds || []).map(String));
    const docsList = Array.isArray(apiDocs) && apiDocs.length ? apiDocs : toDocumentsFallback(fb.documents);
    setDocuments((Array.isArray(docsList) ? docsList : []).filter((d) => !deletedDocs.has(String(d?.id ?? ""))));
    if (Array.isArray(apiSlider) && apiSlider.length) {
      setSlider(apiSlider.map(toSliderRow));
    } else {
      // Fallback to DataContext slides (it already falls back to /public/data/slides.json)
      const fallback = (Array.isArray(fb.slides) ? fb.slides : [])
        .slice(0, 5)
        .map((s, i) => ({ ...toSliderRow(s), order: i + 1, isActive: true }));
      setSlider(fallback);
    }
    const apiEvents = await EventsApi.list().catch(() => null);
    setEvents(Array.isArray(apiEvents) ? apiEvents.map(toEventRow) : fb.events || []);
    const apiAppealsResponse = await AppealsApi.listAll().catch(() => null);
    const apiAppeals = normalizeServerList(apiAppealsResponse);
    setAppeals(Array.isArray(apiAppeals) ? apiAppeals.map(normalizeAppeal) : []);
    const baseConv = Array.isArray(apiConvocations) ? apiConvocations : [];
    const fallbackConv = Array.isArray(fb.convocations) ? fb.convocations : [];
    const mergedConv = mergeConvocationsPreferApi(baseConv, fallbackConv);
    const convocationsList = mergeConvocationsWithOverrides(mergedConv, readConvocationsOverrides());
    setConvocations(convocationsList);
    const apiCommitteesList = Array.isArray(apiCommittees) ? apiCommittees : [];
    committeesApiOkRef.current = apiCommitteesList.length > 0;
    let baseCommittees = mergeCommitteesPreferApi(apiCommitteesList, publicCommitteesFallback());
    // Обогатить комитеты объектом созыва по convocationId/convocation_id для фильтра и колонки «Созыв»
    baseCommittees = baseCommittees.map((c) => {
      let convId = c?.convocation?.id ?? c?.convocationId ?? c?.convocation_id ?? c?.convocation;
      if (convId == null || convId === "") {
        const defaultNum = c?.id != null ? COMMITTEE_DEFAULT_CONVOCATION[String(c.id)] : undefined;
        if (defaultNum != null && defaultNum !== "") convId = defaultNum;
      }
      if (convId == null || convId === "") return c;
      const conv = Array.isArray(convocationsList)
        ? convocationsList.find(
            (it) =>
              it != null &&
              (String(it?.id ?? it?.value) === String(convId) || String(it?.name ?? it?.number ?? "") === String(convId))
          )
        : null;
      const convObj = conv
        ? (typeof conv === "string" ? { id: conv, name: conv } : { id: conv?.id ?? convId, name: conv?.name ?? conv?.number ?? String(convId) })
        : { id: convId, name: String(convId) };
      return { ...c, convocationId: c.convocationId ?? convId, convocation: c.convocation && (c.convocation?.name ?? c.convocation?.id) ? c.convocation : convObj };
    });
    setCommittees(mergeCommitteesWithOverrides(baseCommittees, readCommitteesOverrides()));
    const pagesList = normalizeServerList(apiPages);
    setPages(Array.isArray(pagesList) ? pagesList : []);
  }, [publicCommitteesFallback]);

  function mergeConvocationsWithOverrides(base, overrides) {
    const created = Array.isArray(overrides?.created) ? overrides.created : [];
    const updatedById =
      overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
    const deletedIds = new Set(Array.isArray(overrides?.deletedIds) ? overrides.deletedIds.map(String) : []);

    const out = [];
    const seen = new Set();
    for (const it of Array.isArray(base) ? base : []) {
    if (it == null) continue;
    if (typeof it === "string") {
      const idStr = String(it);
      if (!idStr) continue;
      if (deletedIds.has(idStr)) continue;
      const override = updatedById[idStr];
      const baseRow = { id: idStr, name: idStr };
      out.push(override ? { ...baseRow, ...override } : baseRow);
      seen.add(idStr);
      continue;
    }
    const idStr = String(it?.id ?? "");
    if (!idStr) continue;
    if (deletedIds.has(idStr)) continue;
    const override = updatedById[idStr];
    out.push(override ? { ...it, ...override } : it);
    seen.add(idStr);
    }
    for (const it of created) {
      const idStr = String(it?.id ?? "");
      if (!idStr) continue;
      if (deletedIds.has(idStr)) continue;
      if (seen.has(idStr)) continue;
      const override = updatedById[idStr];
      out.push(override ? { ...it, ...override } : it);
      seen.add(idStr);
    }
    return out;
  }

  React.useEffect(() => {
    // Load once on mount to avoid spamming the API (429).
    loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If API is down and DataContext committees load later, refresh local fallback once.
  React.useEffect(() => {
    if (committeesApiOkRef.current) return;
    const fbList = publicCommitteesFallback();
    if (!fbList.length) return;
    setCommittees((prev) =>
      Array.isArray(prev) && prev.length
        ? prev
        : mergeCommitteesWithOverrides(fbList, readCommitteesOverrides())
    );
  }, [data?.committees, publicCommitteesFallback]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => {
      setCommittees((prev) => mergeCommitteesWithOverrides(prev, readCommitteesOverrides()));
    };
    window.addEventListener(COMMITTEES_OVERRIDES_EVENT_NAME, apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener(COMMITTEES_OVERRIDES_EVENT_NAME, apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => {
      setConvocations((prev) => mergeConvocationsWithOverrides(prev, readConvocationsOverrides()));
    };
    const onStorage = (e) => {
      if (e?.key === CONVOCATIONS_OVERRIDES_STORAGE_KEY) apply();
    };
    window.addEventListener(CONVOCATIONS_OVERRIDES_EVENT_NAME, apply);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONVOCATIONS_OVERRIDES_EVENT_NAME, apply);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleTheme = React.useCallback(() => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    writeAdminTheme(next);
  }, [themeMode]);

  const reload = React.useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  // Allow child components (that don't have direct access to this hook) to request a refresh.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onReload = () => {
      reload();
    };
    window.addEventListener("khural:admin:reload", onReload);
    return () => window.removeEventListener("khural:admin:reload", onReload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createNews = React.useCallback(async (formData) => {
    setBusy(true);
    try {
      await NewsApi.createMultipart(formData);
      message.success("Новость создана");
      await reload();
      // Обновляем публичные данные, чтобы новость сразу появилась на сайте
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const updateNews = React.useCallback(async (id, formData) => {
    setBusy(true);
    try {
      await NewsApi.updateMultipart(id, formData);
      message.success("Новость обновлена");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const deleteNews = React.useCallback(async (id) => {
    setBusy(true);
    try {
      try {
        await NewsApi.remove(id);
        message.success("Новость удалена");
        await reload();
        reloadDataContext();
      } catch {
        // Fallback: allow local delete when API is unavailable (dev without backend / no rights)
        addDeletedNewsId(id);
        setNews((prev) =>
          (Array.isArray(prev) ? prev : []).filter((n) => String(n?.id ?? "") !== String(id))
        );
        message.warning("Удалено локально (сервер недоступен или нет прав)");
        reloadDataContext();
      }
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const createDeputy = React.useCallback(async (payload) => {
    setBusy(true);
    try {
      const { imageFile, ...body } = payload || {};
      const created = await PersonsApi.create(toPersonsApiBody(body));
      if (created?.id && imageFile) {
        await PersonsApi.uploadMedia(created.id, imageFile);
      }
      message.success("Депутат создан");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const updateDeputy = React.useCallback(async (id, payload) => {
    setBusy(true);
    try {
      const { imageFile, ...body } = payload || {};
      await PersonsApi.patch(id, toPersonsApiBody(body));
      if (imageFile) await PersonsApi.uploadMedia(id, imageFile);
      message.success("Депутат обновлён");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const deleteDeputy = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await PersonsApi.remove(id);
      message.success("Депутат удалён");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const createDocument = React.useCallback(async ({
    title,
    description,
    descriptionRu,
    descriptionTy,
    type,
    category,
    number,
    date,
    fileRu,
    fileTy,
    isPublished,
  }) => {
    setBusy(true);
    try {
      const safeString = (v) => {
        if (v === undefined || v === null) return "";
        if (typeof v === "string") return v;
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        if (typeof v === "object") {
          if (typeof v.getContent === "function") {
            try {
              return String(v.getContent() || "");
            } catch {
              return "";
            }
          }
          if (typeof v?.target?.value === "string") return v.target.value;
          if (typeof v?.content === "string") return v.content;
          if (typeof v?.html === "string") return v.html;
          try {
            return JSON.stringify(v);
          } catch {
            return "";
          }
        }
        return String(v);
      };
      const created = await DocumentsApi.create({
        title: safeString(title),
        content: safeString(description || descriptionRu) || "",
        type: mapDocType(type),
        metadata: category ? { 
          category,
          ...(descriptionTy ? { descriptionTy: safeString(descriptionTy) } : {})
        } : (descriptionTy ? { descriptionTy: safeString(descriptionTy) } : undefined),
        number: safeString(number),
        publishedAt: date ? Date.parse(date) : undefined,
        isPublished: isPublished ?? false,
      });
      if (created?.id) {
        if (fileRu) await DocumentsApi.uploadFile(created.id, fileRu);
        if (fileTy) await DocumentsApi.uploadFileTy(created.id, fileTy);
      }
      message.success("Документ создан");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const updateDocument = React.useCallback(async (
    id,
    { title, description, descriptionRu, descriptionTy, type, category, number, date, fileRu, fileTy, isPublished }
  ) => {
    setBusy(true);
    try {
      const safeString = (v) => {
        if (v === undefined || v === null) return "";
        if (typeof v === "string") return v;
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        if (typeof v === "object") {
          if (typeof v.getContent === "function") {
            try {
              return String(v.getContent() || "");
            } catch {
              return "";
            }
          }
          if (typeof v?.target?.value === "string") return v.target.value;
          if (typeof v?.content === "string") return v.content;
          if (typeof v?.html === "string") return v.html;
          try {
            return JSON.stringify(v);
          } catch {
            return "";
          }
        }
        return String(v);
      };
      await DocumentsApi.patch(id, {
        title: safeString(title),
        content: safeString(description || descriptionRu) || "",
        type: mapDocType(type),
        metadata: category ? { 
          category,
          ...(descriptionTy ? { descriptionTy: safeString(descriptionTy) } : {})
        } : (descriptionTy ? { descriptionTy: safeString(descriptionTy) } : undefined),
        number: safeString(number),
        publishedAt: date ? Date.parse(date) : undefined,
        isPublished: isPublished ?? false,
      });
      if (fileRu) await DocumentsApi.uploadFile(id, fileRu);
      if (fileTy) await DocumentsApi.uploadFileTy(id, fileTy);
      message.success("Документ обновлён");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const deleteDocument = React.useCallback(async (id) => {
    setBusy(true);
    try {
      try {
        await DocumentsApi.remove(id);
        message.success("Документ удалён");
      } catch {
        // Second attempt via same-origin proxy path (helps when API base was misconfigured on prod)
        try {
          const token = getAuthToken();
          const res = await fetch(`/api/documents/${encodeURIComponent(String(id))}`, {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          message.success("Документ удалён");
        } catch {
          // Fallback: hide locally when API is unavailable / no rights
          addDeletedDocumentId(String(id));
          message.warning("Документ удалён локально (сервер недоступен или нет прав)");
        }
      }
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const createEvent = React.useCallback(async (payload) => {
    setBusy(true);
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const localEvent = {
      id: tempId,
      date: String(payload?.date ?? "").trim() || new Date().toISOString().slice(0, 10),
      title: String(payload?.title ?? "").trim(),
      time: String(payload?.time ?? "").trim(),
      place: String(payload?.place ?? "").trim(),
      desc: String(payload?.desc ?? "").trim(),
      isImportant: Boolean(payload?.isImportant),
    };
    try {
      const created = await EventsApi.create(toCalendarDto(payload));
      message.success("Событие создано");

      if (created) {
        const toText = (v) => {
          if (v === undefined || v === null) return "";
          if (typeof v === "string") return v;
          if (typeof v === "number" || typeof v === "boolean") return String(v);
          if (typeof v === "object") {
            if (typeof v.getContent === "function") {
              try {
                return String(v.getContent() || "");
              } catch {
                return "";
              }
            }
            if (typeof v?.target?.value === "string") return v.target.value;
            if (typeof v?.content === "string") return v.content;
            if (typeof v?.html === "string") return v.html;
            return "";
          }
          return String(v);
        };
        const newEvent = {
          id: String(created.id ?? tempId),
          date: (() => {
            const d = payload.date;
            if (d) return toText(d);
            const start = created.startDate;
            if (!start) return "";
            const dt = new Date(Number(start));
            return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
          })(),
          title: toText(payload.title) || toText(created.title) || "",
          time: payload.time || (() => {
            const start = created.startDate;
            if (!start) return "";
            const dt = new Date(Number(start));
            if (isNaN(dt.getTime())) return "";
            return dt.toISOString().slice(11, 16);
          })(),
          place: toText(payload.place) || toText(created.location) || "",
          desc: toText(payload.desc) || toText(created.description) || "",
        };
        setDataContextEvents([...dataContextEvents, newEvent]);
        addCreatedEvent(newEvent);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      await reload();
    } catch (e) {
      // Локально созданное событие сохраняем в overrides, чтобы было видно всем (и при недоступности API)
      addCreatedEvent(localEvent);
      setDataContextEvents((prev) => [...prev, localEvent]);
      message.success("Событие сохранено локально");
    } finally {
      setBusy(false);
    }
  }, [message, reload, setDataContextEvents, dataContextEvents]);

  const updateEvent = React.useCallback(async (id, payload) => {
    setBusy(true);
    try {
      try {
        await EventsApi.patch(id, toCalendarDto(payload));
        message.success("Событие обновлено");
      } catch {
        // allow local update if API is unavailable/no rights
        message.warning("Обновлено локально (сервер недоступен или нет прав)");
      }

      // Оптимистично обновляем событие в DataContext + сохраняем в overrides, чтобы работало в календаре при 404/429
      if (dataContextEvents) {
        const toText = (v) => {
          if (v === undefined || v === null) return "";
          if (typeof v === "string") return v;
          if (typeof v === "number" || typeof v === "boolean") return String(v);
          if (typeof v === "object") {
            if (typeof v.getContent === "function") {
              try {
                return String(v.getContent() || "");
              } catch {
                return "";
              }
            }
            if (typeof v?.target?.value === "string") return v.target.value;
            if (typeof v?.content === "string") return v.content;
            if (typeof v?.html === "string") return v.html;
            return "";
          }
          return String(v);
        };
        const updatedEvent = {
          id: String(id),
          date: toText(payload.date) || "",
          title: toText(payload.title) || "",
          time: toText(payload.time) || "",
          place: toText(payload.place) || "",
          desc: toText(payload.desc) || "",
        };
        const updatedEvents = dataContextEvents.map((e) =>
          String(e.id) === String(id) ? updatedEvent : e
        );
        setDataContextEvents(updatedEvents);
        updateEventOverride(String(id), updatedEvent);
      }
      
      await reload();
      // Обновляем DataContext, чтобы календарь увидел обновленное событие (если API работает)
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext, setDataContextEvents, dataContextEvents]);

  const deleteEvent = React.useCallback(async (id) => {
    setBusy(true);
    try {
      try {
        await EventsApi.remove(id);
        message.success("Событие удалено");
      } catch {
        message.warning("Удалено локально (сервер недоступен или нет прав)");
      }
      addDeletedEventId(String(id));
      
      // Оптимистично удаляем событие из DataContext
      if (dataContextEvents) {
        const filteredEvents = dataContextEvents.filter((e) => String(e.id) !== String(id));
        setDataContextEvents(filteredEvents);
      }
      
      await reload();
      // Обновляем DataContext, чтобы календарь обновился после удаления (если API работает)
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext, setDataContextEvents, dataContextEvents]);

  const createSlide = React.useCallback(async ({ title, description, url, isActive }) => {
    setBusy(true);
    try {
      if (Array.isArray(slider) && slider.length >= 5) {
        throw new Error("Максимум 5 слайдов");
      }
      try {
        const created = await SliderApi.create({
          title: title || "",
          description: description || "",
          url: url || "",
          isActive: isActive ?? true,
        });
        message.success("Слайд создан");
        await reload();
        reloadDataContext();
        return created;
      } catch {
        // Fallback: create locally (useful for dev without backend)
        const localId = `local-slide-${Date.now()}`;
        const local = {
          id: localId,
          title: String(title || ""),
          desc: String(description || ""),
          link: String(url || ""),
          image: "", // can be set via upload fallback
          isActive: isActive ?? true,
          order: 0,
        };
        addCreatedSlide(local);
        setSlider((prev) => [toSliderRow(local), ...(Array.isArray(prev) ? prev : [])]);
        message.warning("Слайд создан локально (сервер недоступен или нет прав)");
        reloadDataContext();
        return local;
      }
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext, slider]);

  const updateSlide = React.useCallback(async (id, { title, description, url, isActive }) => {
    setBusy(true);
    try {
      const payload = {
        title: title || "",
        description: description || "",
        url: url || "",
        isActive: isActive ?? true,
      };
      const looksLocal = String(id || "").startsWith("imp-") || String(id || "").startsWith("local-");
      if (!looksLocal) {
        try {
          await SliderApi.patch(id, payload);
          message.success("Слайд обновлён");
          await reload();
          reloadDataContext();
          return;
        } catch {
          // fall back below
        }
      }
      updateSlideOverride(String(id), {
        id: String(id),
        title: String(payload.title),
        desc: String(payload.description),
        link: String(payload.url),
        isActive: payload.isActive,
      });
      setSlider((prev) =>
        (Array.isArray(prev) ? prev : []).map((s) =>
          String(s?.id) === String(id)
            ? {
                ...s,
                title: String(payload.title),
                description: String(payload.description),
                url: String(payload.url),
                isActive: payload.isActive,
              }
            : s
        )
      );
      message.warning("Слайд обновлён локально (сервер недоступен или нет прав)");
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const deleteSlide = React.useCallback(async (id) => {
    setBusy(true);
    try {
      const looksLocal = String(id || "").startsWith("imp-") || String(id || "").startsWith("local-");
      if (!looksLocal) {
        try {
          await SliderApi.remove(id);
          message.success("Слайд удалён");
          await reload();
          reloadDataContext();
          return;
        } catch {
          // fall back below
        }
      }
      addDeletedSlideId(String(id));
      setSlider((prev) => (Array.isArray(prev) ? prev : []).filter((s) => String(s?.id) !== String(id)));
      message.warning("Слайд удалён локально (сервер недоступен или нет прав)");
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const uploadSlideImage = React.useCallback(async (id, file) => {
    setBusy(true);
    try {
      const looksLocal = String(id || "").startsWith("imp-") || String(id || "").startsWith("local-");
      if (!looksLocal) {
        try {
          await SliderApi.uploadImage(id, file);
          message.success("Картинка загружена");
          await reload();
          reloadDataContext();
          return;
        } catch {
          // fall back below
        }
      }
      const toDataUrl = (f) =>
        new Promise((resolve) => {
          if (!f || typeof FileReader === "undefined") return resolve("");
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(f);
        });
      const dataUrl = typeof window !== "undefined" && file ? await toDataUrl(file) : "";
      const url = dataUrl || "";
      if (url) {
        updateSlideOverride(String(id), { image: url });
        setSlider((prev) =>
          (Array.isArray(prev) ? prev : []).map((s) => (String(s?.id) === String(id) ? { ...s, image: url } : s))
        );
      }
      message.warning("Картинка применена локально (сервер недоступен или нет прав)");
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const reorderSlides = React.useCallback(async (ids) => {
    setBusy(true);
    try {
      const arr = Array.isArray(ids) ? ids.map(String) : [];
      const hasLocal = arr.some((x) => x.startsWith("imp-") || x.startsWith("local-"));
      if (!hasLocal) {
        try {
          await SliderApi.reorder(arr);
          message.success("Порядок слайдов обновлён");
          await reload();
          reloadDataContext();
          return;
        } catch {
          // fall back below
        }
      }
      setSliderOrder(arr);
      setSlider((prev) => {
        const list = Array.isArray(prev) ? prev.slice() : [];
        const byId = new Map(list.map((s) => [String(s?.id), s]));
        const ordered = [];
        const used = new Set();
        for (const id of arr) {
          const it = byId.get(String(id));
          if (it) {
            ordered.push(it);
            used.add(String(id));
          }
        }
        for (const it of list) {
          const sid = String(it?.id ?? "");
          if (sid && !used.has(sid)) ordered.push(it);
        }
        return ordered;
      });
      message.warning("Порядок сохранён локально (сервер недоступен или нет прав)");
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const updateAppealStatus = React.useCallback(async (id, status, response) => {
    setBusy(true);
    try {
      await AppealsApi.updateStatus(id, status, response);
      // Сообщение об успехе показывается в компоненте
      // Обновляем локальный список
      setAppeals((prev) =>
        prev.map((a) => (String(a.id) === String(id) ? { ...a, status } : a))
      );
      await reload();
    } finally {
      setBusy(false);
    }
  }, [reload]);

  const deleteAppeal = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await AppealsApi.remove(id);
      message.success("Обращение удалено");
      setAppeals((prev) =>
        Array.isArray(prev) ? prev.filter((a) => String(a?.id) !== String(id)) : prev
      );
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const createConvocation = React.useCallback(async (payload) => {
    setBusy(true);
    try {
      try {
        await ConvocationsApi.create(payload);
      } catch (e) {
        // Fallback for older backend versions that accept only { name }
        if (e?.status === 400 && payload?.name) {
          await ConvocationsApi.create({ name: payload.name });
        } else {
          throw e;
        }
      }
      message.success("Созыв создан");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const updateConvocation = React.useCallback(async (id, payload) => {
    setBusy(true);
    try {
      const sid = String(id);
      // Always persist locally so UI/public site reflects status even if backend ignores it.
      const ov = readConvocationsOverrides();
      const updatedById =
        ov.updatedById && typeof ov.updatedById === "object" ? ov.updatedById : {};
      writeConvocationsOverrides({
        ...ov,
        updatedById: { ...updatedById, [sid]: { ...payload, id: sid } },
      });
      setConvocations((prev) =>
        mergeConvocationsWithOverrides(
          (Array.isArray(prev) ? prev : []).map((c) =>
            String(c?.id ?? "") === sid ? { ...c, ...payload } : c
          ),
          readConvocationsOverrides()
        )
      );
      try {
        await ConvocationsApi.patch(id, payload);
      } catch (e) {
        // Fallback for older backend versions that accept only { name }
        if (e?.status === 400 && payload?.name) {
          await ConvocationsApi.patch(id, { name: payload.name });
        } else {
          message.warning("Сервер не сохранил изменения. Сохранено локально.");
          return;
        }
      }
      message.success("Созыв обновлён");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const deleteConvocation = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await ConvocationsApi.remove(id);
      message.success("Созыв удалён");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const createCommittee = React.useCallback(async (payload) => {
    setBusy(true);
    try {
      const created = await CommitteesApi.create(payload);
      message.success("Комитет создан");
      await reload();
      return created;
    } catch (error) {
      // Fallback: save locally when API is down (500, network, etc.)
      console.error("Ошибка создания комитета:", error);
      const id = `local-${Date.now()}`;
      const next = {
        id,
        name: String(payload?.name || "").trim() || "Комитет",
        description: String(payload?.description || ""),
        phone: payload?.phone || "",
        email: payload?.email || "",
        address: payload?.address || "",
        website: payload?.website || "",
        head: payload?.head || "",
        convocationId:
          payload?.convocationId === null || payload?.convocationId === undefined
            ? null
            : Number(payload.convocationId),
        members: Array.isArray(payload?.members) ? payload.members : [],
        isActive: normalizeBool(payload?.isActive, true),
        order: payload?.order ?? Date.now(),
      };
      const ov = readCommitteesOverrides();
      writeCommitteesOverrides({
        ...ov,
        created: [...(Array.isArray(ov.created) ? ov.created : []), next],
      });
      setCommittees((prev) => mergeCommitteesWithOverrides(prev, readCommitteesOverrides()));
      message.warning("Сервер вернул 500. Комитет сохранён локально.");
      return next;
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const updateCommittee = React.useCallback(async (id, payload) => {
    const sid = String(id);
    if (SYSTEM_COMMITTEE_IDS.includes(sid) && payload?.isActive === false) {
      message.warning("Комитеты структуры нельзя отключить или удалить.");
      return;
    }
    setBusy(true);
    try {
      // Build a full snapshot for overrides so public pages can render even if API is unavailable.
      const baseList = Array.isArray(committees) ? committees : [];
      const found = baseList.find((c) => c && String(c.id) === sid) || null;
      const snapshot =
        found && typeof found === "object"
          ? { ...found, ...payload, id: found.id ?? sid }
          : { id: sid, ...payload };

      // Persist snapshot locally (safe even if API succeeds).
      const ov0 = readCommitteesOverrides();
      const updatedById0 =
        ov0.updatedById && typeof ov0.updatedById === "object" ? ov0.updatedById : {};
      writeCommitteesOverrides({
        ...ov0,
        updatedById: { ...updatedById0, [sid]: { ...(updatedById0[sid] || {}), ...snapshot } },
      });

      // Optimistically update local state
      setCommittees((prev) =>
        mergeCommitteesWithOverrides(
          (Array.isArray(prev) ? prev : []).map((c) => (String(c?.id ?? "") === sid ? { ...c, ...snapshot } : c)),
          readCommitteesOverrides()
        )
      );

      if (sid.startsWith("local-") || sid.startsWith("local-static-")) {
        message.success("Комитет обновлён (локально)");
        return;
      }

      try {
        await CommitteesApi.patch(id, payload);
        message.success("Комитет обновлён");
        await reload();
      } catch {
        // Fallback: keep change locally when backend is broken
        message.warning("Сервер недоступен. Изменения сохранены локально.");
      }
    } finally {
      setBusy(false);
    }
  }, [message, reload, committees]);

  const deleteCommittee = React.useCallback(async (id) => {
    const sid = String(id);
    if (SYSTEM_COMMITTEE_IDS.includes(sid)) {
      message.warning("Комитеты структуры нельзя удалить.");
      return;
    }
    message.warning("Удаление комитетов отключено. Используйте «Отключить».");
    await updateCommittee(id, { isActive: false });
  }, [message, updateCommittee]);

  const stats = React.useMemo(() => {
    const deletedNewsIds = new Set((readNewsOverrides()?.deletedIds || []).map(String));
    const visibleNews = (news || []).filter((n) => !deletedNewsIds.has(String(n?.id ?? n?._id ?? "")));
    return {
      deputies: Array.isArray(persons) ? persons.length : 0,
      pages: Array.isArray(pages) ? pages.length : 0,
      documents: Array.isArray(documents) ? documents.length : 0,
      news: visibleNews.length,
      events: Array.isArray(events) ? events.length : 0,
      slides: Array.isArray(slider) ? slider.length : 0,
      appeals: Array.isArray(appeals) ? appeals.length : 0,
      convocations: Array.isArray(convocations) ? convocations.length : 0,
      committees: countDeduplicatedCommittees(committees),
    };
  }, [persons, pages, documents, news, events, slider, appeals, convocations, committees]);

  const handleLogin = React.useCallback(async () => {
    setLoginBusy(true);
    try {
      await login({ email, password });
      message.success("Вход выполнен");
    } catch (e) {
      message.error(e?.message || "Ошибка входа");
    } finally {
      setLoginBusy(false);
    }
  }, [email, password, login, message]);

  const handleLogout = React.useCallback(() => {
    logout();
    message.success("Вы вышли");
  }, [logout, message]);

  return {
    // Auth
    isAuthenticated,
    user,
    canWrite,
    email,
    setEmail,
    password,
    setPassword,
    loginBusy,
    handleLogin,
    handleLogout,
    
    // Theme
    themeMode,
    toggleTheme,
    
    // Data
    news,
    persons,
    documents,
    events,
    slider,
    appeals,
    convocations,
    committees,
    pages,
    stats,
    apiBase,
    reload,
    
    // CRUD News
    createNews,
    updateNews,
    deleteNews,
    
    // CRUD Deputies
    createDeputy,
    updateDeputy,
    deleteDeputy,
    
    // CRUD Documents
    createDocument,
    updateDocument,
    deleteDocument,
    
    // CRUD Events
    createEvent,
    updateEvent,
    deleteEvent,

    // CRUD Slider
    createSlide,
    updateSlide,
    deleteSlide,
    uploadSlideImage,
    reorderSlides,
    
    // CRUD Appeals
    updateAppealStatus,
    deleteAppeal,
    
    // CRUD Convocations
    createConvocation,
    updateConvocation,
    deleteConvocation,
    
    // CRUD Committees
    createCommittee,
    updateCommittee,
    deleteCommittee,
    
    // State
    busy,
  };
}


