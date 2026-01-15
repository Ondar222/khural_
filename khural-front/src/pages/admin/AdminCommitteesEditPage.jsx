import React from "react";
import { useHashRoute } from "../../Router.jsx";
import AdminShell from "./AdminShell.jsx";
import AdminCommitteesEditor from "./AdminCommitteesEditor.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminCommitteesEditPage() {
  const { route } = useHashRoute();
  const adminData = useAdminData();

  const committeeId = React.useMemo(() => {
    const match = route?.match(/\/admin\/committees\/edit\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [route]);

  return (
    <AdminShell
      activeKey="committees"
      title="Редактировать комитет"
      subtitle={`API: ${adminData.apiBase || "—"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <AdminCommitteesEditor
        mode="edit"
        committeeId={committeeId}
        items={adminData.committees}
        convocations={adminData.convocations}
        onUpdate={adminData.updateCommittee}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}

