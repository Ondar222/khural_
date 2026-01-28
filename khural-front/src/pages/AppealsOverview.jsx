import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function AppealsOverview() {
  const { t } = useI18n();

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{t("Обзор обращений граждан")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            В данном разделе размещается информация об обзоре обращений граждан, поступивших в Верховный Хурал
            (парламент) Республики Тыва. Обращения граждан рассматриваются в соответствии с Федеральным законом от
            02.05.2006 № 59-ФЗ «О порядке рассмотрения обращений граждан Российской Федерации».
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            Сводная информация о количестве поступивших обращений, сроках их рассмотрения и принятых мерах
            публикуется в установленном порядке. За актуальными данными вы можете обратиться в приёмную Верховного
            Хурала или направить запрос через раздел обращений.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 0 }}>
            Дополнительная информация по обзору обращений граждан размещена на официальном портале:{" "}
            <a href="https://khural.rtyva.ru/internet-priemnaya/" target="_blank" rel="noopener noreferrer" className="link">
              khural.rtyva.ru/internet-priemnaya
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
