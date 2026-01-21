import React from "react";
import { Button, Space } from "antd";
import { useAuth } from "../../context/AuthContext.jsx";

function isAdminUser(u) {
  const role = String(u?.role || "").toLowerCase();
  return Boolean(u?.admin) || role === "admin";
}

export default function CabinetShell({ active = "home", title = "Личный кабинет", children }) {
  const { user, logout } = useAuth();
  const isAdmin = isAdminUser(user);

  const linkStyle = { textDecoration: "none" };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 1100 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>{title}</h1>
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              {user?.name || user?.email ? (
                <>
                  Вы вошли как <strong>{user?.name || user?.email}</strong>
                </>
              ) : null}
            </div>
          </div>

          <Space wrap>
            {isAdmin ? (
              <a href="/admin" style={linkStyle}>
                <Button>Админ-панель</Button>
              </a>
            ) : null}
            <Button danger onClick={logout}>
              Выйти
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <Space wrap>
            <a href="/cabinet" style={linkStyle}>
              <Button type={active === "home" ? "primary" : "default"}>Главная</Button>
            </a>
            <a href="/cabinet/appeals" style={linkStyle}>
              <Button type={active === "appeals" ? "primary" : "default"}>Обращения</Button>
            </a>
            <a href="/cabinet/account" style={linkStyle}>
              <Button type={active === "account" ? "primary" : "default"}>Личный аккаунт</Button>
            </a>
          </Space>
        </div>

        <div>{children}</div>
      </div>
    </section>
  );
}

