import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function AppealsMinyust() {
  const { t } = useI18n();
  const minjustUrl = "https://minjust.gov.ru";

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{t("Минюст России")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            Министерство юстиции Российской Федерации осуществляет правовое регулирование и контроль в сфере
            рассмотрения обращений граждан. На официальном сайте Минюста России размещаются нормативные правовые
            акты, разъяснения законодательства и информация о порядке обжалования решений и действий государственных
            органов.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
            Переход на официальный сайт Министерства юстиции Российской Федерации:
          </p>
          <a
            href={minjustUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            Открыть сайт Минюста России (minjust.gov.ru)
            <span aria-hidden>↗</span>
          </a>
        </div>

        <div style={{ marginTop: 24 }}>
          <a href="/appeals" className="btn">
            &larr; Назад к способам подачи обращений
          </a>
        </div>
      </div>
    </section>
  );
}
