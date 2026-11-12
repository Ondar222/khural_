/** Ссылки на архив трансляций (VK и YouTube). Общий список для страницы /broadcast и главной. */
export const BROADCAST_LINKS = [
  "https://vkvideo.ru/video-114457376_456239439",
  "https://vkvideo.ru/video-114457376_456239438",
  "https://vkvideo.ru/video-114457376_456239434",
  "https://vkvideo.ru/video-114457376_456239420",
  "https://vkvideo.ru/video-114457376_456239410",
  "https://vkvideo.ru/video-114457376_456239406",
  "https://vkvideo.ru/video-114457376_456239405",
  "https://vkvideo.ru/video-114457376_456239391",
  "https://vkvideo.ru/video-114457376_456239390",
  "https://vkvideo.ru/video-114457376_456239385",
  "https://vkvideo.ru/video-114457376_456239381",
  "https://vkvideo.ru/video-114457376_456239365",
  "https://vkvideo.ru/video-114457376_456239303",
  "https://youtu.be/5ijpjn_TVEQ",
];

/** Названия трансляций по ID видео (для VK — числовой ID, для YouTube — с префиксом yt_). */
export const BROADCAST_TITLES = {
  456239439:
    "Прямая трансляция седьмого очередного заседания первой сессии Верховного Хурала (парламента) Республики Тыва четвертого созыва",
  456239438:
    "Прямая трансляция шестого очередного заседания первой сессии Верховного Хурала (парламента) Республики Тыва четвертого созыва",
  456239434: "Прямая трансляция: Верховный Хурал (парламент) Республики Тыва",
  456239420:
    "Прямая трансляция первого организационного заседания Верховного Хурала (парламента) Республики Тыва четвертого созыва",
  456239410:
    "Прямая трансляция восьмого очередного заседания десятой сессии Верховного Хурала (парламента) Республики Тыва третьего созыва",
  456239406:
    "Прямая трансляция публичных слушаний по годовому отчету об исполнении республиканского бюджета Республики Тыва за 2023 год",
  456239405:
    "Прямая трансляция седьмого очередного заседания десятой сессии Верховного Хурала (парламента) Республики Тыва третьего созыва",
  456239391:
    "Прямая трансляция четвертого внеочередного заседания десятой сессии Верховного Хурала (парламента) Республики Тыва",
  456239390:
    "Отчет сенатора Российской Федерации Дины Ивановны Оюн, представителя в Совете Федерации",
  456239385:
    "Прямая трансляция третьего очередного заседания десятой сессии Верховного Хурала (парламента) Республики Тыва третьего созыва",
  456239381:
    "Прямая трансляция второго очередного заседания десятой сессии Верховного Хурала (парламента) Республики Тыва третьего созыва",
  456239365:
    "Прямая трансляция пятого очередного заседания девятой сессии Верховного Хурала (парламента) Республики Тыва третьего созыва",
  456239303:
    "Отчет сенатора Российской Федерации Оюн Дины Ивановны о деятельности в период с 1 января по 31 декабря 2022 года",
  yt_5ijpjn_TVEQ:
    "Ежегодное послание Главы Республики Тыва Владислава Ховалыга Верховному Хуралу (Парламенту)",
};

/** Извлекает ID видео ВК (или YouTube, с префиксом yt_) из любого представления: URL, "owner_video", "video-xxx_yyy" или bare ID. */
function getVkVideoId(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const m = s.match(/video-?(-?\d+)_(\d+)/) || s.match(/(-?\d+)_(\d+)/);
  if (m) return m[2];
  if (/^\d+$/.test(s)) return s;
  const yt = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (yt) return `yt_${yt[1]}`;
  return null;
}

/** Возвращает название трансляции по ссылке, ID или ключу или null. */
export function getBroadcastTitle(url) {
  if (!url) return null;
  const videoId = getVkVideoId(url);
  if (!videoId) return null;
  return BROADCAST_TITLES[videoId] || null;
}

