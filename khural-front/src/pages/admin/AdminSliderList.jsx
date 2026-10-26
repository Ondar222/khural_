import React from "react";
import { App, Button, Input, Modal, Space, Table, Switch, Tooltip, Upload } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useHashRoute } from "../../Router.jsx";
import { useData } from "../../context/DataContext.jsx";
import { SliderApi } from "../../api/client.js";
import { stripHtmlTags } from "../../utils/html.js";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { CameraIcon } from "../../components/icons/LinearIcons.jsx";

/** Показ только текста без тегов и сущностей (<p>, &ndash; и т.д.) */
function plainText(html) {
  if (html == null || html === "") return "";
  const s = stripHtmlTags(String(html));
  return s.replace(/\s+/g, " ").trim();
}

/** Первые N слов + … */
function shortText(html, words = 3) {
  const text = plainText(html);
  if (!text) return "";
  const parts = text.split(/\s+/);
  if (parts.length <= words) return text;
  return parts.slice(0, words).join(" ") + "…";
}

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
      width: 52,
      align: 'center',
      render: (_, __, i) => (
        <span 
          className="admin-slider-cell__index"
          style={{
            display: "block",
            textAlign: "center",
            opacity: 0.55,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {i + 1}
        </span>
      ),
    },
    {
      title: "Картинка",
      dataIndex: "image",
      width: 116,
      render: (v) =>
        normalizeFilesUrl(String(v || "")) ? (
          <img
            src={normalizeFilesUrl(String(v || ""))}
            alt=""
            style={{ width: 88, height: 50, objectFit: "cover", borderRadius: 6, display: "block" }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span style={{ display: "inline-flex", opacity: 0.3 }}>
            <CameraIcon size={18} />
          </span>
        ),
    },
    {
      title: "Слайд",
      dataIndex: "title",
      width: 340,
      render: (_, row) => {
        const title = plainText(row.title);
        const desc = plainText(row.description);
        const url = String(row.url || "");
        return (
          <div 
            className="admin-slider-cell"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            <div 
              className="admin-slider-cell__title" 
              title={title}
              style={{
                fontWeight: 700,
                fontSize: 14,
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              {shortText(row.title, 6) || "(без заголовка)"}
            </div>
            {desc ? (
              <div 
                className="admin-slider-cell__desc" 
                title={desc}
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.4,
                  opacity: 0.6,
                  margin: 0,
                }}
              >
                {shortText(row.description, 3)}
              </div>
            ) : null}
            {url ? (
              <div 
                className="admin-slider-cell__url" 
                title={url}
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.3,
                  opacity: 0.45,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  margin: 0,
                }}
              >
                {url.length > 40 ? `${url.slice(0, 40)}…` : url}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Активен",
      dataIndex: "isActive",
      width: 96,
      align: "center",
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
        <Space size={4} className="admin-slider-cell__actions">
          <Tooltip title="Редактировать">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              disabled={!canWrite}
              onClick={() => navigate(`/admin/slider/edit/${encodeURIComponent(String(row.id))}`)}
            />
          </Tooltip>

          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              if (!canWrite) return false;
              onUploadImage?.(row.id, file);
              return false;
            }}
          >
            <Tooltip title="Загрузить картинку">
              <Button size="small" type="text" icon={<UploadOutlined />} disabled={!canWrite} />
            </Tooltip>
          </Upload>

          <Tooltip title="Выше">
            <Button
              size="small"
              type="text"
              icon={<ArrowUpOutlined />}
              disabled={!canWrite}
              onClick={() => moveRow(row.id, -1)}
            />
          </Tooltip>
          <Tooltip title="Ниже">
            <Button
              size="small"
              type="text"
              icon={<ArrowDownOutlined />}
              disabled={!canWrite}
              onClick={() => moveRow(row.id, +1)}
            />
          </Tooltip>

          <Tooltip title="Удалить">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={!canWrite}
              onClick={() => handleDelete(row.id, row.title)}
            />
          </Tooltip>
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
            {filtered.map((row, index) => {
              const imgSrc = normalizeFilesUrl(String(row.image || ""));
              return (
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
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                        <span style={{ display: "inline-flex", opacity: 0.3 }}><CameraIcon size={20} /></span>
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
                        {plainText(row.title) || "(без заголовка)"}
                      </div>
                    </div>
                    {row.description ? (
                      <div style={{
                        opacity: 0.65,
                        fontSize: '13px',
                        lineHeight: 1.4,
                        marginTop: '3px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {shortText(row.description, 3)}
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
              );
            })}
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

      <div className="admin-card admin-table admin-slider-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          tableLayout="fixed"
        />
      </div>
    </div>
  );
}


