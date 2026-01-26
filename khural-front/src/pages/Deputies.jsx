import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { Select } from "antd";
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

  const convocationOptions = React.useMemo(() => {
    const av = Array.from(new Set(convocations))
      .map((c) => String(c || "").trim())
      .filter(Boolean);
    const ordered = CONVOCATION_ORDER.filter((x) => av.includes(x));
    const rest = av.filter((c) => !ordered.includes(c));
    return [...ordered, ...rest].map((c) => ({
      value: c,
      label: c === "Все" ? "Все созывы" : `${c} созыв`,
    }));
  }, [convocations]);
  
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
                <Select
                  value={convocation}
                  onChange={setConvocation}
                  popupMatchSelectWidth={false}
                  options={convocationOptions}
                />
                <Select
                  value={committeeId}
                  onChange={setCommitteeId}
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
                  onChange={setFaction}
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
                  onChange={setDistrict}
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
                empty={filtered.length === 0}
                emptyDescription="По выбранным фильтрам ничего не найдено"
              >
                <div className="grid cols-3">
                  {filtered.map((d) => {
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
                        {d.position ? (
                          <div className="gov-card__role">{d.position}</div>
                        ) : (
                          <div className="gov-card__role">Депутат</div>
                        )}
                        {/* Краткая биография - первые несколько слов */}
                        {(() => {
                          // Проверяем все возможные источники биографии
                          const bioText = String(
                            d.biography || 
                            d.bio || 
                            d.description || 
                            ""
                          ).trim();
                          if (!bioText) return null;
                          // Убираем HTML теги и декодируем HTML entities
                          let bioPlain = bioText
                            .replace(/<[^>]*>/g, "")
                            .replace(/&nbsp;/g, " ")
                            .replace(/&lt;/g, "<")
                            .replace(/&gt;/g, ">")
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&amp;/g, "&")
                            .replace(/&[a-z]+;/gi, " ")
                            .trim();
                          if (!bioPlain || bioPlain.length < 10) return null;
                          // Берем первые 60 символов или до конца первого предложения
                          let shortBio = bioPlain.length > 60 ? bioPlain.substring(0, 60) : bioPlain;
                          // Пытаемся обрезать по точке, если она есть в первых 60 символах
                          const lastDot = shortBio.lastIndexOf(".");
                          if (lastDot > 20) {
                            shortBio = shortBio.substring(0, lastDot + 1);
                          } else {
                            // Иначе обрезаем по пробелу, чтобы не резать слова
                            const lastSpace = shortBio.lastIndexOf(" ");
                            if (lastSpace > 30) {
                              shortBio = shortBio.substring(0, lastSpace);
                            }
                            if (bioPlain.length > shortBio.length) {
                              shortBio += "...";
                            }
                          }
                          return (
                            <div className="gov-card__bio" style={{ fontSize: "0.9em", color: "#666", marginTop: "8px", marginBottom: "8px", lineHeight: "1.4" }}>
                              {shortBio}
                            </div>
                          );
                        })()}
                        <ul className="gov-meta">
                          {address && (
                            <li>
                              <span>📍</span>
                              <span>{address}{office ? `, ${office}` : ""}</span>
                            </li>
                          )}
                          {workTime && (
                            <li>
                              <span>⏰</span>
                              <span>Время работы: {workTime}</span>
                            </li>
                          )}
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
              </DataState>
            </DataState>
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
