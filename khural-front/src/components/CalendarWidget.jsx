import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext.jsx";
// import { useI18n } from "../i18n.js";
import EventModal from "./EventModal.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export default function CalendarWidget() {
  const { events } = useData();
  const { t } = useI18n();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [openedDayEvents, setOpenedDayEvents] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const startWeekday = (start.getDay() + 6) % 7; // Mon=0..Sun=6
  const dayCount = end.getDate();
  const gridCells = startWeekday + dayCount;
  const rows = Math.ceil(gridCells / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const dayNum = i - startWeekday + 1;
    if (dayNum < 1 || dayNum > dayCount) return null;
    return new Date(year, month, dayNum);
  });

  const eventsByDateKey = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      const d = new Date(ev.date);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(ev);
    });
    return map;
  }, [events]);

  const monthName = viewDate.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
  });

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>{t("calendar")}</h2>
          <a className="link" href="#/calendar">
            {t("calendarOpen")} →
          </a>
        </div>

        <div className="calendar">
          <div className="calendar__header">
            <button
              type="button"
              className="icon-btn"
              aria-label={t("prevMonth")}
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
            >
              ‹
            </button>
            <div className="calendar__title">{monthName}</div>
            <button
              type="button"
              className="icon-btn"
              aria-label={t("nextMonth")}
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
            >
              ›
            </button>
          </div>

          <div className="calendar__grid">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((w) => (
              <div key={w} className="calendar__weekday">
                {w}
              </div>
            ))}

            {cells.map((d, i) => {
              if (!d) return <div key={i} className="calendar__day _empty" />;

              const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const evs = eventsByDateKey.get(k) || [];
              const has = evs.length > 0;

              return (
                <button
                  key={i}
                  className={`calendar__day ${has ? "_has" : ""}`}
                  onClick={() => has && setOpenedDayEvents(evs)}
                  type="button"
                >
                  <div className="calendar__daynum">{d.getDate()}</div>
                  {has ? (
                    <div className="calendar__dots">
                      {evs.slice(0, 3).map((_, j) => (
                        <span key={j} className="calendar__dot" />
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <EventModal
          open={!!openedDayEvents}
          onClose={() => setOpenedDayEvents(null)}
          events={openedDayEvents || []}
        />
      </div>
    </section>
  );
}
