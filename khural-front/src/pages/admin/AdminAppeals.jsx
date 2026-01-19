import React from "react";
import { App, Button, Input, Modal, Space, Table, Tag, Select } from "antd";

const STATUS_OPTIONS = [
  { value: "Принято", label: "Принято", color: "gold" },
  { value: "В работе", label: "В работе", color: "blue" },
  { value: "Ответ отправлен", label: "Ответ отправлен", color: "green" },
  { value: "Закрыто", label: "Закрыто", color: "default" },
];

function normalizeServerList(payload) {
  if (Array.isArray(payload)) return payload;
  const p = payload?.data ? payload.data : payload;
  if (Array.isArray(p?.items)) return p.items;
  if (Array.isArray(p?.results)) return p.results;
  if (Array.isArray(p)) return p;
  return [];
}

function normalizeAppeal(a) {
  const createdAt = a?.createdAt || a?.created_at || a?.date || new Date().toISOString();
  const status = a?.status || a?.state || "Принято";
  const number = a?.number || a?.registrationNumber || a?.regNumber || a?.id || "";
  return {
    id: String(a?.id || a?._id || number || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    number: String(number || "").trim(),
    subject: a?.subject || a?.title || "",
    message: a?.message || a?.text || a?.content || "",
    status: String(status),
    createdAt: String(createdAt),
    userEmail: a?.userEmail || a?.user?.email || a?.email || "",
    userName: a?.userName || a?.user?.name || a?.name || "",
  };
}

export default function AdminAppeals({ items, onUpdateStatus, busy, canWrite }) {
  const { message } = App.useApp();
  const [q, setQ] = React.useState("");
  const [selectedAppeal, setSelectedAppeal] = React.useState(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
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
    return (items || []).filter((a) => {
      const subject = String(a.subject || "").toLowerCase();
      const message = String(a.message || "").toLowerCase();
      const number = String(a.number || "").toLowerCase();
      const email = String(a.userEmail || "").toLowerCase();
      return subject.includes(qq) || message.includes(qq) || number.includes(qq) || email.includes(qq);
    });
  }, [items, q]);

  const handleStatusChange = async (appealId, newStatus) => {
    try {
      await onUpdateStatus(appealId, newStatus);
      message.success("Статус обновлен");
    } catch (e) {
      message.error(e?.message || "Не удалось обновить статус");
    }
  };

  const openDetailModal = (appeal) => {
    setSelectedAppeal(appeal);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedAppeal(null);
  };

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option?.color || "default";
  };

  const formatDateTime = React.useCallback((v) => {
    const d = v ? new Date(v) : null;
    if (!d || Number.isNaN(d.getTime())) return "—";
    return `${d.toLocaleDateString("ru-RU")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  }, []);

  const renderSubjectCell = React.useCallback((row) => {
    const title = `${row.number ? `№ ${row.number}` : "—"}${row.subject ? ` · ${row.subject}` : ""}`;
    const author = [row.userName || "", row.userEmail || ""].filter(Boolean).join(" · ");
    return (
      <div className="admin-appeals-list__subject">
        <div className="admin-appeals-list__subject-title">{title}</div>
        {author ? <div className="admin-appeals-list__subject-author">{author}</div> : null}
      </div>
    );
  }, []);

  const renderMessagePreview = React.useCallback((text) => {
    if (!text) return "—";
    const t = String(text);
    return t.slice(0, 220) + (t.length > 220 ? "…" : "");
  }, []);

  const statusOptions = React.useMemo(
    () =>
      STATUS_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    []
  );

  const columns = React.useMemo(() => {
    const base = [
      {
        title: "Номер / Тема",
        key: "subject",
        render: (_, row) => renderSubjectCell(row),
      },
      !isTablet
        ? {
            title: "Текст обращения",
            dataIndex: "message",
            width: 340,
            render: (text) => <div className="admin-appeals-list__message">{renderMessagePreview(text)}</div>,
          }
        : null,
      {
        title: "Дата",
        dataIndex: "createdAt",
        width: 170,
        render: (v) => <div className="admin-appeals-list__date">{formatDateTime(v)}</div>,
      },
      {
        title: "Статус",
        dataIndex: "status",
        width: 200,
        render: (status, row) => (
          <Select
            value={status}
            onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
            disabled={!canWrite || busy}
            style={{ width: "100%" }}
            options={statusOptions}
            size={isTablet ? "small" : "middle"}
          />
        ),
      },
      {
        title: "Действия",
        key: "actions",
        width: 140,
        render: (_, row) => (
          <Space wrap className="admin-appeals-list__actions">
            <Button size={isTablet ? "small" : "middle"} onClick={() => openDetailModal(row)}>
              Подробнее
            </Button>
          </Space>
        ),
      },
    ].filter(Boolean);
    return base;
  }, [busy, canWrite, formatDateTime, isTablet, openDetailModal, renderMessagePreview, renderSubjectCell, statusOptions]);

  const toolbar = (
    <div className="admin-card admin-toolbar admin-appeals-list__toolbar">
      <div className="admin-appeals-list__toolbar-left">
        <Input
          placeholder="Поиск по теме, тексту, номеру, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isMobile ? "large" : "middle"}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="admin-grid admin-appeals-list">
        {toolbar}

        {Array.isArray(filtered) && filtered.length ? (
          <div className="admin-cards admin-appeals-list__cards">
            {filtered.map((row) => (
              <div key={String(row.id)} className="admin-card admin-appeals-list__card">
                {renderSubjectCell(row)}
                <div className="admin-appeals-list__message">{renderMessagePreview(row.message)}</div>

                <div className="admin-appeals-list__meta-row">
                  <div className="admin-appeals-list__date">{formatDateTime(row.createdAt)}</div>
                  <Tag color={getStatusColor(row.status)}>{row.status}</Tag>
                </div>

                <div className="admin-appeals-list__card-actions">
                  <Select
                    value={row.status}
                    onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
                    disabled={!canWrite || busy}
                    options={statusOptions}
                    size="large"
                  />
                  <Button onClick={() => openDetailModal(row)} block>
                    Подробнее
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card admin-appeals-list__empty">Нет данных</div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid admin-appeals-list">
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

      <Modal
        title={
          selectedAppeal
            ? `Обращение ${selectedAppeal.number ? `№ ${selectedAppeal.number}` : ""}`
            : "Подробности обращения"
        }
        open={detailModalOpen}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal}>
            Закрыть
          </Button>,
        ]}
        width={700}
      >
        {selectedAppeal && (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Тема:</div>
              <div>{selectedAppeal.subject || "—"}</div>
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Статус:</div>
              <Tag color={getStatusColor(selectedAppeal.status)}>{selectedAppeal.status}</Tag>
            </div>

            {selectedAppeal.userName || selectedAppeal.userEmail ? (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Автор:</div>
                <div>
                  {selectedAppeal.userName || "—"}
                  {selectedAppeal.userName && selectedAppeal.userEmail ? " · " : ""}
                  {selectedAppeal.userEmail || ""}
                </div>
              </div>
            ) : null}

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Дата создания:</div>
              <div>
                {selectedAppeal.createdAt
                  ? new Date(selectedAppeal.createdAt).toLocaleString("ru-RU")
                  : "—"}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Текст обращения:</div>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: "1.6",
                  padding: "12px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {selectedAppeal.message || "—"}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Изменить статус:</div>
              <Select
                value={selectedAppeal.status}
                onChange={(newStatus) => {
                  handleStatusChange(selectedAppeal.id, newStatus);
                  setSelectedAppeal({ ...selectedAppeal, status: newStatus });
                }}
                disabled={!canWrite || busy}
                style={{ width: "100%" }}
                options={STATUS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


