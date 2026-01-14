import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import PdfPreviewModal from "./PdfPreviewModal.jsx";
import { decodeHtmlEntities } from "../utils/html.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

function stripTags(v) {
  return String(v ?? "").replace(/<[^>]*>/g, "").trim();
}

export default function PersonDetail({ item, type, backHref }) {
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
  const scheduleHtmlRaw =
    (receptionScheduleObj && typeof receptionScheduleObj.notes === "string" && receptionScheduleObj.notes) ||
    (typeof item.receptionSchedule === "string" ? item.receptionSchedule : "");
  const scheduleHtml = decodeHtmlEntities(scheduleHtmlRaw);
  const schedulePlain = stripTags(scheduleHtml);
  const schedule =
    typeof item.receptionSchedule === "string"
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
          : [];

  const [active, setActive] = React.useState("bio");
  const [preview, setPreview] = React.useState(null); // {url, title}
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
            {t("back")}
          </a>
        )}

        <div className="card person-hero">
          {avatarSrc ? (
            <img className="person-portrait" src={avatarSrc} alt={title} loading="lazy" />
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
                  {(item.convocationNumber || item.convocation) && (
                    <div>созыв {stripTags(item.convocationNumber || item.convocation)}</div>
                  )}
                  {item.district && (
                    <div>Избирательный округ: {stripTags(item.district)}</div>
                  )}
                  {item.faction && (
                    <div>Фракция: «{stripTags(item.faction)}»</div>
                  )}
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
                      <button
                        className="btn btn--primary"
                        onClick={(e) => {
                          e.preventDefault();
                          const docUrl = entry.document || entry.url;
                          if (docUrl) {
                            setPreview({ url: docUrl, title: entry.title || entry.number || "Документ" });
                          }
                        }}
                        aria-label="Открыть предпросмотр"
                      >
                        Открыть
                      </button>
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
                        <button
                          className="btn btn--gold"
                          onClick={(e) => {
                            e.preventDefault();
                            const docUrl = doc.document || doc.url;
                            if (docUrl) {
                              setPreview({ url: docUrl, title: doc.title || (doc.year ? `Декларация за ${doc.year} год` : "Документ") });
                            }
                          }}
                        >
                          Перейти к документу
                        </button>
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
          {schedule && schedule.length > 0 ? (
            <div className="sched-grid">
              {(Array.isArray(schedule[0]) ? schedule : schedule.map((s) => [s.day, s.time])).map(
                ([day, time], i) => (
                  <React.Fragment key={day || i}>
                    <div className="sched-cell tile">{day || ""}</div>
                    <div className="sched-cell tile">{time || ""}</div>
                  </React.Fragment>
                )
              )}
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
      <PdfPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        url={preview?.url}
        title={preview?.title}
      />
    </section>
  );
}
