import React from "react";
import { useA11y } from "../context/A11yContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Link from "./Link.jsx";
import { useData } from "../context/DataContext.jsx";
import { RightOutlined } from "@ant-design/icons";
import { AboutApi } from "../api/client.js";
import { getPreferredLocaleToken } from "../utils/pages.js";
import {
  applyPagesOverridesToTree,
  pickMenuLabel,
  PAGES_OVERRIDES_EVENT_NAME,
  PAGES_OVERRIDES_STORAGE_KEY,
} from "../utils/pagesOverrides.js";
// removed unused UI icon libs

export default function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState(null); // 'vh' | 'news' | 'docs' | 'pages'
  const [mobileSection, setMobileSection] = React.useState(null);
  const { isAuthenticated, user, logout } = useAuth();


  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setSheetOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleBurger = () => {
    if (window.innerWidth >= 960) {
      setSheetOpen(true);
    } else {
      setMobileOpen(true);
    }
  };

  useA11y();
 const { lang, setLang, t } = useI18n();
  const localeToken = getPreferredLocaleToken(lang);
  const brandLine1 = lang === "ru" ? "Верховный Хурал" : t("brandTop");
  const brandLine2 = lang === "ru" ? "(парламент)" : t("brandParliament");
  const brandLine3 = lang === "ru" ? "Республика Тыва" : t("brandBottom");
  // Для тувинского языка - три строки
  const tyBrandLines = lang === "ty" 
    ? ["Тыва Республиканын", "Дээди Хуралы", "(ПАРЛАМЕНТИЗИ)"] 
    : null;

  // Обработчик клика на иконку версии для слабовидящих
  const handleAccessibilityToggle = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Получаем текущий путь и параметры поиска
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    // Парсим текущие параметры URL
    const urlParams = new URLSearchParams(currentSearch);
    const isCurrentlyActive = urlParams.get('special_version') === 'Y';
    
    // Переключаем параметр
    if (isCurrentlyActive) {
      urlParams.delete('special_version');
    } else {
      urlParams.set('special_version', 'Y');
    }
    
    // Формируем новый URL с сохранением маршрута
    const newSearch = urlParams.toString();
    const newUrl = currentPath + (newSearch ? '?' + newSearch : '');
    
    // Перезагружаем страницу с сохраненным маршрутом
    window.location.href = newUrl;
  }, []);

  React.useEffect(() => {
    const onNav = () => setSheetOpen(false);
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);

  React.useEffect(() => {
    const anyOpen = mobileOpen || sheetOpen;
    const prev = document.body.style.overflow;
    document.body.style.overflow = anyOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [mobileOpen, sheetOpen]);

  const { news } = useData();
  const newsCategories = React.useMemo(() => {
    const cats = Array.from(
      new Set(
        (news || []).map((n) => {
          const c = n?.category;
          if (typeof c === "string") return c;
          if (!c) return "";
          return c.name || c.title || String(c);
        })
      )
    ).filter((c) => typeof c === "string" && c.trim() !== "");
    return ["Актуальные новости", "Все новости", "Медиа", "—", ...cats];
  }, [news]);

  const [pagesTree, setPagesTree] = React.useState([]);

  const pageHref = React.useCallback((slug) => {
    const segs = String(slug || "")
      .split("/")
      .filter(Boolean)
      .map((s) => encodeURIComponent(s));
    return `/p/${segs.join("/")}`;
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await AboutApi.listPagesTree({ publishedOnly: true }).catch(() => []);
        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        if (!alive) return;
        setPagesTree(applyPagesOverridesToTree(arr));
      } catch {
        if (!alive) return;
        setPagesTree([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const reapply = () => setPagesTree((prev) => applyPagesOverridesToTree(prev));
    const onStorage = (e) => {
      if (e?.key === PAGES_OVERRIDES_STORAGE_KEY) reapply();
    };
    window.addEventListener(PAGES_OVERRIDES_EVENT_NAME, reapply);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PAGES_OVERRIDES_EVENT_NAME, reapply);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="container topbar">
          <a href="/appeals">{t("feedback")}</a>
          <a href="/press">{t("press")}</a>
          <a href="/activity">{t("activity")}</a>

          <span className="topbar-auth">
            {isAuthenticated ? (
              <>
                <span className="topbar-auth__name">
                  {user?.name || user?.email || t("login")}
                </span>
                <a href="/cabinet">{t("Личный кабинет") || "Личный кабинет"}</a>
                {String(user?.role || "").toLowerCase() === "admin" || user?.admin ? (
                  <a href="/admin">{t("Панель управления") || "Панель управления"}</a>
                ) : null}
                <button
                  className="link-like"
                  onClick={() => {
                    logout();
                  }}
                >
                  {t("Выйти") || "Выйти"}
                </button>
              </>
            ) : (
              <>
                <a 
                  href="/login" 
                  className="btn btn--primary"
                  style={{ padding: "6px 12px", fontSize: "13px", marginTop: "4px", marginBottom: "4px" }}
                >
                  {t("login")}
                </a>
                <a 
                  href="/register" 
                  className="btn"
                  style={{ padding: "6px 12px", fontSize: "13px", marginTop: "4px", marginBottom: "4px" }}
                >
                  {t("register")}
                </a>
              </>
            )}
          </span>
        </div>
        <div className="container row">
          <div>
            <div className="brand">
              <a
                href="/"
                className="logo"
                aria-label={t("goHome")}
                style={{ textDecoration: "none" }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg"
                  alt=""
                  width={56}
                  height={56}
                />
              </a>
              {/* Mobile-only title: desktop uses .brand-text, but it is hidden on mobile via CSS */}
              <a href="/" className="brand-mobile-title" style={{ textDecoration: "none" }}>
                {tyBrandLines ? (
                  <>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "var(--primary)" }}>
                      {tyBrandLines[0]}
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "var(--primary)" }}>
                      {tyBrandLines[1]}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.1, color: "var(--muted)" }}>
                      {tyBrandLines[2]}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="brand-mobile-title__top">{brandLine1}</div>
                    <div className="brand-mobile-title__mid">{brandLine2}</div>
                    <div className="brand-mobile-title__bottom">{brandLine3}</div>
                  </>
                )}
              </a>
              <div className="brand-text">
                <a href="/" style={{ textDecoration: "none" }}>
                  {tyBrandLines ? (
                    <div className="brand-ty">
                      <div className="brand-ty__line brand-ty__line--1">{tyBrandLines[0]}</div>
                      <div className="brand-ty__line brand-ty__line--2">{tyBrandLines[1]}</div>
                      <div className="brand-ty__line brand-ty__line--3">{tyBrandLines[2]}</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 900, color: "var(--muted)" }}>
                        {brandLine1}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.1, color: "var(--muted)" }}>{brandLine2}</div>
                      <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "var(--primary)" }}>
                        {brandLine3}
                      </div>
                    </>
                  )}
                </a>
              </div>
            </div>
          </div>

          <nav className="main-nav">
            <div>
              <Link to="/">{t("home")}</Link>
            </div>
            <div
              className={`dropdown ${openMenu === "vh" ? "open" : ""}`}
              onMouseEnter={() => setOpenMenu("vh")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link to="/about">{t("aboutVH")} ▾</Link>
              <div className="dropdown__menu" onMouseEnter={() => setOpenMenu("vh")}>
                <a href="/about">{t("aboutVH")}</a>
                <a href="/section">{t("structure")}</a>
                <a href="/committee">{t("committees")}</a>
                <a href="/convocations">{t("convocations") || "Созывы"}</a>
                <a href={"/section?title=" + encodeURIComponent("Комиссии")}>{t("commissions")}</a>
                <a href={"/section?title=" + encodeURIComponent("Депутатские фракции")}>
                  {t("factions")}
                </a>
                <a
                  href={
                    "/section?title=" + encodeURIComponent("Представительство в Совете Федерации")
                  }
                >
                  {t("senateRep")}
                </a>
                <a href="/apparatus">{t("apparatus")}</a>
                <a href="/contacts">{t("contacts")}</a>
              </div>
            </div>
            <div>
              <Link to="/deputies">{t("deputies")}</Link>
            </div>
            <div
              className={`dropdown ${openMenu === "docs" ? "open" : ""}`}
              onMouseEnter={() => setOpenMenu("docs")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link to="/docs/laws">{t("documents")} ▾</Link>
              <div className="dropdown__menu" onMouseEnter={() => setOpenMenu("docs")}>
                <a href="/docs/laws">
                  {t("docs")}: {t("legislation")}
                </a>
                <a href={`/news?category=${encodeURIComponent("Законодательство")}`}>
                  {t("legislation")} ({t("news")})
                </a>
                <a href="/docs/resolutions">{t("docsResolutions")}</a>
                <a href="/docs/initiatives">{t("docsInitiatives")}</a>
                <a href="/docs/civic">{t("docsCivic")}</a>
                <a href="/docs/constitution">{t("docsConstitution")}</a>
                <a href="/docs/bills">{t("docsBills")}</a>
              </div>
            </div>
            <div
              className={`dropdown ${openMenu === "news" ? "open" : ""}`}
              onMouseEnter={() => setOpenMenu("news")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link to="/news">{t("news")} ▾</Link>
              <div className="dropdown__menu" onMouseEnter={() => setOpenMenu("news")}>
                <a href="/news/week">Главные события недели</a>
                <hr />
                {newsCategories.map((c, i) =>
                  c === "—" ? (
                    <hr key={`hr-${i}`} />
                  ) : (
                    <a
                      key={c}
                      href={
                        c === "Актуальные новости" || c === "Все новости" || c === "Медиа"
                          ? "/news"
                          : `/news?category=${encodeURIComponent(c)}`
                      }
                    >
                      {lang === "ty"
                        ? {
                            "Актуальные новости": t("hotNews"),
                            "Все новости": t("allNews"),
                            Медиа: t("media"),
                            Сессии: t("sessions"),
                            Законодательство: t("legislation"),
                            "Общественные мероприятия": t("publicEvents"),
                            Комитеты: t("committees"),
                            "Работа с гражданами": t("workWithCitizens"),
                          }[c] || c
                        : c}
                    </a>
                  )
                )}
              </div>
            </div>
            <div>
              <Link to="/appeals">{t("appeals")}</Link>
            </div>
            <div
              className={`dropdown ${openMenu === "pages" ? "open" : ""}`}
              onMouseEnter={() => setOpenMenu("pages")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link to="/pages">{t("Страницы") || "Страницы"} ▾</Link>
              <div className="dropdown__menu" onMouseEnter={() => setOpenMenu("pages")}>
                <a href="/pages">{t("Все страницы") || "Все страницы"}</a>
                {Array.isArray(pagesTree) && pagesTree.length ? <hr /> : null}
                {(Array.isArray(pagesTree) ? pagesTree : []).slice(0, 25).map((p) => {
                  const rootLabel = pickMenuLabel(p, localeToken, { prefer: "menu" });
                  const children = Array.isArray(p?.children) ? p.children : [];
                  return (
                    <React.Fragment key={String(p?.id || p?.slug || Math.random())}>
                      <a href={pageHref(p.slug)} style={{ fontWeight: 800 }}>
                        {rootLabel || p.slug}
                      </a>
                      {children.slice(0, 25).map((c) => (
                        <a
                          key={String(c?.id || c?.slug || Math.random())}
                          href={pageHref(c.slug)}
                          style={{ paddingLeft: 14, fontSize: 13 }}
                        >
                          {pickMenuLabel(c, localeToken, { prefer: "submenu" }) || c.slug}
                        </a>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className="header-actions">
            <img 
              id="specialButton" 
              onClick={handleAccessibilityToggle}
              style={{ cursor: 'pointer', maxWidth: '40px', height: 'auto' }} 
              src="https://lidrekon.ru/images/special.png" 
              alt="ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ" 
              title="ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ" 
            />
            <button
              className="icon-btn"
              aria-label={t("changeLanguage")}
              onClick={() => {
                const newLang = lang === "ru" ? "ty" : "ru";
                setLang(newLang);
                // Language switch doesn't require route mutation in history mode.
              }}
            >
              {lang.toUpperCase()}
            </button>
            <button className="icon-btn" aria-label={t("menu")} onClick={handleBurger}>
              <span className="burger">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>

        {/* убрали старое узкое мегаменю */}
      </header>
      <div
        className={`sheet-backdrop ${sheetOpen ? "open" : ""}`}
        onClick={() => setSheetOpen(false)}
      ></div>
      <div className={`mega-sheet ${sheetOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="sheet-header">
          <a
            href="/"
            className="logo"
            aria-label={t("goHome")}
            onClick={() => setSheetOpen(false)}
            style={{
              marginRight: "auto",
              textDecoration: "none",
            }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg"
              alt=""
              width={44}
              height={44}
            />
          </a>
            <a
              href="/"
              className="sheet-title"
              onClick={() => setSheetOpen(false)}
              style={{ textDecoration: "none" }}
            >
              {tyBrandLines ? (
                <>
                  <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "#003366" }}>
                    {tyBrandLines[0]}
                  </div>
                  <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "#003366" }}>
                    {tyBrandLines[1]}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.1, color: "#6b7280" }}>
                    {tyBrandLines[2]}
                  </div>
                </>
              ) : (
                <>
                  <div className="sheet-title__top">{brandLine1}</div>
                  <div className="sheet-title__mid">{brandLine2}</div>
                  <div className="sheet-title__bottom">{brandLine3}</div>
                </>
              )}
            </a>
          <img 
            id="specialButton" 
            onClick={handleAccessibilityToggle}
            style={{ cursor: 'pointer', maxWidth: '40px', height: 'auto' }} 
            src="https://lidrekon.ru/images/special.png" 
            alt="ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ" 
            title="ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ" 
          />
          <button
            className="icon-btn"
            aria-label={t("changeLanguage")}
            onClick={() => {
              const newLang = lang === "ru" ? "ty" : "ru";
              setLang(newLang);
              // Language switch doesn't require route mutation in history mode.
            }}
          >
            {lang.toUpperCase()}
          </button>
          <button className="icon-btn" onClick={() => setSheetOpen(false)} aria-label={t("close")}>
            ✕
          </button>
        </div>
        <div className="sheet-grid container">
          <div className="sheet-col">
            <h3>{t("aboutVH")}</h3>
            <a href="/about">{t("aboutVH")}</a>
            <a href="/section">{t("structure")}</a>
            <a href="/committee">{t("committees")}</a>
            <a href="/convocations">{t("convocations") || "Созывы"}</a>
            <a href={"/section?title=" + encodeURIComponent("Комиссии")}>{t("commissions")}</a>
            <a href={"/section?title=" + encodeURIComponent("Депутатские фракции")}>
              {t("factions")}
            </a>
            <a
              href={"/section?title=" + encodeURIComponent("Представительство в Совете Федерации")}
            >
              {t("senateRep")}
            </a>
            <a href="/apparatus">{t("apparatus")}</a>
            <a href="/contacts">{t("contacts")}</a>
          </div>
          <div className="sheet-col">
            <h3>{t("deputies")}</h3>
            <a href="/deputies">{t("deputies")}</a>
            <a href="/deputies?status=all&convocation=%D0%92%D1%81%D0%B5">{t("deputiesAll")}</a>
            <a href="/deputies?status=ended&convocation=%D0%92%D1%81%D0%B5">Депутаты прекратившие полномочия</a>
          </div>
          <div className="sheet-col">
            <h3>{t("news")}</h3>
            <a href="/news/week">Главные события недели</a>
            <a href="/news">{t("hotNews")}</a>
            <a href="/news">{t("allNews")}</a>
            <a href="/news">{t("media")}</a>
            {newsCategories
              .filter(
                (c) =>
                  c !== "—" && c !== "Актуальные новости" && c !== "Все новости" && c !== "Медиа"
              )
              .map((c) => (
                <a key={c} href={`/news?category=${encodeURIComponent(c)}`}>
                  {lang === "ty"
                    ? {
                        Сессии: t("sessions"),
                        Законодательство: t("legislation"),
                        "Общественные мероприятия": t("publicEvents"),
                        Комитеты: t("committees"),
                        "Работа с гражданами": t("workWithCitizens"),
                      }[c] || c
                    : c}
                </a>
              ))}
          </div>
          <div className="sheet-col">
            <h3>{t("documents")}</h3>
            <a href="/docs/laws">{t("docsLaws")}</a>
            <a href={`/news?category=${encodeURIComponent("Законодательство")}`}>
              {t("legislation")} ({t("news")})
            </a>
            <a href="/docs/resolutions">{t("docsResolutions")}</a>
            <a href="/docs/initiatives">{t("docsInitiatives")}</a>
            <a href="/docs/civic">{t("docsCivic")}</a>
            <a href="/docs/constitution">{t("docsConstitution")}</a>
            <a href="/docs/bills">{t("docsBills")}</a>
          </div>
          <div className="sheet-col">
            <h3>{t("appeals")}</h3>
            <a href="/appeals">{t("feedback")}</a>
            <a href="/contacts">{t("contacts")}</a>
            <a href="/wifi">{t("wifiMap")}</a>
            <a href="/map">{t("map")}</a>
          </div>
          <div className="sheet-col">
            <h3>{t("Страницы") || "Страницы"}</h3>
            <a href="/pages">{t("Все страницы") || "Все страницы"}</a>
            {(Array.isArray(pagesTree) ? pagesTree : []).slice(0, 12).map((p) => (
              <a key={String(p?.id || p?.slug)} href={pageHref(p.slug)}>
                {pickMenuLabel(p, localeToken, { prefer: "menu" }) || p.slug}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div
        className={`drawer-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      ></div>
      <nav className={`mobile-drawer ${mobileOpen ? "open" : ""}`}>
        <div
          className="mobile-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, paddingLeft: 12 }}>
          <a
            href="/"
            className="logo"
            aria-label={t("goHome")}
            onClick={() => setMobileOpen(false)}
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg"
              alt=""
              width={40}
              height={40}
              style={{ display: "block" }}
            />
          </a>
            <div
              className="mobile-brand-text"
              style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, justifyContent: "center", minWidth: 0 }}
            >
              {tyBrandLines ? (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#003366" }}>{tyBrandLines[0]}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#003366" }}>{tyBrandLines[1]}</div>
                  <div style={{ fontSize: 9, color: "#6b7280" }}>{tyBrandLines[2]}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>{brandLine1}</div>
                  <div style={{ fontSize: 9, color: "#6b7280" }}>{brandLine2}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#003366" }}>{brandLine3}</div>
                </>
              )}
            </div>
          </div>
          <img 
            id="specialButton" 
            onClick={handleAccessibilityToggle}
            style={{ cursor: 'pointer', maxWidth: '40px', height: 'auto' }} 
            src="https://lidrekon.ru/images/special.png" 
            alt="ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ" 
            title="ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ" 
          />
          {/* auth quick actions removed */}
          <button
            className="icon-btn"
            aria-label="Сменить язык"
            onClick={() => {
              const newLang = lang === "ru" ? "ty" : "ru";
              setLang(newLang);
              // Language switch doesn't require route mutation in history mode.
            }}
          >
            {lang.toUpperCase()}
          </button>
          <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label={t("close")}>
            ✕
          </button>
        </div>
        {!mobileSection && (
          <>
            <div className="mobile-auth">
              {isAuthenticated ? (
                <div className="mobile-auth__panel">
                  <div className="mobile-auth__name">{user?.name || user?.email}</div>
                  <a
                    className="btn mobile-auth__btn mobile-auth__btn--primary"
                    href="/cabinet"
                    onClick={() => setMobileOpen(false)}
                    style={{ width: "80%" }}
                  >
                    {t("Личный кабинет") || "Личный кабинет"}
                  </a>
                  {String(user?.role || "").toLowerCase() === "admin" || user?.admin ? (
                    <a
                      className="btn mobile-auth__btn mobile-auth__btn--outline"
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      style={{ width: "80%" }}
                    >
                      {t("Панель управления") || "Панель управления"}
                    </a>
                  ) : null}
                  <button
                    className="btn mobile-auth__btn mobile-auth__btn--outline"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    style={{ width: "80%" }}
                  >
                    {t("Выйти") || "Выйти"}
                  </button>
                </div>
              ) : (
                <div className="mobile-auth__panel">
                  <a
                    className="btn mobile-auth__btn mobile-auth__btn--primary"
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    style={{ width: "80%" }}
                  >
                    {t("login")}
                  </a>
                  <a
                    className="btn mobile-auth__btn mobile-auth__btn--outline"
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    style={{ width: "80%" }}
                  >
                    {t("register")}
                  </a>
                </div>
              )}
            </div>
            <div className="mobile-menu-links">
              <Link to="/" onClick={() => setMobileOpen(false)} className="tile link">
                <span className="mobile-menu-link-content">
                  {t("home")}
                  <RightOutlined aria-hidden="true" />
                </span>
              </Link>
              <button className="tile link" onClick={() => setMobileSection("vh")}>
                <span className="mobile-menu-link-content">
                  {t("aboutVH")}
                  <RightOutlined aria-hidden="true" />
                </span>
              </button>
              <Link to="/deputies" onClick={() => setMobileOpen(false)} className="tile link">
                <span className="mobile-menu-link-content">
                  {t("deputies")}
                  <RightOutlined aria-hidden="true" />
                </span>
              </Link>
              <Link to="/appeals" onClick={() => setMobileOpen(false)} className="tile link">
                <span className="mobile-menu-link-content">
                  {t("appeals")}
                  <RightOutlined aria-hidden="true" />
                </span>
              </Link>
              <button className="tile link" onClick={() => setMobileSection("docs")}>
                <span className="mobile-menu-link-content">
                  {t("docs")}
                  <RightOutlined aria-hidden="true" />
                </span>
              </button>
              <button className="tile link" onClick={() => setMobileSection("news")}>
                <span className="mobile-menu-link-content">
                  {t("news")}
                  <RightOutlined aria-hidden="true" />
                </span>
              </button>
              <button className="tile link" onClick={() => setMobileSection("pages")}>
                <span className="mobile-menu-link-content">
                  {t("Страницы") || "Страницы"}
                  <RightOutlined aria-hidden="true" />
                </span>
              </button>
            </div>
          </>
        )}
        {mobileSection === "vh" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("aboutVH")}</div>
            <a className="tile link" href="/about" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("aboutVH")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/section" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("structure")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/committee" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("committees")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/convocations" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("convocations") || "Созывы"}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a
              className="tile link"
              href={"/section?title=" + encodeURIComponent("Комиссии")}
              onClick={() => setMobileOpen(false)}
            >
              <span className="mobile-menu-link-content">
                {t("commissions")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a
              className="tile link"
              href={"/section?title=" + encodeURIComponent("Депутатские фракции")}
              onClick={() => setMobileOpen(false)}
            >
              <span className="mobile-menu-link-content">
                {t("factions")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a
              className="tile link"
              href={"/section?title=" + encodeURIComponent("Представительство в Совете Федерации")}
              onClick={() => setMobileOpen(false)}
            >
              <span className="mobile-menu-link-content">
                {t("senateRep")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/apparatus" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("apparatus")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/contacts" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("contacts")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
          </>
        )}
        {mobileSection === "auth" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("authorities")}</div>
            <a className="tile link" href="/authorities" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("localSelfGovernment")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/authorities" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("legislativeAssembly")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/authorities" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("territorialDepartments")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/authorities" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("headsOfBodies")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
          </>
        )}
        {mobileSection === "activity" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("activity")}</div>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("strategy")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("plansAndForecasts")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("resultsAndReports")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("announcements")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
          </>
        )}
        {mobileSection === "news" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("news")}</div>
            <a className="tile link" href="/news/week" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                Главные события недели
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/news" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("hotNews")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/news" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("allNews")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/news" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("media")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            {newsCategories
              .filter(
                (c) =>
                  c !== "—" && c !== "Актуальные новости" && c !== "Все новости" && c !== "Медиа"
              )
              .map((c) => (
                <a
                  key={c}
                  className="tile link"
                  href={`/news?category=${encodeURIComponent(c)}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="mobile-menu-link-content">
                    {lang === "ty"
                      ? {
                          Сессии: t("sessions"),
                          Законодательство: t("legislation"),
                          "Общественные мероприятия": t("publicEvents"),
                          Комитеты: t("committees"),
                          "Работа с гражданами": t("workWithCitizens"),
                        }[c] || c
                      : c}
                    <RightOutlined aria-hidden="true" />
                  </span>
                </a>
              ))}
          </>
        )}
        {mobileSection === "gov" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("government")}</div>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("head") || "Глава"}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/deputies" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("deputies")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("governmentComposition")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("executiveBodies")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a
              className="tile link"
              href="/government?type=org"
              onClick={() => setMobileOpen(false)}
            >
              <span className="mobile-menu-link-content">
                {t("structure")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("press")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
          </>
        )}
        {mobileSection === "docs" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("documents")}</div>
            <a className="tile link" href="/docs/laws" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("docsLaws")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a
              className="tile link"
              href={`/news?category=${encodeURIComponent("Законодательство")}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="mobile-menu-link-content">
                {t("legislation")} ({t("news")})
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/docs/resolutions" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("docsResolutions")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/docs/initiatives" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("docsInitiatives")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/docs/civic" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("docsCivic")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/docs/constitution" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("docsConstitution")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            <a className="tile link" href="/docs/bills" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("docsBills")}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
          </>
        )}
        {mobileSection === "pages" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("Страницы") || "Страницы"}</div>
            <a className="tile link" href="/pages" onClick={() => setMobileOpen(false)}>
              <span className="mobile-menu-link-content">
                {t("Все страницы") || "Все страницы"}
                <RightOutlined aria-hidden="true" />
              </span>
            </a>
            {(Array.isArray(pagesTree) ? pagesTree : []).map((p) => (
              <React.Fragment key={String(p?.id || p?.slug)}>
                <a className="tile link" href={pageHref(p.slug)} onClick={() => setMobileOpen(false)}>
                  <span className="mobile-menu-link-content">
                    {pickMenuLabel(p, localeToken, { prefer: "menu" }) || p.slug}
                    <RightOutlined aria-hidden="true" />
                  </span>
                </a>
                {(Array.isArray(p?.children) ? p.children : []).map((c) => (
                  <a
                    key={String(c?.id || c?.slug)}
                    className="tile link"
                    href={pageHref(c.slug)}
                    onClick={() => setMobileOpen(false)}
                    style={{ paddingLeft: 14 }}
                  >
                    <span className="mobile-menu-link-content">
                      {pickMenuLabel(c, localeToken, { prefer: "submenu" }) || c.slug}
                      <RightOutlined aria-hidden="true" />
                    </span>
                  </a>
                ))}
              </React.Fragment>
            ))}
          </>
        )}
      </nav>
    </>
  );
}
