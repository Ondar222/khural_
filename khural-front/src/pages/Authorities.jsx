import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";

const CATEGORIES = ["Министерства", "Службы", "Агентства"];
const typeToCategory = (t) =>
  t === "Министерство"
    ? "Министерства"
    : t === "Служба"
      ? "Службы"
      : t === "Агентство"
        ? "Агентства"
        : "";

export default function Authorities() {
  const { authorities } = useData();
  const [category, setCategory] = React.useState(() => {
    const cat = new URLSearchParams(window.location.search || "").get("cat");
    return CATEGORIES.includes(cat) ? cat : "Министерства";
  });
  const [selected, setSelected] = React.useState(() => {
    const id = new URLSearchParams(window.location.search || "").get("id");
    return id || null;
  });
  React.useEffect(() => {
    const onNav = () => {
      const sp = new URLSearchParams(window.location.search || "");
      const id = sp.get("id");
      const cat = sp.get("cat");
      if (cat && CATEGORIES.includes(cat)) setCategory(cat);
      setSelected(id || null);
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);

  if (selected) {
    const item = authorities.find((a) => a.id === selected);
    if (!item) return null;
    return (
      <section className="section">
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <div style={{ flex: "1 1 auto" }}>
              <a
                className="btn btn-back"
                href="/authorities"
                style={{ marginBottom: 16, display: "inline-block" }}
              >
                ← К списку
              </a>
              <div>
                <h1 style={{ marginBottom: 8, display: "block" }}>{item.title}</h1>
                <div style={{ color: "#6b7280", marginBottom: 16 }}>
                  {typeToCategory(item.type) || item.type}
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <p>{item.desc}</p>
            {item.site ? (
              <p>
                Официальный сайт:{" "}
                <a className="link" href={item.site} target="_blank" rel="noreferrer">
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
                  <span key={c} className="pill pill--solid" aria-current="page">
                    {c}
                  </span>
                ) : (
                  <a
                    key={c}
                    className="pill"
                    href={`/authorities?cat=${encodeURIComponent(c)}`}
                    onClick={() => {
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
                    href={`/authorities?cat=${encodeURIComponent(
                      category
                    )}&id=${encodeURIComponent(a.id)}`}
                  >
                    <div style={{ color: "#6b7280", fontSize: 13 }}>{typeToCategory(a.type)}</div>
                    <div style={{ fontWeight: 800, marginTop: 6 }}>{a.title}</div>
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
              { label: "Местное самоуправление", href: "/authorities" },
              { label: "Законодательное Собрание", href: "/authorities" },
              { label: "Территориальные отделения", href: "/authorities" },
              { label: "Руководители органов", href: "/authorities" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
