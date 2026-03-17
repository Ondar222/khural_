import React from "react";
import BroadcastWidget from "../components/BroadcastWidget.jsx";
import VkWidget from "../components/VkWidget.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { useBroadcastLinks } from "../hooks/useBroadcastLinks.js";
import { getBroadcastUrls } from "../content/broadcasts.js";

export default function Broadcast() {
  const { t } = useI18n();
  const { settings } = useData();
  const { links: broadcastLinks } = useBroadcastLinks();

  // Получаем ID группы ВК из настроек
  const vkGroupId = React.useMemo(() => {
    // Проверяем localStorage (для локальных изменений)
    try {
      const local = localStorage.getItem("admin_settings_broadcast");
      if (local) {
        const broadcast = JSON.parse(local);
        if (broadcast?.vk_group_id) {
          return broadcast.vk_group_id;
        }
      }
    } catch {
      // ignore
    }

    // Проверяем settings из API
    if (settings) {
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
        settingsBroadcast = settings.broadcast || settings.vk_group_id;
        if (typeof settingsBroadcast === "string") {
          try {
            settingsBroadcast = JSON.parse(settingsBroadcast);
          } catch {
            settingsBroadcast = null;
          }
        }
      }

      if (settingsBroadcast?.vk_group_id) {
        return settingsBroadcast.vk_group_id;
      }
      // Fallback: проверяем напрямую в settings
      if (settings.vk_group_id) {
        return settings.vk_group_id;
      }
    }

    return null;
  }, [settings]);

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <h1>{t("Трансляции")}</h1>
            <div style={{ marginTop: 24 }}>
              <BroadcastWidget />
            </div>

            {/* Архив трансляций */}
            <div className="card" style={{ padding: "20px 20px" }}>
              <h2 className="h2-compact" style={{ marginBottom: 16 }}>
                Архив трансляций
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 20,
                }}
              >
                {broadcastLinks.map((url, index) => {
                  const { embedUrl, watchUrl } = getBroadcastUrls(url);
                  return (
                    <div
                      key={url}
                      style={{
                        background: "#fafafa",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid #eee",
                      }}
                    >
                      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title={`Трансляция ${index + 1}`}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              border: 0,
                            }}
                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                          />
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              textDecoration: "none",
                            }}
                          >
                            Смотреть трансляцию
                          </a>
                        )}
                      </div>
                      <div style={{ padding: 12 }}>
                        <a
                          href={watchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: 600, fontSize: 14 }}
                        >
                          Трансляция {index + 1} →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Виджет ВК с последними постами */}
            {vkGroupId && (
              <VkWidget groupId={vkGroupId} height={500} />
            )}
          </div>
          <SideNav
            title={t("Трансляции")}
            loadPages={true}
            autoSection={true}
            links={[
              { label: t("Трансляция"), href: "/broadcast" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

