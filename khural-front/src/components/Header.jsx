import React from "react";
import { useA11y } from "../context/A11yContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import Link from "./Link.jsx";
import { useData } from "../context/DataContext.jsx";
// removed unused UI icon libs

export default function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState(null); // 'vh' | 'news' | 'docs'
  const [mobileSection, setMobileSection] = React.useState(null);

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

  const { cycleMode } = useA11y();
  const { lang, setLang, t } = useI18n();

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
  const newsCategories = React.useMemo(
    () => [
      "Актуальные новости",
      "Все новости",
      "Медиа",
      "—",
      ...Array.from(new Set(news.map((n) => n.category))),
    ],
    [news]
  );

  return (
    <>
      <header className="site-header">
        <div className="container topbar">
          <a href="/feedback">{t("feedback")}</a>
          <a href="/press">{t("press")}</a>
          <a href="/activity">{t("activity")}</a>

          <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            <a href="/login">{t("login")}</a>
            <a href="/register">{t("register")}</a>
          </span>
        </div>
        <div className="container row">
          <div className="row">
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
              <div className="brand-text">
                <a href="/" style={{ textDecoration: "none" }}>
                  <div style={{ fontSize: 16, lineHeight: 1, color: "#6b7280" }}>
                    {t("brandTop")} <br /> {t("brandParliament")}
                  </div>
                  <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800 }}>
                    {t("brandBottom")}
                  </div>
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
                <a href={`/news?category=${encodeURIComponent("Комитеты")}`}>
                  {t("committees")} ({t("news")})
                </a>
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
          </nav>

          <div className="header-actions">
            <button className="icon-btn" aria-label={t("accessibilityVersion")} onClick={cycleMode}>
              👁️
            </button>
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
          <button className="icon-btn" aria-label={t("accessibilityVersion")} onClick={cycleMode}>
            👁️
          </button>
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
        <div className="container" style={{ marginBottom: 24 }}>
          <div
            className="sheet-card social-card"
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 24,
              padding: "20px 24px",
            }}
          >
            <img
              className="social-avatar"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Vladislav_Khovalyg_portrait.jpg/250px-Vladislav_Khovalyg_portrait.jpg"
              alt=""
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                border: "3px solid rgba(255, 215, 0, 0.3)",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="social-card__title"
                style={{ marginBottom: 4, fontSize: "18px", lineHeight: 1.3 }}
              >
                {t("Социальные сети")}
              </div>
              <div className="social-card__subtitle" style={{ fontSize: "14px", opacity: 0.9 }}>
                {t("Подписывайтесь")}
              </div>
            </div>
            <div
              className="social-icons"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                flexShrink: 0,
              }}
            >
              <a
                className="sicon"
                href="https://vk.com"
                target="_blank"
                rel="noreferrer"
                aria-label="VK"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="24"
                  height="24"
                  viewBox="0 0 48 48"
                  style={{ width: "24px", height: "24px" }}
                >
                  <path fill="#1976d2" d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"></path>
                  <path
                    fill="#fff"
                    d="M35.937,18.041c0.046-0.151,0.068-0.291,0.062-0.416C35.984,17.263,35.735,17,35.149,17h-2.618 c-0.661,0-0.966,0.4-1.144,0.801c0,0-1.632,3.359-3.513,5.574c-0.61,0.641-0.92,0.625-1.25,0.625C26.447,24,26,23.786,26,23.199 v-5.185C26,17.32,25.827,17,25.268,17h-4.649C20.212,17,20,17.32,20,17.641c0,0.667,0.898,0.827,1,2.696v3.623 C21,24.84,20.847,25,20.517,25c-0.89,0-2.642-3-3.815-6.932C16.448,17.294,16.194,17,15.533,17h-2.643 C12.127,17,12,17.374,12,17.774c0,0.721,0.6,4.619,3.875,9.101C18.25,30.125,21.379,32,24.149,32c1.678,0,1.85-0.427,1.85-1.094 v-2.972C26,27.133,26.183,27,26.717,27c0.381,0,1.158,0.25,2.658,2c1.73,2.018,2.044,3,3.036,3h2.618 c0.608,0,0.957-0.255,0.971-0.75c0.003-0.126-0.015-0.267-0.056-0.424c-0.194-0.576-1.084-1.984-2.194-3.326 c-0.615-0.743-1.222-1.479-1.501-1.879C32.062,25.36,31.991,25.176,32,25c0.009-0.185,0.105-0.361,0.249-0.607 C32.223,24.393,35.607,19.642,35.937,18.041z"
                  ></path>
                </svg>
              </a>

              <a
                className="sicon"
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="24"
                  height="24"
                  viewBox="0 0 48 48"
                  style={{ width: "24px", height: "24px" }}
                >
                  <path fill="#29b6f6" d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"></path>
                  <path
                    fill="#fff"
                    d="M33.95,15l-3.746,19.126c0,0-0.161,0.874-1.245,0.874c-0.576,0-0.873-0.274-0.873-0.274l-8.114-6.733 l-3.97-2.001l-5.095-1.355c0,0-0.907-0.262-0.907-1.012c0-0.625,0.933-0.923,0.933-0.923l21.316-8.468 c-0.001-0.001,0.651-0.235,1.126-0.234C33.667,14,34,14.125,34,14.5C34,14.75,33.95,15,33.95,15z"
                  ></path>
                  <path
                    fill="#b0bec5"
                    d="M23,30.505l-3.426,3.374c0,0-0.149,0.115-0.348,0.12c-0.069,0.002-0.143-0.009-0.219-0.043 l0.964-5.965L23,30.505z"
                  ></path>
                  <path
                    fill="#cfd8dc"
                    d="M29.897,18.196c-0.169-0.22-0.481-0.26-0.701-0.093L16,26c0,0,2.106,5.892,2.427,6.912 c0.322,1.021,0.58,1.045,0.58,1.045l0.964-5.965l9.832-9.096C30.023,18.729,30.064,18.416,29.897,18.196z"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="sheet-grid container">
          <div className="sheet-col">
            <h3>{t("aboutVH")}</h3>
            <a href="/about">{t("aboutVH")}</a>
            <a href="/section">{t("structure")}</a>
            <a href="/committee">{t("committees")}</a>
            <a href={`/news?category=${encodeURIComponent("Комитеты")}`}>
              {t("committees")} ({t("news")})
            </a>
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
            <a href="/deputies">{t("deputiesAll")}</a>
          </div>
          <div className="sheet-col">
            <h3>{t("news")}</h3>
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
          <a
            href="/"
            className="logo"
            aria-label={t("goHome")}
            onClick={() => setMobileOpen(false)}
            style={{ textDecoration: "none" }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg"
              alt=""
              width={36}
              height={36}
            />
          </a>
          <button className="icon-btn" aria-label="Версия для слабовидящих" onClick={cycleMode}>
            👁️
          </button>
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
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <a
                className="btn"
                href="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#003366",
                  color: "#ffffff",

                  fontWeight: 700,
                  padding: "20px 20px",
                }}
              >
                {t("login")}
              </a>
              <a
                className="btn"
                href="/register"
                onClick={() => setMobileOpen(false)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#ffffff",
                  border: "1px solid #003366",

                  color: "#003366",
                  fontWeight: 700,
                  padding: "20px 20px",
                }}
              >
                {t("register")}
              </a>
            </div>
            <Link to="/" onClick={() => setMobileOpen(false)} className="tile link">
              {t("home")}
            </Link>
            <button className="tile link" onClick={() => setMobileSection("vh")}>
              {t("aboutVH")} →
            </button>
            <Link to="/deputies" onClick={() => setMobileOpen(false)} className="tile link">
              {t("deputies")}
            </Link>
            <Link to="/appeals" onClick={() => setMobileOpen(false)} className="tile link">
              {t("appeals")}
            </Link>
            <button className="tile link" onClick={() => setMobileSection("docs")}>
              {t("docs")} →
            </button>
            <button className="tile link" onClick={() => setMobileSection("news")}>
              {t("news")} →
            </button>
            <div className="sheet-card social-card" style={{ marginTop: 12 }}>
              <div className="social-card__header">
                <img
                  className="social-avatar"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Vladislav_Khovalyg_portrait.jpg/250px-Vladislav_Khovalyg_portrait.jpg"
                  alt=""
                />
                <div className="social-card__title">{t("socialNetworksHead")}</div>
              </div>
              <div className="social-icons">
                <a
                  className="sicon"
                  href="https://vk.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="VK"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 48 48"
                  >
                    <path fill="#1976d2" d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"></path>
                    <path
                      fill="#fff"
                      d="M35.937,18.041c0.046-0.151,0.068-0.291,0.062-0.416C35.984,17.263,35.735,17,35.149,17h-2.618 c-0.661,0-0.966,0.4-1.144,0.801c0,0-1.632,3.359-3.513,5.574c-0.61,0.641-0.92,0.625-1.25,0.625C26.447,24,26,23.786,26,23.199 v-5.185C26,17.32,25.827,17,25.268,17h-4.649C20.212,17,20,17.32,20,17.641c0,0.667,0.898,0.827,1,2.696v3.623 C21,24.84,20.847,25,20.517,25c-0.89,0-2.642-3-3.815-6.932C16.448,17.294,16.194,17,15.533,17h-2.643 C12.127,17,12,17.374,12,17.774c0,0.721,0.6,4.619,3.875,9.101C18.25,30.125,21.379,32,24.149,32c1.678,0,1.85-0.427,1.85-1.094 v-2.972C26,27.133,26.183,27,26.717,27c0.381,0,1.158,0.25,2.658,2c1.73,2.018,2.044,3,3.036,3h2.618 c0.608,0,0.957-0.255,0.971-0.75c0.003-0.126-0.015-0.267-0.056-0.424c-0.194-0.576-1.084-1.984-2.194-3.326 c-0.615-0.743-1.222-1.479-1.501-1.879C32.062,25.36,31.991,25.176,32,25c0.009-0.185,0.105-0.361,0.249-0.607 C32.223,24.393,35.607,19.642,35.937,18.041z"
                    ></path>
                  </svg>
                </a>

                <a
                  className="sicon"
                  href="https://t.me"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telegram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 48 48"
                  >
                    <path fill="#29b6f6" d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"></path>
                    <path
                      fill="#fff"
                      d="M33.95,15l-3.746,19.126c0,0-0.161,0.874-1.245,0.874c-0.576,0-0.873-0.274-0.873-0.274l-8.114-6.733 l-3.97-2.001l-5.095-1.355c0,0-0.907-0.262-0.907-1.012c0-0.625,0.933-0.923,0.933-0.923l21.316-8.468 c-0.001-0.001,0.651-0.235,1.126-0.234C33.667,14,34,14.125,34,14.5C34,14.75,33.95,15,33.95,15z"
                    ></path>
                    <path
                      fill="#b0bec5"
                      d="M23,30.505l-3.426,3.374c0,0-0.149,0.115-0.348,0.12c-0.069,0.002-0.143-0.009-0.219-0.043 l0.964-5.965L23,30.505z"
                    ></path>
                    <path
                      fill="#cfd8dc"
                      d="M29.897,18.196c-0.169-0.22-0.481-0.26-0.701-0.093L16,26c0,0,2.106,5.892,2.427,6.912 c0.322,1.021,0.58,1.045,0.58,1.045l0.964-5.965l9.832-9.096C30.023,18.729,30.064,18.416,29.897,18.196z"
                    ></path>
                  </svg>
                </a>
              </div>
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
              {t("aboutVH")}
            </a>
            <a className="tile link" href="/section" onClick={() => setMobileOpen(false)}>
              {t("structure")}
            </a>
            <a className="tile link" href="/committee" onClick={() => setMobileOpen(false)}>
              {t("committees")}
            </a>
            <a
              className="tile link"
              href={`/news?category=${encodeURIComponent("Комитеты")}`}
              onClick={() => setMobileOpen(false)}
            >
              {t("committees")} ({t("news")})
            </a>
            <a
              className="tile link"
              href={"/section?title=" + encodeURIComponent("Комиссии")}
              onClick={() => setMobileOpen(false)}
            >
              {t("commissions")}
            </a>
            <a
              className="tile link"
              href={"/section?title=" + encodeURIComponent("Депутатские фракции")}
              onClick={() => setMobileOpen(false)}
            >
              {t("factions")}
            </a>
            <a
              className="tile link"
              href={"/section?title=" + encodeURIComponent("Представительство в Совете Федерации")}
              onClick={() => setMobileOpen(false)}
            >
              {t("senateRep")}
            </a>
            <a className="tile link" href="/apparatus" onClick={() => setMobileOpen(false)}>
              {t("apparatus")}
            </a>
            <a className="tile link" href="/contacts" onClick={() => setMobileOpen(false)}>
              {t("contacts")}
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
              {t("localSelfGovernment")}
            </a>
            <a className="tile link" href="/authorities" onClick={() => setMobileOpen(false)}>
              {t("legislativeAssembly")}
            </a>
            <a className="tile link" href="/authorities" onClick={() => setMobileOpen(false)}>
              {t("territorialDepartments")}
            </a>
            <a className="tile link" href="/authorities" onClick={() => setMobileOpen(false)}>
              {t("headsOfBodies")}
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
              {t("strategy")}
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              {t("plansAndForecasts")}
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              {t("resultsAndReports")}
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              {t("announcements")}
            </a>
          </>
        )}
        {mobileSection === "news" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("news")}</div>
            <a className="tile link" href="/news" onClick={() => setMobileOpen(false)}>
              {t("hotNews")}
            </a>
            <a className="tile link" href="/news" onClick={() => setMobileOpen(false)}>
              {t("allNews")}
            </a>
            <a className="tile link" href="/news" onClick={() => setMobileOpen(false)}>
              {t("media")}
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
          </>
        )}
        {mobileSection === "gov" && (
          <>
            <button className="btn" onClick={() => setMobileSection(null)}>
              {t("back")}
            </button>
            <div style={{ color: "#6b7280", margin: "8px 0" }}>{t("government")}</div>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              {t("head") || "Глава"}
            </a>
            <a className="tile link" href="/deputies" onClick={() => setMobileOpen(false)}>
              {t("deputies")}
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              {t("governmentComposition")}
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              {t("executiveBodies")}
            </a>
            <a
              className="tile link"
              href="/government?type=org"
              onClick={() => setMobileOpen(false)}
            >
              {t("structure")}
            </a>
            <a className="tile link" href="/government" onClick={() => setMobileOpen(false)}>
              {t("press")}
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
              {t("docsLaws")}
            </a>
            <a
              className="tile link"
              href={`/news?category=${encodeURIComponent("Законодательство")}`}
              onClick={() => setMobileOpen(false)}
            >
              {t("legislation")} ({t("news")})
            </a>
            <a className="tile link" href="/docs/resolutions" onClick={() => setMobileOpen(false)}>
              {t("docsResolutions")}
            </a>
            <a className="tile link" href="/docs/initiatives" onClick={() => setMobileOpen(false)}>
              {t("docsInitiatives")}
            </a>
            <a className="tile link" href="/docs/civic" onClick={() => setMobileOpen(false)}>
              {t("docsCivic")}
            </a>
            <a className="tile link" href="/docs/constitution" onClick={() => setMobileOpen(false)}>
              {t("docsConstitution")}
            </a>
            <a className="tile link" href="/docs/bills" onClick={() => setMobileOpen(false)}>
              {t("docsBills")}
            </a>
          </>
        )}
      </nav>
    </>
  );
}
