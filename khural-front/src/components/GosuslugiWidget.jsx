import React from "react";
import { useData } from "../context/DataContext.jsx";

export default function GosuslugiWidget() {
  const { settings } = useData();
  const widgetRef = React.useRef(null);
  const scriptLoadedRef = React.useRef(false);

  // Получаем код виджета из настроек
  const widgetCode = React.useMemo(() => {
    // Проверяем localStorage (для локальных изменений)
    try {
      const local = localStorage.getItem("admin_settings_gosuslugi");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.widgetCode) {
          return parsed.widgetCode;
        }
      }
    } catch {
      // ignore
    }

    // Проверяем settings из API
    if (settings) {
      let settingsGosuslugi = null;
      
      if (Array.isArray(settings)) {
        const gosuslugiSetting = settings.find((s) => s?.key === "gosuslugi");
        if (gosuslugiSetting?.value) {
          try {
            settingsGosuslugi = JSON.parse(gosuslugiSetting.value);
          } catch {
            settingsGosuslugi = null;
          }
        }
      } else if (typeof settings === "object") {
        settingsGosuslugi = settings.gosuslugi || settings.gosuslugi_widget;
        if (typeof settingsGosuslugi === "string") {
          try {
            settingsGosuslugi = JSON.parse(settingsGosuslugi);
          } catch {
            settingsGosuslugi = null;
          }
        }
      }

      if (settingsGosuslugi?.widgetCode) {
        return settingsGosuslugi.widgetCode;
      }
    }

    return null;
  }, [settings]);

  React.useEffect(() => {
    if (!widgetRef.current) return;

    // Если есть индивидуальный код виджета, используем его
    if (widgetCode) {
      widgetRef.current.innerHTML = widgetCode;
      return;
    }

    // Иначе загружаем базовый скрипт виджета
    if (!scriptLoadedRef.current) {
      const script = document.createElement("script");
      script.src = "https://pos.gosuslugi.ru/bin/script.min.js";
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
      };
      script.onerror = () => {
        // Fallback: показываем заглушку в стиле виджета
        if (widgetRef.current) {
          widgetRef.current.innerHTML = `
            <div style="height:200px;border-radius:16px;background:linear-gradient(135deg,#2b6cb0,#60a5fa);color:#fff;padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:48px;height:48px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;">👍</div>
                <div>
                  <div style="font-weight:800;font-size:18px;margin-bottom:4px;line-height:1.2;">
                    <span style="color:#fff;">гос</span><span style="color:#ff4444;">услуги</span>
                  </div>
                  <div style="font-weight:600;font-size:14px;opacity:0.95;">Решаем вместе</div>
                </div>
              </div>
              <div style="opacity:.95;font-size:15px;line-height:1.4;">Не убран снег, яма на дороге? Столкнулись с проблемой — сообщите о ней!</div>
              <a href="https://pos.gosuslugi.ru" target="_blank" rel="noopener noreferrer" style="align-self:flex-start;background:#fff;color:#1e40af;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Сообщить о проблеме</a>
            </div>
          `;
        }
      };
      document.body.appendChild(script);
      scriptLoadedRef.current = true;
    }

    return () => {
      // Очистка при размонтировании
      if (widgetRef.current && !widgetCode) {
        widgetRef.current.innerHTML = "";
      }
    };
  }, [widgetCode]);

  return (
    <div
      ref={widgetRef}
      style={{
        width: "100%",
        minHeight: 200,
        borderRadius: 16,
        overflow: "hidden",
      }}
    />
  );
}