/** Возвращает { embedUrl, watchUrl } для встраивания и ссылки. */
export function getBroadcastUrls(url) {
  const vkMatch = url.match(/video-?(\d+)_(\d+)/);
  if (vkMatch) {
    const oid = -Number(vkMatch[1]);
    const id = vkMatch[2];
    return {
      // vkvideo.ru стабильнее для iframe, чем vk.com (на главной не «чёрные» плееры)
      embedUrl: `https://vkvideo.ru/video_ext.php?oid=${oid}&id=${id}&hd=2`,
      watchUrl: `https://vkvideo.ru/video-${vkMatch[1]}_${vkMatch[2]}`,
    };
  }
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${id}`,
      watchUrl: url.startsWith("http") ? url : `https://youtu.be/${id}`,
    };
  }
  return { embedUrl: null, watchUrl: url };
}

/** Читаемая дата трансляции: DD.MM.YYYY (если не поддаётся парсу — возвращаем исходную строку). */
export function formatBroadcastDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

/** Служебное название трансляции, которое используется, когда реального названия нет. */
const BROADCAST_FALLBACK_NAME = "Трансляция";

/**
 * Реальное название трансляции (без служебного fallback):
 * title → sourceUrl → externalId → watchUrl → streamKey → name.
 * Возвращает пустую строку, если реального названия не найдено.
 */
function resolveBroadcastName(item) {
  const sourceUrl = text(item?.sourceUrl ?? item?.source_url ?? item?.url);
  const externalId = text(item?.externalId ?? item?.external_id);
  const watchUrl = text(item?.watchUrl);
  const streamKey = text(
    item?.vkStreamKey ?? item?.vk_stream_key ?? item?.stream_key ?? item?.externalId ?? item?.external_id,
  );
  const title = text(item?.title);
  const customName = text(item?.name);
  const realFromTitle = title && title !== BROADCAST_FALLBACK_NAME ? title : "";
  if (realFromTitle) return realFromTitle;
  const fromLink =
    getBroadcastTitle(sourceUrl) ||
    getBroadcastTitle(externalId) ||
    getBroadcastTitle(watchUrl) ||
    getBroadcastTitle(streamKey);
  if (fromLink) return fromLink;
  if (customName && customName !== BROADCAST_FALLBACK_NAME) return customName;
  return "";
}

/**
 * Формат названия трансляции: «Название+дата».
 * Если название не найдено — берём «Трансляция+дата» (или просто «Трансляция»).
 */
export function formatBroadcastTitle(item, fallbackName) {
  const name =
    resolveBroadcastName(item) || text(fallbackName) || BROADCAST_FALLBACK_NAME;
  const date = formatBroadcastDate(item?.publishedAt ?? item?.published_at);
  return date ? `${name} + ${date}` : name;
}

const text = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

/**
 * Единый формат трансляции для витрины и админки.
 * Бэкенд (/api/broadcasts) отдаёт embedUrl/sourceUrl готовыми, но title у синхронизированных
 * записей пустой — название добираем из локального справочника BROADCAST_TITLES по ID видео.
 */
export function fromApiBroadcast(item, index = 0) {
  if (!item || typeof item !== "object") return null;
  const externalId = text(item.externalId ?? item.external_id);
  const sourceUrl = text(item.sourceUrl ?? item.source_url ?? item.url);
  const url = sourceUrl || (externalId ? `https://vkvideo.ru/video${externalId}` : "");
  if (!url) return null;
  const derived = getBroadcastUrls(url);
  return {
    id: item.id ?? externalId ?? url,
    url,
    title: formatBroadcastTitle(
      {
        ...item,
        sourceUrl: sourceUrl || url,
        url,
        publishedAt: item.publishedAt ?? item.published_at,
      },
      text(item.title) || getBroadcastTitle(url) || getBroadcastTitle(derived.watchUrl)
    ),
    description: text(item.description),
    provider: text(item.provider ?? item.type) || "vk",
    embedUrl: text(item.embedUrl ?? item.embed_url) || derived.embedUrl || null,
    watchUrl: derived.watchUrl || url,
    thumbnailUrl: text(item.thumbnailUrl ?? item.thumbnail_url) || null,
    isLive: item.isLive === true || item.is_live === true,
    isPublished: item.isPublished !== false && item.is_published !== false,
    publishedAt:
      text(item.publishedAt ?? item.published_at) || text(item.createdAt ?? item.created_at) || "",
    sortOrder: Number.isFinite(Number(item.sortOrder ?? item.sort_order))
      ? Number(item.sortOrder ?? item.sort_order)
      : index,
    source: "api",
  };
}

