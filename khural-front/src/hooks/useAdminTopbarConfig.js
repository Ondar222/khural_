import React from "react";
import { SettingsApi } from "../api/client.js";
import { normalizeBool } from "../utils/bool.js";

export const ADMIN_TOPBAR_SETTINGS_KEY = "admin-topbar";

export const ADMIN_TOPBAR_DEFAULTS = {
  // Переключатель языка
  showLangToggle: true,
  langLabelRu: "ТЫ",
  langLabelTy: "РУ",
  // Ссылка на сайт
  showGoToSite: true,
  siteLabelRu: "На сайт",
  siteLabelTy: "Сайтка",
  siteUrl: "/",
  // Смена темы
  showThemeSwitch: true,
  themeLabelRu: "Смена темы",
  themeLabelTy: "Теема солуур",
  // Кнопка меню
  showMenuButton: true,
  menuLabelRu: "Меню",
  menuLabelTy: "Меню",
  // Возврат в дашборд
  showBackToDashboard: true,
  backLabelRu: "Назад в дашборд",
  backLabelTy: "Башкарылга шөлүнге эглип",
};

const UPDATE_EVENT = "khural:admin-topbar-updated";
let cachedConfig = { ...ADMIN_TOPBAR_DEFAULTS };

function normalizeText(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeUrl(value, fallback = "/") {
  const url = String(value ?? "").trim() || fallback;
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return url;
  return `/${url}`;
}

/**
 * GET /api/settings возвращает массив entities [{ key, value, ... }],
 * а выделенный endpoint — объект { key, value }. Поддерживаем оба вида,
 * а также обычный объект ключ → значение.
 */
export function extractSettingValue(data, key) {
  if (!data) return undefined;
  if (Array.isArray(data)) {
    const entry = data.find((item) => item && item.key === key);
    return entry?.value;
  }
  if (typeof data === "object") {
    if (Object.prototype.hasOwnProperty.call(data, key)) return data[key];
    if (data.value !== undefined && (data.key === key || data.key === undefined)) {
      return data.value;
    }
  }
  return undefined;
}

export function normalizeAdminTopbarConfig(raw) {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      value = null;
    }
  }
  // Некоторые бэкенды возвращают { key, value } даже для getByKey.
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    value = value.value;
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        value = null;
      }
    }
  }
  const s = value && typeof value === "object" ? value : {};
  return {
    showLangToggle: normalizeBool(s.showLangToggle, ADMIN_TOPBAR_DEFAULTS.showLangToggle),
    langLabelRu: normalizeText(s.langLabelRu, ADMIN_TOPBAR_DEFAULTS.langLabelRu),
    langLabelTy: normalizeText(s.langLabelTy, ADMIN_TOPBAR_DEFAULTS.langLabelTy),

    showGoToSite: normalizeBool(s.showGoToSite, ADMIN_TOPBAR_DEFAULTS.showGoToSite),
    siteLabelRu: normalizeText(s.siteLabelRu, ADMIN_TOPBAR_DEFAULTS.siteLabelRu),
    siteLabelTy: normalizeText(s.siteLabelTy, ADMIN_TOPBAR_DEFAULTS.siteLabelTy),
    siteUrl: normalizeUrl(s.siteUrl, ADMIN_TOPBAR_DEFAULTS.siteUrl),

    showThemeSwitch: normalizeBool(s.showThemeSwitch, ADMIN_TOPBAR_DEFAULTS.showThemeSwitch),
    themeLabelRu: normalizeText(s.themeLabelRu, ADMIN_TOPBAR_DEFAULTS.themeLabelRu),
    themeLabelTy: normalizeText(s.themeLabelTy, ADMIN_TOPBAR_DEFAULTS.themeLabelTy),

    showMenuButton: normalizeBool(s.showMenuButton, ADMIN_TOPBAR_DEFAULTS.showMenuButton),
    menuLabelRu: normalizeText(s.menuLabelRu, ADMIN_TOPBAR_DEFAULTS.menuLabelRu),
    menuLabelTy: normalizeText(s.menuLabelTy, ADMIN_TOPBAR_DEFAULTS.menuLabelTy),

    showBackToDashboard: normalizeBool(
      s.showBackToDashboard,
      ADMIN_TOPBAR_DEFAULTS.showBackToDashboard
    ),
    backLabelRu: normalizeText(s.backLabelRu, ADMIN_TOPBAR_DEFAULTS.backLabelRu),
    backLabelTy: normalizeText(s.backLabelTy, ADMIN_TOPBAR_DEFAULTS.backLabelTy),
  };
}

export function notifyAdminTopbarUpdated(config) {
  cachedConfig = normalizeAdminTopbarConfig(config);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: cachedConfig }));
  }
}

export function useAdminTopbarConfig() {
  const [config, setConfig] = React.useState(() => ({ ...cachedConfig }));

  React.useEffect(() => {
    let active = true;
    const handleUpdate = (event) => {
      const next = normalizeAdminTopbarConfig(event?.detail);
      cachedConfig = next;
      if (active) setConfig(next);
    };
    window.addEventListener(UPDATE_EVENT, handleUpdate);

    SettingsApi.getAll()
      .then((data) => {
        const next = normalizeAdminTopbarConfig(
          extractSettingValue(data, ADMIN_TOPBAR_SETTINGS_KEY)
        );
        cachedConfig = next;
        if (active) setConfig(next);
      })
      .catch(() => {
        // Если настройки недоступны — остаются значения по умолчанию.
      });

    return () => {
      active = false;
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
    };
  }, []);

  return config;
}
