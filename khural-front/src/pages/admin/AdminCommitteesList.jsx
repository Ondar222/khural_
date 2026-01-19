import React from "react";
import { Button, Input, Space, Table, Tag, Select, Empty } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminCommitteesList({
  items,
  convocations,
  selectedConvocationId,
  onConvocationChange,
  onDelete,
  onImport,
  importing,
  busy,
  canWrite,
}) {
  const { navigate } = useHashRoute();
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

  const isLocalStatic = (row) => String(row?.id || "").startsWith("local-static-");
  const isLocal = (row) =>
    !isLocalStatic(row) && String(row?.id || "").startsWith("local-");

  const columns = [
    {
      title: "Комитет",
      dataIndex: "name",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            {row.name}
            {isLocalStatic(row) ? (
              <Tag color="blue">Локально (файл)</Tag>
            ) : isLocal(row) ? (
              <Tag color="blue">Локально</Tag>
            ) : null}
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
            disabled={!canWrite || isLocalStatic(row)}
            onClick={() =>
              navigate(`/admin/committees/edit/${encodeURIComponent(String(row.id))}`)
            }
          >
            Редактировать
          </Button>
          <Button
            danger
            disabled={!canWrite || isLocalStatic(row)}
            onClick={() => onDelete?.(row.id)}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <div className="admin-committees-list__toolbar-left">
          <Select
            style={{ minWidth: 200, flex: "0 0 auto" }}
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
            style={{ flex: "1 1 320px", minWidth: 220 }}
          />
        </div>
        <div className="admin-committees-list__toolbar-right">
          <Button
            type="primary"
            onClick={() => navigate("/admin/committees/create")}
            disabled={!canWrite}
            loading={busy}
            block={isMobile}
          >
            + Добавить комитет
          </Button>
       
        </div>
      </div>

      <div className="admin-card admin-table">
        {isMobile ? (
          <div className="admin-committees-cards">
            {filtered && filtered.length ? (
              filtered.map((row) => {
                const convName = row?.convocation?.name || row?.convocation?.number || "";
                const desc = row?.description ? String(row.description).trim() : "";
                const phone = row?.phone ? String(row.phone).trim() : "";
                const email = row?.email ? String(row.email).trim() : "";
                const address = row?.address ? String(row.address).trim() : "";
                const website = row?.website ? String(row.website).trim() : "";
                const disabled = !canWrite || isLocalStatic(row);
                return (
                  <div key={String(row?.id ?? "")} className="admin-committee-card">
                    <div className="admin-committee-card__header">
                      <div className="admin-committee-card__title">{row?.name || "Комитет"}</div>
                      <div className="admin-committee-card__tags">
                        {isLocalStatic(row) ? (
                          <Tag color="blue">Локально (файл)</Tag>
                        ) : isLocal(row) ? (
                          <Tag color="blue">Локально</Tag>
                        ) : null}
                        {row?.isActive ? (
                          <Tag color="green">Активный</Tag>
                        ) : (
                          <Tag color="default">Неактивный</Tag>
                        )}
                      </div>
                    </div>
                    {convName ? (
                      <div className="admin-committee-card__meta">
                        <span style={{ opacity: 0.7 }}>Созыв:</span> {convName}
                      </div>
                    ) : null}
                    {desc ? (
                      <div className="admin-committee-card__desc">
                        {desc.length > 220 ? `${desc.slice(0, 220)}…` : desc}
                      </div>
                    ) : null}
                    {phone || email || address || website ? (
                      <div className="admin-committee-card__contacts">
                        {phone ? <div>📞 {phone}</div> : null}
                        {email ? <div>✉️ {email}</div> : null}
                        {address ? <div>📍 {address}</div> : null}
                        {website ? <div>🌐 {website}</div> : null}
                      </div>
                    ) : null}
                    <div className="admin-committee-card__actions">
                      <Button
                        block
                        onClick={() =>
                          navigate(`/admin/committees/edit/${encodeURIComponent(String(row.id))}`)
                        }
                        disabled={disabled}
                      >
                        Редактировать
                      </Button>
                      <Button danger block disabled={disabled} onClick={() => onDelete?.(row.id)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 18 }}>
                <Empty description="Нет данных" />
              </div>
            )}
          </div>
        ) : (
          <Table
            rowKey={(r) => String(r.id)}
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 920 }}
          />
        )}
      </div>
    </div>
  );
}

