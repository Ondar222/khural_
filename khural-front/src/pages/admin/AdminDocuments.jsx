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
      render: (v) => <div className="admin-docs-list__title">{v || "—"}</div>,
    },
    {
      title: "№ / Дата",
      key: "meta",
      width: 160,
      render: (_, row) => (
        <div className="admin-docs-list__meta">
          <div>{row.number || "—"}</div>
          <div>{row.publishedAt ? new Date(row.publishedAt).toLocaleDateString("ru-RU") : "—"}</div>
        </div>
      ),
    },
    {
      title: "Тип",
      dataIndex: "type",
      width: 180,
      render: (v) => renderTypeTag(v),
    },
    {
      title: "Файлы",
      key: "files",
      width: 120,
      render: (_, row) => renderFilesTag(row),
    },
    {
      title: "Действия",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space wrap className="admin-docs-list__actions">
          <Button
            size={isTablet ? "small" : "middle"}
            onClick={() => {
              navigate(`/admin/documents/${row.id}`);
            }}
            disabled={!canWrite}
          >
            Редактировать
          </Button>
          <Button
            danger
            size={isTablet ? "small" : "middle"}
            onClick={() => confirmDelete(row)}
            disabled={!canWrite}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const toolbar = (
    <div className="admin-card admin-toolbar admin-docs-list__toolbar">
      <div className="admin-docs-list__toolbar-left">
        <Input
          placeholder="Поиск по названию..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isMobile ? "large" : "middle"}
        />
      </div>
      <div className="admin-docs-list__toolbar-right">
        <Button
          type="primary"
          onClick={() => navigate("/admin/documents/create")}
          disabled={!canWrite}
          size={isMobile ? "large" : "middle"}
        >
          + Создать документ
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="admin-grid admin-docs-list">
        {toolbar}

        {Array.isArray(filtered) && filtered.length ? (
          <div className="admin-cards admin-docs-list__cards">
            {filtered.map((row) => (
              <div key={String(row.id)} className="admin-card admin-docs-list__card">
                <div className="admin-docs-list__card-head">
                  <div className="admin-docs-list__card-title">{row.title || "—"}</div>
                  <div className="admin-docs-list__badges">
                    {renderTypeTag(row.type)}
                    {renderFilesTag(row)}
                  </div>
                  <div className="admin-docs-list__meta">
                    <div>{row.number || "—"}</div>
                    <div>{row.publishedAt ? new Date(row.publishedAt).toLocaleDateString("ru-RU") : "—"}</div>
                  </div>
                </div>

                <div className="admin-docs-list__card-actions">
                  <Button onClick={() => navigate(`/admin/documents/${row.id}`)} disabled={!canWrite} block>
                    Редактировать
                  </Button>
                  <Button danger onClick={() => confirmDelete(row)} disabled={!canWrite} block>
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card admin-docs-list__empty">Нет данных</div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid admin-docs-list">
      {toolbar}

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: 10,
            showSizeChanger: !isTablet,
            showQuickJumper: !isTablet,
            size: isTablet ? "small" : "default",
          }}
          scroll={isTablet ? { x: "max-content" } : undefined}
        />
      </div>
    </div>
  );
}



