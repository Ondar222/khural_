import React from "react";
import GosWidget from "./GosWidget.jsx";
import BroadcastWidget from "./BroadcastWidget.jsx";
import GosuslugiWidget from "./GosuslugiWidget.jsx";
import { useI18n } from "../context/I18nContext.jsx";

const LINKS = [
  {
    label: "НОРМАТИВНО-ПРАВОВЫЕ АКТЫ В РОССИЙСКОЙ ФЕДЕРАЦИИ",
    href: "http://pravo.minjust.ru/",
  },
  {
    label: "ПАРЛАМЕНТ РЕСПУБЛИКИ ТЫВА",
    href: "http://gov.tuva.ru/",
  },
  {
    label: "ОФИЦИАЛЬНЫЙ ИНТЕРНЕТ-ПОРТАЛ ПРАВОВОЙ ИНФОРМАЦИИ",
    href: "http://pravo.gov.ru/",
  },
  {
    label: "ОБЩЕСТВЕННАЯ ПАЛАТА РЕСПУБЛИКИ ТЫВА",
    href: "http://palata.tuva.ru/",
  },
  {
    label: "ФЕДЕРАЛЬНЫЙ ПОРТАЛ ПРОЕКТОВ НОРМАТИВНЫХ ПРАВОВЫХ АКТОВ",
    href: "http://regulation.gov.ru/",
  },
  {
    label: "ГАС ЗАКОНОТВОРЧЕСТВО ",
    href: "http://parliament.gov.ru/",
  },
  {
    label: "ПОРТАЛ ГОСУДАРСТВЕННЫХ УСЛУГ",
    href: "http://gosuslugi.ru/",
  },
  {
    label: "МИНИСТЕРСТВО ЮСТИЦИИ РОССИЙСКОЙ ФЕДЕРАЦИИ",
    href: "http://minjust.ru/",
  },
  {
    label: "ФЕДЕРАЛЬНЫЙ ПОРТАЛ УПРАВЛЕНЧЕСКИХ КАДРОВ",
    href: "http://gossluzhba.gov.ru/",
  },
  {
    label: "УПОЛНОМЕЧЕННЫЙ ПО ЗАЩИТЕ ПРАВ ПРЕДПРИНИМАТЕЛЕЙ В РЕСПУБЛИКЕ ТЫВА ",
    href: "http://upp.rtyva.ru/",
  },
  {
    label: "ИЗБИРАТЕЛЬНАЯ КОММИССИЯ РЕСПУБЛИКИ ТЫВА ",
    href: "http://www.tyva.izbirkom.ru/",
  },
];

export default function Resources() {
  const { t } = useI18n();
  const [portalsOpen, setPortalsOpen] = React.useState(false);
  const portalsId = "portals-list";

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
            {LINKS.map(({ label, href }, i) => (
              <a
                key={i}
                className="tile link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ height: 120 }}
              >
                <span style={{ maxWidth: 260 }}>{label}</span>
                <span>→</span>
              </a>
            ))}
            </div>
          </div>
          <div className="grid" style={{ gap: 24 }}>
            <GosWidget id="gos-widget-3" src="/js/gos_pos_cit.js" variant={3} />
            <GosuslugiWidget />
          </div>
        </div>
        
        {/* Раздел Трансляции */}
        <div style={{ marginTop: 48 }}>
          <h2 className="portals-title" style={{ marginBottom: 24 }}>{t("Трансляции")}</h2>
          <div style={{ marginTop: 16 }}>
            <BroadcastWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
