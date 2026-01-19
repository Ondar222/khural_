import React from "react";
import SideNav from "../components/SideNav.jsx";
import { APPARATUS_NAV_LINKS } from "../utils/apparatusLinks.js";

export default function Apparatus() {
  const toSectionHref = React.useCallback((title) => {
    return `/section?title=${encodeURIComponent(String(title || "").trim())}`;
  }, []);

  return (
    <section className="section apparatus-page">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <a
              className="btn btn-back"
              href="/about?tab=structure&focus=overview"
              style={{ marginBottom: 16, display: "inline-block" }}
            >
              ← Назад к структуре
            </a>
            <h1 className="h1-compact">Аппарат Верховного Хурала (парламента) Республики Тыва</h1>
            <p className="apparatus-lead">
              Аппарат обеспечивает организационную, правовую, информационно-аналитическую и
              административно-хозяйственную деятельность Верховного Хурала (парламента) Республики
              Тыва.
            </p>

            <div className="office-chart card">
              <div className="office-chart__scroll" aria-label="Структура аппарата">
                <div className="office-chart__grid" role="img" aria-label="Организационная структура аппарата">
                  <div className="office-chart__top">
                    <a
                      className="office-chart__node office-chart__node--top office-chart__node--link"
                      href={toSectionHref("Руководитель Аппарата")}
                    >
                      <div className="office-chart__node-title">
                        Руководитель Аппарата Верховного Хурала (парламента) Республики Тыва
                      </div>
                    </a>
                  </div>

                  <div className="office-chart__wires" aria-hidden="true">
                    <span className="office-chart__wire office-chart__wire--stem" />
                    <span className="office-chart__wire office-chart__wire--h" />
                    <span className="office-chart__wire office-chart__wire--v-left" />
                    <span className="office-chart__wire office-chart__wire--v-center" />
                    <span className="office-chart__wire office-chart__wire--v-right" />
                  </div>

                  <div className="office-chart__col office-chart__col--left">
                    <a
                      className="office-chart__node office-chart__node--link"
                      href={toSectionHref("Заместитель Руководителя Аппарата")}
                    >
                      <div className="office-chart__node-title">
                        Заместитель руководителя Аппарата Верховного Хурала – начальник организационного
                        управления Аппарата ВХ РТ
                      </div>
                    </a>
                    <div className="office-chart__stack office-chart__stack--down">
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Организационное управление")}
                      >
                        <div className="office-chart__node-title">Организационное управление Аппарата ВХ РТ</div>
                      </a>
                    </div>
                  </div>

                  <div className="office-chart__col office-chart__col--center">
                    <div className="office-chart__stack">
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Государственно-правовое управление")}
                      >
                        <div className="office-chart__node-title">Государственно-правовое управление Аппарата ВХ РТ</div>
                      </a>
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Управление делами")}
                      >
                        <div className="office-chart__node-title">Управление делами Аппарата ВХ РТ</div>
                      </a>
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Информационно-аналитическое управление")}
                      >
                        <div className="office-chart__node-title">Информационно-аналитическое управление</div>
                      </a>
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Управление финансов, бухгалтерского учета и отчетности")}
                      >
                        <div className="office-chart__node-title">
                          Управление финансов, бухгалтерского учета и отчетности Аппарата ВХ РТ
                        </div>
                      </a>
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Отдел технического и программного обеспечения")}
                      >
                        <div className="office-chart__node-title">
                          Отдел технического и программного обеспечения Аппарата ВХ РТ
                        </div>
                      </a>
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Отдел кадров и государственной службы")}
                      >
                        <div className="office-chart__node-title">
                          Отдел кадров и государственной службы Аппарата ВХ РТ
                        </div>
                      </a>
                    </div>
                  </div>

                  <div className="office-chart__col office-chart__col--right">
                    <div className="office-chart__stack">
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Первый помощник Председателя")}
                      >
                        <div className="office-chart__node-title">
                          Первый помощник Председателя Верховного Хурала (парламента) Республики Тыва
                        </div>
                      </a>
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Помощник Председателя")}
                      >
                        <div className="office-chart__node-title">
                          Помощник Председателя Верховного Хурала (парламента) Республики Тыва
                        </div>
                      </a>
                      <a
                        className="office-chart__node office-chart__node--link"
                        href={toSectionHref("Помощник заместителя Председателя")}
                      >
                        <div className="office-chart__node-title">
                          Помощник заместителя Председателя Верховного Хурала (парламента) Республики Тыва
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <SideNav links={APPARATUS_NAV_LINKS} />
        </div>
      </div>
    </section>
  );
}
