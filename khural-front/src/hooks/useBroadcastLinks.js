import React from "react";
import { SettingsApi } from "../api/client.js";
import { BROADCAST_LINKS } from "../content/broadcasts.js";

/** Список ссылок на трансляции: с API (если бэкенд отдаёт без auth) или статический BROADCAST_LINKS. */
export function useBroadcastLinks() {
  const [links, setLinks] = React.useState(() => BROADCAST_LINKS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    SettingsApi.getBroadcastLinksPublic()
      .then((arr) => {
        if (cancelled) return;
        if (Array.isArray(arr) && arr.length > 0) {
          setLinks(arr);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { links, loading };
}
