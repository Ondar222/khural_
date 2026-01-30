import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { SitesApi } from "../api/client.js";

export default function SitesBlock() {
  const { t } = useI18n();
  const [sites, setSites] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    SitesApi.list()
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setSites(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading || error) return null;
  if (!sites.length) return null;

  return (
    <section className="section sites-block">
      <div className="container">
        <h2 className="portals-title sites-block__title">{t("sites")}</h2>
        <div className="grid cols-3 sites-block__grid">
          {sites.map((site) => {
            const name = site.name || "Сайт";
            const url = (site.url || "").trim() || "#";
            return (
              <a
                key={site.id}
                className="tile link"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ height: 120 }}
              >
                <span style={{ maxWidth: 260 }}>{name}</span>
                <span>→</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