/** Статическая ссылка из BROADCAST_LINKS → тот же формат (fallback без бэкенда). */
export function fromStaticBroadcastLink(url, index = 0) {
  const derived = getBroadcastUrls(url);
  return {
    id: `static-${index}`,
    url: text(url),
    title: formatBroadcastTitle({ url, sourceUrl: text(url), publishedAt: "" }, getBroadcastTitle(url)),
    description: "",
    provider: text(url).includes("youtu") ? "youtube" : "vk",
    embedUrl: derived.embedUrl || null,
    watchUrl: derived.watchUrl || text(url),
    thumbnailUrl: null,
    isLive: false,
    isPublished: true,
    publishedAt: "",
    sortOrder: index,
    source: "static",
  };
}

/** Сортировка: прямые эфиры сверху, далее реальные трансляции (по порядку бэкенда), затем прочие. */
export function sortBroadcastItems(items) {
  const arr = Array.isArray(items) ? items : [];
  const hasRealName = (b) => Boolean(b && hasRealBroadcastName(b));
  return [...arr].sort((a, b) => {
    if (Boolean(a?.isLive) !== Boolean(b?.isLive)) return a?.isLive ? -1 : 1;
    const aReal = hasRealName(a);
    const bReal = hasRealName(b);
    if (aReal !== bReal) return aReal ? -1 : 1;
    const sa = Number.isFinite(Number(a?.sortOrder)) ? Number(a.sortOrder) : 0;
    const sb = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 0;
    if (sa !== sb) return sa - sb;
    const ta = Date.parse(a?.publishedAt ?? "") || 0;
    const tb = Date.parse(b?.publishedAt ?? "") || 0;
    return tb - ta;
  });
}

/**
 * Нормализует название трансляции: title → sourceUrl → externalId → watchUrl → fallback.
 * Возвращает полное имя трансляции, а не служебный fallback вроде «Трансляция 1».
 */
export function resolveBroadcastTitle(item, fallbackName) {
  const name = resolveBroadcastName(item);
  return name || text(fallbackName) || BROADCAST_FALLBACK_NAME;
}

/** Есть ли у трансляции реальное (не служебное) название. */
export function hasRealBroadcastName(item) {
  // resolveBroadcastName возвращает реальное имя или пустую строку,
  // служебный fallback применяется только в resolveBroadcastTitle.
  const name = resolveBroadcastName(item);
  return Boolean(name);
}

/** GET /api/broadcasts → отсортированный список опубликованных трансляций (без безымянных записей). */
export function normalizeApiBroadcasts(list) {
  const arr = Array.isArray(list) ? list : [];
  return sortBroadcastItems(
    arr
      .map((item, i) => fromApiBroadcast(item, i))
      .filter((item) => item && item.isPublished)
      // Безымянные архивные записи на публичных страницах не показываем —
      // иначе вместо названия выводится служебное «Трансляция». Прямые эфиры оставляем всегда.
      .filter((item) => item.isLive || hasRealBroadcastName(item))
  );
}

/** BROADCAST_LINKS → тот же формат, порядок как в списке (свежие в конце). */
export function normalizeStaticBroadcasts(links) {
  const arr = Array.isArray(links) ? links : [];
  return arr.map((url, i) => fromStaticBroadcastLink(url, i)).filter((item) => item && item.url);
}