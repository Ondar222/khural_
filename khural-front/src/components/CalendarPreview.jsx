import React from "react";
import { useData } from "../context/DataContext.jsx";

export default function CalendarPreview() {
  const { events } = useData();
  const upcoming = React.useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3),
    [events]
  );

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>Календарь</h2>
          <a className="link" href="#/calendar">
            Открыть календарь →
          </a>
        </div>
        <div className="grid">
          {upcoming.map((e) => (
            <div key={e.id} className="tile">
              <div style={{ fontWeight: 700 }}>{e.title}</div>
              <div style={{ color: "#6b7280" }}>
                {new Date(e.date).toLocaleDateString("ru-RU")} · {e.time} ·{" "}
                {e.place}
              </div>
              <p>{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
