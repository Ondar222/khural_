import React from "react";
import { useHashRoute } from "../Router.jsx";
import { useData } from "../context/DataContext.jsx";

function getRouteBase(route) {
  if (!route) return "/";
  return route.split("?")[0] || "/";
}

export default function Breadcrumbs() {
  const { route } = useHashRoute();
  const base = getRouteBase(route);
  const { committees } = useData();

  // Static titles for base pages
  const titles = {
    "/": "Главная",
    "/region": "Регион",
    "/about": "О парламенте",
    "/news": "Новости",
    "/calendar": "Календарь",
    "/documents": "Документы",
    "/committee": "Комитеты",
    "/apparatus": "Аппарат",
    "/section": "Структура",
    "/deputies": "Депутаты",
    "/appeals": "Прием обращений",
    "/government": "Персоны",
    "/authorities": "Органы власти",
    "/wifi": "Гостевой Wi‑Fi",
    "/feedback": "Обращения",
    "/press": "Пресс‑служба",
    "/activity": "Деятельность",
    "/docs": "Документы",
    "/contacts": "Контакты",
  };

  // Build hierarchical trail
  const trail = React.useMemo(() => {
    const crumbs = [{ label: "Главная", href: "#/" }];
    // Optional intermediate for certain sections
    if (base === "/committee") {
      crumbs.push({ label: "Структура", href: "#/section" });
      // append selected committee title when possible
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const id = sp.get("id");
        const c = (committees || []).find((x) => x.id === id);
        if (c?.title) {
          crumbs.push({ label: "Комитеты", href: "#/committee" });
          crumbs.push({ label: c.title });
          return crumbs;
        }
      } catch {}
      crumbs.push({ label: "Комитеты" });
      return crumbs;
    }
    if (base === "/deputies") {
      crumbs.push({ label: "Структура", href: "#/section" });
      crumbs.push({ label: "Депутаты" });
      return crumbs;
    }
    // Handle commission pages
    if (base === "/commission") {
      crumbs.push({ label: "Структура", href: "#/section" });
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const id = sp.get("id");
        // Import commission titles mapping
        const COMMISSION_IDS = {
          "nagradnaya": "Наградная комиссия Верховного Хурала (парламента) Республики Тыва",
          "kontrol-dostovernost": "Комиссия Верховного Хурала (парламента) Республики Тыва по контролю за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
          "schetnaya": "Счетная комиссия Верховного Хурала",
          "reglament-etika": "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
          "reabilitatsiya": "Республиканская комиссия по восстановлению прав реабилитированных жертв политических репрессий",
          "svo-podderzhka": "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
          "smi-obshestvo": "Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями",
          "mezhregionalnye-svyazi": "Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным и международным связям",
        };
        if (id && COMMISSION_IDS[id]) {
          crumbs.push({ label: "Комиссии", href: "#/section?title=" + encodeURIComponent("Комиссии") });
          crumbs.push({ label: COMMISSION_IDS[id] });
          return crumbs;
        }
      } catch {}
      crumbs.push({ label: "Комиссии", href: "#/section?title=" + encodeURIComponent("Комиссии") });
      crumbs.push({ label: "Комиссия" });
      return crumbs;
    }
    // Handle section pages with specific titles
    if (base === "/section") {
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const sectionTitle = sp.get("title");
        if (sectionTitle) {
          const decodedTitle = decodeURIComponent(sectionTitle);
          crumbs.push({ label: "Структура", href: "#/section" });
          crumbs.push({ label: decodedTitle });
          return crumbs;
        }
      } catch {}
    }
    // Default: show just page title
    const title = titles[base];
    if (title && base !== "/") {
      crumbs.push({ label: title });
    }
    return crumbs;
  }, [base, route, committees]);

  // Hide on home
  if (base === "/") return null;

  return (
    <div className="section" aria-label="Хлебные крошки">
      <div className="container">
        <nav className="breadcrumbs">
          {trail.map((c, idx) => {
            const last = idx === trail.length - 1;
            return (
              <span key={idx} className="breadcrumbs__item">
                {c.href && !last ? (
                  <a href={c.href}>{c.label}</a>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
                {!last && <span className="breadcrumbs__sep">›</span>}
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
