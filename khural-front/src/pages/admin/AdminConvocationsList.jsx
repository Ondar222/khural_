import React from "react";
import { Button, Input, Space, Table, Tag, App } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { normalizeBool } from "../../utils/bool.js";
import { ClipboardIcon } from "../../components/icons/LinearIcons.jsx";
import { getConvocationNumber } from "../../utils/convocationIdentity.js";

export default function AdminConvocationsList({ items, committees = [], onDelete, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const { modal } = App.useApp();
  const [q, setQ] = React.useState("");
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  // Получаем комитеты для созыва
  const getCommitteesForConvocation = React.useCallback((convocationId) => {
    if (convocationId == null || convocationId === "") return [];
    const target = String(convocationId).trim();
    const ordinal = getConvocationNumber(convocationId);
    return committees.filter((committee) => {
      const committeeConvocation =
        committee?.convocation?.id ??
        committee?.convocationComittees?.id ??
        committee?.convocationId ??
        committee?.convocation_id ??
        committee?.convocation;
      const relatedId =
        committeeConvocation && typeof committeeConvocation === "object"
          ? committeeConvocation.id
          : committeeConvocation;
      return (
        relatedId != null &&
        (String(relatedId).trim() === target ||
          (ordinal && getConvocationNumber(committeeConvocation) === ordinal))
      );
    });
  }, [committees]);

  // Отслеживание размера окна для адаптивности
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  const formatConvocationLabel = React.useCallback((row) => {
    const raw = String(row?.name || row?.number || "").trim();
    if (!raw) return "Созыв";
    const low = raw.toLowerCase();
    if (low.includes("созыв")) return raw;
    return `Созыв ${raw}`;
  }, []);

  // Функция для удаления HTML тегов из текста
  const stripHtmlTags = React.useCallback((html) => {
    if (!html) return "";
    const text = String(html);
    // Создаем временный элемент для извлечения текста
    if (typeof document !== "undefined") {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = text;
      return tmp.textContent || tmp.innerText || text.replace(/<[^>]*>/g, "");
    }
    // Fallback для SSR
    return text.replace(/<[^>]*>/g, "");
  }, []);

  const isConvocationActive = React.useCallback(
    (row) => normalizeBool(row?.isActive, true) !== false,
    []
  );

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
            {formatConvocationLabel(row)}
            {isConvocationActive(row) ? (
              <Tag color="green">Активный</Tag>
            ) : (
              <Tag color="default">Архив</Tag>
            )}
          </div>
          {row.description ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              {stripHtmlTags(row.description).slice(0, 160)}
            </div>
          ) : null}
          {row.years ? (
            <div style={{ fontSize: 13, color: "#475569" }}>Период: {row.years}</div>
          ) : null}
          {row.stats ? (
            <div style={{ fontSize: 13, color: "#475569" }}>
              Депутатов: {row.stats.deputies ?? "—"} · Законов: {row.stats.laws ?? "—"} ·
              Постановлений: {row.stats.resolutions ?? "—"}
            </div>
          ) : null}
          {getCommitteesForConvocation(row.id).length > 0 ? (
            <div style={{ fontSize: 13, color: "#475569" }}>
              Комитетов: {getCommitteesForConvocation(row.id).length}
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
        normalizeBool(isActive, true) !== false ? (
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
              <div style={{ marginBottom: 16 }}><ClipboardIcon size={48} /></div>
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
                          <span>{formatConvocationLabel(row)}</span>
                          {isConvocationActive(row) ? (
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
                            {stripHtmlTags(row.description).slice(0, 120)}
                            {stripHtmlTags(row.description).length > 120 ? '...' : ''}
                          </div>
                        )}
                        {row.years ? (
                          <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
                            Период: {row.years}
                          </div>
                        ) : null}
                        {row.stats ? (
                          <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
                            Депутатов: {row.stats.deputies ?? "—"} · Законов: {row.stats.laws ?? "—"} ·
                            Постановлений: {row.stats.resolutions ?? "—"}
                          </div>
                        ) : null}
                        {getCommitteesForConvocation(row.id).length > 0 ? (
                          <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
                            Комитетов: {getCommitteesForConvocation(row.id).length}
                          </div>
                        ) : null}
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
