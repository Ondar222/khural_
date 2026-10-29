import React from "react";
import { BROADCAST_LINKS } from "../content/broadcasts.js";
import { BroadcastsApi } from "../api/client.js";
import { normalizeApiBroadcasts, normalizeStaticBroadcasts } from "../content/broadcasts.js";

/**
 * Список ссылок на трансляции для архива на главной и /broadcast.
 * Приоритет: публичный /api/broadcasts, fallback — BROADCAST_LINKS.
 */
export function useBroadcastLinks() {
  const [links, setLinks] = React.useState(BROADCAST_LINKS);
  const [items, setItems] = React.useState(() => normalizeStaticBroadcasts(BROADCAST_LINKS));
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await BroadcastsApi.listPublic();
        if (cancelled) return;
        if (Array.isArray(list) && list.length > 0) {
          const normalized = normalizeApiBroadcasts(list);
          if (normalized.length > 0) {
            setItems(normalized);
            setLinks(normalized.map((b) => b.url));
            setLoading(false);
            return;
          }
        }
      } catch {
        // fallback ниже
      }
      if (!cancelled) {
        const fallback = normalizeStaticBroadcasts(BROADCAST_LINKS);
        setItems(fallback);
        setLinks(fallback.map((b) => b.url));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { links, items, loading };
}
