import React from "react";
import { VideoIcon, RssIcon } from "./icons/LinearIcons.jsx";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { BroadcastsApi } from "../api/client.js";

function getVkEmbedUrl(vkStreamKey, vkStreamUrl) {
  // Если есть прямая ссылка на трансляцию VK: https://vkvideo.ru/video-114457376_456239439
  const src = vkStreamUrl || null;
  if (src) {
    // Извлекаем ID трансляции из URL
    const match = src.match(/video(-?\d+)_(\d+)/);
    if (match) {
      // VK трансляции встраиваются через video_ext.php — так работает встроенный плеер
      return `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2`;
    }
    if (src.includes("video_ext.php") || src.startsWith("https://vk.com/video")) {
      return src;
    }
    return null;
  }
  // Если есть ключ трансляции
  const key = vkStreamKey || null;
  if (key) {
    const match = String(key).match(/video(-?\d+)_(\d+)/);
    if (match) {
      return `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2`;
    }
  }
  return null;
}

function getOBSStreamUrl(obsRtmpUrl, obsStreamKey) {
  if (!obsRtmpUrl || !obsStreamKey) return null;
  // OBS обычно использует RTMP, но для веб-плеера нужен HLS или другой формат
  // Можно использовать сервисы типа Wowza, или конвертировать RTMP в HLS
  // Для простоты возвращаем RTMP URL (потребуется специальный плеер)
  return `${obsRtmpUrl}/${obsStreamKey}`;
}

