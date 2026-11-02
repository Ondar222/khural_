import React from "react";
import { App, Button, Input, Modal, Space, Table, Tag } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { getDocumentFileUrl } from "../../utils/documentFile.js";

const TYPE_OPTIONS = [
  { value: "laws", label: "Законы" },
  { value: "resolutions", label: "Постановления" },
  { value: "initiatives", label: "Инициативы" },
  { value: "bills", label: "Законопроекты" },
  { value: "civic", label: "Обращения" },
  { value: "constitution", label: "Конституция" },
  { value: "constitution-fed", label: "Конституция - Федеральное" },
  { value: "constitution-reg", label: "Конституция - Региональное" },
  { value: "other", label: "Другое" },
];

export default function AdminDocuments({ items, onDelete, busy, canWrite }) {
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
    const hasRu = getDocumentFileUrl(row) || row?.pdfFile?.id;
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
      render: (_, row) => {
        const dateStr = row.publishedAt || row.date;
        const dateDisplay = dateStr ? (dateStr.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(dateStr).toLocaleDateString("ru-RU") : dateStr) : "—";
        return (
          <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
            <div>{row.number || "—"}</div>
            <div style={{ opacity: 0.8, marginTop: "2px" }}>{dateDisplay}</div>
          </div>
        );
      },
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
      width: 200,
      render: (_, row) => {
        const isFromJson = String(row?.id ?? "").startsWith("zakony-") || String(row?.id ?? "").startsWith("postamovleniya-");
        const fileUrl = getDocumentFileUrl(row);
        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {fileUrl ? (
              <Button
                size="small"
                onClick={() => window.open(normalizeFilesUrl(fileUrl), "_blank")}
                block
              >
                Открыть ↗
              </Button>
            ) : null}
            <Button
              size="small"
              onClick={() => navigate(`/admin/documents/${row.id}`)}
              disabled={!canWrite || isFromJson}
              block
              title={isFromJson ? "Документ из JSON — сначала импортируйте его в API" : undefined}
            >
              {fileUrl ? "Редактировать" : "Загрузить файл"}
            </Button>
            <Button
              danger
              size="small"
              onClick={() => confirmDelete(row)}
              disabled={!canWrite}
              block
              title={isFromJson ? "Документ из JSON — будет скрыт только в админке" : undefined}
            >
              Удалить
            </Button>
          </Space>
        );
      },
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
          + Загрузить документ
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
          pagination={{
            pageSize: 25,
            showSizeChanger: true,
            pageSizeOptions: ["25", "50", "100", "200"],
            showTotal: (total) => `Всего: ${total}`,
          }}
          scroll={windowWidth > 1024 ? { x: "max-content" } : undefined}
        />
      </div>
    </div>
  );
}
