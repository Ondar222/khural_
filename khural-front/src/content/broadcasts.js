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

/** Возвращает { embedUrl, watchUrl } для встраивания и ссылки. */
export function getBroadcastUrls(url) {
  const vkMatch = url.match(/video-?(\d+)_(\d+)/);
  if (vkMatch) {
    const oid = -Number(vkMatch[1]);
    const id = vkMatch[2];
    return {
      embedUrl: `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`,
      watchUrl: `https://vk.com/video-${vkMatch[1]}_${vkMatch[2]}`,
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
