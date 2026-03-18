import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";
import GosuslugiWidget from "../components/GosuslugiWidget.jsx";

export default function Appeals() {
  const { t } = useI18n();
  const [showGosuslugiModal, setShowGosuslugiModal] = React.useState(false);

  return (
    <section className="section appeals-page">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <h1 className="h1-compact appeals-page__title">{t("Обращения граждан и юридических лиц")}</h1>

        <div className="tile appeals-page__tile">
          <p className="appeals-page__intro">
            Обращения граждан в адрес Верховного Хурала (парламента) Республики Тыва могут быть:
          </p>

          <ul className="appeals-page__methods-list">
            <li><strong>переданы лично</strong></li>
            <li>
              <a href="/appeals/letter" className="link appeals-page__link">
                отправлены по почте
              </a>
            </li>
            <li>
              <a href="/appeals/online" className="link appeals-page__link">
                отправлены в электронном виде через официальный сайт
              </a>
            </li>
          </ul>

          <p className="appeals-page__before-text">
            Прежде чем отправить обращение, внимательно ознакомьтесь с{" "}
            <a href="/appeals/review" className="link">
              порядком рассмотрения обращений
            </a>{" "}
            и следующей информацией:
          </p>

          <ul className="appeals-page__info-list">
            <li>Обращения граждан рассматриваются в течение 30 дней со дня их регистрации.</li>
            <li>
              По просьбе обратившегося, если обращение передано лично в письменной форме, ему выдается расписка с
              указанием даты приема обращения, количества принятых листов и сообщается телефон для справок. Никаких
              отметок на копиях или вторых экземплярах принятых обращений не делается.
            </li>
            <li>
              К регистрации принимаются анонимные обращения и обращения, оформленные с нарушением требований,
              описанных в{" "}
              <a href="/appeals/review" className="link">порядке рассмотрения обращений</a>.
            </li>
            <li>
              Обращения, в которых содержатся нецензурные либо оскорбительные выражения, угрозы жизни, здоровью и
              имуществу должностного лица, а также членов его семьи, остаются без рассмотрения по существу
              поставленных вопросов.
            </li>
            <li>
              Обращения в электронном виде, направляемые минуя предлагаемую{" "}
              <a href="/appeals/online" className="link">форму ввода</a>, либо на иные электронные адреса к
              рассмотрению не принимаются.
            </li>
          </ul>
        </div>

        <div className="tile appeals-page__tile appeals-page__ways">
          <h2 className="appeals-page__heading">Способы подачи обращения</h2>
          <div className="appeals-page__cards">
            <div className="appeals-page__card appeals-page__card--online">
              <h3 className="appeals-page__card-title">📧 Электронная приемная</h3>
              <p className="appeals-page__card-desc">
                Отправьте обращение через официальный сайт в электронном виде
              </p>
              <a href="/appeals/online" className="btn btn--primary appeals-page__btn">
                Подать обращение онлайн
              </a>
            </div>
            <div className="appeals-page__card appeals-page__card--letter">
              <h3 className="appeals-page__card-title">✉️ Письменное обращение</h3>
              <p className="appeals-page__card-desc">
                Информация о подаче письменного обращения по почте или лично
              </p>
              <a href="/appeals/letter" className="btn appeals-page__btn appeals-page__btn--letter">
                Подробнее
              </a>
            </div>
          </div>
        </div>

        <div className="tile appeals-page__tile appeals-page__links-block">
          <h2 className="appeals-page__heading">Полезная информация</h2>
          <nav className="appeals-page__links" aria-label="Полезные ссылки по обращениям">
            <a href="/appeals/status" className="appeals-page__nav-link">→ Проверить статус обращения</a>
            <a href="/appeals/review" className="appeals-page__nav-link">→ Порядок рассмотрения обращений</a>
            <a href="/appeals/complaints" className="appeals-page__nav-link">→ Порядок обжалования</a>
            <a href="/appeals/overview" className="appeals-page__nav-link">→ Обзор обращений граждан</a>
            <a href="/appeals/public-interests" className="appeals-page__nav-link">
              → Ответы на обращения, затрагивающие интересы неопределенного круга лиц
            </a>
            <a href="/appeals/legal" className="appeals-page__nav-link">→ Правовое регулирование</a>
            <a href="/appeals/schedule" className="appeals-page__nav-link">→ График приема граждан</a>
            <a href="/appeals/minyust" className="appeals-page__nav-link">→ Минюст России</a>
          </nav>
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
      </div>
      <SideNav loadPages={true} autoSection={true} />
    </div>
  </div>
</section>
  );
}
