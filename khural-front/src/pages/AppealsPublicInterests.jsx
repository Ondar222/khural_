import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";

export default function AppealsPublicInterests() {
  const { t } = useI18n();

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <div style={{ marginBottom: 16 }}>
              <a href="/appeals" className="btn" style={{ padding: "8px 16px", fontSize: 14 }}>
                &larr; Назад к способам подачи обращений
              </a>
            </div>
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
            Чтобы направить обращение через электронную приёмную нового сайта, перейдите в раздел{" "}
            <a href="/appeals/online" className="link">«Электронная приёмная»</a>.
          </p>
        </div>
          </div>
          <SideNav loadPages={true} autoSection={true} />
        </div>
      </div>
    </section>
  );
}
