import React from "react";
import { Pagination } from "antd";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { Select } from "antd";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import {
  getFactionsFromBio,
  getDistrictsFromBio,
  normalizeFactionKey,
  normalizeDistrictKey,
  buildFactionOptions,
  buildDistrictOptions,
} from "../utils/deputyFilterOptions.js";
import { formatConvocationLabelWithYears, CANONICAL_CONVOCATIONS } from "../utils/convocationLabels.js";

const DEPUTIES_PAGE_SIZE = 12;

function deputyMatchesFaction(deputy, factionName) {
  if (!factionName || factionName === "Все") return true;
  const key = normalizeFactionKey(factionName);
  const dFaction = String(deputy?.faction || "").trim();
  if (dFaction && normalizeFactionKey(dFaction) === key) return true;
  const bio = deputy?.biography || deputy?.bio || deputy?.description || "";
  return getFactionsFromBio(bio).some((f) => normalizeFactionKey(f) === key);
}

function deputyMatchesDistrict(deputy, districtName) {
  if (!districtName || districtName === "Все") return true;
  const key = normalizeDistrictKey(districtName);
  const dDistrict = String(deputy?.district || deputy?.electoralDistrict || "").trim();
  if (dDistrict && normalizeDistrictKey(dDistrict) === key) return true;
  const bio = deputy?.biography || deputy?.bio || deputy?.description || "";
  return getDistrictsFromBio(bio).some((d) => normalizeDistrictKey(d) === key);
}

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  // Track window resize for responsive pagination
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  // Если выбранный созыв не встречается среди депутатов (данные ещё не загружены или нет таких) — сброс в «Все»
  React.useEffect(() => {
    if (convocation === "Все") return;
    if (!Array.isArray(deputies) || deputies.length === 0) return;
    const hasAny = deputies.some((d) => d?.convocation === convocation);
    if (!hasAny) {
      setConvocation("Все");
      updateFiltersUrl({ convocation: "Все" });
    }
  }, [convocation, deputies, updateFiltersUrl]);

  const districts = React.useMemo(() => {
    const toStr = (item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") return String(item.name || item.title || item.label || item).trim();
      return String(item || "").trim();
    };
    const existing = (Array.isArray(structureDistricts) ? structureDistricts : []).map(toStr).filter(Boolean);
    const merged = buildDistrictOptions(existing, deputies);
    return ["Все", ...merged];
  }, [structureDistricts, deputies]);
  
  // Опции созывов — только канонические (I, II, III, IV); «11», «2014 год», «2020» не показываем
  const convocationOptions = React.useMemo(() => {
    const ordered = CONVOCATION_ORDER.filter((x) => x !== "Все" && CANONICAL_CONVOCATIONS.includes(x));
    return [
      { value: "Все", label: formatConvocationLabelWithYears("Все") },
      ...ordered.map((c) => ({ value: c, label: formatConvocationLabelWithYears(c) })),
    ];
  }, []);
  
  const factions = React.useMemo(() => {
    const toStr = (item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") return String(item.name || item.title || item.label || item).trim();
      return String(item || "").trim();
    };
    const existing = (Array.isArray(structureFactions) ? structureFactions : []).map(toStr).filter(Boolean);
    const merged = buildFactionOptions(existing, deputies);
    return ["Все", ...merged];
  }, [structureFactions, deputies]);
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
      if (faction !== "Все" && !deputyMatchesFaction(d, faction)) return false;
      if (district !== "Все" && !deputyMatchesDistrict(d, district)) return false;
      if (committeeMatcher) {
        if (committeeMatcher.ids.has(d.id)) return true;
        if (committeeMatcher.names.has(d.name)) return true;
        return false;
      }
      return true;
    });
  }, [deputies, convocation, faction, district, committeeMatcher]);

  // Paginated deputies
  const paginatedDeputies = React.useMemo(() => {
    const start = (currentPage - 1) * DEPUTIES_PAGE_SIZE;
    const end = start + DEPUTIES_PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [convocation, faction, district, committeeId]);

  // Handle page change with URL update
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const sp = new URLSearchParams(window.location.search || "");
    if (page > 1) {
      sp.set("page", String(page));
    } else {
      sp.delete("page");
    }
    const qs = sp.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(null, "", newUrl);
    // Scroll to top of deputies section
    const deputiesEl = document.querySelector(".deputies-page");
    if (deputiesEl) {
      deputiesEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Get initial page from URL
  React.useEffect(() => {
    const pageParam = new URLSearchParams(window.location.search || "").get("page");
    const p = parseInt(pageParam, 10);
    if (Number.isFinite(p) && p >= 1) {
      setCurrentPage(p);
    }
  }, []);

  // Обновить URL при смене фильтров, чтобы при popstate/navigate не перезаписывать выбор
  const updateFiltersUrl = React.useCallback((updates) => {
    const sp = new URLSearchParams(window.location.search || "");
    if (updates.convocation !== undefined) {
      if (updates.convocation === "Все" || !updates.convocation) sp.delete("convocation");
      else sp.set("convocation", updates.convocation);
    }
    if (updates.faction !== undefined) {
      if (updates.faction === "Все" || !updates.faction) sp.delete("faction");
      else sp.set("faction", updates.faction);
    }
    if (updates.district !== undefined) {
      if (updates.district === "Все" || !updates.district) sp.delete("district");
      else sp.set("district", updates.district);
    }
    if (updates.committeeId !== undefined) {
      if (updates.committeeId === "Все" || !updates.committeeId) sp.delete("committee");
      else sp.set("committee", updates.committeeId);
    }
    const qs = sp.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (window.location.href !== newUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  // Принять начальные фильтры из URL, синхронизировать при popstate/navigate
  React.useEffect(() => {
    const applyFromHash = () => {
      const sp = new URLSearchParams(window.location.search || "");
      const f = sp.get("faction");
      const d = sp.get("district");
      const cv = sp.get("convocation");
      const cm = sp.get("committee");
      if (f != null) setFaction(decodeURIComponent(f));
      if (d != null) setDistrict(decodeURIComponent(d));
      if (cv != null) setConvocation(decodeURIComponent(cv));
      if (cm != null) setCommitteeId(decodeURIComponent(cm));
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
    <section className="section deputies-page">
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
                <Select
                  value={convocation}
                  onChange={(value) => {
                    setConvocation(value);
                    updateFiltersUrl({ convocation: value });
                  }}
                  popupMatchSelectWidth={false}
                  options={convocationOptions}
                />
                <Select
                  value={committeeId}
                  onChange={(value) => {
                    setCommitteeId(value);
                    updateFiltersUrl({ committeeId: value });
                  }}
                  popupMatchSelectWidth={false}
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
                  onChange={(value) => {
                    setFaction(value);
                    updateFiltersUrl({ faction: value });
                  }}
                  popupMatchSelectWidth={false}
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
                  onChange={(value) => {
                    setDistrict(value);
                    updateFiltersUrl({ district: value });
                  }}
                  popupMatchSelectWidth={false}
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
                empty={paginatedDeputies.length === 0}
                emptyDescription="По выбранным фильтрам ничего не найдено"
              >
                <div className="grid cols-3">
                  {paginatedDeputies.map((d) => {
                    // Фото уже нормализовано в DataContext через normalizePhotoUrl
                    // Но на всякий случай проверяем и нормализуем еще раз, если нужно
                    let photo = d.photo || "";
                    // Если фото пустое или не полный URL, пробуем нормализовать
                    if (photo && String(photo).trim() !== "" && !photo.startsWith("http")) {
                      photo = normalizeFilesUrl(photo);
                    }
                    // Если фото все еще пустое, пробуем альтернативные источники
                    if (!photo || String(photo).trim() === "") {
                      const altSources = [
                        d.image?.link,
                        d.image?.url,
                        d.photoUrl,
                        d.photo_url,
                      ].filter(Boolean);
                      if (altSources.length > 0) {
                        photo = normalizeFilesUrl(altSources[0]);
                      }
                    }
                    const receptionText =
                      typeof d.reception === "string"
                        ? d.reception
                        : d.reception && typeof d.reception === "object" && typeof d.reception.notes === "string"
                          ? d.reception.notes
                          : "";
                    // Убираем HTML теги
                    let receptionPlain = String(receptionText || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
                    // Если текст слишком длинный (более 150 символов) или содержит ключевые слова биографии, не показываем его в карточке
                    // Биография должна показываться только на странице "Подробнее"
                    const isBiography = receptionPlain.length > 150 || 
                      /родился|родилась|окончил|окончила|работал|работала|награды|награжден|избран|назначен/i.test(receptionPlain);
                    
                    // Извлекаем адрес, время работы и кабинет из reception (если это не биография)
                    // Сначала используем адрес из данных депутата, если он есть
                    let address = String(d.address || "").trim();
                    let workTime = "";
                    let office = "";
                    
                    // Если адреса нет в данных, пытаемся извлечь из reception
                    if (!address && !isBiography && receptionPlain) {
                      // Ищем адрес (г. Кызыл, ул. Ленина, д. 32)
                      const addressMatch = receptionPlain.match(/(г\.\s*[^,\n]+(?:,\s*ул\.\s*[^,\n]+(?:,\s*д\.\s*\d+)?)?)/i);
                      if (addressMatch) {
                        address = addressMatch[1].trim();
                      }
                    }
                    
                    // Извлекаем время работы и кабинет из reception
                    if (!isBiography && receptionPlain) {
                      // Ищем кабинет
                      const officeMatch = receptionPlain.match(/кабинет\s*(\d+)/i);
                      if (officeMatch) {
                        office = `кабинет ${officeMatch[1]}`;
                      }
                      // Ищем время работы (09:00-11:00 или "третий понедельник месяца, 09:00-11:00")
                      const timeMatch = receptionPlain.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/);
                      if (timeMatch) {
                        workTime = timeMatch[1];
                      } else {
                        // Ищем описание времени типа "третий понедельник месяца"
                        const dayMatch = receptionPlain.match(/((?:первый|второй|третий|четвертый|последний)\s+(?:понедельник|вторник|среда|четверг|пятница)\s+месяца)/i);
                        if (dayMatch) {
                          workTime = dayMatch[1];
                        }
                      }
                    }
                    
                    // Также проверяем schedule для времени работы, если оно есть
                    if (!workTime && Array.isArray(d.schedule) && d.schedule.length > 0) {
                      const scheduleText = d.schedule
                        .map((s) => {
                          const day = s?.day ? String(s.day) : "";
                          const time = s?.time ? String(s.time) : "";
                          return [day, time].filter(Boolean).join(": ");
                        })
                        .filter(Boolean)
                        .join(", ");
                      if (scheduleText) {
                        workTime = scheduleText;
                      }
                    }
                    
                    // Также проверяем receptionSchedule для времени работы
                    if (!workTime && d.receptionSchedule) {
                      const receptionScheduleText = typeof d.receptionSchedule === "string" 
                        ? d.receptionSchedule 
                        : (d.receptionSchedule?.notes || "");
                      const schedulePlain = String(receptionScheduleText || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
                      const timeMatch2 = schedulePlain.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/);
                      if (timeMatch2) {
                        workTime = timeMatch2[1];
                      }
                    }
                    
                    if (isBiography) {
                      receptionPlain = ""; // Не показываем биографию в карточке
                    }
                    
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
                          {photo && String(photo).trim() !== "" && String(photo).trim() !== "undefined" && String(photo).trim() !== "null" ? (
                            <img
                              className="gov-card__avatar"
                              src={photo}
                              alt={d.name || ""}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                // Если фото не загрузилось, заменяем на placeholder
                                const img = e.target;
                                const currentSrc = img.src || photo;
                                
                                // Если это URL с khural.rtyva.ru и мы еще не пробовали прокси
                                if (currentSrc.includes("khural.rtyva.ru") && !img.dataset.proxyTried) {
                                  img.dataset.proxyTried = "true";
                                  const proxyUrl = currentSrc.replace("https://khural.rtyva.ru", "/img-proxy");
                                  // Пробуем загрузить через прокси
                                  img.src = proxyUrl;
                                } else {
                                  // Если прокси не помог, заменяем картинку на плейсхолдер, а не скрываем
                                  img.style.display = "";
                                  img.removeAttribute("src");
                                  img.classList.remove("gov-card__avatar");
                                  img.classList.add("gov-card__avatar-placeholder");
                                }
                              }}
                            />
                          ) : (
                            <div className="gov-card__avatar" aria-hidden="true" />
                          )}
                        </div>
                      <div className="gov-card__body">
                        <div className="gov-card__name">{d.name}</div>
                        <div className="gov-card__role">Депутат</div>
                        <ul className="gov-meta">
                          {(d.contacts?.phone || d.phoneNumber || d.phone) && (
                            <li>
                              <span>📞</span>
                              <span>{String(d.contacts?.phone || d.phoneNumber || d.phone || "").trim()}</span>
                            </li>
                          )}
                          {(d.contacts?.email || d.email) && (
                            <li>
                              <span>✉️</span>
                              <span>{String(d.contacts?.email || d.email || "").trim()}</span>
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

                {/* Pagination */}
                {filtered.length > 0 && (
                  <div className="deputies-page__pagination" style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
                    <Pagination
                      current={currentPage}
                      total={filtered.length}
                      pageSize={DEPUTIES_PAGE_SIZE}
                      showSizeChanger={false}
                      showTotal={(total, range) => `${range[0]}–${range[1]} из ${total}`}
                      onChange={handlePageChange}
                      responsive={true}
                    />
                  </div>
                )}
              </DataState>
            </DataState>
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
