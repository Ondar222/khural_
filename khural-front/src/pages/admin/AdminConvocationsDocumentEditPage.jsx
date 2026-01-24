import React from "react";
import { App, Button, Input } from "antd";
import { useHashRoute } from "../../Router.jsx";
import AdminShell from "./AdminShell.jsx";
import AdminConvocationsDocumentEdit from "./AdminConvocationsDocumentEdit.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminConvocationsDocumentEditPage() {
  const adminData = useAdminData();
  const { route } = useHashRoute();
  const { message } = App.useApp();

  // Извлекаем ID созыва и документа из URL
  // Формат: /admin/convocations/documents/:convocationId/create или /admin/convocations/documents/:convocationId/edit/:documentId
  const { convocationId, documentId } = React.useMemo(() => {
    const base = (route || "/").split("?")[0];
    
    // Формат: /admin/convocations/documents/:convocationId/create
    const createMatch = base.match(/\/admin\/convocations\/documents\/(\d+)\/create$/);
    if (createMatch) {
      return {
        convocationId: createMatch[1],
        documentId: null,
      };
    }
    
    // Формат: /admin/convocations/documents/:convocationId\/edit/:documentId
    const editMatch = base.match(/\/admin\/convocations\/documents\/(\d+)\/edit\/(.+)$/);
    if (editMatch) {
      return {
        convocationId: editMatch[1],
        documentId: decodeURIComponent(editMatch[2]),
      };
    }
    
    return { convocationId: null, documentId: null };
  }, [route]);

  const loginCard = !adminData.isAuthenticated ? (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Вход в админку</div>
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
          Чтобы редактировать, добавлять и удалять записи, выполните вход.
        </div>
        <Input
          placeholder="Email"
          value={adminData.email}
          onChange={(e) => adminData.setEmail(e.target.value)}
        />
        <Input.Password
          placeholder="Пароль"
          value={adminData.password}
          onChange={(e) => adminData.setPassword(e.target.value)}
        />
        <Button type="primary" loading={adminData.loginBusy} onClick={adminData.handleLogin}>
          Войти
        </Button>
      </div>
    </div>
  ) : null;

  if (!convocationId) {
    return (
      <AdminShell
        activeKey="convocations-documents"
        title="Ошибка"
        subtitle=""
        user={adminData.user}
        themeMode={adminData.themeMode}
        onToggleTheme={adminData.toggleTheme}
        onLogout={adminData.handleLogout}
      >
        <div className="admin-card">Неверный ID созыва</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      activeKey="convocations-documents"
      title={documentId ? "Редактирование документа" : "Добавление документа"}
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      <AdminConvocationsDocumentEdit
        convocationId={convocationId}
        documentId={documentId}
        onUpdate={adminData.updateConvocation}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}
