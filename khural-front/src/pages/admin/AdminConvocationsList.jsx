import React from "react";
import { Button, Input, Space, Table, Tag } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminConvocationsList({ items, onDelete, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const [q, setQ] = React.useState("");

  // Отладка: логируем данные
  React.useEffect(() => {
    console.log("AdminConvocationsList items:", items);
    console.log("Items count:", Array.isArray(items) ? items.length : 0);
  }, [items]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter(
      (e) =>
        String(e.name || e.number || "").toLowerCase().includes(qq) ||
        String(e.description || "").toLowerCase().includes(qq)
    );
  }, [items, q]);

  const columns = [
    {
      title: "Созыв",
      dataIndex: "number",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            {row.name || row.number || "Созыв"}
            {row.isActive !== false ? (
              <Tag color="green">Активный</Tag>
            ) : (
              <Tag color="default">Архив</Tag>
            )}
          </div>
          {row.description ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              {String(row.description).slice(0, 160)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Статус",
      dataIndex: "isActive",
      width: 120,
      render: (isActive) =>
        isActive ? (
          <Tag color="green">Активный</Tag>
        ) : (
          <Tag color="default">Архив</Tag>
        ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 240,
      render: (_, row) => (
        <Space wrap>
          <Button
            disabled={!canWrite}
            onClick={() =>
              navigate(`/admin/convocations/edit/${encodeURIComponent(String(row.id))}`)
            }
          >
            Редактировать
          </Button>
          <Button danger disabled={!canWrite} onClick={() => onDelete?.(row.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по номеру или описанию..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button
            type="primary"
            onClick={() => navigate("/admin/convocations/create")}
            disabled={!canWrite}
            loading={busy}
          >
            + Добавить созыв
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
}

