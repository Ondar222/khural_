const STORAGE_KEY = "khural_slider_overrides_v1";
const EVENT_NAME = "khural:slider-updated";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readSliderOverrides() {
  if (typeof window === "undefined") {
    return { created: [], updatedById: {}, deletedIds: [], orderIds: [] };
  }
  const raw = window.localStorage?.getItem(STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") {
    return { created: [], updatedById: {}, deletedIds: [], orderIds: [] };
  }
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById:
      parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
    orderIds: Array.isArray(parsed.orderIds) ? parsed.orderIds : [],
  };
}

export function writeSliderOverrides(next) {
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

function normalizeSlide(slide) {
  const id = String(slide?.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    title: toText(slide?.title),
    desc: toText(slide?.desc ?? slide?.description ?? slide?.subtitle),
    link: toText(slide?.link ?? slide?.url ?? slide?.href),
    image: toText(slide?.image),
    isActive: slide?.isActive === false ? false : true,
    order: Number(slide?.order ?? 0),
  };
}

export function addCreatedSlide(slide) {
  const normalized = normalizeSlide(slide);
  if (!normalized) return;
  const cur = readSliderOverrides();
  const deleted = new Set((cur.deletedIds || []).map(String));
  deleted.delete(normalized.id);
  const created = Array.isArray(cur.created) ? cur.created : [];
  const seen = new Set(created.map((s) => String(s?.id ?? "")));
  if (seen.has(normalized.id)) return;
  writeSliderOverrides({
    created: [normalized, ...created],
    updatedById: cur.updatedById || {},
    deletedIds: Array.from(deleted),
    orderIds: cur.orderIds || [],
  });
}

export function updateSlideOverride(id, patch) {
  const key = String(id ?? "").trim();
  if (!key) return;
  const cur = readSliderOverrides();
  const deleted = new Set((cur.deletedIds || []).map(String));
  if (deleted.has(key)) return;
  const p = patch && typeof patch === "object" ? patch : {};
  // IMPORTANT: store a *partial* patch so missing fields do NOT wipe out existing slide props (e.g. image).
  const normalized = { id: key };
  if (Object.prototype.hasOwnProperty.call(p, "title")) normalized.title = toText(p.title);
  if (Object.prototype.hasOwnProperty.call(p, "desc")) normalized.desc = toText(p.desc);
  if (Object.prototype.hasOwnProperty.call(p, "description")) normalized.desc = toText(p.description);
  if (Object.prototype.hasOwnProperty.call(p, "subtitle")) normalized.desc = toText(p.subtitle);
  if (Object.prototype.hasOwnProperty.call(p, "link")) normalized.link = toText(p.link);
  if (Object.prototype.hasOwnProperty.call(p, "url")) normalized.link = toText(p.url);
  if (Object.prototype.hasOwnProperty.call(p, "href")) normalized.link = toText(p.href);
  if (Object.prototype.hasOwnProperty.call(p, "image")) normalized.image = toText(p.image);
  if (Object.prototype.hasOwnProperty.call(p, "isActive")) normalized.isActive = p.isActive === false ? false : true;
  if (Object.prototype.hasOwnProperty.call(p, "order")) normalized.order = Number(p.order ?? 0);
  writeSliderOverrides({
    created: cur.created || [],
    updatedById: { ...(cur.updatedById || {}), [key]: normalized },
    deletedIds: cur.deletedIds || [],
    orderIds: cur.orderIds || [],
  });
}

export function addDeletedSlideId(id) {
  const key = String(id ?? "").trim();
  if (!key) return;
  const cur = readSliderOverrides();
  const deleted = new Set((cur.deletedIds || []).map(String));
  deleted.add(key);
  const created = (cur.created || []).filter((s) => String(s?.id ?? "") !== key);
  const updatedById = { ...(cur.updatedById || {}) };
  delete updatedById[key];
  const orderIds = (cur.orderIds || []).filter((x) => String(x) !== key);
  writeSliderOverrides({ created, updatedById, deletedIds: Array.from(deleted), orderIds });
}

export function setSliderOrder(ids) {
  const cur = readSliderOverrides();
  writeSliderOverrides({
    created: cur.created || [],
    updatedById: cur.updatedById || {},
    deletedIds: cur.deletedIds || [],
    orderIds: Array.isArray(ids) ? ids.map(String) : [],
  });
}

export const SLIDER_OVERRIDES_STORAGE_KEY = STORAGE_KEY;
export const SLIDER_OVERRIDES_EVENT_NAME = EVENT_NAME;


