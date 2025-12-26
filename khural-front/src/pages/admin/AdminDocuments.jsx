import React from "react";
import { App, Button, Input, Space, Table, Tag } from "antd";
import { useHashRoute } from "../../Router.jsx";

const TYPE_OPTIONS = [
  { value: "laws", label: "Законы" },
  { value: "resolutions", label: "Постановления" },
  { value: "initiatives", label: "Инициативы" },
  { value: "bills", label: "Законопроекты" },
  { value: "civic", label: "Обращения" },
  { value: "constitution", label: "Конституция" },
  { value: "other", label: "Другое" },
];

export default function AdminDocuments({ items, onCreate, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((d) =>
      String(d.title || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [items, q]);

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      render: (v) => <div style={{ fontWeight: 800 }}>{v || "—"}</div>,
    },
    {
      title: "№ / Дата",
      key: "meta",
      width: 160,
      render: (_, row) => (
        <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.35 }}>
          <div>{row.number || "—"}</div>
          <div>{row.publishedAt ? new Date(row.publishedAt).toLocaleDateString("ru-RU") : "—"}</div>
        </div>
      ),
    },
    {
      title: "Тип",
      dataIndex: "type",
      width: 180,
      render: (v) => {
        const opt = TYPE_OPTIONS.find((x) => x.value === v);
        return opt ? <Tag color="blue">{opt.label}</Tag> : v || "—";
      },
    },
    {
      title: "Файлы",
      key: "files",
      width: 120,
      render: (_, row) => {
        const hasRu = row?.pdfFile?.link || row?.pdfFile?.id;
        const hasTy = row?.metadata?.pdfFileTyId || row?.metadata?.pdfFileTyLink;
        if (hasRu && hasTy) {
          return <Tag color="green">RU + TY</Tag>;
        } else if (hasRu) {
          return <Tag color="blue">RU</Tag>;
        } else if (hasTy) {
          return <Tag color="orange">TY</Tag>;
        }
        return "—";
      },
    },
    {
      title: "Действия",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space wrap>
          <Button
            onClick={() => {
              navigate(`/admin/documents/${row.id}`);
            }}
            disabled={!canWrite}
          >
            Редактировать
          </Button>
          <Button danger onClick={() => onDelete(row.id)} disabled={!canWrite}>
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
          <Button type="primary" onClick={() => navigate("/admin/documents/create")} disabled={!canWrite}>
            + Создать документ
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



