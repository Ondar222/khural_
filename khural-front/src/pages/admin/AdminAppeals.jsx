import React from "react";
import { App, Button, Input, Modal, Space, Table, Tag, Select } from "antd";

const STATUS_OPTIONS = [
  { value: "Принято", label: "Принято", color: "gold" },
  { value: "В работе", label: "В работе", color: "blue" },
  { value: "Ответ отправлен", label: "Ответ отправлен", color: "green" },
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

  const columns = [
    {
      title: "Номер / Тема",
      key: "subject",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>
            {row.number ? `№ ${row.number}` : "—"} {row.subject ? `· ${row.subject}` : ""}
          </div>
          {row.userEmail || row.userName ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              {row.userName ? `${row.userName}` : ""}
              {row.userName && row.userEmail ? " · " : ""}
              {row.userEmail ? row.userEmail : ""}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Текст обращения",
      dataIndex: "message",
      width: 300,
      render: (text) => (
        <div
          style={{
            opacity: 0.9,
            wordBreak: "break-word",
            lineHeight: "1.5",
            maxHeight: "100px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text ? String(text).slice(0, 200) + (text.length > 200 ? "..." : "") : "—"}
        </div>
      ),
    },
    {
      title: "Дата",
      dataIndex: "createdAt",
      width: 160,
      render: (v) => {
        const d = v ? new Date(v) : null;
        return d && !isNaN(d.getTime()) ? d.toLocaleDateString("ru-RU") + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "—";
      },
    },
    {
      title: "Статус",
      dataIndex: "status",
      width: 180,
      render: (status, row) => (
        <Select
          value={status}
          onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
          disabled={!canWrite || busy}
          style={{ width: "100%" }}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 120,
      render: (_, row) => (
        <Space wrap>
          <Button onClick={() => openDetailModal(row)}>Подробнее</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по теме, тексту, номеру, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
      </div>

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
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


