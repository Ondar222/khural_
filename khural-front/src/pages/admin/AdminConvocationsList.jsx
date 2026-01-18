import React from "react";
import { Button, Input, Space, Table, Tag, App } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminConvocationsList({ items, onDelete, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const { modal } = App.useApp();
  const [q, setQ] = React.useState("");
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Отслеживание размера окна для адаптивности
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  const filtered = React.useMemo(() => {
    const itemsArray = Array.isArray(items) ? items : [];
    const qq = q.trim().toLowerCase();
    if (!qq) return itemsArray;
    return itemsArray.filter(
      (e) =>
        String(e.name || e.number || "").toLowerCase().includes(qq) ||
        String(e.description || "").toLowerCase().includes(qq)
    );
  }, [items, q]);

  const handleDelete = (id, name) => {
    modal.confirm({
      title: 'Удалить созыв?',
      content: `Вы уверены, что хотите удалить созыв "${name || 'без названия'}"? Это действие нельзя отменить.`,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await onDelete?.(id);
        } catch (e) {
          console.error('Ошибка удаления:', e);
        }
      },
    });
  };

  // Десктопная версия - таблица
  const columns = [
    {
      title: "Созыв",
      dataIndex: "number",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8, flexWrap: 'wrap' }}>
            {row.name || row.number || "Созыв"}
            {row.isActive !== false ? (
              <Tag color="green">Активный</Tag>
            ) : (
              <Tag color="default">Архив</Tag>
            )}
          </div>
          {row.description ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              {String(row.description).slice(0, 160)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Статус",
      dataIndex: "isActive",
      width: 120,
      render: (isActive) =>
        isActive ? (
          <Tag color="green">Активный</Tag>
        ) : (
          <Tag color="default">Архив</Tag>
        ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 240,
      render: (_, row) => (
        <Space wrap>
          <Button
            size={isTablet ? "middle" : "small"}
            disabled={!canWrite}
            onClick={() =>
              navigate(`/admin/convocations/edit/${encodeURIComponent(String(row.id))}`)
            }
          >
            Редактировать
          </Button>
          <Button 
            danger 
            size={isTablet ? "middle" : "small"}
            disabled={!canWrite} 
            onClick={() => handleDelete(row.id, row.name || row.number)}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-grid">
      {/* Панель инструментов */}
      <div 
        className="admin-card admin-toolbar" 
        style={{
          padding: isMobile ? '16px' : '20px 24px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '16px',
          alignItems: isMobile ? 'stretch' : 'center',
        }}
      >
        <Input
          placeholder="Поиск по номеру или описанию..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isMobile ? "large" : "middle"}
          style={{
            flex: isMobile ? 'none' : 1,
            width: isMobile ? '100%' : 'auto',
          }}
        />
        <Button
          type="primary"
          onClick={() => navigate("/admin/convocations/create")}
          disabled={!canWrite}
          loading={busy}
          size={isMobile ? "large" : "middle"}
          block={isMobile}
          style={{
            minWidth: isMobile ? 'auto' : '160px',
            fontWeight: 600,
          }}
        >
          + Добавить созыв
        </Button>
      </div>

      {/* Список - адаптивный */}
      {isMobile ? (
        // Мобильная версия - карточки
        <div className="admin-card" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'rgba(0,0,0,0.45)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Нет созывов</div>
              <div style={{ fontSize: 14 }}>Создайте первый созыв</div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}>
              {filtered.map((row, index) => (
                <div
                  key={String(row.id)}
                  style={{
                    padding: '20px 16px',
                    borderBottom: index < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    background: 'white',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Заголовок и статус */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: 16,
                          marginBottom: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}>
                          <span>{row.name || row.number || "Созыв"}</span>
                          {row.isActive !== false ? (
                            <Tag color="green" style={{ margin: 0 }}>Активный</Tag>
                          ) : (
                            <Tag color="default" style={{ margin: 0 }}>Архив</Tag>
                          )}
                        </div>
                        {row.description && (
                          <div style={{
                            opacity: 0.7,
                            fontSize: 14,
                            lineHeight: 1.5,
                            marginTop: 4,
                          }}>
                            {String(row.description).slice(0, 120)}
                            {String(row.description).length > 120 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}>
                      <Button
                        block
                        disabled={!canWrite}
                        onClick={() =>
                          navigate(`/admin/convocations/edit/${encodeURIComponent(String(row.id))}`)
                        }
                        style={{
                          flex: 1,
                          minWidth: '120px',
                        }}
                      >
                        Редактировать
                      </Button>
                      <Button
                        danger
                        block
                        disabled={!canWrite}
                        onClick={() => handleDelete(row.id, row.name || row.number)}
                        style={{
                          flex: 1,
                          minWidth: '120px',
                        }}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Десктопная версия - таблица
        <div className="admin-card admin-table" style={{
          overflowX: 'auto',
        }}>
          <Table
            rowKey={(r) => String(r.id)}
            columns={columns}
            dataSource={filtered}
            pagination={{
              pageSize: isTablet ? 8 : 10,
              showSizeChanger: false,
              showTotal: (total) => `Всего: ${total}`,
              responsive: true,
            }}
            scroll={isTablet ? { x: 'max-content' } : undefined}
          />
        </div>
      )}
    </div>
  );
}

