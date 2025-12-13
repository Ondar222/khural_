import React from "react";
import SideNav from "../components/SideNav.jsx";

function RegionModal({ open, onClose, item }) {
  if (!open || !item) return null;
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal__close icon-btn"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ✕
        </button>
        <div className="modal__content">
          <h3 style={{ marginTop: 0 }}>{item.title}</h3>
          <p>{item.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Region() {
  const [open, setOpen] = React.useState(null);
  const cards = [
    {
      id: "geo",
      title: "География",
      text: "Республика Тыва расположена в центре Азии. Территорию пересекают горные хребты Саян, множество рек и озёр.",
    },
    {
      id: "economy",
      title: "Экономика",
      text: "Базовые отрасли — энергетика, добыча полезных ископаемых, сельское хозяйство, туризм и культура.",
    },
    {
      id: "culture",
      title: "Культура",
      text: "Уникальные традиции, горловое пение, ремёсла и богатое культурное наследие народов Тувы.",
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>О регионе</h1>
            <p>Краткие сведения о Республике Тыва.</p>
            <div className="grid cols-3">
              {cards.map((c) => (
                <button
                  key={c.id}
                  className="tile"
                  onClick={() => setOpen(c)}
                  style={{ textAlign: "left" }}
                >
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <span className="link">Подробнее →</span>
                </button>
              ))}
            </div>
            <RegionModal
              open={!!open}
              onClose={() => setOpen(null)}
              item={open}
            />
          </div>
          <SideNav
            title="О регионе"
            links={[
              { label: "Республика Тыва", href: "#/region" },
              { label: "Карта области", href: "#/region" },
              { label: "Летопись", href: "#/region" },
              { label: "Официальные символы", href: "#/region" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
