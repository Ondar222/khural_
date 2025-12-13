import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";

function useQuery() {
  const [q, setQ] = React.useState(() => {
    const h = window.location.hash;
    return new URLSearchParams(h.split("?")[1]);
  });
  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      setQ(new URLSearchParams(h.split("?")[1]));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return q;
}

export default function SectionPage() {
  const q = useQuery();
  const titleParam = q.get("title");
  const { committees, factions, commissions, councils } = useData();

  // Detail stub when title is provided
  if (titleParam) {
    let title = titleParam;
    try {
      title = decodeURIComponent(titleParam);
    } catch {}
    
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
        <section className="section">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1>{title}</h1>
                <ul>
                  {commissionsList.map((item) => (
                    <li key={item.id}>
                      <a href={`#/commission?id=${item.id}`}>
                        {item.name}
                      </a>
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
    
    return (
      <section className="section">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1>{title}</h1>
              <p>Здесь будет содержимое страницы «{title}».</p>
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  // Structure diagram view (as on the picture)
  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>Структура Верховного Хурала (парламента) Республики Тыва</h1>
            <div className="org org--khural">
              <div className="org__row org__row--center">
                <div className="org__item org__item--blue org__item--xl">
                  Председатель Верховного Хурала (парламента) Республики Тыва
                </div>
              </div>
              {/* Factions row */}
              <div className="org__row org__row--factions">
                {["Единая Россия", "КПРФ", "ЛДПР", "Новые люди"].map((f) => (
                  <a
                    key={f}
                    className="org__item org__item--blue"
                    href={`#/deputies?faction=${encodeURIComponent(f)}`}
                  >
                    Фракция
                    <br />
                    {f}
                  </a>
                ))}
              </div>
              {/* Three column zone: committees on the left, commissions/councils on right */}
              <div className="org__row org__row--cols4">
                <div className="org__col">
                  <a
                    className="org__item org__item--blue"
                    href={"#/section?title=" + encodeURIComponent("Комитеты")}
                  >
                    Комитеты Верховного Хурала (парламента) Республики Тыва
                  </a>
                  {(committees || []).map((c) => (
                    <a
                      key={c.id}
                      className="org__item org__item--green"
                      href={`#/committee?id=${encodeURIComponent(c.id)}`}
                    >
                      {c.title}
                    </a>
                  ))}
                </div>
                <div className="org__col">
                  <a
                    className="org__item org__item--blue"
                    href="#/commission?id=mezhregionalnye-svyazi"
                  >
                    Комитет Верховного Хурала (парламента) Республики Тыва по
                    межрегиональным связям
                  </a>
                  <a
                    className="org__item org__item--blue"
                    href="#/commission?id=smi-obshestvo"
                  >
                    Комитет Верховного Хурала (парламента) Республики Тыва по
                    взаимодействию со средствами массовой информации и
                    общественными организациями
                  </a>
                </div>
                <div className="org__col org__col--span2">
                  {[
                    { title: "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике", id: "reglament-etika" },
                    { title: "Комиссия Верховного Хурала (парламента) Республики Тыва контрольно за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва", id: "kontrol-dostovernost" },
                    { title: "Наградная комиссия Верховного Хурала (парламента) Республики Тыва", id: "nagradnaya" },
                    { title: "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей", id: "svo-podderzhka" },
                    { title: "Счетная комиссия Верховного Хурала (парламента) Республики Тыва", id: "schetnaya" },
                  ].map((item, i) => (
                    <a
                      key={`wide-${i}`}
                      className="org__item org__item--blue"
                      href={`#/commission?id=${item.id}`}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>
              <div className="org__row org__row--center">
                <a
                  className="org__item org__item--xl org__item--blue"
                  href="#/apparatus"
                >
                  Аппарат Верховного Хурала (парламента) Республики Тыва
                </a>
              </div>
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </div>
    </section>
  );
}
