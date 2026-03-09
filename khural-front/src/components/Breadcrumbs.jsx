import React from "react";
import { useHashRoute } from "../Router.jsx";
import { useData } from "../context/DataContext.jsx";
import Link from "./Link.jsx";

// Static titles for base pages
const TITLES = {
  "/": "Главная",
  "/region": "Регион",
  "/about": "О парламенте",
  "/news": "Новости",
  "/news/week": "Главные события недели",
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
  "/info": "Информация",
  "/info/finansy": "Финансы",
  "/info/personnel": "Кадровое обеспечение",
};

function getRouteBase(route) {
  if (!route) return "/";
  return route.split("?")[0] || "/";
}

export default function Breadcrumbs() {
  const { route, navigate } = useHashRoute();
  const base = getRouteBase(route);
  const { committees, slides } = useData();

  // Build hierarchical trail
  const trail = React.useMemo(() => {
    const crumbs = [{ label: "Главная", href: "/" }];
    // Optional intermediate for certain sections
    if (base === "/committee") {
      crumbs.push({ label: "Структура", href: "/section" });
      // append selected committee title when possible
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const id = sp.get("id");
        const c = (committees || []).find((x) => x.id === id);
        if (c?.title) {
          crumbs.push({ label: "Комитеты", href: "/committee" });
          crumbs.push({ label: c.title });
          return crumbs;
        }
      } catch {}
      crumbs.push({ label: "Комитеты" });
      return crumbs;
    }
    // News: Week highlights page
    if (base === "/news/week") {
      crumbs.push({ label: "Новости", href: "/news" });
      crumbs.push({ label: "Главные события недели" });
      return crumbs;
    }
    // News: Slider detail page
    if (base.startsWith("/news/slider/")) {
      crumbs.push({ label: "Новости", href: "/news" });
      crumbs.push({ label: "Главные события недели", href: "/news/week" });
      try {
        const id =
          (typeof window !== "undefined" && window.__routeParams && window.__routeParams.id
            ? String(window.__routeParams.id)
            : decodeURIComponent(base.slice("/news/slider/".length))) || "";
        const found = (Array.isArray(slides) ? slides : []).find((s) => String(s?.id ?? "") === String(id));
        crumbs.push({ label: String(found?.title || "").trim() || "Событие" });
      } catch {
        crumbs.push({ label: "Событие" });
      }
      return crumbs;
    }
    if (base === "/deputies") {
      crumbs.push({ label: "Структура", href: "/section" });
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const status = String(sp.get("status") || "").toLowerCase();
        if (status === "ended") {
          crumbs.push({ label: "Депутаты (прекратившие полномочия)" });
          return crumbs;
        }
      } catch {}
      crumbs.push({ label: "Депутаты" });
      return crumbs;
    }
    // Handle commission pages
    if (base === "/commission") {
      crumbs.push({ label: "Структура", href: "/section" });
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const id = sp.get("id");
        // Import commission titles mapping
        const COMMISSION_IDS = {
          nagradnaya: "Наградная комиссия Верховного Хурала (парламента) Республики Тыва",
          "kontrol-dostovernost":
            "Комиссия Верховного Хурала (парламента) Республики Тыва по контролю за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
          schetnaya: "Счетная комиссия Верховного Хурала",
          "reglament-etika":
            "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
          reabilitatsiya:
            "Республиканская комиссия по восстановлению прав реабилитированных жертв политических репрессий",
          "svo-podderzhka":
            "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
          "smi-obshestvo":
            "Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями",
          "mezhregionalnye-svyazi":
            "Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным и международным связям",
        };
        if (id && COMMISSION_IDS[id]) {
          crumbs.push({
            label: "Комиссии",
            href: "/section?title=" + encodeURIComponent("Комиссии"),
          });
          crumbs.push({ label: COMMISSION_IDS[id] });
          return crumbs;
        }
      } catch {}
      crumbs.push({ label: "Комиссии", href: "/section?title=" + encodeURIComponent("Комиссии") });
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
          crumbs.push({ label: "Структура", href: "/section" });
          crumbs.push({ label: decodedTitle });
          return crumbs;
        }
      } catch {}
    }
    // Handle /info routes (PageBySlug)
    if (base === "/info") {
      crumbs.push({ label: "Информация" });
      return crumbs;
    }
    // Handle /info/* routes (PageBySlug)
    if (base.startsWith("/info/")) {
      const pathParts = base.slice(6).split("/"); // After "/info/"
      crumbs.push({ label: "Информация", href: "/info" });
      
      const firstPart = pathParts[0];
      
      // Handle /info/iokrug/*
      if (firstPart === "iokrug") {
        if (pathParts.length === 1) {
          crumbs.push({ label: "Избирательные округа" });
        } else {
          crumbs.push({ label: "Избирательные округа", href: "/info/iokrug" });
          // District detail page - try to get district name
          const districtSlug = pathParts[1];
          const districtNames = {
            "1": "Одномандатный избирательный округ №1",
            "2": "Одномандатный избирательный округ №2",
            "3": "Одномандатный избирательный округ №3",
            "4": "Одномандатный избирательный округ №4",
            "5": "Одномандатный избирательный округ №5",
            "6": "Одномандатный избирательный округ №6",
            "7": "Одномандатный избирательный округ №7",
            "8": "Одномандатный избирательный округ №8",
            "9": "Одномандатный избирательный округ №9",
            "10": "Одномандатный избирательный округ №10",
            "11": "Одномандатный избирательный округ №11",
            "12": "Одномандатный избирательный округ №12",
            "13": "Одномандатный избирательный округ №13",
            "14": "Одномандатный избирательный округ №14",
            "15": "Одномандатный избирательный округ №15",
            "16": "Одномандатный избирательный округ №16",
          };
          crumbs.push({ label: districtNames[districtSlug] || `Округ ${districtSlug}` });
        }
        return crumbs;
      }
      
      // Handle /info/finansy/*
      if (firstPart === "finansy") {
        if (pathParts.length === 1) {
          crumbs.push({ label: "Финансы" });
        } else {
          const secondPart = pathParts[1];
          if (secondPart === "byudzhet") {
            crumbs.push({ label: "Финансы", href: "/info/finansy" });
            if (pathParts.length === 2) {
              crumbs.push({ label: "Бюджет" });
            } else {
              crumbs.push({ label: "Бюджет", href: "/info/finansy/byudzhet" });
              // Budget year detail
              crumbs.push({ label: pathParts[2] });
            }
          } else if (secondPart === "otcheti") {
            crumbs.push({ label: "Финансы", href: "/info/finansy" });
            if (pathParts.length === 2) {
              crumbs.push({ label: "Отчеты" });
            } else {
              crumbs.push({ label: "Отчеты", href: "/info/finansy/otcheti" });
              crumbs.push({ label: pathParts[2] });
            }
          } else if (secondPart === "rezultaty-proverok") {
            crumbs.push({ label: "Финансы", href: "/info/finansy" });
            if (pathParts.length === 2) {
              crumbs.push({ label: "Результаты проверок" });
            } else {
              crumbs.push({ label: "Результаты проверок", href: "/info/finansy/rezultaty-proverok" });
              crumbs.push({ label: pathParts[2] });
            }
          } else {
            crumbs.push({ label: "Финансы", href: "/info/finansy" });
            crumbs.push({ label: pathParts[1] });
          }
        }
        return crumbs;
      }
      
      // Handle /info/personnel/*
      if (firstPart === "personnel") {
        if (pathParts.length === 1) {
          crumbs.push({ label: "Кадровое обеспечение" });
        } else {
          crumbs.push({ label: "Кадровое обеспечение", href: "/info/personnel" });
          const titles = {
            "gossluzhba": "Государственная служба",
            "poryadok-postupleniya": "Порядок поступления",
            "law-58fz": "Федеральный закон № 58-ФЗ",
            "law-79fz": "Федеральный закон № 79-ФЗ",
            "law-112": "Указ Президента № 112",
            "telefon-spravok": "Телефон для справок",
            "poryadok-obzhalovaniya": "Порядок обжалования",
            "pensionnoe-obespechenie": "Пенсионное обеспечение",
            "otpusk-sluzhaschih": "Отпуска служащих",
          };
          crumbs.push({ label: titles[pathParts[1]] || pathParts[1] });
        }
        return crumbs;
      }
      
      // Handle other /info/* pages
      if (pathParts.length === 1) {
        const titles = {
          "zakon-karta": "Законодательная карта",
          "istoriya-parlamentarizma": "История парламентаризма",
          "polnomochiya": "Полномочия",
          "upoln-po-prav": "Уполномоченный по правам человека",
          "upoln-po-rebenku": "Уполномоченный по правам ребенка",
        };
        crumbs.push({ label: titles[firstPart] || firstPart });
      } else {
        const titles = {
          "zakon-karta": "Законодательная карта",
          "istoriya-parlamentarizma": "История парламентаризма",
          "polnomochiya": "Полномочия",
          "upoln-po-prav": "Уполномоченный по правам человека",
          "upoln-po-rebenku": "Уполномоченный по правам ребенка",
        };
        crumbs.push({ label: titles[firstPart] || firstPart, href: `/info/${firstPart}` });
        crumbs.push({ label: pathParts[1] });
      }
      return crumbs;
    }
    
    // Handle /struct/* routes
    if (base.startsWith("/struct/")) {
      const slug = base.slice(8);
      crumbs.push({ label: "Структура", href: "/section" });
      const titles = {
        "o-verkhovnom-khurale": "О Верховном Хурале",
        "predstavitelstvo": "Представительство",
        "deputatskie-fraktsii": "Депутатские фракции",
        "komissii": "Комиссии",
        "molodezhnyy-khural": "Молодежный Хурал",
      };
      crumbs.push({ label: titles[slug] || slug });
      return crumbs;
    }
    
    // Handle /page/* routes (legacy)
    if (base.startsWith("/page/")) {
      const slug = base.slice(6);
      if (slug.startsWith("info/")) {
        crumbs.push({ label: "Информация", href: "/info" });
        if (slug.startsWith("info/finansy/")) {
          crumbs.push({ label: "Финансы", href: "/info/finansy" });
        } else if (slug.startsWith("info/personnel/")) {
          crumbs.push({ label: "Кадровое обеспечение", href: "/info/personnel" });
        }
      } else if (slug.startsWith("about/")) {
        crumbs.push({ label: "О парламенте", href: "/about" });
      }
      crumbs.push({ label: slug.split("/").pop() });
      return crumbs;
    }
    // Default: show just page title
    const title = TITLES[base];
    if (title && base !== "/") {
      crumbs.push({ label: title });
    }
    return crumbs;
  }, [base, route, committees, slides]);

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
                {c.href ? (
                  <button 
                    className="btn" 
                    onClick={() => navigate(c.href)}
                    aria-current={last ? "page" : undefined}
                  >
                    {c.label}
                  </button>
                ) : (
                  <button className="btn" aria-current="page" disabled>{c.label}</button>
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
