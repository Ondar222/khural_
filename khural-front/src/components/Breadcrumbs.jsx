import React from "react";
import { useHashRoute } from "../Router.jsx";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import Link from "./Link.jsx";

// Static titles for base pages (will be translated via t())
const TITLES_KEYS = {
  "/": "Главная",
  "/region": "Регион",
  "/about": "О парламенте",
  "/news": "Новости",
  "/news/week": "Главные события",
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
  const { t, lang } = useI18n();

  // Build hierarchical trail
  const trail = React.useMemo(() => {
    const crumbs = [{ label: t("Главная"), href: "/" }];
    // Optional intermediate for certain sections
    if (base === "/committee") {
      crumbs.push({ label: t("Структура"), href: "/section" });
      // append selected committee title when possible
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const id = sp.get("id");
        const c = (committees || []).find((x) => x.id === id);
        if (c?.title) {
          crumbs.push({ label: t("Комитеты"), href: "/committee" });
          crumbs.push({ label: c.title });
          return crumbs;
        }
      } catch {}
      crumbs.push({ label: t("Комитеты") });
      return crumbs;
    }
    // News: Week highlights page
    if (base === "/news/week") {
      crumbs.push({ label: t("Новости"), href: "/news" });
      crumbs.push({ label: t("Главные события") });
      return crumbs;
    }
    // News: Slider detail page
    if (base.startsWith("/news/slider/")) {
      crumbs.push({ label: t("Новости"), href: "/news" });
      crumbs.push({ label: t("Главные события"), href: "/news/week" });
      try {
        const id =
          (typeof window !== "undefined" && window.__routeParams && window.__routeParams.id
            ? String(window.__routeParams.id)
            : decodeURIComponent(base.slice("/news/slider/".length))) || "";
        const found = (Array.isArray(slides) ? slides : []).find((s) => String(s?.id ?? "") === String(id));
        crumbs.push({ label: String(found?.title || "").trim() || t("Событие") });
      } catch {
        crumbs.push({ label: t("Событие") });
      }
      return crumbs;
    }
    if (base === "/deputies") {
      crumbs.push({ label: t("Структура"), href: "/section" });
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const status = String(sp.get("status") || "").toLowerCase();
        if (status === "ended") {
          crumbs.push({ label: t("Депутаты (прекратившие полномочия)") });
          return crumbs;
        }
      } catch {}
      crumbs.push({ label: t("Депутаты") });
      return crumbs;
    }
    // Handle commission pages
    if (base === "/commission") {
      crumbs.push({ label: t("Структура"), href: "/section" });
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const id = sp.get("id");
        // Import commission titles mapping
        const COMMISSION_IDS = {
          nagradnaya: t("Наградная комиссия"),
          "kontrol-dostovernost": t("Комиссия по контролю за достоверностью сведений"),
          schetnaya: t("Счетная комиссия"),
          "reglament-etika": t("Комиссия по Регламенту и депутатской этике"),
          reabilitatsiya: t("Комиссия по восстановлению прав реабилитированных"),
          "svo-podderzhka": t("Комиссия по поддержке участников СВО"),
          "smi-obshestvo": t("Комитет по взаимодействию со СМИ"),
          "mezhregionalnye-svyazi": t("Комитет по межрегиональным связям"),
        };
        if (id && COMMISSION_IDS[id]) {
          crumbs.push({
            label: t("Комиссии"),
            href: "/section?title=" + encodeURIComponent("Комиссии"),
          });
          crumbs.push({ label: COMMISSION_IDS[id] });
          return crumbs;
        }
      } catch {}
      crumbs.push({ label: t("Комиссии"), href: "/section?title=" + encodeURIComponent("Комиссии") });
      crumbs.push({ label: t("Комиссия") });
      return crumbs;
    }
    // Handle section pages with specific titles
    if (base === "/section") {
      try {
        const sp = new URLSearchParams((route || "").split("?")[1]);
        const sectionTitle = sp.get("title");
        if (sectionTitle) {
          const decodedTitle = decodeURIComponent(sectionTitle);
          crumbs.push({ label: t("Структура"), href: "/section" });
          crumbs.push({ label: decodedTitle });
          return crumbs;
        }
      } catch {}
    }
    // Handle /info routes (PageBySlug)
    if (base === "/info") {
      crumbs.push({ label: t("Информация") });
      return crumbs;
    }
    // Handle /info/* routes (PageBySlug)
    if (base.startsWith("/info/")) {
      const pathParts = base.slice(6).split("/"); // After "/info/"
      crumbs.push({ label: t("Информация"), href: "/info" });

      const firstPart = pathParts[0];

      // Handle /info/iokrug/*
      if (firstPart === "iokrug") {
        if (pathParts.length === 1) {
          crumbs.push({ label: t("Избирательные округа") });
        } else {
          crumbs.push({ label: t("Избирательные округа"), href: "/info/iokrug" });
          // District detail page - try to get district name
          const districtSlug = pathParts[1];
          const districtNames = {
            "1": t("Одномандатный избирательный округ №1"),
            "2": t("Одномандатный избирательный округ №2"),
            "3": t("Одномандатный избирательный округ №3"),
            "4": t("Одномандатный избирательный округ №4"),
            "5": t("Одномандатный избирательный округ №5"),
            "6": t("Одномандатный избирательный округ №6"),
            "7": t("Одномандатный избирательный округ №7"),
            "8": t("Одномандатный избирательный округ №8"),
            "9": t("Одномандатный избирательный округ №9"),
            "10": t("Одномандатный избирательный округ №10"),
            "11": t("Одномандатный избирательный округ №11"),
            "12": t("Одномандатный избирательный округ №12"),
            "13": t("Одномандатный избирательный округ №13"),
            "14": t("Одномандатный избирательный округ №14"),
            "15": t("Одномандатный избирательный округ №15"),
            "16": t("Одномандатный избирательный округ №16"),
          };
          crumbs.push({ label: districtNames[districtSlug] || `${t("Округ")} ${districtSlug}` });
        }
        return crumbs;
      }

      // Handle /info/finansy/*
      if (firstPart === "finansy") {
        if (pathParts.length === 1) {
          crumbs.push({ label: t("Финансы") });
        } else {
          const secondPart = pathParts[1];
          if (secondPart === "byudzhet") {
            crumbs.push({ label: t("Финансы"), href: "/info/finansy" });
            if (pathParts.length === 2) {
              crumbs.push({ label: t("Бюджет") });
            } else {
              crumbs.push({ label: t("Бюджет"), href: "/info/finansy/byudzhet" });
              // Budget year detail
              crumbs.push({ label: pathParts[2] });
            }
          } else if (secondPart === "otcheti") {
            crumbs.push({ label: t("Финансы"), href: "/info/finansy" });
            if (pathParts.length === 2) {
              crumbs.push({ label: t("Отчеты") });
            } else {
              crumbs.push({ label: t("Отчеты"), href: "/info/finansy/otcheti" });
              crumbs.push({ label: pathParts[2] });
            }
          } else if (secondPart === "rezultaty-proverok") {
            crumbs.push({ label: t("Финансы"), href: "/info/finansy" });
            if (pathParts.length === 2) {
              crumbs.push({ label: t("Результаты проверок") });
            } else {
              crumbs.push({ label: t("Результаты проверок"), href: "/info/finansy/rezultaty-proverok" });
              crumbs.push({ label: pathParts[2] });
            }
          } else {
            crumbs.push({ label: t("Финансы"), href: "/info/finansy" });
            crumbs.push({ label: pathParts[1] });
          }
        }
        return crumbs;
      }

      // Handle /info/personnel/*
      if (firstPart === "personnel") {
        if (pathParts.length === 1) {
          crumbs.push({ label: t("Кадровое обеспечение") });
        } else {
          crumbs.push({ label: t("Кадровое обеспечение"), href: "/info/personnel" });
          const titles = {
            "gossluzhba": t("Государственная служба"),
            "poryadok-postupleniya": t("Порядок поступления"),
            "law-58fz": t("Федеральный закон № 58-ФЗ"),
            "law-79fz": t("Федеральный закон № 79-ФЗ"),
            "law-112": t("Указ Президента № 112"),
            "telefon-spravok": t("Телефон для справок"),
            "poryadok-obzhalovaniya": t("Порядок обжалования"),
            "pensionnoe-obespechenie": t("Пенсионное обеспечение"),
            "otpusk-sluzhaschih": t("Отпуска служащих"),
          };
          crumbs.push({ label: titles[pathParts[1]] || pathParts[1] });
        }
        return crumbs;
      }

      // Handle other /info/* pages
      if (pathParts.length === 1) {
        const titles = {
          "zakon-karta": t("Законодательная карта"),
          "istoriya-parlamentarizma": t("История парламентаризма"),
          "polnomochiya": t("Полномочия"),
          "upoln-po-prav": t("Уполномоченный по правам человека"),
          "upoln-po-reb": t("Уполномоченный по правам ребенка"),
          "upoln-po-rebenku": t("Уполномоченный по правам ребенка"),
        };
        crumbs.push({ label: titles[firstPart] || firstPart });
      } else {
        const titles = {
          "zakon-karta": t("Законодательная карта"),
          "istoriya-parlamentarizma": t("История парламентаризма"),
          "polnomochiya": t("Полномочия"),
          "upoln-po-prav": t("Уполномоченный по правам человека"),
          "upoln-po-reb": t("Уполномоченный по правам ребенка"),
          "upoln-po-rebenku": t("Уполномоченный по правам ребенка"),
        };
        crumbs.push({ label: titles[firstPart] || firstPart, href: `/info/${firstPart}` });
        crumbs.push({ label: pathParts[1] });
      }
      return crumbs;
    }
    
    // Handle /youth-parliament routes
    if (base === "/youth-parliament" || base.startsWith("/youth-parliament/")) {
      crumbs.push({ 
        label: lang === "ty" ? "Аныяктар Хуралы" : lang === "ru" ? "Молодежный Хурал" : "Youth Parliament", 
        href: "/youth-parliament" 
      });
      if (base !== "/youth-parliament") {
        const slug = base.slice(16); // Remove "/youth-parliament/"
        const firstSegment = slug.split("/")[0];
        const titles = {
          "regulation": lang === "ty" ? "Дүрүм" : lang === "ru" ? "Положение" : "Regulation",
          "composition": lang === "ty" ? "Тургузуу" : lang === "ru" ? "Состав" : "Composition",
          "reports": lang === "ty" ? "Отчеттар" : lang === "ru" ? "Отчеты" : "Reports",
          "contacts": lang === "ty" ? "Харылзаа" : lang === "ru" ? "Контакты" : "Contacts",
          "agendas": lang === "ty" ? "Повесткалар" : lang === "ru" ? "Повестки заседаний" : "Agendas",
          "duza-project": lang === "ty" ? "\"Дуза\" төлевилел" : lang === "ru" ? "Проект \"Дуза\"" : "Duza Project",
          "rules": lang === "ty" ? "Регламент" : lang === "ru" ? "Регламент" : "Rules",
        };

        if (firstSegment === "reports" && slug.includes("/")) {
          // Sub-page like /youth-parliament/reports/2015
          const year = slug.split("/")[1];
          crumbs.push({ 
            label: lang === "ty" ? "Отчеттар" : lang === "ru" ? "Отчеты" : "Reports", 
            href: "/youth-parliament/reports" 
          });
          crumbs.push({ 
            label: lang === "ty" 
              ? `${year} чылда отчет` 
              : lang === "ru" 
                ? `Отчет за ${year} год` 
                : `Report for ${year}` 
          });
        } else {
          crumbs.push({ label: titles[firstSegment] || firstSegment });
        }
      }
      return crumbs;
    }

    // Handle /struct/* routes
    if (base.startsWith("/struct/")) {
      const slug = base.slice(8);
      crumbs.push({ label: t("Структура"), href: "/section" });
      const titles = {
        "o-verkhovnom-khurale": t("О Верховном Хурале"),
        "predstavitelstvo": t("Представительство"),
        "deputatskie-fraktsii": t("Депутатские фракции"),
        "komissii": t("Комиссии"),
        "council": t("Представительство в Совете Федерации"),
      };
      crumbs.push({ label: titles[slug] || slug });
      return crumbs;
    }

    // Handle /page/* routes (legacy)
    if (base.startsWith("/page/")) {
      const slug = base.slice(6);
      if (slug.startsWith("info/")) {
        crumbs.push({ label: t("Информация"), href: "/info" });
        if (slug.startsWith("info/finansy/")) {
          crumbs.push({ label: t("Финансы"), href: "/info/finansy" });
        } else if (slug.startsWith("info/personnel/")) {
          crumbs.push({ label: t("Кадровое обеспечение"), href: "/info/personnel" });
        }
      } else if (slug.startsWith("about/")) {
        crumbs.push({ label: t("О парламенте"), href: "/about" });
      }
      crumbs.push({ label: slug.split("/").pop() });
      return crumbs;
    }
    // Default: show just page title
    const titleKey = TITLES_KEYS[base];
    if (titleKey && base !== "/") {
      crumbs.push({ label: t(titleKey) });
    }
    return crumbs;
  }, [base, route, committees, slides, t]);

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
