import React from "react";
import { BROADCAST_LINKS } from "../content/broadcasts.js";
import { BroadcastsApi } from "../api/client.js";

/**
 * Список ссылок на трансляции для архива на главной и /broadcast.
 * Берём sourceUrl из публичного /broadcasts, при ошибке — статический BROADCAST_LINKS.
 */
export function useBroadcastLinks() {
  const [links, setLinks] = React.useState(BROADCAST_LINKS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await BroadcastsApi.listPublic();
        if (cancelled) return;
        if (Array.isArray(list) && list.length > 0) {
          const urls = list
            .map((b) => b?.sourceUrl || b?.source_url || b?.url || "")
            .filter((u) => typeof u === "string" && u.trim());
          if (urls.length > 0) {
            setLinks(urls);
            setLoading(false);
            return;
          }
        }
      } catch {
        // fallback ниже
      }
      if (!cancelled) {
        setLinks(BROADCAST_LINKS);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { links, loading };
}
