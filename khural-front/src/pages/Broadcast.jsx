import React from "react";
import { Pagination } from "antd";
import BroadcastWidget from "../components/BroadcastWidget.jsx";
import VkWidget from "../components/VkWidget.jsx";
import SideNav from "../components/SideNav.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { useBroadcastLinks } from "../hooks/useBroadcastLinks.js";

const BROADCAST_PAGE_SIZE = 6;

export default function Broadcast() {
  const { t } = useI18n();
  const { settings } = useData();
  const { items: broadcastItems } = useBroadcastLinks();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [activeBroadcastId, setActiveBroadcastId] = React.useState(null);
  const pageItems = React.useMemo(() => {
    const start = (currentPage - 1) * BROADCAST_PAGE_SIZE;
    return broadcastItems.slice(start, start + BROADCAST_PAGE_SIZE);
  }, [broadcastItems, currentPage]);

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
              <div className="broadcast-archive__grid">
                {pageItems.map((item, index) => {
                  const itemId = String(item.id ?? item.url);
                  const title =
                    item.title ||
                    `Трансляция ${(currentPage - 1) * BROADCAST_PAGE_SIZE + index + 1}`;
                  const isPlayerActive = activeBroadcastId === itemId;
                  return (
                    <div
                      key={itemId}
                      className="broadcast-archive__card"
                    >
                      <div className="broadcast-archive__player">
                        {item.embedUrl && isPlayerActive ? (
                          <iframe
                            src={item.embedUrl}
                            title={title}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                          />
                        ) : item.embedUrl ? (
                          <button
                            type="button"
                            className="broadcast-archive__load-player"
                            onClick={() => setActiveBroadcastId(itemId)}
                            aria-label={`Загрузить плеер: ${title}`}
                          >
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt="" loading="lazy" />
                            ) : null}
                            <span className="broadcast-archive__play" aria-hidden="true">▶</span>
                            <span>Нажмите, чтобы загрузить видео</span>
                          </button>
                        ) : (
                          <a
                            href={item.watchUrl || item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="broadcast-archive__load-player"
                          >
                            Открыть трансляцию
                          </a>
                        )}
                      </div>
                      <div className="broadcast-archive__caption">
                        <a
                          href={item.watchUrl || item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {title}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              {broadcastItems.length > BROADCAST_PAGE_SIZE ? (
                <Pagination
                  className="broadcast-archive__pagination"
                  current={currentPage}
                  pageSize={BROADCAST_PAGE_SIZE}
                  total={broadcastItems.length}
                  showSizeChanger={false}
                  onChange={(page) => {
                    setCurrentPage(page);
                    setActiveBroadcastId(null);
                  }}
                  aria-label="Страницы архива трансляций"
                />
              ) : null}
            </div>

            {/* Виджет ВК с последними постами */}
            {vkGroupId && (
              <VkWidget groupId={vkGroupId} height={500} />
            )}
          </div>
          <SideNav
            loadPages={true}
            autoSection={true}
          />
        </div>
      </div>
    </section>
  );
}
