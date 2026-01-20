import React from "react";
import { useHashRoute } from "../../Router.jsx";
import AdminShell from "./AdminShell.jsx";
import AdminConvocationsEditor from "./AdminConvocationsEditor.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminConvocationsEditPage() {
  const { route } = useHashRoute();
  const adminData = useAdminData();

  const convocationId = React.useMemo(() => {
    const match = route?.match(/\/admin\/convocations\/edit\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [route]);

  return (
    <AdminShell
      activeKey="convocations"
      title="Редактировать созыв"
      subtitle={`API: ${adminData.apiBase || "—"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <AdminConvocationsEditor
        mode="edit"
        convocationId={convocationId}
        items={adminData.convocations}
        committees={adminData.committees}
        onUpdateCommittee={adminData.updateCommittee}
        onUpdate={adminData.updateConvocation}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}

