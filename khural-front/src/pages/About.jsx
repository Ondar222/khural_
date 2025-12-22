import React from "react";
import SideNav from "../components/SideNav.jsx";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { AboutApi } from "../api/client.js";

export default function About() {
  const { committees, aboutPages: cachedPages, aboutStructure: cachedStructure } = useData();
  const { lang } = useI18n();
  const [activeTab, setActiveTab] = React.useState("general"); // general | structure
  const [pages, setPages] = React.useState(() => (Array.isArray(cachedPages) ? cachedPages : []));
  const [structure, setStructure] = React.useState(() =>
    Array.isArray(cachedStructure) ? cachedStructure : []
  );

  const scrollToBlock = React.useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Keep About content in sync with API (locale-aware)
  React.useEffect(() => {
    const locale = lang === "ty" ? "tyv" : "ru";
    (async () => {
      const [apiPages, apiStructure] = await Promise.all([
        AboutApi.listPages({ locale }).catch(() => null),
        AboutApi.listStructure().catch(() => null),
      ]);
      if (Array.isArray(apiPages)) setPages(apiPages);
      if (Array.isArray(apiStructure)) setStructure(apiStructure);
    })();
  }, [lang]);

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

  const generalPage = React.useMemo(() => {
    const arr = Array.isArray(pages) ? pages : [];
    // Try to pick a meaningful "about" page; otherwise show the first by order.
    const bySlug =
      arr.find((p) => String(p.slug).toLowerCase().includes("about")) ||
      arr.find((p) => String(p.slug).toLowerCase().includes("about-us")) ||
      arr[0] ||
      null;
    return bySlug;
  }, [pages]);

  const structureTree = React.useMemo(() => {
    const items = Array.isArray(structure) ? structure : [];
    const byId = new Map(items.map((x) => [String(x.id), x]));
    const childrenByParent = new Map();
    items.forEach((x) => {
      const pid = x?.parent?.id ? String(x.parent.id) : "";
      if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
      childrenByParent.get(pid).push(x);
    });
    childrenByParent.forEach((arr) =>
      arr.sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0))
    );
    const roots = (childrenByParent.get("") || []).filter((x) => byId.has(String(x.id)));
    return { roots, childrenByParent };
  }, [structure]);

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h3>О Верховном Хурале Республики Тыва</h3>

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
                Общие сведения
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
                Структура органов управления
              </a>
            </div>

            <div id="about-general" className="person-block">
              <h3>Общие сведения</h3>
              {generalPage?.content ? (
                <div
                  className="tile"
                  style={{ marginTop: 12 }}
                  dangerouslySetInnerHTML={{ __html: String(generalPage.content) }}
                />
              ) : null}
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
              <div
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
              </div>
            </div>

            <div id="about-structure" className="person-block" style={{ marginTop: 10 }}>
              <h3>Структура органов управления</h3>
              <p style={{ marginTop: 0 }}>
                Ниже — схема структуры. Нажмите на фракции/комитеты, чтобы перейти к соответствующим
                разделам.
              </p>

              {structureTree.roots.length ? (
                <div className="tile" style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>Структура (из API)</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {structureTree.roots.map((r) => (
                      <div key={r.id} className="tile" style={{ margin: 0 }}>
                        <div style={{ fontWeight: 800 }}>{r.name}</div>
                        {r.description ? (
                          <div style={{ opacity: 0.8, marginTop: 6 }}>{r.description}</div>
                        ) : null}
                        {(structureTree.childrenByParent.get(String(r.id)) || []).length ? (
                          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                            {(structureTree.childrenByParent.get(String(r.id)) || []).map((c) => (
                              <a
                                key={c.id}
                                className="link"
                                href={
                                  c?.page?.slug
                                    ? `/about?tab=general&slug=${encodeURIComponent(c.page.slug)}`
                                    : "/about?tab=structure"
                                }
                                style={{
                                  display: "block",
                                  padding: "10px 12px",
                                  borderRadius: 12,
                                  border: "1px solid rgba(0,0,0,0.08)",
                                  background: "rgba(255,255,255,0.7)",
                                }}
                              >
                                <div style={{ fontWeight: 700 }}>{c.name}</div>
                                {c.description ? (
                                  <div style={{ opacity: 0.75, fontSize: 13, marginTop: 4 }}>
                                    {c.description}
                                  </div>
                                ) : null}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="org org--khural" id="focus-overview">
                <div className="org__row org__row--center">
                  <div className="org__item org__item--blue org__item--xl">
                    Председатель Верховного Хурала (парламента) Республики Тыва
                  </div>
                </div>

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

                <div className="org__row org__row--cols4">
                  <div className="org__col" id="focus-committees">
                    <a
                      className="org__item org__item--blue"
                      href="/about?tab=structure&focus=committees"
                    >
                      Комитеты Верховного Хурала (парламента) Республики Тыва
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
                      Комитет ВХ РТ по межрегиональным связям
                    </a>
                    <a className="org__item org__item--blue" href="/commission?id=smi-obshestvo">
                      Комитет ВХ РТ по взаимодействию со СМИ и общественными организациями
                    </a>
                  </div>

                  <div className="org__col org__col--span2" id="focus-commissions">
                    {[
                      {
                        title: "Комиссия ВХ РТ по Регламенту и депутатской этике",
                        id: "reglament-etika",
                      },
                      {
                        title: "Комиссия ВХ РТ по контролю за достоверностью сведений о доходах",
                        id: "kontrol-dostovernost",
                      },
                      { title: "Наградная комиссия ВХ РТ", id: "nagradnaya" },
                      {
                        title: "Комиссия ВХ РТ по поддержке участников СВО и их семей",
                        id: "svo-podderzhka",
                      },
                      { title: "Счетная комиссия ВХ РТ", id: "schetnaya" },
                    ].map((item) => (
                      <a
                        key={item.id}
                        className="org__item org__item--blue"
                        href={`/commission?id=${item.id}`}
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Placeholder anchor for councils (currently same visual zone) */}
                <div id="focus-councils" style={{ height: 1 }} />

                <div className="org__row org__row--center">
                  <a className="org__item org__item--xl org__item--blue" href="/apparatus">
                    Аппарат Верховного Хурала (парламента) Республики Тыва
                  </a>
                </div>
              </div>

            </div>
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
