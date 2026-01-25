import React from "react";
import { Button, Input, Space, Table, Tag, App } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { normalizeBool } from "../../utils/bool.js";
import { CommitteesApi } from "../../api/client.js";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminConvocationsList({ items, onDelete, busy, canWrite }) {
  const adminData = useAdminData();
  const { navigate } = useHashRoute();
  const { modal } = App.useApp();
  const [q, setQ] = React.useState("");
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  // Используем комитеты из useAdminData, чтобы они автоматически обновлялись
  const committeesFromAdmin = adminData.committees || [];
  const [committees, setCommittees] = React.useState([]);

  // Логируем структуру созывов для отладки
  React.useEffect(() => {
    if (Array.isArray(items) && items.length > 0) {
      console.log("[AdminConvocationsList] Созывы:", items.map(c => ({
        id: c.id,
        id_type: typeof c.id,
        name: c.name,
        number: c.number,
      })));
    }
  }, [items]);

  // Загружаем комитеты напрямую из API для получения актуальных данных
  const loadCommittees = React.useCallback(async () => {
    try {
      const comms = await CommitteesApi.list({ all: true }).catch(() => []);
      const commsArray = Array.isArray(comms) ? comms : [];
      console.log("[AdminConvocationsList] Загружено комитетов из API:", commsArray.length);
      console.log("[AdminConvocationsList] Полный ответ API:", comms);
      
      // Логируем структуру ВСЕХ комитетов для отладки
      commsArray.forEach((c, idx) => {
        // Проверяем все возможные варианты полей для связи с созывом
        const allPossibleFields = {
          convocation: c.convocation,
          convocationId: c.convocationId,
          convocation_id: c.convocation_id,
          convocationNumber: c.convocationNumber,
          convocationNumberId: c.convocationNumberId,
        };
        
        console.log(`[AdminConvocationsList] Комитет ${idx + 1} (ID: ${c.id}):`, {
          id: c.id,
          name: c.name || c.title,
          ...allPossibleFields,
          allFields: Object.keys(c),
          fullObject: c,
        });
      });
      
      setCommittees(commsArray);
    } catch (error) {
      console.error("Failed to load committees:", error);
      // Fallback на данные из useAdminData
      setCommittees(committeesFromAdmin);
    }
  }, [committeesFromAdmin]);

  React.useEffect(() => {
    loadCommittees();
  }, [loadCommittees]);

  // Также используем комитеты из useAdminData как fallback
  React.useEffect(() => {
    if (committeesFromAdmin.length > 0 && committees.length === 0) {
      console.log("[AdminConvocationsList] Используем комитеты из useAdminData:", committeesFromAdmin.length);
      setCommittees(committeesFromAdmin);
    }
  }, [committeesFromAdmin, committees.length]);

  // Перезагружаем комитеты при фокусе на окне (например, после создания комитета)
  React.useEffect(() => {
    const handleFocus = () => {
      loadCommittees();
    };
    const handleReload = () => {
      loadCommittees();
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("khural:admin:reload", handleReload);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("khural:admin:reload", handleReload);
    };
  }, [loadCommittees]);

  // Получаем комитеты для созыва
  const getCommitteesForConvocation = React.useCallback((convocationId) => {
    if (!convocationId) {
      console.log("[AdminConvocationsList] getCommitteesForConvocation: convocationId пустой");
      return [];
    }
    
    console.log(`[AdminConvocationsList] Ищем комитеты для созыва ID: ${convocationId}, тип: ${typeof convocationId}`);
    console.log(`[AdminConvocationsList] Всего комитетов для проверки: ${committees.length}`);
    
    // Логируем все комитеты с их convocationId для отладки
    if (committees.length > 0) {
      console.log(`[AdminConvocationsList] Все комитеты и их convocationId:`, committees.map(c => ({
        id: c.id,
        name: c.name || c.title,
        convocationId: c.convocationId,
        convocation: c.convocation,
        convocation_type: typeof c.convocation,
        convocationId_type: typeof c.convocationId,
      })));
    }
    
    // Нормализуем ID созыва для сравнения
    const normalizedConvId = String(convocationId).trim();
    const numericConvId = Number(convocationId);
    
    const result = committees.filter(c => {
      // Проверяем все возможные варианты связи
      let cConvId = null;
      let source = null;
      
      // Вариант 1: вложенный объект convocation.id
      if (c?.convocation && typeof c.convocation === "object" && c.convocation.id !== undefined) {
        cConvId = c.convocation.id;
        source = "convocation.id";
      }
      // Вариант 2: прямое поле convocationId
      else if (c?.convocationId !== undefined && c?.convocationId !== null && c?.convocationId !== "") {
        cConvId = c.convocationId;
        source = "convocationId";
      }
      // Вариант 3: поле convocation_id (snake_case)
      else if (c?.convocation_id !== undefined && c?.convocation_id !== null && c?.convocation_id !== "") {
        cConvId = c.convocation_id;
        source = "convocation_id";
      }
      // Вариант 4: поле convocation как ID (не объект)
      else if (c?.convocation !== undefined && c?.convocation !== null && typeof c.convocation !== "object") {
        cConvId = c.convocation;
        source = "convocation (direct)";
      }
      
      if (cConvId === null || cConvId === undefined) {
        // Логируем комитеты без связи для отладки
        console.log(`[AdminConvocationsList] Комитет ${c.id} (${c.name || c.title}) не имеет связи с созывом:`, {
          convocation: c.convocation,
          convocationId: c.convocationId,
        });
        return false;
      }
      
      // Сравниваем как строки и как числа
      const cConvIdStr = String(cConvId).trim();
      const cConvIdNum = Number(cConvId);
      
      const matchStr = cConvIdStr === normalizedConvId;
      const matchNum = Number.isFinite(cConvIdNum) && Number.isFinite(numericConvId) && cConvIdNum === numericConvId;
      const match = matchStr || matchNum;
      
      if (match) {
        console.log(`[AdminConvocationsList] ✓ Найден комитет для созыва ${convocationId}:`, {
          committeeId: c.id,
          committeeName: c.name || c.title,
          cConvId,
          source,
          matchStr,
          matchNum,
        });
      } else {
        // Логируем несовпадения для отладки (только первые несколько)
        if (committees.indexOf(c) < 3) {
          console.log(`[AdminConvocationsList] Комитет ${c.id} не совпадает:`, {
            committeeId: c.id,
            cConvId,
            normalizedConvId,
            matchStr,
            matchNum,
            cConvIdStr,
            cConvIdNum,
            numericConvId,
          });
        }
      }
      
      return match;
    });
    
    console.log(`[AdminConvocationsList] Для созыва ${convocationId} найдено комитетов: ${result.length}`);
    return result;
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

