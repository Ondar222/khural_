import React from "react";
import { Button, Input, Space, Table, Tag, Select } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminCommitteesList({
  items,
  convocations,
  selectedConvocationId,
  onConvocationChange,
  onDelete,
  busy,
  canWrite,
}) {
  const { navigate } = useHashRoute();
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    let filteredItems = items || [];
    
    // Фильтр по созыву
    if (selectedConvocationId && selectedConvocationId !== "all") {
      filteredItems = filteredItems.filter(
        (c) => String(c?.convocation?.id || c?.convocationId) === String(selectedConvocationId)
      );
    }
    
    // Поиск по названию
    const qq = q.trim().toLowerCase();
    if (qq) {
      filteredItems = filteredItems.filter(
        (c) =>
          String(c.name || "").toLowerCase().includes(qq) ||
          String(c.description || "").toLowerCase().includes(qq)
      );
    }
    
    return filteredItems;
  }, [items, selectedConvocationId, q]);

  const columns = [
    {
      title: "Комитет",
      dataIndex: "name",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            {row.name}
            {row.isActive ? (
              <Tag color="green">Активный</Tag>
            ) : (
              <Tag color="default">Неактивный</Tag>
            )}
          </div>
          {row.convocation ? (
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              {row.convocation.name || row.convocation.number || ""}
            </div>
          ) : null}
          {row.description ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              {String(row.description).slice(0, 160)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Созыв",
      dataIndex: "convocation",
      width: 120,
      render: (convocation) =>
        convocation ? (
          <Tag>{convocation.name || convocation.number || ""}</Tag>
        ) : (
          <Tag color="default">—</Tag>
        ),
    },
    {
      title: "Статус",
      dataIndex: "isActive",
      width: 100,
      render: (isActive) =>
        isActive ? (
          <Tag color="green">Активный</Tag>
        ) : (
          <Tag color="default">Неактивный</Tag>
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
              navigate(`/admin/committees/edit/${encodeURIComponent(String(row.id))}`)
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Select
            style={{ minWidth: 200 }}
            placeholder="Выберите созыв"
            value={selectedConvocationId}
            onChange={onConvocationChange}
            allowClear
          >
            <Select.Option value="all">Все созывы</Select.Option>
            {(convocations || []).map((c) => (
              <Select.Option key={c.id} value={String(c.id)}>
                {c.name || c.number || `Созыв ${c.id}`}
              </Select.Option>
            ))}
          </Select>
          <Input
            placeholder="Поиск по названию или описанию..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="admin-input"
            style={{ flex: 1, minWidth: 200 }}
          />
        </div>
        <Space wrap>
          <Button
            type="primary"
            onClick={() => navigate("/admin/committees/create")}
            disabled={!canWrite}
            loading={busy}
          >
            + Добавить комитет
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

