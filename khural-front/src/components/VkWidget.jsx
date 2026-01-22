import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function VkWidget({ groupId, height = 400 }) {
  const { t } = useI18n();
  const widgetRef = React.useRef(null);

  React.useEffect(() => {
    // Загружаем VK API скрипт
    if (!window.VK) {
      const script = document.createElement("script");
      script.src = "https://vk.com/js/api/openapi.js?169";
      script.async = true;
      script.onload = () => {
        if (window.VK && window.VK.Widgets && groupId) {
          window.VK.Widgets.Group(
            widgetRef.current,
            {
              mode: 0, // 0 - последние посты, 1 - только новости, 2 - только фото, 3 - только видео
              width: "auto",
              height: height,
              color1: "FFFFFF",
              color2: "2B587A",
              color3: "5B7FA6",
            },
            groupId
          );
        }
      };
      document.body.appendChild(script);
    } else if (window.VK && window.VK.Widgets && groupId && widgetRef.current) {
      // Если VK API уже загружен, сразу инициализируем виджет
      window.VK.Widgets.Group(
        widgetRef.current,
        {
          mode: 0,
          width: "auto",
          height: height,
          color1: "FFFFFF",
          color2: "2B587A",
          color3: "5B7FA6",
        },
        groupId
      );
    }

    return () => {
      // Очистка при размонтировании
      if (widgetRef.current) {
        widgetRef.current.innerHTML = "";
      }
    };
  }, [groupId, height]);

  if (!groupId) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
        <p>Виджет ВК не настроен. Укажите ID группы в настройках.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 16, fontSize: 20, fontWeight: 700 }}>
        {t("Последние посты из ВКонтакте")}
      </h3>
      <div
        ref={widgetRef}
        style={{
          width: "100%",
          minHeight: height,
          borderRadius: 12,
          overflow: "hidden",
        }}
      />
    </div>
  );
}
