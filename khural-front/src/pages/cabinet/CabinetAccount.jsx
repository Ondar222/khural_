import React from "react";
import { Card, Descriptions } from "antd";
import { useAuth } from "../../context/AuthContext.jsx";
import CabinetShell from "./CabinetShell.jsx";

function roleLabel(role) {
  const r = String(role || "").trim().toLowerCase();
  if (!r) return "—";
  return (
    {
      citizen: "Гражданин",
      user: "Пользователь",
      admin: "Администратор",
      moderator: "Модератор",
      operator: "Оператор",
    }[r] || role
  );
}

export default function CabinetAccount() {
  const { user } = useAuth();

  return (
    <CabinetShell active="account" title="Личный кабинет — Личный аккаунт">
      <Card>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="Имя">{user?.name || "—"}</Descriptions.Item>
          <Descriptions.Item label="Email">{user?.email || "—"}</Descriptions.Item>
          <Descriptions.Item label="Телефон">{user?.phone || "—"}</Descriptions.Item>
          <Descriptions.Item label="Роль">{roleLabel(user?.role)}</Descriptions.Item>
        </Descriptions>
        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
          Если нужно изменить данные аккаунта — обратитесь к администратору.
        </div>
      </Card>
    </CabinetShell>
  );
}

