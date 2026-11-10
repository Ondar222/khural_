import React from "react";
import NotFound from "./NotFound.jsx";
import { resolveLegacyCommissionTarget } from "../utils/legacyCommissionPaths.js";

/**
 * Запасная страница (маршрут "*"): если адрес — устаревшая ссылка на комиссию
 * (/struct/komissii/..., /commission-data-...), делаем мягкий redirect
 * на актуальный /commission?id=..., иначе показываем 404.
 */
export default function LegacyNotFound() {
  const [redirecting, setRedirecting] = React.useState(() =>
    Boolean(resolveLegacyCommissionTarget(window.location.pathname))
  );

  React.useEffect(() => {
    const tryRedirect = () => {
      const target = resolveLegacyCommissionTarget(window.location.pathname);
      if (!target) {
        setRedirecting(false);
        return;
      }
      const [path, query] = target.split("?");
      const search = query ? `?${query}` : window.location.search;
      window.history.replaceState({}, "", `${path}${search}${window.location.hash}`);
      window.dispatchEvent(new Event("app:navigate"));
    };

    tryRedirect();
    window.addEventListener("popstate", tryRedirect);
    window.addEventListener("app:navigate", tryRedirect);
    return () => {
      window.removeEventListener("popstate", tryRedirect);
      window.removeEventListener("app:navigate", tryRedirect);
    };
  }, []);

  if (redirecting) return null;
  return <NotFound />;
}