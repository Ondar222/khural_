import React from "react";
import { App, Empty, Spin } from "antd";
import SideNav from "../components/SideNav.jsx";
import { getApparatusNavLinks } from "../utils/apparatusLinks.js";
import { sectionHref } from "../utils/sectionLinks.js";
import { useI18n } from "../context/I18nContext.jsx";
import { ApparatusApi } from "../api/client.js";

const ROLE_ORDER = { head: 0, deputy_head: 1, assistant: 2, employee: 3 };

function byOrder(a, b) {
  return (a?.order ?? 0) - (b?.order ?? 0) || (a?.id ?? 0) - (b?.id ?? 0);
}

function PersonNode({ person, fallbackTitle }) {
  const title = person?.position || fallbackTitle || "";
  if (!person) {
    return (
      <div className="office-chart__node">
        <div className="office-chart__node-title">{title}</div>
      </div>
    );
  }
  return (
    <a className="office-chart__node office-chart__node--link" href={sectionHref(person.position || fallbackTitle || person.fullName)}>
      <div className="office-chart__node-title">{title}</div>
    </a>
  );
}

export default function Apparatus() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [loading, setLoading] = React.useState(true);
  const [structure, setStructure] = React.useState({ leadership: [], departments: [] });
  const navLinks = React.useMemo(() => getApparatusNavLinks(t), [t]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await ApparatusApi.getStructure();
        if (!alive) return;
        setStructure({
          leadership: Array.isArray(data?.leadership) ? data.leadership : [],
          departments: Array.isArray(data?.departments) ? data.departments : [],
        });
      } catch (e) {
        if (alive) message.error(e?.message || "Не удалось загрузить структуру аппарата");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [message]);

  const leadership = React.useMemo(
    () => [...structure.leadership].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || byOrder(a, b)),
    [structure.leadership]
  );
  const departments = React.useMemo(
    () => [...structure.departments].sort(byOrder),
    [structure.departments]
  );

  const head = leadership.find((p) => p.role === "head");
  const deputy = leadership.find((p) => p.role === "deputy_head");
  const assistants = leadership.filter((p) => p.role === "assistant");

  const deputyDeptId = deputy?.department?.id;
  const deputyDepartment = departments.find((d) => d.id === deputyDeptId) || departments.find((d) => /организацион/i.test(d.name || ""));
  const centerDepartments = departments.filter((d) => d.id !== deputyDepartment?.id);

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
              административно-хозяйственную деятельность Верховного Хурала (парламента) Республики Тыва.
            </p>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>
            ) : !leadership.length && !departments.length ? (
              <Empty description="Данные аппарата пока не добавлены" />
            ) : (
              <div className="office-chart card">
                <div className="office-chart__scroll" aria-label="Структура аппарата">
                  <div className="office-chart__grid" role="img" aria-label="Организационная структура аппарата">
                    <div className="office-chart__top">
                      <PersonNode person={head} fallbackTitle="Руководитель Аппарата" />
                    </div>

                    <div className="office-chart__wires" aria-hidden="true">
                      <span className="office-chart__wire office-chart__wire--stem" />
                      <span className="office-chart__wire office-chart__wire--h" />
                      <span className="office-chart__wire office-chart__wire--v-left" />
                      <span className="office-chart__wire office-chart__wire--v-center" />
                      <span className="office-chart__wire office-chart__wire--v-right" />
                    </div>

                    <div className="office-chart__col office-chart__col--left">
                      <PersonNode person={deputy} fallbackTitle="Заместитель руководителя Аппарата" />
                      <div className="office-chart__stack office-chart__stack--down">
                        {deputyDepartment ? (
                          <a className="office-chart__node office-chart__node--link" href={sectionHref(deputyDepartment.name)}>
                            <div className="office-chart__node-title">{deputyDepartment.name}</div>
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="office-chart__col office-chart__col--center">
                      <div className="office-chart__stack">
                        {centerDepartments.map((dep) => (
                          <a key={dep.id} className="office-chart__node office-chart__node--link" href={sectionHref(dep.name)}>
                            <div className="office-chart__node-title">{dep.name}</div>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="office-chart__col office-chart__col--right">
                      <div className="office-chart__stack">
                        {assistants.map((p) => (
                          <PersonNode key={p.id} person={p} fallbackTitle={p.position || "Помощник"} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <SideNav links={navLinks.length ? navLinks : undefined} />
        </div>
      </div>
    </section>
  );
}
