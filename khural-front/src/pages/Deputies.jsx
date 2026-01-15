import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { Select, Button, Dropdown } from "antd";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

const CONVOCATION_ORDER = ["VIII", "VII", "VI", "V", "IV", "III", "II", "I", "Все"];

export default function Deputies() {
  const {
    deputies,
    committees,
    factions: structureFactions,
    districts: structureDistricts,
    convocations: structureConvocations,
    loading,
    errors,
    reload,
  } = useData();
  const { t } = useI18n();
  // Filters per structure
  const [convocation, setConvocation] = React.useState("Все");
  const [committeeId, setCommitteeId] = React.useState("Все");
  const [faction, setFaction] = React.useState("Все");
  const [district, setDistrict] = React.useState("Все");
  const [openConv, setOpenConv] = React.useState(false);

  // If URL/structure links set a convocation that doesn't exist in data yet,
  // don't show an empty page — fallback to "Все".
  React.useEffect(() => {
    if (convocation === "Все") return;
    if (!Array.isArray(deputies) || deputies.length === 0) return;
    const hasAny = deputies.some((d) => d?.convocation === convocation);
    if (!hasAny) setConvocation("Все");
  }, [convocation, deputies]);

  const districts = React.useMemo(() => {
    const items = Array.isArray(structureDistricts) ? structureDistricts : [];
    // Убеждаемся, что все значения - строки
    const stringItems = items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          // Если объект, пытаемся извлечь строковое значение
          return item.name || item.title || item.label || String(item);
        }
        return String(item || "");
      })
      .filter((item) => item && item.trim() !== "");
    return ["Все", ...stringItems];
  }, [structureDistricts]);
  
  const convocations = React.useMemo(() => {
    const items = Array.isArray(structureConvocations) ? structureConvocations : [];
    const stringItems = items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return item.name || item.title || item.label || String(item);
        }
        return String(item || "");
      })
      .filter((item) => item && item.trim() !== "");
    return ["Все", ...stringItems];
  }, [structureConvocations]);
  
  const factions = React.useMemo(() => {
    const items = Array.isArray(structureFactions) ? structureFactions : [];
    const stringItems = items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return item.name || item.title || item.label || String(item);
        }
        return String(item || "");
      })
      .filter((item) => item && item.trim() !== "");
    return ["Все", ...stringItems];
  }, [structureFactions]);
  const convMenuItems = React.useMemo(() => {
    const av = Array.from(new Set(convocations));
    const ordered = CONVOCATION_ORDER.filter((x) => av.includes(x));
    return ordered.map((c) => ({
      key: c,
      label: c === "Все" ? "Все созывы" : `${c} созыв`,
      onClick: () => {
        setConvocation(c);
        setOpenConv(false);
      },
    }));
  }, [convocations]);

  const committeeOptions = React.useMemo(() => {
    return ["Все", ...(committees || []).map((c) => c.id)];
  }, [committees]);

  const committeeMatcher = React.useMemo(() => {
    if (committeeId === "Все") return null;
    const c = (committees || []).find((x) => x.id === committeeId);
    if (!c) return null;
    const ids = new Set();
    const names = new Set();
    (c.members || []).forEach((m) => {
      if (!m) return;
      if (m.id) ids.add(m.id);
      if (m.name) names.add(m.name);
    });
    return { ids, names };
  }, [committeeId, committees]);

  const filtered = React.useMemo(() => {
    return deputies.filter((d) => {
      if (convocation !== "Все" && d.convocation !== convocation) return false;
      if (faction !== "Все" && d.faction !== faction) return false;
      if (district !== "Все" && d.district !== district) return false;
      if (committeeMatcher) {
        if (committeeMatcher.ids.has(d.id)) return true;
        if (committeeMatcher.names.has(d.name)) return true;
        return false;
      }
      return true;
    });
  }, [deputies, convocation, faction, district, committeeMatcher]);

  // Accept initial filters from URL, keep in sync on hash changes
  React.useEffect(() => {
    const applyFromHash = () => {
      const sp = new URLSearchParams(window.location.search || "");
      const f = sp.get("faction");
      const d = sp.get("district");
      const cv = sp.get("convocation");
      const cm = sp.get("committee");
      if (f) setFaction(decodeURIComponent(f));
      if (d) setDistrict(decodeURIComponent(d));
      if (cv) setConvocation(decodeURIComponent(cv));
      if (cm) setCommitteeId(decodeURIComponent(cm));
    };
    applyFromHash();
    window.addEventListener("popstate", applyFromHash);
    window.addEventListener("app:navigate", applyFromHash);
    return () => {
      window.removeEventListener("popstate", applyFromHash);
      window.removeEventListener("app:navigate", applyFromHash);
    };
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <h1>{t("deputies")}</h1>
            <DataState
              loading={Boolean(loading?.deputies) && (!deputies || deputies.length === 0)}
              error={errors?.deputies}
              onRetry={reload}
              empty={!loading?.deputies && (!deputies || deputies.length === 0)}
              emptyDescription="Список депутатов пуст"
            >
              {/* Single-row filters from Structure */}
              <div className="filters filters--deputies">
                <Dropdown
                  open={openConv}
                  onOpenChange={setOpenConv}
                  menu={{ items: convMenuItems }}
                >
                  <Button size="large">
                    <span className="filters__btnText">
                      {convocation === "Все" ? "Все созывы" : `${convocation} созыв`}
                    </span>
                    <span className="filters__btnCaret" aria-hidden="true">
                      ▾
                    </span>
                  </Button>
                </Dropdown>
                <Select
                  value={committeeId}
                  onChange={setCommitteeId}
                  dropdownMatchSelectWidth={false}
                  options={committeeOptions.map((id) =>
                    id === "Все"
                      ? { value: "Все", label: "По комитетам: Все" }
                      : {
                          value: id,
                          label:
                            `По комитетам: ` +
                            ((committees || []).find((c) => c.id === id)?.title || id),
                        }
                  )}
                />
                <Select
                  value={faction}
                  onChange={setFaction}
                  dropdownMatchSelectWidth={false}
                  options={factions.map((x) => {
                    const strValue = typeof x === "string" ? x : String(x || "");
                    return {
                      value: strValue,
                      label: strValue === "Все" ? "По фракциям: Все" : `По фракциям: ${strValue}`,
                    };
                  })}
                  placeholder="Фракция"
                />
                <Select
                  value={district}
                  onChange={setDistrict}
                  dropdownMatchSelectWidth={false}
                  options={districts.map((x) => {
                    const strValue = typeof x === "string" ? x : String(x || "");
                    return {
                      value: strValue,
                      label: strValue === "Все" ? "По округам: Все" : `По округам: ${strValue}`,
                    };
                  })}
                  placeholder="Округ"
                />
              </div>

              <DataState
                loading={false}
                error={null}
                empty={filtered.length === 0}
                emptyDescription="По выбранным фильтрам ничего не найдено"
              >
                <div className="grid cols-3">
                  {filtered.map((d) => {
                    const photo = normalizeFilesUrl(d.photo || (d.image && d.image.link) || "");
                    const receptionText =
                      typeof d.reception === "string"
                        ? d.reception
                        : d.reception && typeof d.reception === "object" && typeof d.reception.notes === "string"
                          ? d.reception.notes
                          : "";
                    const receptionPlain = String(receptionText || "").replace(/<[^>]*>/g, "").trim();
                    
                    // Получаем комитеты депутата
                    const committeeIds = Array.isArray(d.committeeIds) 
                      ? d.committeeIds 
                      : (Array.isArray(d.committees) 
                        ? d.committees.map((c) => (typeof c === "string" ? c : c?.id || c?.name || ""))
                        : []);
                    const deputyCommittees = (() => {
                      if (!committeeIds.length || !committees || !Array.isArray(committees)) return [];
                      return committees
                        .filter((c) => {
                          const cId = String(c?.id || "");
                          const cName = String(c?.name || c?.title || "");
                          return committeeIds.some((id) => 
                            String(id || "") === cId || 
                            String(id || "").toLowerCase() === cName.toLowerCase()
                          );
                        })
                        .map((c) => c?.name || c?.title || c?.id || "");
                    })();
                    
                    return (
                      <div key={d.id} className="gov-card">
                        <div className="gov-card__top">
                          {photo ? (
                            <img
                              className="gov-card__avatar"
                              src={photo}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="gov-card__avatar" aria-hidden="true" />
                          )}
                        </div>
                      <div className="gov-card__body">
                        <div className="gov-card__name">{d.name}</div>
                        {d.position ? (
                          <div className="gov-card__role">{d.position}</div>
                        ) : (
                          <div className="gov-card__role">Депутат</div>
                        )}
                        <ul className="gov-meta">
                          {receptionPlain && (
                            <li>
                              <span>⏰</span>
                              <span>Приём: {receptionPlain}</span>
                            </li>
                          )}
                          {deputyCommittees.length > 0 && (
                            <li>
                              <span>📋</span>
                              <span>Комитеты: {deputyCommittees.join(", ")}</span>
                            </li>
                          )}
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
                          {(() => {
                            // Обрабатываем созывы - могут быть массивом или строкой
                            const convocations = Array.isArray(d.convocations) 
                              ? d.convocations.map((c) => (typeof c === "string" ? c : c?.name || c?.title || String(c || "")))
                              : (d.convocation ? [String(d.convocation)] : []);
                            return convocations.length > 0 ? (
                              <li>
                                <span>🎖️</span>
                                <span>Созывы: {convocations.join(", ")}</span>
                              </li>
                            ) : null;
                          })()}
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
                        <a className="gov-card__btn" href={`/government?type=dep&id=${d.id}`}>
                          Подробнее
                        </a>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </DataState>
            </DataState>
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
