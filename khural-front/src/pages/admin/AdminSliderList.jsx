import React from "react";
import { App, Button, Input, Modal, Space, Table, Switch, Upload } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { useData } from "../../context/DataContext.jsx";
import { SliderApi } from "../../api/client.js";

export default function AdminSliderList({
  items,
  onUpdate,
  onDelete,
  onUploadImage,
  onReorder,
  busy,
  canWrite,
}) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const publicData = useData();
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState([]);
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

  React.useEffect(() => {
    const sorted = (Array.isArray(items) ? items : [])
      .slice()
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
    setRows(sorted);
  }, [items]);

  const maxReached = rows.length >= 5;

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((s) => String(s?.title || "").toLowerCase().includes(qq));
  }, [rows, q]);

  const applyReorder = React.useCallback(
    async (nextRows) => {
      const prevRows = rows;
      setRows(nextRows);
      const ids = nextRows.map((r) => String(r.id));
      try {
        await onReorder?.(ids);
      } catch (e) {
        message.error(e?.message || "Не удалось сохранить порядок");
        // Revert UI if backend reorder failed (we require persistence)
        setRows(prevRows);
      }
    },
    [onReorder, message, rows]
  );

  const moveRow = React.useCallback(
    async (id, dir) => {
      const idx = rows.findIndex((r) => String(r.id) === String(id));
      if (idx < 0) return;
      const j = idx + dir;
      if (j < 0 || j >= rows.length) return;
      const next = rows.slice();
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      await applyReorder(next);
    },
    [rows, applyReorder]
  );

  const handleDelete = React.useCallback((id, title) => {
    Modal.confirm({
      title: 'Удалить слайд?',
      content: `Вы уверены, что хотите удалить слайд "${title || 'без названия'}"?`,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: () => onDelete?.(id),
    });
  }, [onDelete]);

  const columns = [
    {
      title: "№",
      width: 64,
      align: 'center',
      render: (_, __, i) => <span style={{ opacity: 0.75, display: 'block', textAlign: 'center' }}>{i + 1}</span>,
    },
    {
      title: "Картинка",
      dataIndex: "image",
      width: 120,
      render: (v) =>
        v ? (
          <img
            src={v}
            alt=""
            style={{ width: 96, height: 54, objectFit: "cover", borderRadius: 8 }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          "—"
        ),
    },
    {
      title: "Слайд",
      dataIndex: "title",
      width: windowWidth > 1024 ? 600 : undefined,
      ellipsis: false,
      render: (_, row) => (
        <div 
          className="admin-slider-title-cell"
          style={{ 
            display: "grid", 
            gap: 6,
            maxWidth: windowWidth > 1024 ? "600px" : "100%",
            width: windowWidth > 1024 ? "600px" : "100%",
            overflowWrap: "break-word", 
            wordWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "normal",
            overflow: "hidden",
            boxSizing: "border-box"
          }}
        >
          <div style={{ fontWeight: 800, lineHeight: "1.4" }}>{row.title || "(без заголовка)"}</div>
          {row.description ? (
            <div style={{ 
              opacity: 0.75, 
              fontSize: 13, 
              lineHeight: "1.4",
              overflowWrap: "break-word",
              wordWrap: "break-word",
              whiteSpace: "normal"
            }}>
              {String(row.description)}
            </div>
          ) : null}
          {row.url ? (
            <div style={{ opacity: 0.65, fontSize: 12, lineHeight: "1.4" }}>
              Ссылка: <code style={{ wordBreak: "break-all" }}>{row.url}</code>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Активен",
      dataIndex: "isActive",
      width: 120,
      render: (v, row) => (
        <Switch
          checked={Boolean(v)}
          disabled={!canWrite}
          onChange={(checked) =>
            onUpdate?.(row.id, {
              title: row.title,
              description: row.description,
              url: row.url,
              isActive: checked,
            })
          }
        />
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 180,
      render: (_, row) => (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Button
            size="small"
            disabled={!canWrite}
            onClick={() => navigate(`/admin/slider/edit/${encodeURIComponent(String(row.id))}`)}
            block
          >
            Редактировать
          </Button>

          <Upload
            showUploadList={false}
            accept={undefined}
            beforeUpload={(file) => {
              if (!canWrite) return false;
              onUploadImage?.(row.id, file);
              return false;
            }}
          >
            <Button size="small" disabled={!canWrite} block>
              Картинка
            </Button>
          </Upload>

          <Space size="small" style={{ width: "100%" }}>
            <Button
              size="small"
              disabled={!canWrite}
              onClick={() => moveRow(row.id, -1)}
              style={{ flex: 1 }}
            >
              ↑
            </Button>
            <Button
              size="small"
              disabled={!canWrite}
              onClick={() => moveRow(row.id, +1)}
              style={{ flex: 1 }}
            >
              ↓
            </Button>
          </Space>

          <Button
            danger
            size="small"
            disabled={!canWrite}
            onClick={() => handleDelete(row.id, row.title)}
            block
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  // Адаптивные карточки для мобильных
  if (isMobile) {
    return (
      <div className="admin-grid" style={{
        maxWidth: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div className="admin-card admin-toolbar" style={{
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <Input
            placeholder="Поиск по заголовку..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="admin-input"
            size="large"
            style={{ width: '100%' }}
          />
          <Button
            type="primary"
            onClick={() => {
              if (maxReached) {
                message.error("Максимум 5 слайдов. Удалите существующий слайд, чтобы добавить новый.");
                return;
              }
              navigate("/admin/slider/create");
            }}
            disabled={!canWrite || maxReached}
            loading={busy}
            block
            size="large"
            style={{ fontWeight: 600 }}
          >
            + Добавить слайд
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-card" style={{
            padding: '32px 16px',
            textAlign: 'center',
            opacity: 0.6,
          }}>
            {q ? 'Слайды не найдены' : 'Слайды отсутствуют'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((row, index) => (
              <div
                key={String(row.id)}
                className="admin-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {row.image ? (
                      <img
                        src={row.image}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '20px', opacity: 0.3 }}>📷</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                      justifyContent: 'center',
                    }}>
                      <span style={{
                        opacity: 0.6,
                        fontSize: '12px',
                        fontWeight: 600,
                        textAlign: 'center',
                        flexShrink: 0,
                      }}>№{index + 1}</span>
                      <div style={{
                        fontWeight: 800,
                        fontSize: '16px',
                        lineHeight: 1.3,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        textAlign: 'center',
                        flex: 1,
                      }}>
                        {row.title || "(без заголовка)"}
                      </div>
                    </div>
                    {row.description ? (
                      <div style={{
                        opacity: 0.75,
                        fontSize: '13px',
                        lineHeight: 1.5,
                        marginTop: '4px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        textAlign: 'center',
                      }}>
                        {String(row.description)}
                      </div>
                    ) : null}
                    {row.url ? (
                      <div style={{
                        opacity: 0.65,
                        fontSize: '11px',
                        marginTop: '4px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        textAlign: 'center',
                      }}>
                        <code style={{
                          background: 'rgba(0,0,0,0.05)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}>{row.url}</code>
                      </div>
                    ) : null}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                }}>
                  <Switch
                    checked={Boolean(row.isActive)}
                    disabled={!canWrite}
                    onChange={(checked) =>
                      onUpdate?.(row.id, {
                        title: row.title,
                        description: row.description,
                        url: row.url,
                        isActive: checked,
                      })
                    }
                  />
                  <span style={{
                    fontSize: '13px',
                    opacity: 0.7,
                    flex: 1,
                  }}>
                    {row.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  <Button
                    size="small"
                    block={!isMobile}
                    disabled={!canWrite}
                    onClick={() => navigate(`/admin/slider/edit/${encodeURIComponent(String(row.id))}`)}
                    style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 1 auto' }}
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="small"
                    block={!isMobile}
                    disabled={!canWrite}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files?.[0];
                        if (file && canWrite) onUploadImage?.(row.id, file);
                      };
                      input.click();
                    }}
                    style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 1 auto' }}
                  >
                    Картинка
                  </Button>
                  <Button
                    size="small"
                    disabled={!canWrite || index === 0}
                    onClick={() => moveRow(row.id, -1)}
                    style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 1 auto' }}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    disabled={!canWrite || index === filtered.length - 1}
                    onClick={() => moveRow(row.id, +1)}
                    style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 1 auto' }}
                  >
                    ↓
                  </Button>
                  <Button
                    danger
                    size="small"
                    block={isMobile}
                    disabled={!canWrite}
                    onClick={() => handleDelete(row.id, row.title)}
                    style={{ flex: isMobile ? '1 1 100%' : '0 1 auto' }}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid" style={{
      maxWidth: '100%',
      width: '100%',
      margin: 0,
      padding: 0,
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по заголовку..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button
            type="primary"
            onClick={() => {
              if (maxReached) {
                message.error("Максимум 5 слайдов. Удалите существующий слайд, чтобы добавить новый.");
                return;
              }
              navigate("/admin/slider/create");
            }}
            disabled={!canWrite || maxReached}
            loading={busy}
          >
            + Добавить слайд
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          scroll={windowWidth > 1024 ? { x: "max-content" } : undefined}
        />
      </div>
    </div>
  );
}


