import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import GosuslugiWidget from "../components/GosuslugiWidget.jsx";

export default function Appeals() {
  const { t } = useI18n();
  const [showGosuslugiModal, setShowGosuslugiModal] = React.useState(false);

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{t("Обращения граждан и юридических лиц")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            Обращения граждан в адрес Верховного Хурала (парламента) Республики Тыва могут быть:
          </p>

          <ul style={{ fontSize: 15, lineHeight: 1.8, marginLeft: 24, marginBottom: 16 }}>
            <li>
            <a 
                href="/appeals/" 
                className="link"
                style={{ fontWeight: 600 }}
              >
               переданы лично
              </a>
            </li>
            <li>
              <a 
                href="/appeals/letter" 
                className="link"
                style={{ fontWeight: 600 }}
              >
                отправлены по почте
              </a>
            </li>
            <li>
              <a 
                href="/appeals/online" 
                className="link"
                style={{ fontWeight: 600 }}
              >
                отправлены в электронном виде через официальный сайт
              </a>
            </li>
          </ul>

          <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
            Прежде чем отправить обращение, внимательно ознакомьтесь с{" "}
            <a href="/appeals/review" className="link">
              порядком рассмотрения обращений
            </a>{" "}
            и следующей информацией:
          </p>

          <ul style={{ fontSize: 14, lineHeight: 1.7, marginLeft: 24, marginBottom: 16, color: "#374151" }}>
            <li>
              Обращения граждан рассматриваются в течение 30 дней со дня их регистрации.
            </li>
            <li>
              По просьбе обратившегося, если обращение передано лично в письменной форме, ему выдается расписка с
              указанием даты приема обращения, количества принятых листов и сообщается телефон для справок. Никаких
              отметок на копиях или вторых экземплярах принятых обращений не делается.
            </li>
            <li>
              К регистрации принимаются анонимные обращения и обращения, оформленные с нарушением требований,
              описанных в{" "}
              <a href="/appeals/review" className="link">
                порядке рассмотрения обращений
              </a>
              .
            </li>
            <li>
              Обращения, в которых содержатся нецензурные либо оскорбительные выражения, угрозы жизни, здоровью и
              имуществу должностного лица, а также членов его семьи, остаются без рассмотрения по существу
              поставленных вопросов.
            </li>
            <li>
              Обращения в электронном виде, направляемые минуя предлагаемую{" "}
              <a href="/appeals/online" className="link">
                форму ввода
              </a>
              , либо на иные электронные адреса к рассмотрению не принимаются.
            </li>
          </ul>
        </div>

        <div className="tile" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>
            Способы подачи обращения
          </h2>

          <div style={{ display: "grid", gap: 16 }}>
            {/* Электронная приемная */}
            <div className="card" style={{ padding: 20, borderLeft: "4px solid #0d4b8f" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12, color: "#0d4b8f" }}>
                📧 Электронная приемная
              </h3>
              <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
                Отправьте обращение через официальный сайт в электронном виде
              </p>
              <a href="/appeals/online" className="btn btn--primary">
                Подать обращение онлайн
              </a>
            </div>

            {/* Через Госуслуги */}
            {/* <div className="card" style={{ padding: 20, borderLeft: "4px solid #0033a0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12, color: "#0033a0" }}>
                🏛 Через Госуслуги
              </h3>
              <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
                Отправьте обращение через портал Государственных услуг
              </p>
              <button 
                className="btn btn--primary" 
                onClick={() => setShowGosuslugiModal(true)}
                style={{ backgroundColor: "#0033a0" }}
              >
                Отправить через Госуслуги
              </button>
            </div> */}

            {/* Письменное обращение */}
            <div className="card" style={{ padding: 20, borderLeft: "4px solid #059669" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12, color: "#059669" }}>
                ✉️ Письменное обращение
              </h3>
              <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
                Информация о подаче письменного обращения по почте или лично
              </p>
              <a href="/appeals/letter" className="btn" style={{ borderColor: "#059669", color: "#059669" }}>
                Подробнее
              </a>
            </div>
          </div>
        </div>

        {/* Полезные ссылки */}
        <div className="tile">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>
            Полезная информация
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            <a href="/appeals/status" className="link" style={{ fontSize: 15 }}>
              → Проверить статус обращения
            </a>
            <a href="/appeals/review" className="link" style={{ fontSize: 15 }}>
              → Порядок рассмотрения обращений
            </a>
            <a href="/appeals/complaints" className="link" style={{ fontSize: 15 }}>
              → Порядок обжалования
            </a>
            <a href="/appeals/overview" className="link" style={{ fontSize: 15 }}>
              → Обзор обращений граждан
            </a>
            <a href="/appeals/public-interests" className="link" style={{ fontSize: 15 }}>
              → Ответы на обращения, затрагивающие интересы неопределенного круга лиц
            </a>
            <a href="/appeals/legal" className="link" style={{ fontSize: 15 }}>
              → Правовое регулирование
            </a>
            <a href="/appeals/schedule" className="link" style={{ fontSize: 15 }}>
              → График приема граждан
            </a>
            <a href="/appeals/minyust" className="link" style={{ fontSize: 15 }}>
              → Минюст России
            </a>
          </div>
        </div>
      </div>

      {/* Модальное окно с виджетом Госуслуг */}
      {showGosuslugiModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowGosuslugiModal(false)}
          style={{ zIndex: 9999 }}
        >
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "900px", maxHeight: "90vh", overflow: "auto" }}
          >
            <button 
              className="modal__close icon-btn" 
              onClick={() => setShowGosuslugiModal(false)}
              aria-label="Закрыть"
            >
              ✕
            </button>
            <div className="modal__content">
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>Отправить обращение через Госуслуги</h3>
              <GosuslugiWidget />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
