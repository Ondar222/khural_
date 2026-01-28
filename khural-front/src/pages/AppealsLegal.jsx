import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function AppealsLegal() {
  const { t } = useI18n();

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{t("Правовое регулирование")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            Рассмотрение обращений граждан в Верховном Хурале (парламенте) Республики Тыва осуществляется в
            соответствии с законодательством Российской Федерации и Республики Тыва.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
            Основные нормативные правовые акты
          </h2>

          <ul style={{ fontSize: 15, lineHeight: 1.8, marginLeft: 24, marginBottom: 16 }}>
            <li style={{ marginBottom: 12 }}>
              <strong>Конституция Российской Федерации</strong>, статья 33 — право граждан обращаться лично, а также
              направлять индивидуальные и коллективные обращения в государственные органы и органы местного
              самоуправления.
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>Федеральный закон от 02.05.2006 № 59-ФЗ</strong> «О порядке рассмотрения обращений граждан
              Российской Федерации» — устанавливает порядок рассмотрения обращений граждан государственными органами,
              органами местного самоуправления и должностными лицами.
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>Гражданский процессуальный кодекс Российской Федерации</strong>, глава 25 — производство по делам
              об оспаривании решений, действий (бездействия) органов государственной власти, органов местного
              самоуправления, должностных лиц, государственных и муниципальных служащих.
            </li>
            <li style={{ marginBottom: 12 }}>
              Нормативные правовые акты Республики Тыва, регулирующие вопросы приёма и рассмотрения обращений
              граждан в Верховном Хурале Республики Тыва.
            </li>
          </ul>

          <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 0 }}>
            Полные тексты нормативных правовых актов размещены на официальном интернет-портале правовой информации:{" "}
            <a href="http://pravo.gov.ru" target="_blank" rel="noopener noreferrer" className="link">
              pravo.gov.ru
            </a>
            , на сайте Минюста России:{" "}
            <a href="https://minjust.gov.ru" target="_blank" rel="noopener noreferrer" className="link">
              minjust.gov.ru
            </a>
          </p>
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
