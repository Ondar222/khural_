import React from "react";
import GosWidget from "./GosWidget.jsx";
import BroadcastWidget from "./BroadcastWidget.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { useBroadcastLinks } from "../hooks/useBroadcastLinks.js";
import {
  readPortalsOverrides,
  mergePortalsWithOverrides,
  PORTALS_OVERRIDES_EVENT_NAME,
} from "../utils/portalsOverrides.js";

// Дефолтные порталы (используются как fallback)
const DEFAULT_PORTALS = [
  {
    id: "portal-1",
    label: "НОРМАТИВНО-ПРАВОВЫЕ АКТЫ В РОССИЙСКОЙ ФЕДЕРАЦИИ",
    href: "http://pravo.minjust.ru/",
  },
  {
    id: "portal-2",
    label: "ПАРЛАМЕНТ РЕСПУБЛИКИ ТЫВА",
    href: "http://gov.tuva.ru/",
  },
  {
    id: "portal-3",
    label: "ОФИЦИАЛЬНЫЙ ИНТЕРНЕТ-ПОРТАЛ ПРАВОВОЙ ИНФОРМАЦИИ",
    href: "http://pravo.gov.ru/",
  },
  {
    id: "portal-4",
    label: "ОБЩЕСТВЕННАЯ ПАЛАТА РЕСПУБЛИКИ ТЫВА",
    href: "http://palata.tuva.ru/",
  },
  {
    id: "portal-5",
    label: "ФЕДЕРАЛЬНЫЙ ПОРТАЛ ПРОЕКТОВ НОРМАТИВНЫХ ПРАВОВЫХ АКТОВ",
    href: "http://regulation.gov.ru/",
  },
  {
    id: "portal-6",
    label: "ГАС ЗАКОНОТВОРЧЕСТВО",
    href: "http://parliament.gov.ru/",
  },
  {
    id: "portal-7",
    label: "ПОРТАЛ ГОСУДАРСТВЕННЫХ УСЛУГ",
    href: "http://gosuslugi.ru/",
  },
  {
    id: "portal-8",
    label: "МИНИСТЕРСТВО ЮСТИЦИИ РОССИЙСКОЙ ФЕДЕРАЦИИ",
    href: "http://minjust.ru/",
  },
  {
    id: "portal-9",
    label: "ФЕДЕРАЛЬНЫЙ ПОРТАЛ УПРАВЛЕНЧЕСКИХ КАДРОВ",
    href: "http://gossluzhba.gov.ru/",
  },
  {
    id: "portal-10",
    label: "УПОЛНОМЕЧЕННЫЙ ПО ЗАЩИТЕ ПРАВ ПРЕДПРИНИМАТЕЛЕЙ В РЕСПУБЛИКЕ ТЫВА",
    href: "http://upp.rtyva.ru/",
  },
  {
    id: "portal-11",
    label: "ИЗБИРАТЕЛЬНАЯ КОММИССИЯ РЕСПУБЛИКИ ТЫВА",
    href: "http://www.tyva.izbirkom.ru/",
  },
];

export default function Resources() {
  const { t } = useI18n();
  const { items: broadcastItems } = useBroadcastLinks();
  const [portalsOpen, setPortalsOpen] = React.useState(false);
  const portalsId = "portals-list";
  const [portals, setPortals] = React.useState(() => {
    const overrides = readPortalsOverrides();
    return mergePortalsWithOverrides(DEFAULT_PORTALS, overrides);
  });

  // Загружаем порталы из localStorage
  React.useEffect(() => {
    const loadPortals = () => {
      const overrides = readPortalsOverrides();
      setPortals(mergePortalsWithOverrides(DEFAULT_PORTALS, overrides));
    };

    loadPortals();
    window.addEventListener(PORTALS_OVERRIDES_EVENT_NAME, loadPortals);
    window.addEventListener("storage", (e) => {
      if (e?.key === "khural_portals_overrides_v1") {
        loadPortals();
      }
    });

    return () => {
      window.removeEventListener(PORTALS_OVERRIDES_EVENT_NAME, loadPortals);
    };
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="portals-head">
          <h2 className="portals-title">{t("portals")}</h2>
          <button
            type="button"
            className="portals-toggle"
            aria-expanded={portalsOpen}
            aria-controls={portalsId}
            onClick={() => setPortalsOpen((v) => !v)}
          >
            <span>{portalsOpen ? t("hide") : t("show")}</span>
            <span className="portals-toggle__chev" aria-hidden>
              ▾
            </span>
          </button>
        </div>
        <div className="grid resources-grid" style={{ gap: 24 }}>
          <div id={portalsId} className={`portals-body ${portalsOpen ? "is-open" : ""}`}>
            <div className="grid cols-3">
            {portals.map((portal) => (
              <a
                key={portal.id}
                className="tile link resources-portals__tile"
                href={portal.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="resources-portals__label">{t(portal.label)}</span>
                <span className="resources-portals__arrow" aria-hidden="true">→</span>
              </a>
            ))}
            </div>
          </div>
          <div className="grid" style={{ gap: 24, alignSelf: "start" }}>
            <GosWidget id="gos-widget-3" />
          </div>
        </div>
        
        {/* Раздел Трансляции */}
        <div className="broadcasts-section">
          <div className="broadcasts-section__head">
            <h2 className="portals-title">{t("Трансляции")}</h2>
            <a href="/broadcast" className="broadcasts-section__all">
              Все трансляции →
            </a>
          </div>
          <BroadcastWidget compact />
          {/* 4 актуальные трансляции из /api/broadcasts (live и свежие сверху); остальные — на «Все трансляции» */}
          {(() => {
            const top4 = broadcastItems.slice(0, 4);
            if (top4.length === 0) return null;
            return (
              <div className="broadcasts-home">
                {top4.map((item, index) => {
                  const title = item.title || `${t("Трансляция")} ${index + 1}`;
                  return (
                    <div key={String(item.id ?? item.watchUrl ?? index)} className="broadcasts-home__item">
                      <div className="broadcasts-home__video">
                        {item.embedUrl ? (
                          <iframe
                            src={item.embedUrl}
                            title={title}
                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                          />
                        ) : (
                          <a
                            className="broadcasts-home__fallback"
                            href={item.watchUrl || item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("Трансляция")}
                          </a>
                        )}
                      </div>
                      <div className="broadcasts-home__link">
                        <a href={item.watchUrl || item.url} target="_blank" rel="noopener noreferrer">
                          {title}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
