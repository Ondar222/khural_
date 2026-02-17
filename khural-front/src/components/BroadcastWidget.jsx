import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

function getVkEmbedUrl(vkStreamKey, vkStreamUrl) {
  // Если есть прямая ссылка на трансляцию VK
  if (vkStreamUrl) {
    // Извлекаем ID трансляции из URL
    const match = vkStreamUrl.match(/video(-?\d+_\d+)/);
    if (match) {
      return `https://vk.com/video${match[1]}`;
    }
    return vkStreamUrl;
  }
  // Если есть ключ трансляции
  if (vkStreamKey) {
    // VK трансляции обычно имеют формат: https://vk.com/video-{group_id}_{video_id}
    // или можно использовать iframe embed
    return `https://vk.com/video${vkStreamKey}`;
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

  const [embedUrl, setEmbedUrl] = React.useState(null);
  const [streamType, setStreamType] = React.useState(null);

  React.useEffect(() => {
    if (!broadcastSettings || !broadcastSettings.isActive) {
      setEmbedUrl(null);
      setStreamType(null);
      return;
    }

    const type = broadcastSettings.type?.toLowerCase() || "vk";
    setStreamType(type);

    // Определяем URL для встраивания в зависимости от типа
    if (broadcastSettings.embedUrl) {
      setEmbedUrl(broadcastSettings.embedUrl);
    } else if (type === "vk" || type === "vkontakte") {
      const url = getVkEmbedUrl(broadcastSettings.vkStreamKey, broadcastSettings.vkStreamUrl);
      if (url) {
        // VK трансляции встраиваются через iframe
        setEmbedUrl(`https://vk.com/video_ext.php?oid=-${broadcastSettings.vkStreamKey?.replace(/[^0-9]/g, "")}&id=${broadcastSettings.vkStreamKey?.replace(/[^0-9]/g, "")}&hash=${Date.now()}`);
      }
    } else if (type === "obs") {
      const url = getOBSStreamUrl(broadcastSettings.obsRtmpUrl, broadcastSettings.obsStreamKey);
      if (url) {
        // Для OBS нужен специальный плеер (например, video.js с RTMP плагином)
        // Или конвертация RTMP в HLS через сервер
        setEmbedUrl(url);
      }
    } else if (type === "youtube") {
      const url = getYouTubeEmbedUrl(broadcastSettings.youtubeVideoId, broadcastSettings.youtubeUrl);
      if (url) {
        setEmbedUrl(url);
      }
    }
  }, [broadcastSettings]);

  if (loading?.settings) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
        Загрузка трансляции...
      </div>
    );
  }

  if (!broadcastSettings || !broadcastSettings.isActive) {
    return null;
  }

  return (
    <div style={{ background: "#f9fafb", padding: 24, borderRadius: 12 }}>
      <div className="container">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              {broadcastSettings.title}
            </h2>
            {broadcastSettings.description && (
              <p style={{ color: "#6b7280", fontSize: 16 }}>
                {broadcastSettings.description}
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
            {streamType === "youtube" && embedUrl ? (
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
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                title={broadcastSettings.title || t("Трансляция")}
              />
            ) : streamType === "vk" || streamType === "vkontakte" ? (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(broadcastSettings.vkStreamUrl || broadcastSettings.vkStreamKey) ? (
                  <a
                    href={broadcastSettings.vkStreamUrl || `https://vk.com/video${broadcastSettings.vkStreamKey}`}
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
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
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
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    OBS Трансляция
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
                    RTMP поток: {broadcastSettings.obsRtmpUrl || "не настроен"}
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
                title={broadcastSettings.title || t("Трансляция")}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

