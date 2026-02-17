import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";

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

export default function AccountInfo() {
  const { user, isAuthenticated, logout } = useAuth();
  const { navigate } = useHashRoute();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleGoToCabinet = () => {
    navigate("/cabinet/account");
  };

  return (
    <div className="account-info">
      <div className="account-info__header">
        <div className="account-info__avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="account-info__name">
          <div className="account-info__fullname">
            {user?.surname || ""} {user?.firstName || user?.name || ""}
          </div>
          <div className="account-info__email">{user?.email || ""}</div>
        </div>
      </div>

      <div className="account-info__details">
        <div className="account-info__row">
          <span className="account-info__label">Роль:</span>
          <span className="account-info__value">{roleLabel(user?.role)}</span>
        </div>
        {user?.phone && (
          <div className="account-info__row">
            <span className="account-info__label">Телефон:</span>
            <span className="account-info__value">{user?.phone}</span>
          </div>
        )}
      </div>

      <div className="account-info__actions">
        <button
          className="account-info__btn account-info__btn--outline"
          onClick={handleGoToCabinet}
        >
          Личный кабинет
        </button>
        <button
          className="account-info__btn account-info__btn--primary"
          onClick={handleLogout}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
