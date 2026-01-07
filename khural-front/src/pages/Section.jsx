import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";
import PersonDetail from "../components/PersonDetail.jsx";

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

const STRUCTURE_TYPE_LABELS = {
  committee: "Комитет",
  parliament_leadership: "Руководство парламента",
  commission: "Комиссия",
  apparatus: "Аппарат",
  municipal_council: "Совет по взаимодействию с представительными органами муниципальных образований",
  youth_khural: "Молодежный Хурал",
  federation_council: "Представительство в Совете Федерации",
};

const ROLE_LABELS_BY_STRUCTURE = {
  committee: {
    chairman: "Председатель комитета",
    vice_chairman: "Заместитель председателя комитета",
    member: "Член комитета",
  },
  parliament_leadership: {
    chairman: "Председатель",
    vice_chairman: "Заместитель председателя",
    member: "Член руководства",
  },
  commission: {
    chairman: "Председатель комиссии",
    vice_chairman: "Заместитель председателя комиссии",
    member: "Член комиссии",
  },
  apparatus: {
    leader: "Руководитель аппарата",
    member: "Сотрудник аппарата",
  },
  municipal_council: {
    chairman: "Председатель совета",
    vice_chairman: "Заместитель председателя совета",
    member: "Член совета",
  },
  youth_khural: {
    chairman: "Председатель Молодежного Хурала",
    vice_chairman: "Заместитель председателя Молодежного Хурала",
    member: "Член Молодежного Хурала",
  },
  federation_council: {
    leader: "Руководитель представительства",
    member: "Член представительства",
  },
};

function roleRank(structureType, role) {
  const r = String(role || "").trim();
  const type = String(structureType || "").trim();
  // Default ordering: leaders first, then deputies, then members.
  const ranks = {
    committee: { chairman: 0, vice_chairman: 1, member: 2 },
    parliament_leadership: { chairman: 0, vice_chairman: 1, member: 2 },
    commission: { chairman: 0, vice_chairman: 1, member: 2 },
    municipal_council: { chairman: 0, vice_chairman: 1, member: 2 },
    youth_khural: { chairman: 0, vice_chairman: 1, member: 2 },
    federation_council: { leader: 0, member: 1 },
    apparatus: { leader: 0, member: 1 },
  };
  const map = ranks[type] || {};
  return map[r] ?? 99;
}

function getDeputyTitle(d, structureType) {
  const fromPosition = typeof d?.position === "string" ? d.position.trim() : "";
  if (fromPosition) return fromPosition;
  const role = String(d?.role || "").trim();
  const byRole = ROLE_LABELS_BY_STRUCTURE?.[structureType]?.[role];
  if (byRole) return byRole;
  const stLabel = STRUCTURE_TYPE_LABELS?.[structureType];
  return stLabel ? stLabel : "Депутат";
}

