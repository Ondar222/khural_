import React from "react";
import AdminShell from "./AdminShell.jsx";
import AdminCommitteesEditor from "./AdminCommitteesEditor.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminCommitteesCreatePage() {
  const adminData = useAdminData();

  return (
    <AdminShell
      activeKey="committees"
      title="Добавить комитет"
      subtitle={`API: ${adminData.apiBase || "—"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <AdminCommitteesEditor
        mode="create"
        convocations={adminData.convocations}
        onCreate={adminData.createCommittee}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}

