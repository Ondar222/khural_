/** Утилиты категории «Медиа»: фотоальбомы и видеозаписи в разделе новостей.
 * Медиа-запись — это новость с категорией «Медиа». Видео хранятся в контенте
 * в виде iframe-эмбедов (YouTube / VK Видео / Rutube), ссылки на них добавляются
 * из админки на форме создания.
 */
import { resolveNewsCategory } from "./newsCategoryAutofill.js";

export const MEDIA_CATEGORY_NAME = "Медиа";

/** Название категории — «Медиа»? (без учёта регистра) */
export function isMediaCategoryLabel(label) {
  return String(label || "").trim().toLowerCase() === "медиа";
}

/** Является ли новость медиа-записью (категория «Медиа»)? */
export function isMediaNews(item) {
  if (!item) return false;
  const own =
    typeof item.category === "string"
      ? item.category
      : String(item.category?.name || item.category?.title || "").trim();
  // Только собственная категория: автоопределение по тексту не должно
  // записывать обычные новости в медиа.
  return isMediaCategoryLabel(own) || isMediaCategoryLabel(resolveNewsCategory(item).label);
}

const VIDEO_HOST_RE = /(youtube\.com|youtu\.be|vk\.com|vkvideo\.ru|rutube\.ru)/i;

/** Ссылка ведёт на видеоплатформу? */
export function isVideoPlatformUrl(url) {
  return VIDEO_HOST_RE.test(String(url || ""));
}

/** YouTube watch/share-ссылку или ID превращает в URL эмбеда; остальное — как есть. */
export function toEmbedUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (/^[\w-]{11}$/.test(s)) return `https://www.youtube.com/embed/${s}`;
  const yt = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return s;
}

/** Собирает HTML-блок с видео-эмбедами (вставляется в контент новости). */
export function buildVideoEmbedHtml(urls) {
  const list = (Array.isArray(urls) ? urls : [])
    .map((u) => String(u || "").trim())
    .filter(Boolean);
  if (!list.length) return "";
  const parts = list.map((raw) => {
    const url = toEmbedUrl(raw);
    if (VIDEO_HOST_RE.test(url) && /embed|youtu\.be|vk\.com\/video|vkvideo\.ru|rutube\.ru/i.test(url)) {
      return `<div class="news-video-embed" style="margin:16px 0"><iframe src="${url}" title="Видео" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;max-width:100%;aspect-ratio:16/9;border:0;border-radius:12px"></iframe></div>`;
    }
    return `<p><a href="${raw}" target="_blank" rel="noopener noreferrer">Видеозапись: ${raw}</a></p>`;
  });
  return parts.join("");
}

/** Есть ли у новости видео (iframe/видео-тег или ссылка на видеоплатформу). */
export function newsHasVideo(item) {
  const html = `${item?.contentHtml || ""} ${item?.contentHtmlTy || ""}`;
  if (!html.trim()) return false;
  if (/<(iframe|video)[^>]/i.test(html)) return true;
  return VIDEO_HOST_RE.test(html);
}

/** Количество фото у новости (обложка + галерея). */
export function newsPhotosCount(item) {
  const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];
  if (images.length) return images.length;
  return item?.image ? 1 : 0;
}
