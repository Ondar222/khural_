import React from "react";
import { App, Button, Input, Space, Table, Popconfirm } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { stripHtmlTags } from "../../utils/html.js";

/** Показываем только текст без тегов. */
function plainName(name) {
  const t = stripHtmlTags(String(name || ""));
  return t.trim() || "—";
}

export default function AdminCommissionsList({
  items,
  onReload,
  onDelete,
  busy,
  canWrite,
}) {
  const { navigate } = useHashRoute();
  const { message } = App.useApp();
  const [q, setQ] = React.useState("");
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 820;

  const filtered = React.useMemo(() => {
    let list = Array.isArray(items) ? items.slice() : [];
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (c) =>
          plainName(c?.name).toLowerCase().includes(qq) ||
          String(c?.id || "").toLowerCase().includes(qq)
      );
    }
    return list;
  }, [items, q]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 180,
      ellipsis: true,
      render: (id) => <code className="admin-commissions-list__id">{id}</code>,
    },
    {
      title: "Название",
      dataIndex: "name",
      ellipsis: true,
      render: (name) => (
        <span className="admin-commissions-list__name">{plainName(name)}</span>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, row) => (
        <Space size="small" wrap className="admin-commissions-list__actions">
          <Button
            size="small"
            disabled={!canWrite}
            onClick={() =>
              navigate(`/admin/commissions/edit/${encodeURIComponent(String(row.id))}`)
            }
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить комиссию?"
            description="Комиссия исчезнет со страницы «Комиссии»."
            onConfirm={() => onDelete?.(row.id)}
            okText="Удалить"
            cancelText="Отмена"
          >
            <Button size="small" danger disabled={!canWrite}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const toolbar = (
    <div className="admin-card admin-toolbar">
      <div className="admin-commissions-list__toolbar-left">
        <Input
          placeholder="Поиск по названию или ID..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          allowClear
          className="admin-input admin-commissions-search"
          size="small"
          style={{
            flex: "1 1 320px",
            minWidth: isMobile ? 150 : 220,
            maxWidth: isMobile ? "100%" : "none",
          }}
        />
      </div>
      <div className="admin-commissions-list__toolbar-right">
        <Button
          type="primary"
          disabled={!canWrite}
          onClick={() => navigate("/admin/commissions/create")}
          loading={busy}
          block={isMobile}
        >
          + Добавить комиссию
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="admin-grid admin-commissions admin-commissions--mobile">
        {toolbar}
        {filtered.length > 0 ? (
          <div className="admin-commissions-cards">
            {filtered.map((row) => (
              <div key={row.id} className="admin-card admin-commissions-card">
                <code className="admin-commissions-list__id">{row.id}</code>
                <div className="admin-commissions-card__name">
                  {plainName(row.name)}
                </div>
                <div className="admin-commissions-card__actions">
                  <Button
                    block
                    disabled={!canWrite}
                    onClick={() =>
                      navigate(`/admin/commissions/edit/${encodeURIComponent(String(row.id))}`)
                    }
                  >
                    Редактировать
                  </Button>
                  <Popconfirm
                    title="Удалить комиссию?"
                    description="Комиссия исчезнет со страницы «Комиссии»."
                    onConfirm={() => onDelete?.(row.id)}
                    okText="Удалить"
                    cancelText="Отмена"
                  >
                    <Button block danger disabled={!canWrite}>
                      Удалить
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card admin-commissions-empty">Комиссий нет</div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid admin-commissions">
      {toolbar}
      <div className="admin-card admin-table">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "Комиссий нет" }}
          scroll={{ x: 900 }}
          size="small"
          style={{ tableLayout: "fixed" }}
        />
      </div>
    </div>
  );
}
