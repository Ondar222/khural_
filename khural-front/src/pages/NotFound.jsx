import React from "react";
import { Button } from "antd";
import { useHashRoute } from "../Router.jsx";

export default function NotFound() {
  const { navigate } = useHashRoute();
  const path = React.useMemo(() => {
    if (typeof window === "undefined") return "/";
    const pathname = window.location.pathname || "/";
    const search = window.location.search || "";
    return `${pathname}${search}` || "/";
  }, []);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1>Страница не найдена</h1>
        <p style={{ opacity: 0.8, lineHeight: 1.5 }}>
          Запрошенный адрес <b>{path}</b> не существует или был перенесён.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate("/")}>
            На главную
          </Button>
          <Button onClick={() => window.history.back()}>Назад</Button>
        </div>
      </div>
    </section>
  );
}



