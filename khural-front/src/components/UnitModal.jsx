import React from "react";
import { createPortal } from "react-dom";

export default function UnitModal({ open, onClose, title, description, link }) {
  React.useEffect(() => {
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
          <h3 style={{ marginTop: 0 }}>{title}</h3>
          {description ? <p>{description}</p> : null}
          {link ? (
            <a className="btn btn--primary" href={link} onClick={onClose}>
              Подробнее
            </a>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
