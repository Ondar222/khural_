/**
 * Локальные правки событий календаря (localStorage). Видны только на этом устройстве/браузере.
 * Чтобы созданные/изменённые события были на всех устройствах — бэкенд должен сохранять
 * события в БД и отдавать их в GET /calendar (тот же API для всех клиентов).
 */
const STORAGE_KEY = "khural_events_overrides_v1";
const EVENT_NAME = "khural:events-updated";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readEventsOverrides() {
  if (typeof window === "undefined") return { created: [] };
  const raw = window.localStorage?.getItem(STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById:
      parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

export function writeEventsOverrides(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // ignore
  }
}

function toText(v) {
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
}

/** Приводит дату к YYYY-MM-DD для календаря (локально и на проде) */
function toDateKey(v) {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return s;
  }
  if (typeof v === "number") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (typeof v === "object" && v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getFullYear(), m = String(v.getMonth() + 1).padStart(2, "0"), day = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

function normalizeEvent(event) {
  const id = String(event?.id ?? "").trim();
  if (!id) return null;
  let date = toDateKey(event?.date) || toText(event?.date);
  if (!date && (event?.startDate != null || event?.start_date != null)) {
    const ts = Number(event?.startDate ?? event?.start_date);
    if (!Number.isNaN(ts)) date = toDateKey(ts) || new Date(ts).toISOString().slice(0, 10);
  }
  return {
    id,
    date: date || "",
    title: toText(event?.title),
    time: toText(event?.time),
    place: toText(event?.place),
    desc: toText(event?.desc),
    isImportant: Boolean(event?.isImportant),
  };
}

export function addCreatedEvent(event) {
  const normalized = normalizeEvent(event);
  if (!normalized) return;
  const cur = readEventsOverrides();
  const created = Array.isArray(cur.created) ? cur.created : [];
  const seen = new Set(created.map((e) => String(e?.id ?? "")));
  if (seen.has(normalized.id)) return;
  const deleted = new Set((cur.deletedIds || []).map(String));
  deleted.delete(normalized.id);
  writeEventsOverrides({
    created: [normalized, ...created],
    updatedById: cur.updatedById || {},
    deletedIds: Array.from(deleted),
  });
}

export function updateEventOverride(id, patch) {
  const key = String(id ?? "").trim();
  if (!key) return;
  const normalized = normalizeEvent({ ...(patch || {}), id: key });
  if (!normalized) return;
  const cur = readEventsOverrides();
  const deleted = new Set((cur.deletedIds || []).map(String));
  if (deleted.has(key)) return;
  writeEventsOverrides({
    created: cur.created || [],
    updatedById: { ...(cur.updatedById || {}), [key]: normalized },
    deletedIds: cur.deletedIds || [],
  });
}

export function addDeletedEventId(id) {
  const key = String(id ?? "").trim();
  if (!key) return;
  const cur = readEventsOverrides();
  const deleted = new Set((cur.deletedIds || []).map(String));
  deleted.add(key);
  const created = (cur.created || []).filter((e) => String(e?.id ?? "") !== key);
  const updatedById = { ...(cur.updatedById || {}) };
  delete updatedById[key];
  writeEventsOverrides({ created, updatedById, deletedIds: Array.from(deleted) });
}

/** Объединяет список событий с API с локальными правками: добавленные, обновлённые, удалённые.
 *  Сначала добавляем created (локальные создания), потом список API — чтобы у созданных событий
 *  была дата и они отображались в календаре даже если бэкенд вернул событие без даты. */
export function mergeEventsWithOverrides(base, overrides) {
  const list = Array.isArray(base) ? base : [];
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById =
    overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
  const deleted = new Set((overrides?.deletedIds || []).map((x) => String(x)));
  const out = [];
  const seen = new Set();
  for (const e of created) {
    const id = String(e?.id ?? "").trim();
    if (!id) continue;
    if (deleted.has(id)) continue;
    if (seen.has(id)) continue;
    const patch = updatedById[id];
    out.push(patch ? { ...e, ...patch, id } : e);
    seen.add(id);
  }
  for (const e of list) {
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

export const EVENTS_OVERRIDES_STORAGE_KEY = STORAGE_KEY;
export const EVENTS_OVERRIDES_EVENT_NAME = EVENT_NAME;


