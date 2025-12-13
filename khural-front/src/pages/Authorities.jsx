import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";

export default function Authorities() {
  const { authorities } = useData();
  const CATEGORIES = ["Министерства", "Службы", "Агентства"];
  const typeToCategory = (t) =>
    t === "Министерство"
      ? "Министерства"
      : t === "Служба"
      ? "Службы"
      : t === "Агентство"
      ? "Агентства"
      : "";
  const [category, setCategory] = React.useState(() => {
    const h = window.location.hash;
    const cat = new URLSearchParams(h.split("?")[1]).get("cat");
    return CATEGORIES.includes(cat) ? cat : "Министерства";
  });
  const [selected, setSelected] = React.useState(() => {
    const h = window.location.hash;
    const id = new URLSearchParams(h.split("?")[1]).get("id");
    return id || null;
  });
  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      const sp = new URLSearchParams(h.split("?")[1]);
      const id = sp.get("id");
      const cat = sp.get("cat");
      if (cat && CATEGORIES.includes(cat)) setCategory(cat);
      setSelected(id || null);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (selected) {
    const item = authorities.find((a) => a.id === selected);
    if (!item) return null;
    return (
      <section className="section">
        <div className="container">
          <a className="btn" href="#/authorities" style={{ marginBottom: 12 }}>
            ← К списку
          </a>
          <h1 style={{ marginBottom: 8 }}>{item.title}</h1>
          <div style={{ color: "#6b7280", marginBottom: 16 }}>
            {typeToCategory(item.type) || item.type}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <p>{item.desc}</p>
            {item.site ? (
              <p>
                Официальный сайт:{" "}
                <a
                  className="link"
                  href={item.site}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.site}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>Министерства и ведомства</h1>
            <div className="tabs" style={{ margin: "12px 0 20px" }}>
              {CATEGORIES.map((c) => {
                const isActive = c === category;
                return isActive ? (
                  <span
                    key={c}
                    className="pill pill--solid"
                    aria-current="page"
                  >
                    {c}
                  </span>
                ) : (
                  <a
                    key={c}
                    className="pill"
                    href={`#/authorities?cat=${encodeURIComponent(c)}`}
                    onClick={(e) => {
                      // update state immediately for snappy UI
                      setCategory(c);
                    }}
                  >
                    {c}
                  </a>
                );
              })}
            </div>
            <div className="grid cols-3">
              {authorities
                .filter((a) => typeToCategory(a.type) === category)
                .map((a) => (
                  <a
                    key={a.id}
                    className="tile"
                    href={`#/authorities?cat=${encodeURIComponent(
                      category
                    )}&id=${encodeURIComponent(a.id)}`}
                  >
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      {typeToCategory(a.type)}
                    </div>
                    <div style={{ fontWeight: 800, marginTop: 6 }}>
                      {a.title}
                    </div>
                    <div className="link" style={{ marginTop: 10 }}>
                      Подробнее →
                    </div>
                  </a>
                ))}
            </div>
          </div>
          <SideNav
            title="Органы власти"
            links={[
              { label: "Местное самоуправление", href: "#/authorities" },
              { label: "Законодательное Собрание", href: "#/authorities" },
              { label: "Территориальные отделения", href: "#/authorities" },
              { label: "Руководители органов", href: "#/authorities" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
