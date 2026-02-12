export const COMMISSIONS_OVERRIDES_STORAGE_KEY = "khural_commissions_overrides_v1";
export const COMMISSIONS_OVERRIDES_EVENT_NAME = "khural:commissions-updated";

/** Список комиссий по умолчанию (как на странице «Комиссии»). */
export const DEFAULT_COMMISSIONS_LIST = [
  { id: "nagradnaya", name: "Наградная комиссия Верховного Хурала (парламента) Республики Тыва" },
  {
    id: "kontrol-dostovernost",
    name: "Комиссия Верховного Хурала (парламента) Республики Тыва по контролю за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
  },
  { id: "schetnaya", name: "Счетная комиссия Верховного Хурала" },
  {
    id: "reglament-etika",
    name: "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
  },
  {
    id: "reabilitatsiya",
    name: "Республиканская комиссия по восстановлению прав реабилитированных жертв политических репрессий",
  },
  {
    id: "svo-podderzhka",
    name: "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
  },
  {
    id: "smi-obshestvo",
    name: "Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями",
  },
  {
    id: "mezhregionalnye-svyazi",
    name: "Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным и международным связям",
  },
];

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * @returns {{ created: Array<{id: string, name: string}>, updatedById: Record<string, {id?: string, name?: string}>, deletedIds: string[] }}
 */
export function readCommissionsOverrides() {
  if (typeof window === "undefined")
    return { created: [], updatedById: {}, deletedIds: [] };
  const raw = window.localStorage?.getItem(COMMISSIONS_OVERRIDES_STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object")
    return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById:
      parsed.updatedById && typeof parsed.updatedById === "object"
        ? parsed.updatedById
        : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds.map(String) : [],
  };
}

/**
 * @param {{ created: Array<{id: string, name: string}>, updatedById: Record<string, {}>, deletedIds: string[] }} next
 */
export function writeCommissionsOverrides(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(COMMISSIONS_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(COMMISSIONS_OVERRIDES_EVENT_NAME));
  } catch {
    // ignore
  }
}

/** Поля контента страницы комиссии (постановление и текст). */
const DETAIL_KEYS = [
  "parentBody",
  "documentType",
  "resolutionDate",
  "resolutionNumber",
  "resolutionSubject",
  "bodyHtml",
];

function pickDetailFields(obj, allowEmpty) {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const key of DETAIL_KEYS) {
    const val = obj[key];
    if (val === undefined) continue;
    if (!allowEmpty && (val === null || val === "")) continue;
    out[key] = String(val);
  }
  return out;
}

/**
 * Собирает итоговый список комиссий: базовый список с применением updatedById и без deletedIds, плюс created.
 * Элементы могут содержать поля контента: parentBody, documentType, resolutionDate, resolutionNumber, resolutionSubject, bodyHtml.
 * @param {Array<{id: string, name: string, ...}>} baseList
 * @param {{ created: Array<{id: string, name: string, ...}>, updatedById: Record<string, {}>, deletedIds: string[] }} overrides
 * @returns {Array<{id: string, name: string, parentBody?: string, documentType?: string, resolutionDate?: string, resolutionNumber?: string, resolutionSubject?: string, bodyHtml?: string}>}
 */
export function mergeCommissionsWithOverrides(baseList, overrides) {
  const deletedSet = new Set((overrides.deletedIds || []).map(String));
  const updates = overrides.updatedById || {};
  const base = (Array.isArray(baseList) ? baseList : []).filter(
    (c) => c && c.id && !deletedSet.has(String(c.id))
  );
  const result = base.map((c) => {
    const u = updates[String(c.id)];
    if (!u)
      return { ...c, ...pickDetailFields(c, false) };
    const baseDetails = pickDetailFields(c, false);
    const updateDetails = pickDetailFields(u, true);
    return {
      id: u.id !== undefined ? String(u.id) : c.id,
      name: u.name !== undefined ? String(u.name) : c.name,
      ...baseDetails,
      ...updateDetails,
    };
  });
  const createdIds = new Set(result.map((r) => String(r.id)));
  for (const item of overrides.created || []) {
    if (item && item.id && item.name && !createdIds.has(String(item.id))) {
      result.push({
        id: String(item.id),
        name: String(item.name),
        ...pickDetailFields(item, false),
      });
      createdIds.add(String(item.id));
    }
  }
  return result;
}
