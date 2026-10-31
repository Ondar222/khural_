import React from "react";
import { App } from "antd";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  API_BASE_URL,
  AboutApi,
  NewsApi,
  PersonsApi,
  DocumentsApi,
  EventsApi,
  AppealsApi,
  SliderApi,
  ConvocationsApi,
  CommitteesApi,
  getAuthToken,
} from "../api/client.js";
import { addDeletedNewsId, readNewsOverrides } from "../utils/newsOverrides.js";
import { addDeletedDocumentId, readDocumentsOverrides } from "../utils/documentsOverrides.js";
import { readAdminTheme, writeAdminTheme } from "../pages/admin/adminTheme.js";
import { toPersonsApiBody } from "../api/personsPayload.js";
import {
  addCreatedEvent,
  updateEventOverride,
  addDeletedEventId,
  readEventsOverrides,
  mergeEventsWithOverrides,
  EVENTS_OVERRIDES_EVENT_NAME,
} from "../utils/eventsOverrides.js";
import { addCreatedSlide, updateSlideOverride, addDeletedSlideId, setSliderOrder } from "../utils/sliderOverrides.js";
import {
  SYSTEM_COMMITTEE_IDS,
  COMMITTEE_DEFAULT_CONVOCATION,
} from "../utils/committeesOverrides.js";
import {
  DEFAULT_COMMISSIONS_LIST,
} from "../utils/commissionsData.js";
import {
  commissionPagePayload,
  mergeCommissionsWithPages,
  readCommissionPage,
} from "../utils/commissionPages.js";
import {
  getCommitteeConvocation,
  getCommitteeConvocationId,
  getConvocationNumber,
  isStaticConvocationId,
  mergeConvocationsPreferApi,
} from "../utils/convocationIdentity.js";
import { normalizeBool } from "../utils/bool.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

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

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj != null && obj[k] !== undefined && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function toEventRow(e) {
  const dateVal = pick(e, "date", "date_of_event");
  const startVal = pick(e, "startDate", "start_date");
  const start = startVal != null ? new Date(startVal) : null;
  const date =
    dateVal ? String(dateVal).trim().slice(0, 10)
    : start && !isNaN(start.getTime()) ? start.toISOString().slice(0, 10)
    : "";
  const timeVal = pick(e, "time", "event_time");
  const time =
    timeVal ? String(timeVal).trim().slice(0, 5)
    : start && !isNaN(start.getTime()) ? start.toISOString().slice(11, 16)
    : "";
  return {
    id: String(e?.id ?? e?.externalId ?? Math.random().toString(36).slice(2)),
    date,
    time,
    place: String(pick(e, "location", "place", "event_place") || ""),
    placeTy: String(pick(e, "locationTy", "placeTy", "event_place_ty") || ""),
    title: String(pick(e, "title", "event_title") || ""),
    titleTy: String(pick(e, "titleTy", "event_title_ty") || ""),
    desc: String(pick(e, "description", "desc", "event_description") || ""),
    descTy: String(pick(e, "descriptionTy", "descTy", "event_description_ty") || ""),
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
  const fromContext = s && (s.desc !== undefined || s.link !== undefined);
  return {
    id: String(s?.id ?? Math.random().toString(36).slice(2)),
    title: String(s?.title || ""),
    description: String(s?.description ?? s?.desc ?? s?.subtitle ?? ""),
    titleTy: s?.titleTy ?? s?.title_ty ?? "",
    descriptionTy: s?.descTy ?? s?.descriptionTy ?? s?.description_ty ?? "",
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
  if (Array.isArray(p?.pages)) return p.pages;
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

  const dateStr = safeString(values?.date).trim() || new Date().toISOString().slice(0, 10);
  const timeStr = safeString(values?.time).trim() || "00:00";
  const [hh, mm] = timeStr.split(":").map((x) => parseInt(x, 10));
  const dt = new Date(`${dateStr}T00:00:00.000Z`);
  if (!isNaN(hh)) dt.setUTCHours(hh);
  if (!isNaN(mm)) dt.setUTCMinutes(mm);
  const title = safeString(values?.title);
  const description = safeString(values?.desc);
  const location = safeString(values?.place);
  const titleTy = safeString(values?.titleTy).trim();
  const descriptionTy = safeString(values?.descTy);
  const locationTy = safeString(values?.placeTy).trim();
  // Бэкенд хранит startDate как ISO-строку (GET /calendar возвращает "2026-10-30T10:00:00.000Z").
  // Числовой timestamp и лишние поля (date_of_event, event_title, start_date…) отклоняет
  // class-validator → 400 → событие сохранялось только в localStorage и было видно на одном устройстве.
  return {
    title,
    description,
    location,
    startDate: dt.toISOString(),
    endDate: null,
    isPublic: true,
    ...(titleTy ? { titleTy } : {}),
    ...(descriptionTy ? { descriptionTy } : {}),
    ...(locationTy ? { locationTy } : {}),
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

function committeeConvocationKey(committee) {
  const relation = getCommitteeConvocation(committee);
  return getConvocationNumber(relation) || String(getCommitteeConvocationId(committee) ?? "");
}

function mergeCommitteesPreferApi(apiList, fallbackList) {
  const api = Array.isArray(apiList) ? apiList : [];
  const fallback = Array.isArray(fallbackList) ? fallbackList : [];
  const out = api.map((c) => ({ ...c }));
  const byId = new Map();
  const byNameAndConvocation = new Map();

  for (const c of out) {
    const id = String(c?.id ?? "");
    if (id) byId.set(id, c);
    const nameKey = normalizeCommitteeName(c?.name || c?.title || c?.label || c?.description);
    const convocationKey = committeeConvocationKey(c);
    if (nameKey && convocationKey) {
      byNameAndConvocation.set(`${nameKey}|${convocationKey}`, c);
    }
  }

  for (const c of fallback) {
    const id = String(c?.id ?? "");
    const nameKey = normalizeCommitteeName(c?.name || c?.title || c?.label || c?.description);
    const convocationKey = committeeConvocationKey(c);
    const target =
      (id && byId.get(id)) ||
      (nameKey && convocationKey
        ? byNameAndConvocation.get(`${nameKey}|${convocationKey}`)
        : null);
    if (target) {
      for (const key of [
        "name",
        "title",
        "description",
        "phone",
        "email",
        "address",
        "website",
        "head",
        "convocation",
        "convocationId",
        "members",
        "staff",
        "plans",
        "activities",
      ]) {
        const current = target[key];
        const fallbackValue = c?.[key];
        const isMissing =
          current == null ||
          current === "" ||
          (Array.isArray(current) && current.length === 0);
        const hasFallback =
          fallbackValue != null &&
          fallbackValue !== "" &&
          (!Array.isArray(fallbackValue) || fallbackValue.length > 0);
        if (isMissing && hasFallback) target[key] = fallbackValue;
      }
      continue;
    }
    out.push(c);
  }

  return out;
}

/** Количество комитетов после дедупликации по названию (как в списке и на /committee) */
function countDeduplicatedCommittees(list) {
  const arr = Array.isArray(list) ? list : [];
  const getTitle = (c) => String(c?.title || c?.name || c?.label || c?.description || "").trim();
  const normalizeKey = (v) => String(v ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const richness = (c) => {
    let s = 0;
    if (String(c?.description ?? "").trim().length > 0) s += 2;
    const convId = getCommitteeConvocationId(c);
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
    reloadEvents: reloadDataContextEvents,
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
  const [eventsOverrides, setEventsOverrides] = React.useState(() =>
    typeof window !== "undefined" ? readEventsOverrides() : { created: [], updatedById: {}, deletedIds: [] }
  );
  const [slider, setSlider] = React.useState([]);
  const [appeals, setAppeals] = React.useState([]);
  const [convocations, setConvocations] = React.useState([]);
  const [committees, setCommittees] = React.useState([]);
  const [commissions, setCommissions] = React.useState(DEFAULT_COMMISSIONS_LIST);
  const [pages, setPages] = React.useState(null);
  const [adminDataLoaded, setAdminDataLoaded] = React.useState(false);
  const statsReady =
    adminDataLoaded && !data.loading?.structure && !data.loading?.committees;

  const canWrite = isAuthenticated;

  // Track whether committees list endpoint is healthy; if not, keep local fallback in sync.
  const committeesApiOkRef = React.useRef(true);

  const resolveConvocationApiId = React.useCallback(
    async (value) => {
      if (value == null || value === "") return null;
      const ordinal = getConvocationNumber(value);
      const current = (Array.isArray(convocations) ? convocations : []).find((item) => {
        if (String(item?.id ?? "") === String(value)) return true;
        return ordinal && getConvocationNumber(item) === ordinal;
      });
      if (current && !isStaticConvocationId(current.id)) return current.id;

      const apiRows = await ConvocationsApi.list({ activeOnly: false });
      const apiMatch = apiRows.find((item) => {
        if (String(item?.id ?? "") === String(value)) return true;
        return ordinal && getConvocationNumber(item) === ordinal;
      });
      if (apiMatch) return apiMatch.id;
      if (!ordinal) return value;

      const fallback = (Array.isArray(convocations) ? convocations : []).find(
        (item) => getConvocationNumber(item) === ordinal
      );
      if (!fallback) throw new Error(`Созыв ${ordinal} отсутствует в списке`);

      const created = await ConvocationsApi.create({
        name: fallback.name || `Созыв ${ordinal}`,
        description: fallback.description || "",
        isActive: normalizeBool(fallback.isActive, true),
        is_active: normalizeBool(fallback.isActive, true),
      });
      if (created?.id != null) return created.id;

      const refreshedRows = await ConvocationsApi.list({ activeOnly: false });
      const refreshed = refreshedRows.find((item) => getConvocationNumber(item) === ordinal);
      if (!refreshed?.id) {
        throw new Error(`API не вернул ID созданного созыва ${ordinal}`);
      }
      return refreshed.id;
    },
    [convocations]
  );

  const publicCommitteesFallback = React.useCallback(() => {
    const fb = fallbackRef.current || {};
    const list = Array.isArray(fb.committees) ? fb.committees : [];
    return list.map((c, idx) => {
      const title = String(c?.title || c?.name || "").trim();
      const convRaw = c?.convocationComittees?.id ?? c?.convocation?.id ?? c?.convocationId ?? c?.convocation;
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
        ...c,
        id: `local-static-${String(c?.id || idx)}`,
        name: title || `Комитет ${idx + 1}`,
        convocation: conv || c?.convocation || null,
        convocationId:
          c?.convocationComittees?.id ??
          c?.convocationId ??
          c?.convocation_id ??
          conv?.id ??
          (typeof c?.convocation === "object" ? c.convocation?.id : c?.convocation) ??
          null,
        members: Array.isArray(c?.members) ? c.members : [],
        staff: Array.isArray(c?.staff) ? c.staff : [],
        plans: Array.isArray(c?.plans) ? c.plans : [],
        activities: Array.isArray(c?.activities) ? c.activities : [],
        isActive: c?.isActive ?? true,
        order: c?.order ?? idx,
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
    setAdminDataLoaded(false);
    const fb = fallbackRef.current || {};
    const [apiNews, apiPersons, apiDocsResponse, apiSlider, apiConvocations, apiCommittees, apiPages, personsDocJson, convocationMappingRaw] = await Promise.all([
      NewsApi.list().catch(() => null),
      PersonsApi.list().catch(() => null),
      DocumentsApi.listAll().catch(() => null),
      SliderApi.list({ all: true }).catch(() => null),
      ConvocationsApi.list().catch(() => null),
      CommitteesApi.list({ all: true }).catch(() => null),
      AboutApi.listAdminPages().catch(() => null),
      Promise.all([
        fetch("/persons_doc/zakony.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/persons_doc/zakony2.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/persons_doc/postamovleniya_VH.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]),
      fetch("/data/deputy_convocation_mapping.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    ]);
    const [zakonyData, zakony2Data, postamovleniyaData] = Array.isArray(personsDocJson) ? personsDocJson : [[], [], []];
    const deletedNewsIds = new Set((readNewsOverrides()?.deletedIds || []).map(String));
    const newsList = Array.isArray(apiNews) ? apiNews : toNewsFallback(fb.news);
    setNews((newsList || []).filter((n) => !deletedNewsIds.has(String(n?.id ?? n?._id ?? ""))));
    const basePersons =
      Array.isArray(apiPersons) && apiPersons.length
        ? apiPersons
        : toPersonsFallback(fb.deputies);
    const govList = Array.isArray(fb.government) ? fb.government : [];
    const existingIds = new Set(basePersons.map((p) => String(p?.id ?? "")));
    const existingNames = new Set(
      basePersons.map((p) => (p?.fullName || p?.name || "").toLowerCase().replace(/\s+/g, " ").trim())
    );
    const fromGov = govList.filter(
      (g) =>
        g?.id &&
        g?.name &&
        !existingIds.has(String(g.id)) &&
        !existingNames.has((g.name || "").toLowerCase().replace(/\s+/g, " ").trim())
    );
    const personsList = fromGov.length ? [...basePersons, ...toPersonsFallback(fromGov)] : basePersons;
    // Обогащаем депутатов созывами из deputy_convocation_mapping.json (как на сайте I–IV)
    const mapping = convocationMappingRaw && typeof convocationMappingRaw === "object" ? convocationMappingRaw : {};
    const convOrder = ["I", "II", "III", "IV"];
    const convByNormalizedName = new Map();
    for (const conv of convOrder) {
      const names = Array.isArray(mapping[conv]) ? mapping[conv] : [];
      for (const n of names) {
        const key = String(n ?? "").replace(/\s+/g, " ").trim().toLowerCase();
        if (!key) continue;
        if (!convByNormalizedName.has(key)) convByNormalizedName.set(key, []);
        const arr = convByNormalizedName.get(key);
        if (!arr.includes(conv)) arr.push(conv);
      }
    }
    for (const arr of convByNormalizedName.values()) {
      arr.sort((a, b) => convOrder.indexOf(a) - convOrder.indexOf(b));
    }
    const primaryConv = (convs) => {
      for (const c of convOrder) if (convs.includes(c)) return c;
      return convs[0] || "";
    };
    const personsEnriched = personsList.map((p) => {
      const name = p?.fullName ?? p?.full_name ?? p?.name ?? "";
      const key = String(name).replace(/\s+/g, " ").trim().toLowerCase();
      const convocations = convByNormalizedName.get(key);
      if (!convocations || !convocations.length) return p;
      return { ...p, convocation: primaryConv(convocations), convocations };
    });
    setPersons(personsEnriched);
    const apiDocs = apiDocsResponse?.items || (Array.isArray(apiDocsResponse) ? apiDocsResponse : []);
    const deletedDocs = new Set((readDocumentsOverrides()?.deletedIds || []).map(String));
    const parseZakony = (row) => {
      if (!row?.IE_NAME) return null;
      const fileUrl = String(row.IP_PROP28 || "").trim();
      const url = fileUrl ? normalizeFilesUrl(fileUrl.startsWith("http") ? fileUrl : `/upload/${fileUrl.replace(/^\/?upload\//i, "")}`) : "";
      return {
        id: `zakony-${row.IE_ID ?? row.IE_XML_ID ?? Math.random()}`,
        title: String(row.IE_NAME || "").trim(),
        description: "",
        type: "laws",
        number: String(row.IP_PROP26 || "").trim(),
        date: String(row.IP_PROP27 || "").trim(),
        publishedAt: String(row.IP_PROP27 || "").trim() || undefined,
        file: url ? { link: url } : {},
      };
    };
    const parsePostamovleniya = (row) => {
      if (!row?.IE_NAME) return null;
      const fileUrl = String(row.IP_PROP59 || "").trim();
      const url = fileUrl ? normalizeFilesUrl(fileUrl.startsWith("http") ? fileUrl : `/upload/${fileUrl.replace(/^\/?upload\//i, "")}`) : "";
      return {
        id: `postamovleniya-${row.IE_ID ?? row.IE_XML_ID ?? Math.random()}`,
        title: String(row.IE_NAME || "").trim(),
        description: "",
        type: "resolutions",
        number: String(row.IP_PROP57 || "").trim(),
        date: String(row.IP_PROP58 || "").trim(),
        publishedAt: String(row.IP_PROP58 || "").trim() || undefined,
        file: url ? { link: url } : {},
      };
    };
    const fromJson = [
      ...(Array.isArray(zakonyData) ? zakonyData : []).map(parseZakony).filter(Boolean),
      ...(Array.isArray(zakony2Data) ? zakony2Data : []).map(parseZakony).filter(Boolean),
      ...(Array.isArray(postamovleniyaData) ? postamovleniyaData : []).map(parsePostamovleniya).filter(Boolean),
    ];
    const docsList = fromJson.length > 0 ? fromJson : (Array.isArray(apiDocs) && apiDocs.length ? apiDocs : toDocumentsFallback(fb.documents));
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
    const apiEventsRaw = await EventsApi.list().catch(() => null);
    const apiEventsArr =
      apiEventsRaw === null
        ? null
        : Array.isArray(apiEventsRaw)
          ? apiEventsRaw
          : apiEventsRaw?.items && Array.isArray(apiEventsRaw.items)
            ? apiEventsRaw.items
            : apiEventsRaw?.data && Array.isArray(apiEventsRaw.data)
              ? apiEventsRaw.data
              : apiEventsRaw?.events && Array.isArray(apiEventsRaw.events)
                ? apiEventsRaw.events
                : null;
    setEvents(apiEventsArr ? apiEventsArr.map(toEventRow) : fb.events || []);
    // Обращения не загружаем при открытии дашборда — только при переходе на /admin/appeals (loadAppeals), чтобы не было ошибок в консоли при отсутствии API обращений
    
    // Загружаем созывы: API -> /data/convocations.json -> fallback из DataContext
    const apiConvocationsList = Array.isArray(apiConvocations) && apiConvocations.length > 0 ? apiConvocations : [];
    let fallbackConv = Array.isArray(fb.convocations) ? fb.convocations : [];
    
    // Если ни API, ни DataContext не вернули данные, загружаем из /data/convocations.json
    if (apiConvocationsList.length === 0 && fallbackConv.length === 0) {
      try {
        const staticConv = await fetch("/data/convocations.json").then((r) => (r.ok ? r.json() : [])).catch(() => []);
        if (Array.isArray(staticConv) && staticConv.length > 0) {
          fallbackConv = staticConv;
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn("Failed to load convocations from /data/convocations.json:", e);
        }
      }
    }
    
    const mergedConv = apiConvocationsList.length > 0
      ? mergeConvocationsPreferApi(apiConvocationsList, fallbackConv)
      : fallbackConv;
    const convocationsList = mergedConv;
    setConvocations(convocationsList);
    const apiCommitteesList = Array.isArray(apiCommittees) ? apiCommittees : [];
    committeesApiOkRef.current = apiCommitteesList.length > 0;
    let baseCommittees = mergeCommitteesPreferApi(apiCommitteesList, publicCommitteesFallback());
    // Обогатить комитеты объектом созыва по convocationId/convocation_id для фильтра и колонки «Созыв»
    baseCommittees = baseCommittees.map((c) => {
      let convId = getCommitteeConvocationId(c);
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
    setCommittees(baseCommittees);
    setCommissions(
      mergeCommissionsWithPages(
        DEFAULT_COMMISSIONS_LIST,
        Array.isArray(apiPages) ? apiPages : []
      )
    );
    if (apiPages !== null) {
      setPages(apiPages);
    }
    setAdminDataLoaded(true);
  }, [publicCommitteesFallback]);

  const isAdminRoute =
    typeof window !== "undefined" &&
    (window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/"));

  React.useEffect(() => {
    // Приватные эндпоинты (/documents/all и др.) дёргаем только в админке или когда есть токен.
    // Раньше loadAll() выполнялся на каждой публичной странице (PageBySlug вызывает этот хук),
    // что давало 401 на /api/documents/all и лишние 429 от бэкенда.
    if (!isAdminRoute && !isAuthenticated) return;
    loadAll();
  }, [isAdminRoute, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the shared public fallback visible if the committees API has no records yet.
  React.useEffect(() => {
    if (committeesApiOkRef.current) return;
    const fbList = publicCommitteesFallback();
    if (!fbList.length) return;
    setCommittees((prev) =>
      Array.isArray(prev) && prev.length ? prev : fbList
    );
  }, [data?.committees, publicCommitteesFallback]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onEventsOverrides = () => setEventsOverrides(readEventsOverrides());
    window.addEventListener(EVENTS_OVERRIDES_EVENT_NAME, onEventsOverrides);
    return () => window.removeEventListener(EVENTS_OVERRIDES_EVENT_NAME, onEventsOverrides);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    writeAdminTheme(next);
  }, [themeMode]);

  const reloadPages = React.useCallback(async () => {
    const pagesList = await AboutApi.listAdminPages();
    setPages(pagesList);
    return pagesList;
  }, []);

  const reload = React.useCallback(async () => {
    if (typeof reloadDataContext === "function") reloadDataContext();
    await loadAll();
  }, [loadAll, reloadDataContext]);

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
    const sid = String(id ?? "").trim();
    setBusy(true);
    try {
      try {
        await DocumentsApi.remove(id);
        message.success("Документ удалён");
        addDeletedDocumentId(sid); // скрыть и при списке из JSON
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
          addDeletedDocumentId(sid);
        } catch {
          // Fallback: hide locally when API is unavailable / no rights
          addDeletedDocumentId(sid);
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
    try {
      const created = await EventsApi.create(toCalendarDto(payload));
      // Сервер — единый источник правды: в localStorage ничего не пишем,
      // иначе локальная копия затенит серверную на этом устройстве.
      message.success("Событие создано и видно всем на сайте");

      if (created) {
        const newEvent = toEventRow({
          ...created,
          id: created.id ?? tempId,
          date: payload.date,
          time: payload.time,
          title: payload.title ?? created.title,
          titleTy: payload.titleTy ?? created.titleTy,
          place: payload.place ?? created.location,
          placeTy: payload.placeTy ?? created.locationTy,
          desc: payload.desc ?? created.description,
          descTy: payload.descTy ?? created.descriptionTy,
        });
        setDataContextEvents((prev) => [...prev, newEvent]);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (typeof reloadDataContextEvents === "function") reloadDataContextEvents();
      await reload();
    } catch (e) {
      // Ошибка API — сохраняем локально, но показываем реальную причину
      const detail = e?.status ? `HTTP ${e.status}: ${e?.message || "ошибка бэкенда"}` : (e?.message || "сеть недоступна");
      const localEvent = {
        id: tempId,
        date: String(payload?.date ?? "").trim() || new Date().toISOString().slice(0, 10),
        title: String(payload?.title ?? "").trim(),
        titleTy: String(payload?.titleTy ?? "").trim(),
        time: String(payload?.time ?? "").trim(),
        place: String(payload?.place ?? "").trim(),
        placeTy: String(payload?.placeTy ?? "").trim(),
        desc: String(payload?.desc ?? "").trim(),
        descTy: String(payload?.descTy ?? "").trim(),
        isImportant: Boolean(payload?.isImportant),
      };
      addCreatedEvent(localEvent);
      setDataContextEvents((prev) => [...prev, localEvent]);
      message.warning(
        `Бэкенд не принял событие: ${detail}. Сохранено только на этом устройстве — на других не видно.`
      );
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContextEvents, setDataContextEvents]);

  const updateEvent = React.useCallback(async (id, payload) => {
    setBusy(true);
    try {
      const updated = await EventsApi.patch(id, toCalendarDto(payload));

      // Сервер — единственный источник правды: обновляем локально только при успехе
      if (updated && dataContextEvents) {
        const updatedEvent = toEventRow({
          ...updated,
          id: String(id),
          date: payload.date,
          time: payload.time,
          title: payload.title ?? updated.title,
          titleTy: payload.titleTy ?? updated.titleTy,
          place: payload.place ?? updated.location,
          placeTy: payload.placeTy ?? updated.locationTy,
          desc: payload.desc ?? updated.description,
          descTy: payload.descTy ?? updated.descriptionTy,
        });
        setDataContextEvents((prev) =>
          prev.map((e) => (String(e.id) === String(id) ? updatedEvent : e))
        );
        updateEventOverride(String(id), updatedEvent);
      }

      message.success("Событие обновлено");
      await reload();
      reloadDataContext();
    } catch (e) {
      const detail = e?.status ? `HTTP ${e.status}: ${e?.message || "ошибка бэкенда"}` : (e?.message || "сеть недоступна");
      message.error(`Не удалось обновить: ${detail}`);
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext, setDataContextEvents, dataContextEvents]);

  const deleteEvent = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await EventsApi.remove(id);
      message.success("Событие удалено");
      addDeletedEventId(String(id));

      // Удаляем локально только после успешного ответа сервера
      if (dataContextEvents) {
        const filteredEvents = dataContextEvents.filter((e) => String(e.id) !== String(id));
        setDataContextEvents(filteredEvents);
      }

      await reload();
      await reloadDataContext();
    } catch (e) {
      const detail = e?.status ? `HTTP ${e.status}: ${e?.message || "ошибка бэкенда"}` : (e?.message || "сеть недоступна");
      message.error(`Не удалось удалить событие: ${detail}`);
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext, setDataContextEvents, dataContextEvents]);

  const createSlide = React.useCallback(async ({ title, description, url, isActive, titleTy, descriptionTy }) => {
    setBusy(true);
    try {
      if (Array.isArray(slider) && slider.length >= 5) {
        throw new Error("Максимум 5 слайдов");
      }
      const createPayload = {
        title: title || "",
        description: description || "",
        url: url || "",
        isActive: isActive ?? true,
      };
      if (titleTy != null && String(titleTy).trim()) createPayload.titleTy = String(titleTy).trim();
      if (descriptionTy != null && String(descriptionTy).trim()) createPayload.descriptionTy = String(descriptionTy).trim();
      try {
        const created = await SliderApi.create(createPayload);
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
          titleTy: titleTy != null ? String(titleTy).trim() : "",
          descTy: descriptionTy != null ? String(descriptionTy).trim() : "",
          link: String(url || ""),
          image: "",
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

  const updateSlide = React.useCallback(async (id, body) => {
    const { title, description, url, isActive, titleTy, descriptionTy, content } = body || {};
    setBusy(true);
    try {
      // Формируем payload с content[] для локализации — так бэкенд сохраняет переводы в БД
      const payload = {
        title: title || "",
        description: description || "",
        url: url || "",
        isActive: isActive ?? true,
      };
      
      // Если есть content[] (с локалями), отправляем его
      if (Array.isArray(content) && content.length > 0) {
        payload.content = content;
      } else {
        // Fallback: формируем content[] из titleTy/descriptionTy
        payload.content = [
          {
            locale: "ru",
            title: title || "",
            description: description || "",
          },
        ];
        if (titleTy || descriptionTy) {
          payload.content.push({
            locale: "tyv",
            title: titleTy || "",
            description: descriptionTy || "",
          });
        }
      }
      
      const looksLocal = String(id || "").startsWith("imp-") || String(id || "").startsWith("local-");
      if (!looksLocal) {
        try {
          await SliderApi.patch(id, payload);
          message.success("Слайд обновлён");
          await reload();
          reloadDataContext();
          return;
        } catch (err) {
          console.error("Slider update error:", err);
          // fall back below
        }
      }
      updateSlideOverride(String(id), {
        id: String(id),
        title: String(payload.title),
        desc: String(payload.description),
        titleTy: titleTy || "",
        descTy: descriptionTy || "",
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
                titleTy: titleTy || "",
                descTy: descriptionTy || "",
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

  const loadAppeals = React.useCallback(async () => {
    const apiAppealsResponse = await AppealsApi.listAll().catch(() => null);
    const apiAppeals = normalizeServerList(apiAppealsResponse);
    setAppeals(Array.isArray(apiAppeals) ? apiAppeals.map(normalizeAppeal) : []);
  }, []);

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
      await ConvocationsApi.create(payload);
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
      if (isStaticConvocationId(sid)) {
        const ordinal = getConvocationNumber(sid);
        const apiRows = await ConvocationsApi.list({ activeOnly: false });
        const existing = apiRows.find((item) => getConvocationNumber(item) === ordinal);
        if (existing?.id != null) {
          await ConvocationsApi.patch(existing.id, payload);
        } else {
          await ConvocationsApi.create(payload);
        }
      } else {
        await ConvocationsApi.patch(id, payload);
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
      let apiId = id;
      if (isStaticConvocationId(id)) {
        const ordinal = getConvocationNumber(id);
        const apiRows = await ConvocationsApi.list({ activeOnly: false });
        const existing = apiRows.find((item) => getConvocationNumber(item) === ordinal);
        if (!existing?.id) throw new Error(`Созыв ${ordinal} отсутствует в API`);
        apiId = existing.id;
      }
      await ConvocationsApi.remove(apiId);
      message.success("Созыв удалён");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const createCommittee = React.useCallback(async (payload) => {
    setBusy(true);
    try {
      const convocationId = await resolveConvocationApiId(
        payload?.convocationId ?? payload?.convocation_id
      );
      const committeeFields = { ...(payload || {}) };
      delete committeeFields.convocation_id;
      const created = await CommitteesApi.create({
        ...committeeFields,
        convocationId,
      });
      message.success("Комитет создан");
      await reload();
      return created;
    } finally {
      setBusy(false);
    }
  }, [message, reload, resolveConvocationApiId]);

  const updateCommittee = React.useCallback(async (id, payload) => {
    const sid = String(id);
    const systemId = sid.replace(/^local-static-/, "");
    if (SYSTEM_COMMITTEE_IDS.includes(systemId) && payload?.isActive === false) {
      message.warning("Комитеты структуры нельзя отключить или удалить.");
      return;
    }
    setBusy(true);
    try {
      const convocationId = await resolveConvocationApiId(
        payload?.convocationId ?? payload?.convocation_id
      );
      const committeeFields = { ...(payload || {}) };
      delete committeeFields.convocation_id;
      const apiPayload = {
        ...committeeFields,
        convocationId,
      };
      let apiId = id;
      if (sid.startsWith("local-")) {
        const apiRows = await CommitteesApi.list({ all: true });
        const name = normalizeCommitteeName(payload?.name);
        const existing = apiRows.find(
          (committee) =>
            normalizeCommitteeName(committee?.name || committee?.title) === name
        );
        if (existing?.id != null) {
          apiId = existing.id;
        } else {
          await CommitteesApi.create(apiPayload);
          message.success("Комитет сохранён в API");
          await reload();
          return;
        }
      }
      await CommitteesApi.patch(apiId, apiPayload);
      message.success("Комитет обновлён в API");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload, resolveConvocationApiId]);

  const deleteCommittee = React.useCallback(async (id) => {
    const sid = String(id);
    const systemId = sid.replace(/^local-static-/, "");
    if (SYSTEM_COMMITTEE_IDS.includes(systemId)) {
      message.warning("Комитеты структуры нельзя удалить.");
      return;
    }
    message.warning("Удаление комитетов отключено. Используйте «Отключить».");
    await updateCommittee(id, { isActive: false });
  }, [message, updateCommittee]);

  const createCommission = React.useCallback(
    async (payload) => {
      const id = String(payload?.id || "").trim() || `commission-${Date.now()}`;
      const name = String(payload?.name || "").trim();
      if (!name) throw new Error("Введите название комиссии");
      if (commissions.some((commission) => String(commission.id) === id)) {
        throw new Error("Комиссия с таким ID уже существует");
      }

      setBusy(true);
      try {
        const page = await AboutApi.createPage(
          commissionPagePayload({ ...payload, id, name })
        );
        message.success("Комиссия сохранена в общей базе");
        await reload();
        return page;
      } finally {
        setBusy(false);
      }
    },
    [commissions, message, reload]
  );

  const updateCommission = React.useCallback(
    async (id, payload) => {
      const sid = String(id);
      const current = commissions.find((commission) => String(commission.id) === sid);
      if (!current) throw new Error("Комиссия не найдена");
      const updated = { ...current, ...payload, id: sid };
      const pagePayload = commissionPagePayload(updated);
      const currentPage = Array.isArray(pages)
        ? pages.find(
            (page) =>
              (current.cmsPageId != null &&
                String(page?.id) === String(current.cmsPageId)) ||
              String(page?.slug || "") === pagePayload.slug
          )
        : null;
      const pageId = currentPage?.id ?? current.cmsPageId;
      const localizedContent = Array.isArray(currentPage?.content)
        ? currentPage.content.map((entry) => ({
            locale: String(entry?.locale || "ru").toLowerCase(),
            title: String(entry?.title || pagePayload.title),
            description: entry?.description ?? undefined,
            content: pagePayload.content,
            blocks: Array.isArray(entry?.blocks) ? entry.blocks : undefined,
          }))
        : [];
      if (
        localizedContent.length > 0 &&
        !localizedContent.some((entry) => entry.locale === "ru")
      ) {
        localizedContent.push({
          locale: "ru",
          title: pagePayload.title,
          content: pagePayload.content,
        });
      }
      const updatePayload =
        localizedContent.length > 0
          ? { ...pagePayload, content: localizedContent }
          : pagePayload;

      setBusy(true);
      try {
        if (pageId != null) {
          await AboutApi.updatePage(pageId, updatePayload);
        } else if (Array.isArray(pages)) {
          await AboutApi.createPage(pagePayload);
        } else {
          throw new Error(
            "Не удалось загрузить страницы CMS. Обновите список и повторите сохранение."
          );
        }
        const savedPages = await AboutApi.listAdminPages();
        const savedCommission = savedPages
          .map(readCommissionPage)
          .find((commission) => String(commission?.id) === sid);
        const fieldsToVerify = [
          "name",
          "parentBody",
          "documentType",
          "resolutionDate",
          "resolutionNumber",
          "resolutionSubject",
          "bodyHtml",
        ];
        if (!savedCommission) {
          throw new Error(
            "API не подтвердило сохранение комиссии. Изменения не опубликованы."
          );
        }
        message.success("Комиссия сохранена в общей базе");
        await reload();
      } finally {
        setBusy(false);
      }
    },
    [commissions, message, pages, reload]
  );

  const deleteCommission = React.useCallback(
    async (id) => {
      const sid = String(id);
      const current = commissions.find((commission) => String(commission.id) === sid);
      if (!current) throw new Error("Комиссия не найдена");

      setBusy(true);
      try {
        const pagePayload = commissionPagePayload(current, { deleted: true });
        if (current.cmsPageId != null) {
          await AboutApi.updatePage(current.cmsPageId, pagePayload);
        } else {
          await AboutApi.createPage(pagePayload);
        }
        message.success("Комиссия удалена из общего списка");
        await reload();
      } finally {
        setBusy(false);
      }
    },
    [commissions, message, reload]
  );

  const eventsForList = React.useMemo(
    () => mergeEventsWithOverrides(events, eventsOverrides),
    [events, eventsOverrides]
  );

  const stats = React.useMemo(() => {
    const deletedNewsIds = new Set((readNewsOverrides()?.deletedIds || []).map(String));
    const visibleNews = (news || []).filter((n) => !deletedNewsIds.has(String(n?.id ?? n?._id ?? "")));
    return {
      deputies: Array.isArray(persons) ? persons.length : 0,
      pages: Array.isArray(pages) ? pages.length : null,
      documents: Array.isArray(documents) ? documents.length : 0,
      news: visibleNews.length,
      events: Array.isArray(eventsForList) ? eventsForList.length : 0,
      slides: Array.isArray(slider) ? slider.length : 0,
      appeals: Array.isArray(appeals) ? appeals.length : 0,
      convocations: Array.isArray(convocations) ? convocations.length : 0,
      committees: countDeduplicatedCommittees(committees),
      commissions: Array.isArray(commissions) ? commissions.length : 0,
    };
  }, [persons, pages, documents, news, eventsForList, slider, appeals, convocations, committees, commissions]);

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
    events: eventsForList,
    slider,
    appeals,
    convocations,
    committees,
    commissions,
    pages,
    stats,
    statsReady,
    reloadPages,
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
    loadAppeals,
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
    
    // CRUD Commissions
    createCommission,
    updateCommission,
    deleteCommission,
    
    // State
    busy,
  };
}