function getYouTubeEmbedUrl(youtubeVideoId, youtubeUrl) {
  if (youtubeVideoId) {
    return `https://www.youtube.com/embed/${youtubeVideoId}`;
  }
  if (youtubeUrl) {
    // Извлекаем ID из URL
    const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
}

export default function BroadcastWidget() {
  const { settings, loading } = useData();
  const { t } = useI18n();
  
  // Получаем настройки трансляции из settings
  const broadcastSettings = React.useMemo(() => {
    // Сначала проверяем localStorage (для локальных изменений)
    let broadcast = null;
    try {
      const local = localStorage.getItem("admin_settings_broadcast");
      if (local) {
        broadcast = JSON.parse(local);
      }
    } catch {
      // ignore
    }
    
    // Если нет в localStorage, ищем в settings из API
    if (!broadcast && settings) {
      // Settings может быть массивом объектов {key, value} или объектом с ключами
      let settingsBroadcast = null;
      
      if (Array.isArray(settings)) {
        // Если settings - массив, ищем элемент с key === "broadcast"
        const broadcastSetting = settings.find((s) => s?.key === "broadcast");
        if (broadcastSetting?.value) {
          try {
            settingsBroadcast = JSON.parse(broadcastSetting.value);
          } catch {
            settingsBroadcast = null;
          }
        }
      } else if (typeof settings === "object") {
        // Если settings - объект, ищем напрямую
        settingsBroadcast = settings.broadcast || settings.stream || settings.vk_stream || settings.current_broadcast;
        
        // Если это строка (JSON), парсим
        if (typeof settingsBroadcast === "string") {
          try {
            settingsBroadcast = JSON.parse(settingsBroadcast);
          } catch {
            settingsBroadcast = null;
          }
        }
      }
      
      broadcast = settingsBroadcast;
    }
    
    if (!broadcast || typeof broadcast !== "object") return null;
    
    return {
      type: broadcast.type || broadcast.platform || "vk",
      title: broadcast.title || broadcast.name || t("Трансляция"),
      description: broadcast.description || "",
      vkStreamKey: broadcast.vk_stream_key || broadcast.vkStreamKey || broadcast.stream_key,
      vkStreamUrl: broadcast.vk_stream_url || broadcast.vkStreamUrl || broadcast.stream_url,
      obsRtmpUrl: broadcast.obs_rtmp_url || broadcast.obsRtmpUrl || broadcast.rtmp_url,
      obsStreamKey: broadcast.obs_stream_key || broadcast.obsStreamKey || broadcast.obs_key,
      youtubeVideoId: broadcast.youtube_video_id || broadcast.youtubeVideoId,
      youtubeUrl: broadcast.youtube_url || broadcast.youtubeUrl,
      embedUrl: broadcast.embed_url || broadcast.embedUrl,
      isActive: broadcast.is_active !== false && broadcast.isActive !== false,
    };
  }, [settings, t]);

  // Fallback: текущую трансляцию берём из API (/broadcasts), где бэкенд хранит
  // трансляции, автоматически синхронизированные с VK (video.get). Без ручного добавления через админку.
  const [apiBroadcast, setApiBroadcast] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await BroadcastsApi.listPublic();
      if (cancelled) return;
      const live = Array.isArray(list) ? list.find((b) => b?.isLive) || list[0] || null : null;
      if (live) setApiBroadcast(live);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Активная трансляция: сначала настройки админки, иначе — последняя из API
  const resolvedBroadcast = React.useMemo(() => {
    if (broadcastSettings?.isActive) return broadcastSettings;
    if (apiBroadcast) {
      return { ...apiBroadcast, isActive: true, type: apiBroadcast.type || apiBroadcast.provider };
    }
    return null;
  }, [broadcastSettings, apiBroadcast]);

  const [embedUrl, setEmbedUrl] = React.useState(null);
  const [streamType, setStreamType] = React.useState(null);

  React.useEffect(() => {
    if (!resolvedBroadcast || !resolvedBroadcast.isActive) {
      setEmbedUrl(null);
      setStreamType(null);
      return;
    }

    const type = resolvedBroadcast.type?.toLowerCase() || "vk";
    setStreamType(type);

    // Определяем URL для встраивания в зависимости от типа
    if (resolvedBroadcast.embedUrl) {
      setEmbedUrl(resolvedBroadcast.embedUrl);
    } else if (type === "vk" || type === "vkontakte") {
      const url = getVkEmbedUrl(resolvedBroadcast.vkStreamKey, resolvedBroadcast.vkStreamUrl);
      if (url) {
        // VK трансляции встраиваются через iframe video_ext.php
        setEmbedUrl(url);
      }
    } else if (type === "obs") {
      const url = getOBSStreamUrl(resolvedBroadcast.obsRtmpUrl, resolvedBroadcast.obsStreamKey);
      if (url) {
        // Для OBS нужен специальный плеер (например, video.js с RTMP плагином)
        // Или конвертация RTMP в HLS через сервер
        setEmbedUrl(url);
      }
    } else if (type === "youtube") {
      const url = getYouTubeEmbedUrl(resolvedBroadcast.youtubeVideoId, resolvedBroadcast.youtubeUrl);
      if (url) {
        setEmbedUrl(url);
      }
    }
  }, [resolvedBroadcast]);

  if (loading?.settings) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
        Загрузка трансляции...
      </div>
    );
  }

  if (!resolvedBroadcast) {
    // Трансляция не настроена — ничего не показываем
    return null;
  }

  if (!resolvedBroadcast.isActive) {
    // Состояние: трансляция запланирована/настроена, но прямо сейчас эфира нет
    setEmbedUrl(null);
    setStreamType(null);
    return (
      <div
        style={{
          background: "#f9fafb",
          padding: 32,
          borderRadius: 12,
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "#374151" }}>
          Сейчас нет активной трансляции
        </div>
        <div style={{ fontSize: 14 }}>
          Прямой эфир скоро начнётся — загляните на сайт позже
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f9fafb", padding: 24, borderRadius: 12 }}>
      <div className="container">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              {resolvedBroadcast.title}
            </h2>
            {resolvedBroadcast.description && (
              <p style={{ color: "#6b7280", fontSize: 16 }}>
                {resolvedBroadcast.description}
              </p>
            )}
          </div>
          
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%", // 16:9 aspect ratio
              height: 0,
              overflow: "hidden",
              borderRadius: 12,
              background: "#000",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            {((streamType === "youtube" || streamType === "vk" || streamType === "vkontakte") && embedUrl) ? (
              <iframe
                src={embedUrl}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; screen-wake-lock; fullscreen"
                title={resolvedBroadcast.title || t("Трансляция")}
              />
            ) : streamType === "vk" || streamType === "vkontakte" ? (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(resolvedBroadcast.vkStreamUrl || resolvedBroadcast.vkStreamKey) ? (
                  <a
                    href={resolvedBroadcast.vkStreamUrl || `https://vk.com/video${resolvedBroadcast.vkStreamKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #0077FF 0%, #0051D5 100%)",
                      color: "#fff",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: 16,
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    <div style={{ fontSize: 64, lineHeight: 1 }}>▶</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>Смотреть трансляцию в VK</div>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>Нажмите, чтобы открыть</div>
                  </a>
                ) : (
                  <div style={{ color: "#fff", textAlign: "center", padding: 40 }}>
                    <div style={{ marginBottom: 16 }}><VideoIcon size={48} /></div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                      Трансляция VK
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>
                      Настройте ссылку на трансляцию в админке
                    </div>
                  </div>
                )}
              </div>
            ) : streamType === "obs" ? (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a" }}>
                <div style={{ color: "#fff", textAlign: "center", padding: 40 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "#94a3b8" }}><RssIcon size={48} /></div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    OBS Трансляция
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
                    RTMP поток: {resolvedBroadcast.obsRtmpUrl || "не настроен"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Для отображения OBS потока требуется специальный видеоплеер
                  </div>
                </div>
              </div>
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="autoplay; encrypted-media; fullscreen"
                title={resolvedBroadcast.title || t("Трансляция")}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

