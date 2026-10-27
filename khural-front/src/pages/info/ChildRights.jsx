import React from "react";
import { useI18n } from "../../context/I18nContext.jsx";
import SideNav from "../../components/SideNav.jsx";
import ScrollToTop from "../../components/ScrollToTop.jsx";

export default function ChildRights() {
  const { t } = useI18n();
  const links = [
    { label: t("aboutHistory"), href: "/about/history" },
    { label: t("aboutPowersHural"), href: "/info/hural-powers" },
    { label: t("aboutPowersSpeaker"), href: "/info/speaker-powers" },
    { label: t("aboutStaff"), href: "/about/staff" },
    { label: t("aboutCorruption"), href: "/info/anti-corruption" },
    { label: t("aboutContacts"), href: "/info/contacts" },
    { label: t("aboutOmbudsman"), href: "/info/ombudsman" },
    { label: t("aboutChildRights"), href: "/info/child-rights" },
    { label: t("aboutDistricts"), href: "/about/districts" },
    { label: t("aboutFinances"), href: "/about/finances" },
    { label: t("aboutSymbols"), href: "/info/symbols" },
    { label: t("aboutBorder"), href: "/info/border-subject" },
  ];
  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>Уполномоченный по правам ребенка в Республике Тыва</h1>
            <article className="card" style={{ padding: 24 }}>
              <div className="prose">
                <h2>Сенгии Саида Хертековна</h2>
                <p>Адрес: 667010, Республика Тыва, г. Кызыл, ул. Калинина д.1б</p>
                <p>Телефон: <a href="tel:83942226309">8 (394-22) 2-63-09</a><br />
                Факс: 8 (39422) 26308<br />
                E-mail: <a href="mailto:saidasengii@mail.ru">saidasengii@mail.ru</a><br />
                E-mail: <a href="mailto:tyvarfdeti@rtyva.ru">tyvarfdeti@rtyva.ru</a></p>
                <h3>Биография</h3>
                <p>Родилась 17 мая 1970 года в г. Кызыле.</p>
                <h3>Образование</h3>
                <p>В 1993 году закончила Кызылский государственный педагогический институт, в 2007 году — Сибирский юридический институт МВД России.</p>
                <h3>Награды</h3>
                <ul>
                  <li>2007 г. – медаль Республики Тыва «За доблестный труд»</li>
                  <li>2021 г. – юбилейная медаль в честь 100-летия образования Тувинской Народной Республики</li>
                </ul>
                <h3>Трудовая деятельность</h3>
                <ul>
                  <li>09.1987 – 06. 1993 гг. – студент Красноярского, Кызылского педагогических институтов</li>
                  <li>09.1993 – 09.1994 гг. – учитель тувинского языка в начальных классах школы № 4 г. Кызыла</li>
                  <li>09.1994 – 09.2016 гг. – инспектор по делам несовершеннолетних, старший инспектор по делам несовершеннолетних, начальник отделения организации работы подразделений по делам несовершеннолетних, начальник отдела организации деятельности участковых уполномоченных полиции и подразделений по делам несовершеннолетних МВД по Республике Тыва</li>
                  <li>07.2016 – 12.2018 гг. – директор Агентства по делам семьи и детей в Республике Тыва</li>
                  <li>12.2018 – 03.2020 гг. – министр труда и социальной политики Республики Тыва</li>
                  <li>03.2020 – 04.2021 гг. – и.о. заместителя Председателя Правительства Республики Тыва, заместитель Председателя Правительства Республики Тыва</li>
                  <li>04.2021 – 10.2021 гг. – и.о. заместителя Председателя Правительства Республики Тыва</li>
                  <li>10.2021 – 05.2022 гг. – советник Главы Республики Тыва, Администрации Главы Республики Тыва и Аппарата Правительства Республики Тыва</li>
                  <li>05.2022 – 03.2024 гг. – начальник управления по обеспечению деятельности Межведомственной комиссии по делам несовершеннолетних и защите их прав при Правительстве Республики Тыва</li>
                  <li>27 марта 2024 года постановлением Верховного Хурала (Парламента) назначена на должность Уполномоченного по правам ребенка в Республике Тыва.</li>
                </ul>
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
