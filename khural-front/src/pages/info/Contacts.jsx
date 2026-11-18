import React from "react";
import { useI18n } from "../../context/I18nContext.jsx";
import SideNav from "../../components/SideNav.jsx";
import ScrollToTop from "../../components/ScrollToTop.jsx";
import { ABOUT_SECTION_LINKS } from "../../data/sectionMenus.js";

export default function InfoContacts() {
  const { t } = useI18n();
  const links = ABOUT_SECTION_LINKS.map(({ label, href }) => ({ label: t(label), href }));
  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>Контактная информация</h1>
            <article className="card" style={{ padding: 24 }}>
              <div className="prose">
                <p>667000, Республика Тыва, г. Кызыл, ул. Ленина, 32</p>
                <p><strong>Приемная</strong></p>
                <p>тел: 8 (39422) 2-16-32<br />
                e-mail: <a href="mailto:khural@inbox.ru">khural@inbox.ru</a></p>
                <p>Время работы:<br />
                понедельник - пятница: 8.30 - 17.30<br />
                перерыв на обед: 13.00 - 14.00</p>
              </div>
            </article>
          </div>
          <SideNav links={links} />
        </div>
      </div>
      <ScrollToTop />
    </section>
  );
}
