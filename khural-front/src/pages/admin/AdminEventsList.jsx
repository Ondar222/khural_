import React from "react";
import { Button, Input, Space, Table } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminEventsList({ items, onDelete, busy, canWrite }) {
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
    return (items || []).filter((e) => String(e.title || "").toLowerCase().includes(qq));
  }, [items, q]);

  const formatMeta = React.useCallback((row) => {
    const parts = [];
    const date = row?.date ? String(row.date) : "";
    const time = row?.time ? String(row.time) : "";
    const place = row?.place ? String(row.place) : "";
    const when = [date, time].filter(Boolean).join(" ");
    if (when) parts.push(when);
    if (place) parts.push(place);
    return parts.join(" · ");
  }, []);

  const renderEventCell = React.useCallback(
    (row) => (
      <div className="admin-events-list__eventcell">
        <div className="admin-events-list__title">{row.title || "—"}</div>
        <div className="admin-events-list__meta">{formatMeta(row) || "—"}</div>
        {row.desc ? (
          <div className="admin-events-list__desc">{String(row.desc).replace(/<[^>]+>/g, "").slice(0, 160)}</div>
        ) : null}
      </div>
    ),
    [formatMeta]
  );

  const columns = [
    {
      title: "Событие",
      dataIndex: "title",
      render: (_, row) => renderEventCell(row),
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
        <Space wrap className="admin-events-list__actions">
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

  const toolbar = (
    <div className="admin-card admin-toolbar admin-events-list__toolbar">
      <div className="admin-events-list__toolbar-left">
        <Input
          placeholder="Поиск по названию..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isMobile ? "large" : "middle"}
        />
      </div>
      <div className="admin-events-list__toolbar-right">
        <Button type="primary" onClick={() => navigate("/admin/events/create")} disabled={!canWrite} loading={busy} size={isMobile ? "large" : "middle"}>
          + Добавить событие
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="admin-grid admin-events-list">
        {toolbar}

        {Array.isArray(filtered) && filtered.length ? (
          <div className="admin-cards admin-events-list__cards">
            {filtered.map((row) => (
              <div key={String(row.id)} className="admin-card admin-events-list__card">
                {renderEventCell(row)}
                <div className="admin-events-list__card-actions">
                  <Button
                    disabled={!canWrite}
                    onClick={() => navigate(`/admin/events/edit/${encodeURIComponent(String(row.id))}`)}
                    block
                  >
                    Редактировать
                  </Button>
                  <Button danger disabled={!canWrite} onClick={() => onDelete?.(row.id)} block>
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card admin-events-list__empty">Нет данных</div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid admin-events-list">
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


