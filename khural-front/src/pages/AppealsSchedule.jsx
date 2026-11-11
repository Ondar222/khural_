import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";

// Ссылка на раздел «График приема граждан руководством и председателями комитетов»
// с сайта khural.rtyva.ru (источник актуальных данных).
const COMMITTEES_RECEPTIONS_URL = "https://khural.rtyva.ru/letters/receptions/176/";
// Ссылка на раздел «График приема граждан депутатами Верховного Хурала»
// с сайта khural.rtyva.ru (источник актуальных данных).
const DEPUTIES_RECEPTIONS_URL = "https://khural.rtyva.ru/letters/receptions/131/";

export default function AppealsSchedule() {
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
            <h1 className="h1-compact">{t("График приема граждан")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
            Приём граждан в Верховном Хурале (парламенте) Республики Тыва осуществляется в соответствии с
            установленным графиком. При обращении при себе необходимо иметь документ, удостоверяющий личность.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
            График приема граждан руководством и председателями комитетов Верховного Хурала
            (парламента) Республики Тыва
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
            Организацию личного приема граждан, в том числе предварительной записи граждан на личный
            приём, осуществляют помощники Председателя Верховного Хурала, помощник заместителя
            Председателя Верховного Хурала, специалисты приемных руководителей, советник комитета,
            помощник депутата Верховного Хурала.
          </p>
          <a
            href={COMMITTEES_RECEPTIONS_URL}
            className="link"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 15, lineHeight: 1.6 }}
          >
            График приема граждан руководством и председателями комитетов Верховного Хурала
            (парламента) Республики Тыва →
          </a>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>
            График приема граждан депутатами Верховного Хурала Республики Тыва
          </h2>
          <a
            href={DEPUTIES_RECEPTIONS_URL}
            className="link"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 15, lineHeight: 1.6 }}
          >
            График приема граждан депутатами Верховного Хурала Республики Тыва →
          </a>

          <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 0 }}>
            Для уточнения графика приёма депутатов и руководителей органов Верховного Хурала обращайтесь в
            приёмную по телефонам, указанным в разделе «Контакты». Предварительная запись может быть
            обязательной.
          </p>
        </div>
          </div>
          <SideNav loadPages={true} autoSection={true} />
        </div>
      </div>
    </section>
  );
}
