import React from "react";
import { MenuApi, SiteApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";

/**
 * Общие данные «шапки/подвала/меню» для публичной части сайта.
 * При недоступности API компоненты продолжают использовать свои локальные
 * данные — поэтому запросы не должны ломать отрисовку страницы.
 */
const cache = {
  site: null,
  headerMenu: null,
  footerMenu: null,
  loadedAt: 0,
};

const EVENTS = ["khural:site-updated", "khural:menu-updated"];

/**
 * Header/Footer/SideNav монтируют хук одновременно — без разделяемого Promise
 * один и тот же запрос уходил на бэкенд по 3–4 раза и попадал под лимит 429.
 */
const pendingLoads = new Map();

export function useSiteChrome() {
  const { lang } = useI18n();
  const apiLang = lang === "ty" || lang === "tyv" ? "tyv" : "ru";
  const [state, setState] = React.useState({
    site: cache.site,
    headerMenu: cache.headerMenu,
    footerMenu: cache.footerMenu,
    loading: !cache.loadedAt,
  });

  const load = React.useCallback(async () => {
    let pending = pendingLoads.get(apiLang);
    if (!pending) {
      pending = (async () => {
        const results = await Promise.allSettled([
          SiteApi.getAll(),
          MenuApi.list({ area: "header", tree: true, lang: apiLang }),
          MenuApi.list({ area: "footer", tree: true, lang: apiLang }),
        ]);

        const site = results[0].status === "fulfilled" ? results[0].value : cache.site;
        const headerMenu = results[1].status === "fulfilled" ? results[1].value : cache.headerMenu;
        const footerMenu = results[2].status === "fulfilled" ? results[2].value : cache.footerMenu;

        if (site) cache.site = site;
        if (headerMenu) cache.headerMenu = headerMenu;
        if (footerMenu) cache.footerMenu = footerMenu;
        cache.loadedAt = Date.now();
        return { site, headerMenu, footerMenu };
      })().finally(() => pendingLoads.delete(apiLang));
      pendingLoads.set(apiLang, pending);
    }

    const data = await pending;
    setState({ ...data, loading: false });
  }, [apiLang]);

  React.useEffect(() => {
    load();
    const onUpdate = () => load();
    EVENTS.forEach((event) => window.addEventListener(event, onUpdate));
    return () => EVENTS.forEach((event) => window.removeEventListener(event, onUpdate));
  }, [load]);

  const header = state.site?.header;
  const footer = state.site?.footer;

  /** Плоский список видимых пунктов меню шапки (для боковой панели). */
  const headerItems = React.useMemo(() => {
    if (Array.isArray(state.headerMenu?.items)) return state.headerMenu.items;
    if (Array.isArray(state.headerMenu)) return state.headerMenu;
    return [];
  }, [state.headerMenu]);

  const footerGroups = React.useMemo(() => {
    if (Array.isArray(state.footerMenu?.groups)) return state.footerMenu.groups;
    return [];
  }, [state.footerMenu]);

  const footerItems = React.useMemo(() => {
    if (Array.isArray(state.footerMenu?.items)) return state.footerMenu.items;
    if (Array.isArray(state.footerMenu)) return state.footerMenu;
    return [];
  }, [state.footerMenu]);

  return {
    header,
    footer,
    headerItems,
    footerGroups,
    footerItems,
    loading: state.loading,
    refresh: load,
  };
}

export default useSiteChrome;
