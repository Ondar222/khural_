import React from "react";
import BroadcastWidget from "../components/BroadcastWidget.jsx";
import VkWidget from "../components/VkWidget.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { useData } from "../context/DataContext.jsx";

export default function Broadcast() {
  const { t } = useI18n();
  const { settings } = useData();

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
            
            {/* Виджет ВК с последними постами */}
            {vkGroupId && (
              <VkWidget groupId={vkGroupId} height={500} />
            )}
          </div>
          <SideNav
            title={t("Трансляции")}
            links={[
              { label: t("Трансляция"), href: "/broadcast" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

