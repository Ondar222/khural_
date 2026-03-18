import React from "react";
import SideNav from "../components/SideNav.jsx";
import { useData } from "../context/DataContext.jsx";
import Nagradnaya from "./commissions/Nagradnaya.jsx";
import KontrolDostovernost from "./commissions/KontrolDostovernost.jsx";
import Schetnaya from "./commissions/Schetnaya.jsx";
import ReglamentEtika from "./commissions/ReglamentEtika.jsx";
import Reabilitatsiya from "./commissions/Reabilitatsiya.jsx";
import SvoPodderzhka from "./commissions/SvoPodderzhka.jsx";
import SmiObshestvo from "./commissions/SmiObshestvo.jsx";
import MezhregionalnyeSvyazi from "./commissions/MezhregionalnyeSvyazi.jsx";

// Маппинг id -> компонент (для комиссий без контента из админки)
const COMMISSION_COMPONENTS = {
  nagradnaya: Nagradnaya,
  "kontrol-dostovernost": KontrolDostovernost,
  schetnaya: Schetnaya,
  "reglament-etika": ReglamentEtika,
  reabilitatsiya: Reabilitatsiya,
  "svo-podderzhka": SvoPodderzhka,
  "smi-obshestvo": SmiObshestvo,
  "mezhregionalnye-svyazi": MezhregionalnyeSvyazi,
};

/** Шаблон страницы комиссии из данных админки (постановление + HTML-контент). */
function CommissionContentFromData({ commission }) {
  const {
    name,
    parentBody,
    documentType,
    resolutionDate,
    resolutionNumber,
    resolutionSubject,
    bodyHtml,
  } = commission || {};

  const hasResolution =
    documentType || resolutionDate || resolutionNumber || resolutionSubject;
  const hasBody = bodyHtml && String(bodyHtml).trim().length > 0;

  return (
    <div>
      {parentBody && (
        <h4 style={{ textAlign: "center" }}>{parentBody}</h4>
      )}
      {hasResolution && (
        <>
          {documentType && (
            <h5>
              {documentType}
              {(resolutionDate || resolutionNumber) && (
                <>
                  <br />
                  {[resolutionDate, resolutionNumber].filter(Boolean).join(" ")}
                </>
              )}
            </h5>
          )}
          {resolutionSubject && (
            <h4 dangerouslySetInnerHTML={{ __html: resolutionSubject }} />
          )}
        </>
      )}
      {hasBody && (
        <div
          className="commission-body"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}
      {!hasResolution && !hasBody && (
        <p>Содержимое страницы можно добавить в админ-панели (раздел «Комисии» → Редактировать).</p>
      )}
    </div>
  );
}

export default function Commission() {
  const { commissions } = useData();
  const [id, setId] = React.useState(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search || "");
    setId(sp.get("id") || null);
  }, []);

  React.useEffect(() => {
    const onNav = () => {
      const sp = new URLSearchParams(window.location.search || "");
      setId(sp.get("id") || null);
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);

  const commissionFromData = React.useMemo(
    () =>
      id && Array.isArray(commissions)
        ? commissions.find((c) => String(c?.id) === id)
        : null,
    [id, commissions]
  );

  const LegacyComponent = id ? COMMISSION_COMPONENTS[id] : null;
  const useDataContent =
    commissionFromData &&
    (commissionFromData.bodyHtml ||
      commissionFromData.resolutionSubject ||
      commissionFromData.documentType);

  if (!id) {
    return (
      <section className="section">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1>Комиссия</h1>
              <p>Укажите комиссию в адресе: /commission?id=...</p>
            </div>
            <SideNav />
          </div>
        </div>
      </section>
    );
  }

  if (!commissionFromData && !LegacyComponent) {
    return (
      <section className="section">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1>Комиссия</h1>
              <p>Комиссия не найдена.</p>
            </div>
            <SideNav />
          </div>
        </div>
      </section>
    );
  }

  const rawTitle = commissionFromData?.name || id;
  const title = typeof rawTitle === "string" && /<[^>]+>/.test(rawTitle)
    ? rawTitle.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() || rawTitle
    : rawTitle;

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h3>{title}</h3>
            {useDataContent ? (
              <CommissionContentFromData commission={commissionFromData} />
            ) : LegacyComponent ? (
              <LegacyComponent />
            ) : (
              <p>Здесь будет содержимое страницы «{title}». Добавьте его в админ-панели.</p>
            )}
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
