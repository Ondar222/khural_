import React from "react";
import { VideoIcon, RssIcon } from "./icons/LinearIcons.jsx";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { BroadcastsApi } from "../api/client.js";
import { getBroadcastTitle } from "../content/broadcasts.js";

function getVkEmbedUrl(vkStreamKey, vkStreamUrl) {
  const src = vkStreamUrl || null;
  if (src) {
    const match = src.match(/video(-?\d+)_(\d+)/);
    if (match) {
      return `https://vkvideo.ru/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2`;
    }
    if (src.includes("video_ext.php") || src.startsWith("https://vk.com/video") || src.startsWith("https://vkvideo.ru/")) {
      return src;
    }
    return null;
  }
  const key = vkStreamKey || null;
  if (key) {
    const match = String(key).match(/video(-?\d+)_(\d+)/);
    if (match) {
      return `https://vkvideo.ru/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2`;
    }
  }
  return null;
}

function getOBSStreamUrl(obsRtmpUrl, obsStreamKey) {
  if (!obsRtmpUrl || !obsStreamKey) return null;
  return `${obsRtmpUrl}/${obsStreamKey}`;
}

function getYouTubeEmbedUrl(youtubeVideoId, youtubeUrl) {
  if (youtubeVideoId) {
    return `https://www.youtube.com/embed/${youtubeVideoId}`;
  }
  if (youtubeUrl) {
    const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
}

function parseBroadcastFromSettings(settings) {
  if (!settings) return null;

  let settingsBroadcast = null;

  if (Array.isArray(settings)) {
    const broadcastSetting = settings.find((s) => s?.key === "broadcast");
    if (broadcastSetting?.value) {
      try {
        settingsBroadcast = JSON.parse(broadcastSetting.value);
      } catch {
        settingsBroadcast = null;
      }
    }
  } else if (typeof settings === "object") {
    settingsBroadcast =
      settings.broadcast || settings.stream || settings.vk_stream || settings.current_broadcast;

    if (typeof settingsBroadcast === "string") {
      try {
        settingsBroadcast = JSON.parse(settingsBroadcast);
      } catch {
        settingsBroadcast = null;
      }
    }
  }

  if (!settingsBroadcast || typeof settingsBroadcast !== "object") return null;

  return {
    type: settingsBroadcast.type || settingsBroadcast.platform || "vk",
    title: settingsBroadcast.title || settingsBroadcast.name || "",
    description: settingsBroadcast.description || "",
    vkStreamKey:
      settingsBroadcast.vk_stream_key ||
      settingsBroadcast.vkStreamKey ||
      settingsBroadcast.stream_key,
    vkStreamUrl:
      settingsBroadcast.vk_stream_url ||
      settingsBroadcast.vkStreamUrl ||
      settingsBroadcast.stream_url,
    obsRtmpUrl:
      settingsBroadcast.obs_rtmp_url || settingsBroadcast.obsRtmpUrl || settingsBroadcast.rtmp_url,
    obsStreamKey:
      settingsBroadcast.obs_stream_key || settingsBroadcast.obsStreamKey || settingsBroadcast.obs_key,
    youtubeVideoId: settingsBroadcast.youtube_video_id || settingsBroadcast.youtubeVideoId,
    youtubeUrl: settingsBroadcast.youtube_url || settingsBroadcast.youtubeUrl,
    embedUrl: settingsBroadcast.embed_url || settingsBroadcast.embedUrl,
    isActive: settingsBroadcast.is_active !== false && settingsBroadcast.isActive !== false,
    source: "settings",
  };
}

function mapApiBroadcast(item, fallbackTitle) {
  if (!item || typeof item !== "object") return null;
  const sourceUrl = item.sourceUrl || item.source_url || item.url || "";
  const title =
    item.title ||
    getBroadcastTitle(sourceUrl) ||
    fallbackTitle ||
    "";

  return {
    type: item.type || item.provider || "vk",
    title,
    description: item.description || "",
    vkStreamKey: item.vk_stream_key || item.vkStreamKey || item.externalId,
    vkStreamUrl: item.vk_stream_url || item.vkStreamUrl || sourceUrl,
    obsRtmpUrl: item.obs_rtmp_url || item.obsRtmpUrl,
    obsStreamKey: item.obs_stream_key || item.obsStreamKey,
    youtubeVideoId: item.youtube_video_id || item.youtubeVideoId,
    youtubeUrl: item.youtube_url || item.youtubeUrl,
    embedUrl: item.embedUrl || item.embed_url || null,
    isActive: item.isLive === true || item.is_live === true,
    sourceUrl,
    source: "api",
  };
}

function resolveEmbed(broadcast) {
  if (!broadcast) return { embedUrl: null, streamType: null };

  const type = String(broadcast.type || "vk").toLowerCase();
  if (broadcast.embedUrl) {
    return { embedUrl: broadcast.embedUrl, streamType: type };
  }
  if (type === "vk" || type === "vkontakte") {
    return {
      embedUrl: getVkEmbedUrl(broadcast.vkStreamKey, broadcast.vkStreamUrl),
      streamType: type,
    };
  }
  if (type === "obs") {
    return {
      embedUrl: getOBSStreamUrl(broadcast.obsRtmpUrl, broadcast.obsStreamKey),
      streamType: type,
    };
  }
  if (type === "youtube") {
    return {
      embedUrl: getYouTubeEmbedUrl(broadcast.youtubeVideoId, broadcast.youtubeUrl),
      streamType: type,
    };
  }
  return { embedUrl: null, streamType: type };
}

/**
 * @param {{ compact?: boolean }} props
 * compact — для главной: без лишних обёрток/вложенного .container
 */
export default function BroadcastWidget({ compact = false } = {}) {
  const { settings, loading } = useData();
  const { t } = useI18n();
  const fallbackTitle = t("Трансляция");

  const broadcastSettings = React.useMemo(() => {
    try {
      const local = localStorage.getItem("admin_settings_broadcast");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === "object") {
          return {
            type: parsed.type || parsed.platform || "vk",
            title: parsed.title || parsed.name || fallbackTitle,
            description: parsed.description || "",
            vkStreamKey: parsed.vk_stream_key || parsed.vkStreamKey || parsed.stream_key,
            vkStreamUrl: parsed.vk_stream_url || parsed.vkStreamUrl || parsed.stream_url,
            obsRtmpUrl: parsed.obs_rtmp_url || parsed.obsRtmpUrl || parsed.rtmp_url,
            obsStreamKey: parsed.obs_stream_key || parsed.obsStreamKey || parsed.obs_key,
            youtubeVideoId: parsed.youtube_video_id || parsed.youtubeVideoId,
            youtubeUrl: parsed.youtube_url || parsed.youtubeUrl,
            embedUrl: parsed.embed_url || parsed.embedUrl,
            isActive: parsed.is_active !== false && parsed.isActive !== false,
            source: "local",
          };
        }
      }
    } catch {
      // ignore
    }

    const fromSettings = parseBroadcastFromSettings(settings);
    if (fromSettings) {
      return {
        ...fromSettings,
        title: fromSettings.title || fallbackTitle,
      };
    }
    return null;
  }, [settings, fallbackTitle]);

  const [apiBroadcast, setApiBroadcast] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await BroadcastsApi.listPublic();
      if (cancelled) return;
      if (!Array.isArray(list) || list.length === 0) {
        setApiBroadcast(null);
        return;
      }
      // Только реально live; не подставляем архивную запись как «прямой эфир»
      const live = list.find((b) => b?.isLive === true || b?.is_live === true) || null;
      setApiBroadcast(live ? mapApiBroadcast(live, fallbackTitle) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackTitle]);

  const resolvedBroadcast = React.useMemo(() => {
    // Админские настройки с явным эфиром — приоритет
    if (broadcastSettings?.isActive) {
      const hasStream =
        broadcastSettings.embedUrl ||
        broadcastSettings.vkStreamUrl ||
        broadcastSettings.vkStreamKey ||
        broadcastSettings.youtubeUrl ||
        broadcastSettings.youtubeVideoId ||
        broadcastSettings.obsRtmpUrl;
      if (hasStream) return broadcastSettings;
    }
    if (apiBroadcast?.isActive) return apiBroadcast;
    return null;
  }, [broadcastSettings, apiBroadcast]);

  const { embedUrl, streamType } = React.useMemo(
    () => resolveEmbed(resolvedBroadcast),
    [resolvedBroadcast]
  );

  if (loading?.settings) {
    return (
      <div className="broadcast-widget broadcast-widget--loading">
        Загрузка трансляции...
      </div>
    );
  }

  if (!resolvedBroadcast) {
    return null;
  }

  const title = resolvedBroadcast.title || fallbackTitle;
  const canEmbedIframe =
    Boolean(embedUrl) &&
    (streamType === "youtube" ||
      streamType === "vk" ||
      streamType === "vkontakte" ||
      streamType === "other");

  return (
    <div className={`broadcast-widget${compact ? " broadcast-widget--compact" : ""}`}>
      {!compact && (
        <div className="broadcast-widget__head">
          <h2 className="broadcast-widget__title">{title}</h2>
          {resolvedBroadcast.description ? (
            <p className="broadcast-widget__desc">{resolvedBroadcast.description}</p>
          ) : null}
        </div>
      )}

      <div className="broadcast-widget__player">
        {canEmbedIframe ? (
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; screen-wake-lock; fullscreen"
            title={title}
          />
        ) : streamType === "vk" || streamType === "vkontakte" ? (
          <div className="broadcast-widget__fallback">
            {resolvedBroadcast.vkStreamUrl || resolvedBroadcast.vkStreamKey ? (
              <a
                className="broadcast-widget__vk-link"
                href={
                  resolvedBroadcast.vkStreamUrl ||
                  `https://vk.com/video${resolvedBroadcast.vkStreamKey}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="broadcast-widget__play">▶</span>
                <span className="broadcast-widget__vk-title">Смотреть трансляцию в VK</span>
                <span className="broadcast-widget__vk-hint">Нажмите, чтобы открыть</span>
              </a>
            ) : (
              <div className="broadcast-widget__empty">
                <VideoIcon size={48} />
                <div className="broadcast-widget__empty-title">Трансляция VK</div>
                <div className="broadcast-widget__empty-hint">
                  Настройте ссылку на трансляцию в админке
                </div>
              </div>
            )}
          </div>
        ) : streamType === "obs" ? (
          <div className="broadcast-widget__fallback broadcast-widget__fallback--obs">
            <div className="broadcast-widget__empty">
              <span className="broadcast-widget__empty-icon">
                <RssIcon size={48} />
              </span>
              <div className="broadcast-widget__empty-title">OBS Трансляция</div>
              <div className="broadcast-widget__empty-hint">
                RTMP поток: {resolvedBroadcast.obsRtmpUrl || "не настроен"}
              </div>
              <div className="broadcast-widget__empty-hint">
                Для отображения OBS потока требуется специальный видеоплеер
              </div>
            </div>
          </div>
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            allow="autoplay; encrypted-media; fullscreen"
            title={title}
          />
        ) : null}
      </div>

      {compact && title ? (
        <div className="broadcast-widget__caption">{title}</div>
      ) : null}
    </div>
  );
}
