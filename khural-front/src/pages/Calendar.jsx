import React from "react";
import { useData } from "../context/DataContext.jsx";
import EventModal from "../components/EventModal.jsx";

function getMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday first
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getLocalDateKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CalendarPage() {
  const { events } = useData();
  const dateParam = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    const q = new URLSearchParams(window.location.search || "");
    const raw = String(q.get("date") || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
  }, []);
  const [cursor, setCursor] = React.useState(() => {
    const init = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
    const d = isNaN(init.getTime()) ? new Date() : init;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const grid = getMonthGrid(y, m);
  const eventsByDateKey = React.useMemo(() => {
    const mp = new Map();
    for (const e of events) {
      const d = new Date(e.date);
      const key = getLocalDateKey(d);
      if (!mp.has(key)) mp.set(key, []);
      mp.get(key).push(e);
    }
    return mp;
  }, [events]);
  const [openedDayEvents, setOpenedDayEvents] = React.useState(null);

  React.useEffect(() => {
    if (!dateParam) return;
    const evs = eventsByDateKey.get(dateParam);
    if (!evs || !evs.length) return;
    // Open the day from deep-link (e.g. click from HeroCarousel).
    setOpenedDayEvents(evs);
  }, [dateParam, eventsByDateKey]);

  return (
    <section className="section">
      <div className="container">
        <h1>Календарь</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <button className="btn" onClick={() => setCursor(new Date(y, m - 1, 1))}>
            ←
          </button>
          <strong>{cursor.toLocaleString("ru-RU", { month: "long", year: "numeric" })}</strong>
          <button className="btn" onClick={() => setCursor(new Date(y, m + 1, 1))}>
            →
          </button>
        </div>
        <div className="calendar">
          <div className="calendar__header">
            <button
              type="button"
              className="icon-btn"
              aria-label="Предыдущий месяц"
              onClick={() => setCursor(new Date(y, m - 1, 1))}
            >
              ‹
            </button>
            <div className="calendar__title">
              {cursor.toLocaleString("ru-RU", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Следующий месяц"
              onClick={() => setCursor(new Date(y, m + 1, 1))}
            >
              ›
            </button>
          </div>
          <div className="calendar__grid">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((h) => (
              <div key={h} className="calendar__weekday">
                {h}
              </div>
            ))}
            {grid.map((d, i) => {
              const key = getLocalDateKey(d);
              const inMonth = d.getMonth() === m;
              const evs = eventsByDateKey.get(key) || [];
              const has = evs.length > 0;
              return (
                <button
                  key={i}
                  type="button"
                  className={`calendar__day ${!inMonth ? "_empty" : ""} ${has ? "_has" : ""}`}
                  onClick={() => has && setOpenedDayEvents(evs)}
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
