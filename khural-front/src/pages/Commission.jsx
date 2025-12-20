import React from "react";
import SideNav from "../components/SideNav.jsx";
import Nagradnaya from "./commissions/Nagradnaya.jsx";
import KontrolDostovernost from "./commissions/KontrolDostovernost.jsx";
import Schetnaya from "./commissions/Schetnaya.jsx";
import ReglamentEtika from "./commissions/ReglamentEtika.jsx";
import Reabilitatsiya from "./commissions/Reabilitatsiya.jsx";
import SvoPodderzhka from "./commissions/SvoPodderzhka.jsx";
import SmiObshestvo from "./commissions/SmiObshestvo.jsx";
import MezhregionalnyeSvyazi from "./commissions/MezhregionalnyeSvyazi.jsx";

// Mapping id -> title/component for each commission
const COMMISSIONS = {
  nagradnaya: {
    title: "Наградная комиссия Верховного Хурала (парламента) Республики Тыва",
    Component: Nagradnaya,
  },
  "kontrol-dostovernost": {
    title:
      "Комиссия Верховного Хурала (парламента) Республики Тыва по контролю за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
    Component: KontrolDostovernost,
  },
  schetnaya: {
    title: "Счетная комиссия Верховного Хурала",
    Component: Schetnaya,
  },
  "reglament-etika": {
    title:
      "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
    Component: ReglamentEtika,
  },
  reabilitatsiya: {
    title:
      "Республиканская комиссия по восстановлению прав реабилитированных жертв политических репрессий",
    Component: Reabilitatsiya,
  },
  "svo-podderzhka": {
    title:
      "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
    Component: SvoPodderzhka,
  },
  "smi-obshestvo": {
    title:
      "Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями",
    Component: SmiObshestvo,
  },
  "mezhregionalnye-svyazi": {
    title:
      "Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным и международным связям",
    Component: MezhregionalnyeSvyazi,
  },
};

export default function Commission() {
  const [commission, setCommission] = React.useState(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search || "");
    const id = sp.get("id");
    setCommission(id && COMMISSIONS[id] ? { id, ...COMMISSIONS[id] } : null);
  }, []);

  React.useEffect(() => {
    const onNav = () => {
      const sp = new URLSearchParams(window.location.search || "");
      const id = sp.get("id");
      setCommission(id && COMMISSIONS[id] ? { id, ...COMMISSIONS[id] } : null);
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);

  if (!commission) {
    return (
      <section className="section">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1>Комиссия</h1>
              <p>Комиссия не найдена.</p>
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  const Page = commission.Component;

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h3>{commission.title}</h3>
            {Page ? <Page /> : <p>Здесь будет содержимое страницы «{commission.title}».</p>}
          </div>
          <SideNav title="Разделы" />
        </div>
      </div>
    </section>
  );
}