function DeputyGrid({ deputies, structureType, backHref }) {
  const PLACEHOLDER =
    "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-vector-600nw-2027875490.jpg";
  const filtered = React.useMemo(() => {
    const list = Array.isArray(deputies) ? deputies : [];
    return list
      .filter((d) => d && String(d.structureType || "").trim() === String(structureType || "").trim())
      .slice()
      .sort((a, b) => {
        const ra = roleRank(structureType, a?.role);
        const rb = roleRank(structureType, b?.role);
        if (ra !== rb) return ra - rb;
        return String(a?.name || "").localeCompare(String(b?.name || ""), "ru");
      });
  }, [deputies, structureType]);

  if (!filtered.length) {
    return (
      <div className="tile" style={{ padding: 24, marginTop: 16 }}>
        Список пока пуст. Добавьте депутата с типом структуры «{STRUCTURE_TYPE_LABELS?.[structureType] || structureType}
        » в админке.
      </div>
    );
  }

  return (
    <div className="grid cols-3" style={{ marginTop: 16, gap: 16 }}>
      {filtered.map((d) => (
        <div key={d.id} className="gov-card">
          <div className="gov-card__top">
            <img
              className="gov-card__avatar"
              src={d.photo || (d.image && d.image.link) || PLACEHOLDER}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="gov-card__body">
            <div className="gov-card__name">{d.name}</div>
            <div className="gov-card__role">{getDeputyTitle(d, structureType)}</div>
            <ul className="gov-meta">
              {d.district && (
                <li>
                  <span>🏛️</span>
                  <span>{typeof d.district === "string" ? d.district : String(d.district || "")}</span>
                </li>
              )}
              {d.faction && (
                <li>
                  <span>👥</span>
                  <span>{typeof d.faction === "string" ? d.faction : String(d.faction || "")}</span>
                </li>
              )}
              {d.convocation && (
                <li>
                  <span>🎖️</span>
                  <span>Созыв: {typeof d.convocation === "string" ? d.convocation : String(d.convocation || "")}</span>
                </li>
              )}
              {d.contacts?.phone && (
                <li>
                  <span>📞</span>
                  <span>{d.contacts.phone}</span>
                </li>
              )}
              {d.contacts?.email && (
                <li>
                  <span>✉️</span>
                  <span>{d.contacts.email}</span>
                </li>
              )}
            </ul>
          </div>
          <div className="gov-card__actions">
            <a
              className="gov-card__btn"
              href={`/government?type=dep&id=${encodeURIComponent(String(d.id))}${
                backHref ? `&back=${encodeURIComponent(backHref)}` : ""
              }`}
            >
              Подробнее
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SectionPage() {
  const q = useQuery();
  const titleParam = q.get("title");
  const { committees, factions: structureFactions, government, deputies } = useData();
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
      const defaultFactions = ["Единая Россия", "КПРФ", "ЛДПР", "Новые люди"];
      const factions = (Array.isArray(structureFactions) ? structureFactions : [])
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
          return String(item || "");
        })
        .map((s) => String(s || "").trim())
        .filter((s) => s && s !== "Все");
      const mergedFactions = Array.from(new Set([...factions, ...defaultFactions]));
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className="no-gold-underline">{title}</h1>
                <p style={{ marginTop: 0 }}>
                  Выберите фракцию, чтобы перейти к списку депутатов по этой фракции.
                </p>
                {mergedFactions.length ? (
                  <div className="grid cols-2" style={{ marginTop: 12 }}>
                    {mergedFactions.map((f) => (
                      <a
                        key={String(f)}
                        className="tile link"
                        href={`/deputies?faction=${encodeURIComponent(String(f))}`}
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
      // Ищем представителя/сенатора:
      // 1) приоритетно по structureType=federation_council (из админки)
      // 2) fallback по position/role (старый механизм)
      const findSenator = () => {
        const fromStructureType = (deputies || []).find(
          (d) => d && String(d.structureType || "").trim() === "federation_council"
        );
        if (fromStructureType) {
          return {
            ...fromStructureType,
            role:
              getDeputyTitle(fromStructureType, "federation_council") ||
              "Член Совета Федерации от Республики Тыва",
            type: "dep",
          };
        }
        // Сначала проверяем deputies
        const senatorFromDeputies = (deputies || []).find((d) => 
          d && (
            (d.position && typeof d.position === "string" && d.position.toLowerCase().includes("сенатор")) ||
            (d.role && typeof d.role === "string" && d.role.toLowerCase().includes("сенатор")) ||
            (d.position && typeof d.position === "string" && d.position.toLowerCase().includes("совет федерации"))
          )
        );
        
        if (senatorFromDeputies) {
          return {
            ...senatorFromDeputies,
            role: senatorFromDeputies.position || senatorFromDeputies.role || "Член Совета Федерации от Республики Тыва",
            type: "dep"
          };
        }
        
        // Проверяем government
        const senatorFromGov = (government || []).find((g) => 
          g && (
            (g.role && typeof g.role === "string" && g.role.toLowerCase().includes("сенатор")) ||
            (g.role && typeof g.role === "string" && g.role.toLowerCase().includes("совет федерации"))
          )
        );
        
        if (senatorFromGov) {
          return {
            ...senatorFromGov,
            type: "org"
          };
        }
        
        // Если не найден, возвращаем null (будет показана заглушка)
        return null;
      };
      
      const senator = findSenator();
      
      if (senator) {
        return (
          <section className="section section-page">
            <div className="container">
              <div className="page-grid">
                <div className="page-grid__main">
                  <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                  <PersonDetail 
                    item={senator} 
                    type={senator.type || "dep"}
                    backHref={`/section?title=${encodeURIComponent("Представительство в Совете Федерации")}`}
                  />
                </div>
                <SideNav title="Разделы" />
              </div>
            </div>
          </section>
        );
      }
      
      // Если сенатор не найден, показываем заглушку с инструкцией
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                <div className="tile" style={{ padding: 24, marginTop: 20 }}>
                  <p style={{ marginTop: 0 }}>
                    Для отображения информации о представителе в Совете Федерации необходимо добавить депутата 
                    с позицией, содержащей слово "сенатор" или "Совет Федерации" в данные депутатов.
                  </p>
                <p>
                    Или добавьте запись в файл government.json с ролью, содержащей "сенатор" или "Совет Федерации".
                </p>
                </div>
                <div className="tabs" style={{ marginTop: 20 }}>
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
              <div className="page-grid__main">
                <h1 className="no-gold-underline">{title}</h1>
               
                <DeputyGrid
                  deputies={deputies}
                  structureType="youth_khural"
                  backHref={`/section?title=${encodeURIComponent("Молодежный Хурал")}`}
                />
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
              <div className="page-grid__main">
                <h1 className="no-gold-underline">{title}</h1>
                <p style={{ marginTop: 0 }}>
                  Состав формируется автоматически по полю <strong>Тип структуры</strong> у депутата.
                </p>
                <DeputyGrid
                  deputies={deputies}
                  structureType="municipal_council"
                  backHref={`/section?title=${encodeURIComponent(
                    "Совет по взаимодействию с представительными органами муниципальных образований"
                  )}`}
                />
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Руководство парламента" || title === "Руководство Верховного Хурала (парламента) Республики Тыва") {
      const back = `/section?title=${encodeURIComponent("Руководство парламента")}`;
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <h1 className="no-gold-underline">{title === "Руководство парламента" ? title : "Руководство парламента"}</h1>
                <p style={{ marginTop: 0 }}>
                  Состав формируется автоматически по полю <strong>Тип структуры</strong> у депутата.
                </p>
                <DeputyGrid deputies={deputies} structureType="parliament_leadership" backHref={back} />
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
                        Председатель Верховного Хурала (парламента) Республики Тыва
                      </a>
                    );
                  }
                  return (
                    <div className="org__item org__item--blue org__item--xl">
                      Председатель Верховного Хурала (парламента) Республики Тыва
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
