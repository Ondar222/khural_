import React from "react";
import { App, Button, Input, Modal, Space, Table, Tag } from "antd";
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
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((d) =>
      String(d.title || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [items, q]);

  const renderTypeTag = React.useCallback((v) => {
    const opt = TYPE_OPTIONS.find((x) => x.value === v);
    return opt ? <Tag color="blue">{opt.label}</Tag> : v || "—";
  }, []);

  const renderFilesTag = React.useCallback((row) => {
    const hasRu = row?.pdfFile?.link || row?.pdfFile?.id;
    const hasTy = row?.metadata?.pdfFileTyId || row?.metadata?.pdfFileTyLink;
    if (hasRu && hasTy) return <Tag color="green">RU + TY</Tag>;
    if (hasRu) return <Tag color="blue">RU</Tag>;
    if (hasTy) return <Tag color="orange">TY</Tag>;
    return "—";
  }, []);

  const confirmDelete = React.useCallback(
    (row) => {
      Modal.confirm({
        title: "Удалить документ?",
        content: "Действие необратимо. Если сервер недоступен — документ будет скрыт локально.",
        okText: "Удалить",
        okType: "danger",
        cancelText: "Отмена",
        onOk: async () => {
          try {
            await onDelete?.(row.id);
          } catch (e) {
            message.error(e?.message || "Не удалось удалить документ");
          }
        },
      });
    },
    [message, onDelete]
  );

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      width: windowWidth > 1024 ? 600 : undefined,
      ellipsis: false,
      render: (v) => (
        <div 
          className="admin-docs-title-cell"
          style={{ 
            maxWidth: windowWidth > 1024 ? "600px" : "100%",
            width: windowWidth > 1024 ? "600px" : "100%",
            overflowWrap: "break-word", 
            wordWrap: "break-word",
            wordBreak: "break-word",
            lineHeight: "1.4",
            whiteSpace: "normal",
            overflow: "hidden",
            boxSizing: "border-box"
          }}
        >
          {v || "—"}
        </div>
      ),
    },
    {
      title: "№ / Дата",
      key: "meta",
      width: 140,
      render: (_, row) => (
        <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
          <div>{row.number || "—"}</div>
          <div style={{ opacity: 0.8, marginTop: "2px" }}>
            {row.publishedAt ? new Date(row.publishedAt).toLocaleDateString("ru-RU") : "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Тип",
      dataIndex: "type",
      width: 150,
      render: (v) => renderTypeTag(v),
    },
    {
      title: "Файлы",
      key: "files",
      width: 100,
      render: (_, row) => renderFilesTag(row),
    },
    {
      title: "Действия",
      key: "actions",
      width: 180,
      render: (_, row) => (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Button
            size="small"
            onClick={() => {
              navigate(`/admin/documents/${row.id}`);
            }}
            disabled={!canWrite}
            block
          >
            Редактировать
          </Button>
          <Button 
            danger 
            size="small"
            onClick={() => confirmDelete(row)} 
            disabled={!canWrite}
            block
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const toolbar = (
    <div className="admin-card admin-toolbar">
      <Input
        placeholder="Поиск по названию..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="admin-input"
      />
      <Space wrap>
        <Button
          type="primary"
          onClick={() => navigate("/admin/documents/create")}
          disabled={!canWrite}
          loading={busy}
        >
          + Создать документ
        </Button>
      </Space>
    </div>
  );

  return (
    <div className="admin-grid">
      {toolbar}

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          scroll={windowWidth > 1024 ? { x: "max-content" } : undefined}
        />
      </div>
    </div>
  );
}



