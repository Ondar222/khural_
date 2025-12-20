import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function EventModal({ open, onClose, events }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close icon-btn" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
        <div className="modal__content">
          <h3 style={{ margin: 0 }}>
            {events && events.length > 0
              ? `События ${new Date(events[0].date).toLocaleDateString("ru-RU")}`
              : "События"}
          </h3>
          <div className="grid" style={{ marginTop: 12 }}>
            {(events || []).map((ev) => (
              <div key={ev.id} className="card" style={{ padding: 12 }}>
                <h4 style={{ margin: "0 0 6px" }}>{ev.title}</h4>
                <div style={{ color: "#0a3b72", fontWeight: 600 }}>
                  {new Date(ev.date).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {ev.time ? ` • ${ev.time}` : ""}
                </div>
                {ev.place ? <div className="text-muted">{ev.place}</div> : null}
                {ev.desc ? <p style={{ marginBottom: 0 }}>{ev.desc}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
