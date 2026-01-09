import React, { useEffect } from "react";
import { createPortal } from "react-dom";

function parseEventDate(raw) {
  if (raw === undefined || raw === null) return new Date(NaN);
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") return new Date(raw);
  const s = String(raw || "").trim();
  if (!s) return new Date(NaN);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00`);
  return new Date(s);
}

function renderText(v) {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    if (typeof v.getContent === "function") {
      try {
        return String(v.getContent() || "");
      } catch {
        return "";
      }
    }
    if (typeof v?.target?.value === "string") return v.target.value;
    if (typeof v?.content === "string") return v.content;
    if (typeof v?.html === "string") return v.html;
    return "";
  }
  return String(v);
}

function looksLikeHtml(s) {
  return /<\/?[a-z][\s\S]*>/i.test(String(s || ""));
}

function stripHtmlToText(html) {
  const s = String(html || "");
  // remove tags
  const noTags = s.replace(/<[^>]*>/g, " ");
  // decode minimal nbsp-like entities and collapse whitespace
  return noTags
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
              ? `События ${parseEventDate(events[0].date).toLocaleDateString("ru-RU")}`
              : "События"}
          </h3>
          <div className="grid" style={{ marginTop: 12 }}>
            {(events || []).map((ev) => (
              <div key={ev.id} className="card" style={{ padding: 12 }}>
                <h4 style={{ margin: "0 0 6px" }}>{renderText(ev.title)}</h4>
                <div style={{ color: "#0a3b72", fontWeight: 600 }}>
                  {parseEventDate(ev.date).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {renderText(ev.time) ? ` • ${renderText(ev.time)}` : ""}
                </div>
                {renderText(ev.place) ? <div className="text-muted">{renderText(ev.place)}</div> : null}
                {(() => {
                  const raw = renderText(ev.desc);
                  if (!raw) return null;
                  if (looksLikeHtml(raw)) {
                    const plain = stripHtmlToText(raw);
                    if (!plain) return null; // ignore empty HTML like <p>&nbsp;</p>
                    return (
                      <div
                        className="prose"
                        style={{ marginTop: 8 }}
                        dangerouslySetInnerHTML={{ __html: raw }}
                      />
                    );
                  }
                  const plain = String(raw || "").trim();
                  if (!plain) return null;
                  return (
                    <p className="prose" style={{ marginBottom: 0, marginTop: 8 }}>
                      {plain}
                    </p>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
