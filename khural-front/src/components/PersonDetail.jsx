import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

export default function PersonDetail({ item, type, backHref }) {
  const { t } = useI18n();
  const isDeputy = type === "dep";
  const title = item.name || item.title;
  const phone = isDeputy ? item.contacts?.phone : item.phone;
  const email = isDeputy ? item.contacts?.email : item.email;
  const avatarSrc =
    (isDeputy &&
      (item.photo ||
        "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-vector-600nw-2027875490.jpg")) ||
    item.photo ||
    "/img/ok.png";
  const address = item.address || "г. Кызыл, ул. Ленина, 40";
  const laws = Array.isArray(item.laws) && item.laws.length ? item.laws : null;
  const incomeDocs =
    Array.isArray(item.incomeDocs) && item.incomeDocs.length
      ? item.incomeDocs
      : [{ year: 2024 }, { year: 2023 }, { year: 2022 }];
  const schedule =
    Array.isArray(item.schedule) && item.schedule.length
      ? item.schedule
      : [
          ["Понедельник", "10:00 - 12:00"],
          ["Вторник", "10:00 - 12:00"],
          ["Среда", "10:00 - 12:00"],
          ["Четверг", "10:00 - 12:00"],
          ["Пятница", "10:00 - 12:00"],
          ["Суббота-Воскресенье", "Выходной"],
        ];

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
    <section className="section">
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
          <img className="person-portrait" src={avatarSrc} alt={title} loading="lazy" />
          <div className="person-hero__body">
            <h1 className="person-name">{title}</h1>
            <div className="person-meta">
              {isDeputy ? (
                <>
                  {item.position && <div>{item.position}</div>}
                  {item.convocation && <div>созыв {item.convocation}</div>}
                  {item.district && <div>Избирательный округ: {item.district}</div>}
                  {item.faction && <div>Фракция: «{item.faction}»</div>}
                </>
              ) : (
                <>
                  <div>{item.role}</div>
                  {item.agency && <div>{item.agency}</div>}
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
            {item.bio ? (
              <p>{item.bio}</p>
            ) : (
              <>
                <p>
                  Родился в с. Суг‑Бажы Каа‑Хемского района Республики Тыва. Окончил институт по
                  специальности «Лечебное дело».
                </p>
                <p>
                  Работал врачом и руководителем медицинских учреждений. Зарекомендовал себя
                  компетентным, грамотным и опытным специалистом.
                </p>
              </>
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
          <div className="law-list">
            {(laws || [1, 2]).map((entry, i) => (
              <div key={laws ? entry.id : i} className="law-item tile">
                <div className="law-left">
                  <div className="law-ico">📄</div>
                  <div className="law-text">
                    <div className="law-title">{laws ? entry.title : `№ 1056580-${i + 1}`}</div>
                    <div className="law-desc">
                      {laws
                        ? entry.desc
                        : "О внесении изменений в Федеральный закон «О государственной регистрации транспортных средств в РФ»"}
                    </div>
                    <div className="law-status">{laws ? entry.status : "На рассмотрении"}</div>
                  </div>
                </div>
                <a className="law-link" href={laws ? entry.url : "#"} aria-label="Перейти">
                  ↗
                </a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button className="btn btn--gold">Показать больше</button>
          </div>
        </div>

        <div id="income" className="person-block">
          <h2>Сведения о доходах</h2>
          <p>
            Скачать информацию о доходах, расходах, об имуществе и обязательствах имущественного
            характера:
          </p>
          <div className="grid docs-grid">
            {incomeDocs.map((doc) => (
              <div key={doc.year} className="doc-card tile">
                <div className="doc-header">
                  <div className="doc-ico">🗂</div>
                  <div>
                    <div className="doc-title">Декларация за {doc.year} год</div>
                    <div className="doc-meta">PDF{doc.size ? `, ${doc.size}` : ""}</div>
                  </div>
                </div>
                <div>
                  <a className="btn btn--gold" href={doc.url || "#"}>
                    Перейти к документу
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="schedule" className="person-block">
          <h2>График приема граждан</h2>
          <div className="sched-grid">
            {(Array.isArray(schedule[0]) ? schedule : schedule.map((s) => [s.day, s.time])).map(
              ([day, time]) => (
                <React.Fragment key={day}>
                  <div className="sched-cell tile">{day}</div>
                  <div className="sched-cell tile">{time}</div>
                </React.Fragment>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
