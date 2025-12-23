import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";

function useQuery() {
  const [q, setQ] = React.useState(() => {
    return new URLSearchParams(window.location.search || "");
  });
  React.useEffect(() => {
    const onNav = () => setQ(new URLSearchParams(window.location.search || ""));
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);
  return q;
}

export default function SectionPage() {
  const q = useQuery();
  const titleParam = q.get("title");
  const { committees, factions: structureFactions } = useData();
  const focus = q.get("focus");

  // Scroll to a requested block from URL (e.g., /section?focus=committees)
  React.useEffect(() => {
    if (!focus) return;
    const id = `focus-${String(focus)}`;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focus]);

  // Detail stub when title is provided
  if (titleParam) {
    let title = titleParam;
    try {
      title = decodeURIComponent(titleParam);
    } catch {
      // ignore invalid URI encoding
    }
    const noGoldUnderline =
      title === "Представительство в Совете Федерации" ||
      title === "Депутатские фракции" ||
      title === "Комиссии" ||
      title === "Молодежный Хурал" ||
      title.startsWith("Подробнее о:");

    // Committees list page
    if (title === "Комитеты") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1>Комитеты</h1>
                <p style={{ marginTop: 0 }}>
                  Выберите комитет, чтобы посмотреть состав и информацию.
                </p>
                <div className="grid cols-2" style={{ marginTop: 12 }}>
                  {(committees || []).map((c) => (
                    <a
                      key={c.id}
                      className="tile link"
                      href={`/committee?id=${encodeURIComponent(c.id)}`}
                    >
                      <span style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontWeight: 900, color: "#0a1f44" }}>{c.title}</span>
                        <span style={{ color: "#6b7280", fontSize: 13 }}>
                          {(Array.isArray(c.members) ? c.members.length : 0)
                            ? `Состав: ${c.members.length}`
                            : "Состав: —"}
                        </span>
                      </span>
                      <span aria-hidden="true">›</span>
                    </a>
                  ))}
                </div>
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    // Special handling for Комиссии page
    if (title === "Комиссии") {
      const commissionsList = [
        {
          id: "nagradnaya",
          name: "Наградная комиссия Верховного Хурала (парламента) Республики Тыва",
        },
        {
          id: "kontrol-dostovernost",
          name: "Комиссия Верховного Хурала (парламента) Республики Тыва по контролю за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
        },
        {
          id: "schetnaya",
          name: "Счетная комиссия Верховного Хурала",
        },
        {
          id: "reglament-etika",
          name: "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
        },
        {
          id: "reabilitatsiya",
          name: "Республиканская комиссия по восстановлению прав реабилитированных жертв политических репрессий",
        },
        {
          id: "svo-podderzhka",
          name: "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
        },
        {
          id: "smi-obshestvo",
          name: "Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями",
        },
        {
          id: "mezhregionalnye-svyazi",
          name: "Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным и международным связям",
        },
      ];

      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                <ul>
                  {commissionsList.map((item) => (
                    <li key={item.id}>
                      <a href={`/commission?id=${item.id}`}>{item.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Депутатские фракции") {
      const factions = (structureFactions || []).filter((x) => x && x !== "Все");
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className="no-gold-underline">{title}</h1>
                <p style={{ marginTop: 0 }}>
                  Выберите фракцию, чтобы перейти к списку депутатов по этой фракции.
                </p>
                {factions.length ? (
                  <div className="grid cols-2" style={{ marginTop: 12 }}>
                    {factions.map((f) => (
                      <a
                        key={f}
                        className="tile link"
                        href={`/deputies?faction=${encodeURIComponent(f)}`}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <span aria-hidden="true">‹</span>
                          {f}
                        </span>
                        <span aria-hidden="true">›</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="tile" style={{ marginTop: 12 }}>
                    Список фракций пока пуст.
                  </div>
                )}
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Представительство в Совете Федерации") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                <p>
                  Раздел в разработке. Здесь будет информация о представителях Республики Тыва в
                  Совете Федерации, контакты и биографии.
                </p>
                <div className="tabs">
                  <a className="btn" href="/contacts">
                    Контакты →
                  </a>
                  <a className="btn" href="/appeals">
                    Прием обращений →
                  </a>
                </div>
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Молодежный Хурал") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className="no-gold-underline">{title}</h1>
                <p>
                  Раздел в разработке. Здесь будет информация о составе, мероприятиях и документах
                  Молодежного Хурала.
                </p>
                <div className="tabs">
                  <a className="btn" href="/news">
                    Новости →
                  </a>
                  <a className="btn" href="/calendar">
                    Календарь →
                  </a>
                </div>
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Совет по взаимодействию с представительными органами муниципальных образований") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className="no-gold-underline">{title}</h1>
                <p style={{ marginTop: 0 }}>
                  Раздел в разработке. Здесь будут документы, повестки, решения и материалы заседаний
                  Совета, а также контакты ответственных лиц.
                </p>
                <div className="tabs">
                  <a className="btn" href="/documents">
                    Документы →
                  </a>
                  <a className="btn" href="/news">
                    Новости →
                  </a>
                  <a className="btn" href="/appeals">
                    Обратиться →
                  </a>
                </div>
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
              <p>
                Раздел «{title}» пока не заполнен. Если это важный пункт меню — скажи, и я добавлю
                содержимое/данные.
              </p>
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  // Structure diagram view (as on the picture)
  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main" id="focus-overview">
            <h1 className="no-gold-underline h1-compact">
              Структура Верховного Хурала (парламента) Республики Тыва
            </h1>
            <div className="org org--khural">
              <div className="org__row org__row--center">
                <div className="org__item org__item--blue org__item--xl">
                  Председатель Верховного Хурала (парламента) Республики Тыва
                </div>
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
                    Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным связям
                  </a>
                  <a className="org__item org__item--blue" href="/commission?id=smi-obshestvo">
                    Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со
                    средствами массовой информации и общественными организациями
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
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>
              {/* Councils anchor (same visual area for now) */}
              <div id="focus-councils" style={{ height: 1 }} />
              <div className="org__row org__row--center">
                <a className="org__item org__item--xl org__item--blue" href="/apparatus">
                  Аппарат Верховного Хурала (парламента) Республики Тыва
                </a>
              </div>
            </div>
          </div>
          <SideNav title="Разделы" />
        </div>
      </div>
    </section>
  );
}
