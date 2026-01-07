import React from "react";
import { Button, Input, Space, Table } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminEventsList({ items, onDelete, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((e) => String(e.title || "").toLowerCase().includes(qq));
  }, [items, q]);

  const columns = [
    {
      title: "Событие",
      dataIndex: "title",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>{row.title}</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            {row.date} {row.time ? `· ${row.time}` : ""} {row.place ? `· ${row.place}` : ""}
          </div>
          {row.desc ? <div style={{ opacity: 0.75, fontSize: 13 }}>{String(row.desc).slice(0, 160)}</div> : null}
        </div>
      ),
    },
    {
      title: "Дата",
      dataIndex: "date",
      width: 140,
    },
    {
      title: "Действия",
      key: "actions",
      width: 240,
      render: (_, row) => (
        <Space wrap>
          <Button disabled={!canWrite} onClick={() => navigate(`/admin/events/edit/${encodeURIComponent(String(row.id))}`)}>
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
          placeholder="Поиск по названию..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button type="primary" onClick={() => navigate("/admin/events/create")} disabled={!canWrite} loading={busy}>
            + Добавить событие
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table rowKey={(r) => String(r.id)} columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />
      </div>
    </div>
  );
}


