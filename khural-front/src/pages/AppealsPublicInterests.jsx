import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function AppealsPublicInterests() {
  const { t } = useI18n();

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{t("Ответы на обращения, затрагивающие интересы неопределенного круга лиц")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            В соответствии с законодательством Российской Федерации, если в обращении гражданина затрагиваются
            вопросы, затрагивающие интересы неопределённого круга лиц, ответ на обращение может быть размещён на
            официальном сайте государственного органа в информационно-телекоммуникационной сети «Интернет».
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            В данном разделе размещаются ответы на обращения граждан, которые носят общественно значимый характер и
            могут представлять интерес для неопределённого круга лиц. Гражданин, направивший обращение, уведомляется
            о размещении ответа на сайте.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 0 }}>
            Актуальные ответы на обращения, затрагивающие интересы неопределённого круга лиц, размещены на
            официальном портале:{" "}
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
