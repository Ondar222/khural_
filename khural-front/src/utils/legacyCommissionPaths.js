import { DEFAULT_COMMISSIONS_LIST } from "./commissionsData.js";

const COMMISSION_PAGE_SLUG_PREFIX = "commission-data-";

// Старые числовые разделы /struct/komissii/<раздел>/<документ>/ со старого сайта —
// маппим раздел на id комиссии из текущего справочника.
const LEGACY_SECTION_TO_COMMISSION_ID = {
  114: "nagradnaya",
  262: "kontrol-dostovernost",
  265: "reglament-etika",
  266: "reabilitatsiya",
};

const KNOWN_COMMISSION_IDS = new Set(
  (DEFAULT_COMMISSIONS_LIST || []).map((c) => String(c.id))
);

/**
 * Возвращает актуальный адрес для устаревших ссылок на комиссии
 * (страницы старого сайта /struct/komissii/... и CMS-слаги commission-data-*),
 * либо null, если адрес не является устаревшей ссылкой на комиссию.
 */
export function resolveLegacyCommissionTarget(pathname) {
  const clean = String(pathname || "").replace(/\/+$/, "");
  if (!clean) return null;

  // /struct/komissii, /struct/komissii/266, /struct/komissii/266/6290
  const komissii = clean.match(/^\/struct\/komissii(?:\/(\d+))?(?:\/\d+)?$/i);
  if (komissii) {
    const id = LEGACY_SECTION_TO_COMMISSION_ID[komissii[1]];
    return id
      ? `/commission?id=${encodeURIComponent(id)}`
      : `/section?title=${encodeURIComponent("Комиссии")}`;
  }

  // CMS-страницы комиссий: /commission-data-<id> (в т.ч. /p/commission-data-<id>) —
  // это дубли раздела «Комиссии», редиректим на /commission?id=<id>
  if (clean.includes(COMMISSION_PAGE_SLUG_PREFIX)) {
    const idx = clean.lastIndexOf(COMMISSION_PAGE_SLUG_PREFIX);
    const id = decodeURIComponent(clean.slice(idx + COMMISSION_PAGE_SLUG_PREFIX.length));
    if (KNOWN_COMMISSION_IDS.has(id)) return `/commission?id=${encodeURIComponent(id)}`;
    return `/section?title=${encodeURIComponent("Комиссии")}`;
  }

  // /commission/<id> и /commissions/<id> — корректный адрес: /commission?id=<id>
  const bySegment = clean.match(/^\/commissions?\/([^/]+)$/i);
  if (bySegment) {
    const id = decodeURIComponent(bySegment[1]);
    if (KNOWN_COMMISSION_IDS.has(id)) return `/commission?id=${encodeURIComponent(id)}`;
  }

  return null;
}
