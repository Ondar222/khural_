import React from "react";
import { App, Button, Input, Modal } from "antd";
import AdminShell from "./AdminShell.jsx";
import AdminCommitteesList from "./AdminCommitteesList.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { useData } from "../../context/DataContext.jsx";
import { CommitteesApi } from "../../api/client.js";

function normKey(v) {
  return String(v || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function deriveCommitteeName(fullTitle) {
  const cleaned = String(fullTitle || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return { name: "", description: "" };

  // If backend stores `name` as varchar(255), keep name <= 255.
  if (cleaned.length <= 255) return { name: cleaned, description: "" };

  // Prefer a meaningful short name: cut at the first comma (common in Russian long titles).
  const comma = cleaned.indexOf(",");
  let short = comma > 20 ? cleaned.slice(0, comma).trim() : "";

  // Fallback: keep the beginning and add ellipsis
  if (!short) short = cleaned.slice(0, 252).trimEnd() + "…";

  // Ensure length safety
  if (short.length > 255) short = short.slice(0, 252).trimEnd() + "…";

  return { name: short, description: cleaned };
}

export default function AdminCommitteesPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const { committees: publicCommittees } = useData();
  const [selectedConvocationId, setSelectedConvocationId] = React.useState("all");
  const [importing, setImporting] = React.useState(false);

  const importFromSite = React.useCallback(() => {
    if (!adminData.canWrite) return;
    const source = Array.isArray(publicCommittees) ? publicCommittees : [];
    if (!source.length) {
      message.error("Не найдены комитеты на основном сайте (public/data/committees.json)");
      return;
    }

    const existing = new Set(
      (Array.isArray(adminData.committees) ? adminData.committees : []).map((c) => normKey(c?.name))
    );
    const persons = Array.isArray(adminData.persons) ? adminData.persons : [];
    const personIdByName = new Map(
      persons
        .map((p) => ({
          id: p?.id ?? p?._id ?? p?.personId,
          name: p?.fullName || p?.full_name || p?.name,
        }))
        .map((x) => [normKey(x.name), x.id])
        .filter(([k]) => k)
    );

    const toMembers = (committee) => {
      const members = Array.isArray(committee?.members) ? committee.members : [];
      const out = [];
      let order = 0;
      for (const m of members) {
        const name = String(m?.name || "").trim();
        const role = String(m?.role || "Член комитета").trim() || "Член комитета";
        if (!name) continue;
        order += 1;
        const pid = personIdByName.get(normKey(name));
        const personIdNum = pid !== undefined && pid !== null && String(pid).trim() !== "" ? Number(pid) : NaN;
        if (Number.isFinite(personIdNum) && personIdNum > 0) {
          out.push({ personId: personIdNum, role, order });
        } else {
          out.push({ name, role, order });
        }
      }
      return out.length ? out : undefined;
    };

    Modal.confirm({
      title: "Импортировать комитеты с основного сайта?",
      content:
        "Создадим отсутствующие комитеты из публичной версии (public/data/committees.json). Если комитет с таким названием уже есть — пропустим.",
      okText: "Импортировать",
      cancelText: "Отмена",
      onOk: async () => {
        setImporting(true);
        try {
          let created = 0;
          let skipped = 0;
          let failed = 0;

          for (let i = 0; i < source.length; i += 1) {
            const c = source[i];
            const fullTitle = String(c?.title || c?.name || "").trim();
            const { name, description } = deriveCommitteeName(fullTitle);
            if (!name) {
              skipped += 1;
              continue;
            }
            const k = normKey(name);
            if (existing.has(k)) {
              skipped += 1;
              continue;
            }

            // Create committee first (without members), then add members via separate endpoint.
            // This avoids backend issues and keeps payload simple.
            const payload = {
              name,
              isActive: true,
              order: i,
            };
            const members = toMembers(c);
            if (description) payload.description = description;

            try {
              // Don't use adminData.createCommittee here: it triggers reload() per item
              // which causes a lot of extra API calls and noise during bulk import.
              const createdCommittee = await CommitteesApi.create(payload);
              const committeeId = createdCommittee?.id;
              if (committeeId && members?.length) {
                try {
                  await CommitteesApi.addMembers(committeeId, members);
                } catch (e) {
                  // If adding members fails, keep committee created anyway
                  console.warn("Committee members import failed", e);
                }
              }
              existing.add(k);
              created += 1;
            } catch (e) {
              failed += 1;
              console.warn("Committee import failed", e);
            }
          }

          message.success(`Готово: создано ${created}, пропущено ${skipped}, ошибок ${failed}`);
          await adminData.reload?.();
        } finally {
          setImporting(false);
        }
      },
    });
  }, [adminData, message, publicCommittees]);

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

  return (
    <AdminShell
      activeKey="committees"
      title="Комитеты"
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      <AdminCommitteesList
        items={adminData.committees}
        convocations={adminData.convocations}
        selectedConvocationId={selectedConvocationId}
        onConvocationChange={setSelectedConvocationId}
        onDelete={adminData.deleteCommittee}
        onImport={importFromSite}
        importing={importing}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}

