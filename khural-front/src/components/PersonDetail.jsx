import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { decodeHtmlEntities } from "../utils/html.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { formatConvocationLabelWithYears } from "../utils/convocationLabels.js";

function stripTags(v) {
  return String(v ?? "").replace(/<[^>]*>/g, "").trim();
}

export default function PersonDetail({ item, type, backHref, committees = [] }) {
  const { t } = useI18n();
  const isDeputy = type === "dep";
  const title = item.name || item.title;
  const bioHtmlRaw = item.biography || item.bio || item.description || item.position || item.role || "";
  // Backend may store biography HTML-escaped (e.g. "&lt;p&gt;..."), so decode first.
  const bioHtml = decodeHtmlEntities(bioHtmlRaw);
  const bioPlain = stripTags(bioHtml);
  const phone = isDeputy ? item.contacts?.phone : item.phone;
  const email = isDeputy ? item.contacts?.email : item.email;
  const avatarSrc = normalizeFilesUrl(item.photo);
  const address = item.address || "г. Кызыл, ул. Ленина, 40";
  // Используем legislativeActivity из API, если есть, иначе laws из локальных данных
  const laws = Array.isArray(item.legislativeActivity) && item.legislativeActivity.length 
    ? item.legislativeActivity 
    : (Array.isArray(item.laws) && item.laws.length ? item.laws : null);
  // Используем incomeDeclarations из API, если есть, иначе incomeDocs из локальных данных
  const incomeDocs = Array.isArray(item.incomeDeclarations) && item.incomeDeclarations.length
    ? item.incomeDeclarations
    : (Array.isArray(item.incomeDocs) && item.incomeDocs.length ? item.incomeDocs : []);
  // Используем receptionSchedule из API, если есть, иначе schedule из локальных данных
  const receptionScheduleObj =
    item.receptionSchedule && typeof item.receptionSchedule === "object" && !Array.isArray(item.receptionSchedule)
      ? item.receptionSchedule
      : null;
  
  // Обрабатываем новый формат с workingDays
  const workingDays = receptionScheduleObj?.workingDays;
  const scheduleFromWorkingDays = Array.isArray(workingDays)
    ? workingDays
        .filter((day) => day?.isWorking === true)
        .map((day) => {
          const dayNames = {
            monday: "Понедельник",
            tuesday: "Вторник",
            wednesday: "Среда",
            thursday: "Четверг",
            friday: "Пятница",
            saturday: "Суббота",
            sunday: "Воскресенье",
          };
          const dayName = dayNames[day.dayOfWeek] || day.dayOfWeek;
          const time = day.startTime && day.endTime ? `${day.startTime}-${day.endTime}` : "";
          return [dayName, time];
        })
    : null;

  // Извлекаем график приема из reception/receptionSchedule, но исключаем биографию
  const receptionRaw =
    (receptionScheduleObj && typeof receptionScheduleObj.notes === "string" && receptionScheduleObj.notes) ||
    (typeof item.receptionSchedule === "string" ? item.receptionSchedule : "") ||
    (typeof item.reception === "string" ? item.reception : "");
  const receptionPlain = stripTags(receptionRaw).replace(/&nbsp;/g, " ");
  // Проверяем, что это не биография (не показываем биографию в графике приема)
  const isReceptionBiography = receptionPlain.length > 200 || 
    /родился|родилась|окончил|окончила|работал|работала|награды|награжден|избран|назначен|окончил|окончила|работал|работала/i.test(receptionPlain);
  
  const scheduleHtmlRaw = !isReceptionBiography ? receptionRaw : "";
  const scheduleHtml = decodeHtmlEntities(scheduleHtmlRaw);
  const schedulePlain = stripTags(scheduleHtml);
  const schedule = scheduleFromWorkingDays ||
    (!isReceptionBiography && typeof item.receptionSchedule === "string"
      ? item.receptionSchedule.split("\n").map((line) => {
          const parts = line.split(/[:-]/);
          if (parts.length >= 2) {
            return [parts[0].trim(), parts.slice(1).join(":").trim()];
          }
          return [line.trim(), ""];
        })
      : Array.isArray(item.receptionSchedule)
        ? item.receptionSchedule
        : Array.isArray(item.schedule) && item.schedule.length
          ? item.schedule
          : []);

  const [active, setActive] = React.useState("bio");
  const phoneIconStyle = { transform: "scaleX(-1)" };

  // Smooth-scroll to section without breaking hash-based routing
  const scrollToSection = React.useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  }, []);

  // Observe sections to highlight the current pill while scrolling
  React.useEffect(() => {
    const ids = ["bio", "contacts", "laws", "income", "schedule"];
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id;
          setActive(id);
        }
      },
      {
        root: null,
        // Trigger when section top crosses ~90px from top (header height)
        rootMargin: "-90px 0px -60% 0px",
        threshold: 0.01,
      }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section person-detail">
      <div className="container">
        {backHref && (
          <a
            className="btn btn-back"
            href={backHref}
            style={{ marginBottom: 24, display: "inline-block" }}
          >
            {t("backToDeputiesList")}
          </a>
        )}

        <div className="card person-hero">
          {avatarSrc ? (
            <img 
              className="person-portrait" 
              src={avatarSrc} 
              alt={title} 
              loading="lazy"
              onError={(e) => {
                const img = e.target;
                const currentSrc = img.src;
                
                if (currentSrc.includes("khural.rtyva.ru") && !img.dataset.proxyTried) {
                  img.dataset.proxyTried = "true";
                  img.src = currentSrc.replace("https://khural.rtyva.ru", "/img-proxy");
                } else {
                  img.style.display = "";
                  img.removeAttribute("src");
                  img.classList.remove("person-portrait");
                  img.classList.add("person-portrait-placeholder");
                }
              }}
            />
          ) : (
            <div className="person-portrait" aria-hidden="true" />
          )}
          <div className="person-hero__body">
            <h1 className="person-name">{title}</h1>
            <div className="person-meta">
              {isDeputy ? (
                <>
                  {stripTags(item.position || item.role) &&
                  stripTags(item.position || item.role) !== bioPlain ? (
                    <div>{stripTags(item.position || item.role)}</div>
                  ) : null}
                  {(() => {
                    // Обрабатываем множественные созывы (с годами по справочнику)
                    const convocations = Array.isArray(item.convocations) && item.convocations.length
                      ? item.convocations.map((c) => (typeof c === "string" ? c : c?.name || c?.title || String(c || "")))
                      : ((item.convocationNumber || item.convocation) ? [String(item.convocationNumber || item.convocation)] : []);
                    const labels = convocations.map((c) => formatConvocationLabelWithYears(c.trim()));
                    return labels.length > 0 ? (
                      <div>Созывы: {labels.join(", ")}</div>
                    ) : null;
                  })()}
                  {item.district && (
                    <div>Избирательный округ: {stripTags(item.district)}</div>
                  )}
                  {item.faction && (
                    <div>Фракция: «{stripTags(item.faction)}»</div>
                  )}
                  {(() => {
                    // Получаем комитеты депутата
                    const committeeIds = (() => {
                      if (Array.isArray(item.committeeIds)) {
                        return item.committeeIds.map(String).filter(Boolean);
                      }
                      if (Array.isArray(item.committees)) {
                        return item.committees
                          .map((c) => {
                            if (typeof c === "string") return c;
                            if (c && typeof c === "object") return c?.id || c?.name || "";
                            return "";
                          })
                          .map(String)
                          .filter(Boolean);
                      }
                      return [];
                    })();
                    if (!committeeIds.length || !committees || !Array.isArray(committees)) return null;
                    const deputyCommittees = committees
                      .filter((c) => {
                        const cId = String(c?.id || "");
                        const cName = String(c?.name || c?.title || "").toLowerCase();
                        return committeeIds.some((id) => {
                          const idStr = String(id || "").toLowerCase();
                          return idStr === cId.toLowerCase() || idStr === cName;
                        });
                      })
                      .map((c) => c?.name || c?.title || c?.id || "")
                      .filter(Boolean);
                    return deputyCommittees.length > 0 ? (
                      <div>Комитеты: {deputyCommittees.join(", ")}</div>
                    ) : null;
                  })()}
                </>
              ) : (
                <>
                  {stripTags(item.role) && stripTags(item.role) !== bioPlain ? (
                    <div>{stripTags(item.role)}</div>
                  ) : null}
                  {item.agency && <div>{stripTags(item.agency)}</div>}
                </>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <a className="btn btn--primary" href={email ? `mailto:${email}` : "#"}>
                Обратиться к депутату
              </a>
            </div>
          </div>
        </div>

        <div className="person-tabs">
          <a
            className={`pill ${active === "bio" ? "pill--solid" : ""}`}
            href="#"
            role="button"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("bio");
            }}
          >
            Биография
          </a>
          <a
            className={`pill ${active === "contacts" ? "pill--solid" : ""}`}
            href="#"
            role="button"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contacts");
            }}
          >
            Контакты
          </a>
          <a
            className={`pill ${active === "laws" ? "pill--solid" : ""}`}
            href="#"
            role="button"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("laws");
            }}
          >
            Законодательная деятельность
          </a>
          <a
            className={`pill ${active === "income" ? "pill--solid" : ""}`}
            href="#"
            role="button"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("income");
            }}
          >
            Сведения о доходах
          </a>
          <a
            className={`pill ${active === "schedule" ? "pill--solid" : ""}`}
            href="#"
            role="button"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("schedule");
            }}
          >
            График приема граждан
          </a>
        </div>

        <div id="bio" className="person-block">
          <h2>Биография</h2>
          <div className="prose">
            {bioPlain ? (
              <div dangerouslySetInnerHTML={{ __html: String(bioHtml) }} />
            ) : (
              <p>Биография не указана</p>
            )}
          </div>
        </div>

        <div id="contacts" className="person-block">
          <h2>Контакты</h2>
          <div className="tile contact-card">
            <div className="contact-row">
              <PhoneOutlined className="contact-ico" style={phoneIconStyle} aria-hidden="true" />
              <div className="contact-text">
                <div className="contact-title">Телефон</div>
                <a className="link" href={phone ? `tel:${phone}` : "#"}>
                  {phone || "—"}
                </a>
              </div>
            </div>
            <div className="contact-row">
              <MailOutlined className="contact-ico" aria-hidden="true" />
              <div className="contact-text">
                <div className="contact-title">Email</div>
                <a className="link" href={email ? `mailto:${email}` : "#"}>
                  {email || "—"}
                </a>
              </div>
            </div>
            <div className="contact-row">
              <EnvironmentOutlined className="contact-ico" aria-hidden="true" />
              <div className="contact-text">
                <div className="contact-title">Адрес</div>
                <div>{address}</div>
              </div>
            </div>
          </div>
        </div>

        <div id="laws" className="person-block">
          <h2>Законодательная деятельность</h2>
          {laws && laws.length > 0 ? (
            <>
              <div className="law-list">
                {laws.map((entry, i) => (
                  <div key={entry.id || entry.number || i} className="law-item tile">
                    <div className="law-left">
                      <div className="law-ico">📄</div>
                      <div className="law-text">
                        <div className="law-title">{entry.title || entry.number || `Документ ${i + 1}`}</div>
                        {entry.title && entry.number && (
                          <div className="law-desc">№ {entry.number}</div>
                        )}
                        {entry.status && (
                          <div className="law-status">{entry.status}</div>
                        )}
                      </div>
                    </div>
                    {entry.document || entry.url ? (
                      <a
                        className="btn btn--primary"
                        href={entry.document || entry.url ? normalizeFilesUrl(entry.document || entry.url) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Открыть документ"
                      >
                        Открыть
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>Информация о законодательной деятельности отсутствует</p>
          )}
        </div>

        <div id="income" className="person-block">
          <h2>Сведения о доходах</h2>
          {incomeDocs && incomeDocs.length > 0 ? (
            <>
              <p>
                Скачать информацию о доходах, расходах, об имуществе и обязательствах имущественного
                характера:
              </p>
              <div className="grid docs-grid">
                {incomeDocs.map((doc, i) => (
                  <div key={doc.year || doc.title || i} className="doc-card tile">
                    <div className="doc-header">
                      <div className="doc-ico">🗂</div>
                      <div>
                        <div className="doc-title">{doc.title || (doc.year ? `Декларация за ${doc.year} год` : `Документ ${i + 1}`)}</div>
                        <div className="doc-meta">PDF{doc.size ? `, ${doc.size}` : ""}</div>
                      </div>
                    </div>
                    <div>
                      {doc.document || doc.url ? (
                        <a
                          className="btn btn--gold"
                          href={normalizeFilesUrl(doc.document || doc.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Перейти к документу
                        </a>
                      ) : (
                        <span className="doc-meta">Документ не загружен</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>Информация о доходах отсутствует</p>
          )}
        </div>

        <div id="schedule" className="person-block">
          <h2>График приема граждан</h2>
          {schedule && schedule.length > 0 && Array.isArray(schedule[0]) ? (
            <div className="sched-grid">
              {schedule.map(([day, time], i) => (
                <React.Fragment key={day || i}>
                  <div className="sched-cell tile">{day || ""}</div>
                  <div className="sched-cell tile">{time || ""}</div>
                </React.Fragment>
              ))}
            </div>
          ) : schedule && schedule.length > 0 ? (
            <div className="sched-grid">
              {schedule.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="sched-cell tile">{s.day || ""}</div>
                  <div className="sched-cell tile">{s.time || ""}</div>
                </React.Fragment>
              ))}
            </div>
          ) : schedulePlain ? (
            <div className="prose">
              <div dangerouslySetInnerHTML={{ __html: String(scheduleHtml) }} />
            </div>
          ) : (
            <p>График приема граждан не указан</p>
          )}
        </div>
      </div>
    </section>
  );
}
