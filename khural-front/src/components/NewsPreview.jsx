import React from "react";

const NEWS = [
  {
    title: 'Более 60 студентов приняли участие в Дне ОЭЗ "Кулибин"',
    tag: "Образование",
    image: "/img/tile.svg",
  },
  {
    title: 'Выскa поборется за звание "Город молодёжи"',
    tag: "Молодёжная политика",
    image: "/img/slide-2.svg",
  },
  {
    title: "В Республике Тыва прошло выездное совещание Секретаря Совбеза",
    tag: "Безопасность",
    image: "/img/slide-3.svg",
  },
];

export default function NewsPreview() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>Новости</h2>
          <a className="link" href="#">
            Читать все новости →
          </a>
        </div>
        <div className="grid cols-3">
          {NEWS.map((n, i) => (
            <a key={i} className="tile" href="#" style={{ overflow: "hidden", padding: 0 }}>
              <div style={{ height: 180, overflow: "hidden" }}>
                <img
                  src={n.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#eef2ff",
                    color: "#3730a3",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {n.tag}
                </div>
                <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>{n.title}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
