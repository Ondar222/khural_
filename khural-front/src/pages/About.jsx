import React from "react";
import SideNav from "../components/SideNav.jsx";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export default function About() {
  const { committees, government } = useData();
  // NOTE: government is used to link Chairman in the structure diagram.
  const { t } = useI18n();
  const [activeTab, setActiveTab] = React.useState("general"); // general | structure

  const scrollToBlock = React.useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // If user arrives with /about?tab=structure — scroll smoothly after mount
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search || "");
    const tab = sp.get("tab");
    const focus = sp.get("focus");
    if (tab === "structure") {
      requestAnimationFrame(() =>
        scrollToBlock(focus ? `focus-${String(focus)}` : "about-structure")
      );
    }
  }, [scrollToBlock]);

  // Highlight active tab while scrolling
  React.useEffect(() => {
    const ids = ["about-general", "about-structure"];
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0]?.target?.id;
        if (top === "about-structure") setActiveTab("structure");
        else if (top === "about-general") setActiveTab("general");
      },
      {
        root: null,
        rootMargin: "-90px 0px -60% 0px",
        threshold: 0.01,
      }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // NOTE: About structure diagram below is intentionally kept identical to `/section`
  // (so we do not render the "Structure (from API)" tree here).

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h3>{t("О Верховном Хурале Республики Тыва")}</h3>

            <div className="tabs" style={{ marginTop: 8 }}>
              <a
                className={`pill ${activeTab === "general" ? "pill--solid" : ""}`}
                href="#"
                role="button"
                aria-current={activeTab === "general" ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("general");
                  scrollToBlock("about-general");
                }}
              >
                {t("Общие сведения")}
              </a>
              <a
                className={`pill ${activeTab === "structure" ? "pill--solid" : ""}`}
                href="#"
                role="button"
                aria-current={activeTab === "structure" ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("structure");
                  scrollToBlock("about-structure");
                }}
              >
                {t("Структура органов управления")}
              </a>
            </div>

            <div id="about-general" className="person-block">
              <h3>{t("Общие сведения")}</h3>
              <p>
                8 сентября 2019 года состоялись очередные выборы в высший законодательный
                (представительный) орган государственной власти Республики Тыва.
              </p>
              <p>
                Было избрано 32 депутата: 16 депутатов избраны по партийным спискам, остальные 16 —
                по одномандатным округам. В Верховном Хурале представлены два избирательных
                объединения: «Единая Россия» (30 мандатов), «ЛДПР» (2 мандата). Из 32 депутатов
                только 9 работают на постоянной основе.
              </p>
              <p>
                Депутатский корпус представлен опытными политиками, законодателями, многие из
                которых избирались неоднократно, профессиональными юристами, деятелями культуры,
                искусства, спортсменами, учителями, врачами, предпринимателями.
              </p>

              <p>
                Законодотворческая деятельность Верховного Хурала (парламента) Республики Тыва
                осуществляется в тесном и плодотворном взаимодействии со всеми субъектами
                законодательной инициативы и, прежде всего, с Правительством Республики Тыва.
              </p>
              <p>
                Кроме основной деятельности по совершенствованию законодательства, депутаты активно
                участвуют практически во всех социально значимых мероприятиях, благотворительных
                акциях, марафонах. Работу с избирателями, выезды в избирательные участки, рабочие
                командировки депутаты всегда стараются совместить с оказанием практической помощи:
                медицинской, консультативной.
              </p>
              <p>
                Властная вертикаль, согласно Конституции 1921 года, была построена следующим
                образом: каждый сумон (село) подчинялся Управлению кожууна, кожуун подчинялся
                Центральному Совету, Центральный Совет был ответственен перед Всеобщим
                Танну-Тувинским съездом. Решения сумонов и хошунов могли быть отменены Центральным
                Советом, если они противоречили Конституции. Таким образом, Конституция Танну-Тува
                Улус 1921 года обладала высшей юридической силой.
              </p>

              <div
                className="tile"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  margin: "20px 0",
                  borderRadius: 16,
                }}
              >
                <img
                  src="/img/slider1.jpg"
                  alt=""
                  style={{ width: "100%", display: "block" }}
                  loading="lazy"
                />
              </div>

              <p>
                8 сентября 2019 года состоялись очередные выборы в высший законодательный
                (представительный) орган государственной власти Республики Тыва.
              </p>
              <p>
                Было избрано 32 депутата: 16 депутатов избраны по партийным спискам, остальные 16 –
                по одномандатным округам. В Верховном Хурале представлены два избирательных
                объединения: «Единой России» (30 мандатов), «ЛДПР» (2 мандата). Из 32 депутатов
                только 9 работают на постоянной основе
              </p>
              <p>
                Депутатский корпус представлен опытными политиками, законодателями, многие из
                которых избирались неоднократно, профессиональными юристами, деятелями культуры,
                искусства, спортсменами, учителями, врачами, предпринимателями.
              </p>
              {/* <div
                className="tile"
                style={{
                  padding: 0,
                  height: 418,
                  display: "grid",
                  placeItems: "center",
                  background: "#f2f4f7",
                  borderRadius: 16,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "#e5e7eb",
                    display: "grid",
                    placeItems: "center",
                    color: "#6b7280",
                    fontSize: 40,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                  }}
                >
                  ▶
                </div>
              </div> */}
            </div>

            <div id="about-structure" className="person-block about-structure" style={{ marginTop: 22 }}>
              <div id="focus-overview" style={{ height: 1 }} />
              <h3 className="about-structure__title">{t("Структура органов управления")}</h3>
              <p style={{ marginTop: 0 }}>{t("Ниже — схема структуры. Нажмите на фракции/комитеты, чтобы перейти к соответствующим разделам.")}</p>

              <div className="org org--khural">
                <div className="org__row org__row--center">
                  {(() => {
                    const chairman = (government || []).find(
                      (g) =>
                        g &&
                        g.role &&
                        typeof g.role === "string" &&
                        g.role.toLowerCase().includes("председатель")
                    );
                    if (chairman && chairman.id) {
                      return (
                        <a
                          className="org__item org__item--blue org__item--xl"
                          href={`/government?type=gov&id=${encodeURIComponent(chairman.id)}`}
                        >
                        {t("Председатель Верховного Хурала (парламента) Республики Тыва")}
                        </a>
                      );
                    }
                    return (
                      <div className="org__item org__item--blue org__item--xl">
                      {t("Председатель Верховного Хурала (парламента) Республики Тыва")}
                      </div>
                    );
                  })()}
                </div>
                {/* Factions row */}
                <div className="org__row org__row--factions" id="focus-factions">
                  {["Единая Россия", "КПРФ", "ЛДПР", "Новые люди"].map((f) => (
                    <a
                      key={f}
                      className="org__item org__item--blue"
                      href={`/deputies?faction=${encodeURIComponent(f)}`}
                    >
                      Фракция
                      <br />
                      {f}
                    </a>
                  ))}
                </div>
                {/* Three column zone: committees on the left, commissions/councils on right */}
                <div className="org__row org__row--cols4">
                  <div className="org__col" id="focus-committees">
                    <a
                      className="org__item org__item--blue"
                      href={"/section?title=" + encodeURIComponent("Комитеты")}
                    >
                      {t("Комитеты Верховного Хурала (парламента) Республики Тыва")}
                    </a>
                    {(committees || []).map((c) => (
                      <a
                        key={c.id}
                        className="org__item org__item--green"
                        href={`/committee?id=${encodeURIComponent(c.id)}`}
                      >
                        {c.title}
                      </a>
                    ))}
                  </div>
                  <div className="org__col">
                    <a
                      className="org__item org__item--blue"
                      href="/commission?id=mezhregionalnye-svyazi"
                    >
                      {t("Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным связям")}
                    </a>
                    <a className="org__item org__item--blue" href="/commission?id=smi-obshestvo">
                      {t("Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями")}
                    </a>
                  </div>
                  <div className="org__col org__col--span2" id="focus-commissions">
                    {[
                      {
                        title:
                          "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
                        id: "reglament-etika",
                      },
                      {
                        title:
                          "Комиссия Верховного Хурала (парламента) Республики Тыва контрольно за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
                        id: "kontrol-dostovernost",
                      },
                      {
                        title: "Наградная комиссия Верховного Хурала (парламента) Республики Тыва",
                        id: "nagradnaya",
                      },
                      {
                        title:
                          "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
                        id: "svo-podderzhka",
                      },
                      {
                        title: "Счетная комиссия Верховного Хурала (парламента) Республики Тыва",
                        id: "schetnaya",
                      },
                    ].map((item, i) => (
                      <a
                        key={`wide-${i}`}
                        className="org__item org__item--blue"
                        href={`/commission?id=${item.id}`}
                      >
                        {t(item.title)}
                      </a>
                    ))}
                  </div>
                </div>
                {/* Councils anchor (same visual area for now) */}
                <div id="focus-councils" style={{ height: 1 }} />
                <div className="org__row org__row--center">
                  <a className="org__item org__item--xl org__item--blue" href="/apparatus">
                    {t("Аппарат Верховного Хурала (парламента) Республики Тыва")}
                  </a>
                </div>
              </div>

              {/* NOTE: ниже ничего не рендерим — схема должна совпадать с /section */}
            </div>
          </div>
          <SideNav className="sidenav--about" title={t("О Верховном Хурале")} />
        </div>
      </div>
    </section>
  );
}
