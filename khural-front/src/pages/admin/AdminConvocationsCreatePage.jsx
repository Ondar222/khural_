import React from "react";
import AdminShell from "./AdminShell.jsx";
import AdminConvocationsEditor from "./AdminConvocationsEditor.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminConvocationsCreatePage() {
  const adminData = useAdminData();

  return (
    <AdminShell
      activeKey="convocations"
      title="Добавить созыв"
      subtitle={`API: ${adminData.apiBase || "—"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <AdminConvocationsEditor
        mode="create"
        onCreate={adminData.createConvocation}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}

