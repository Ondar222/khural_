import React from "react";
import { App, Button, Input, Modal, Form, Upload, Space, Table, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useHashRoute } from "../../Router.jsx";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { CameraIcon } from "../../components/icons/LinearIcons.jsx";

function pickRu(content) {
  const arr = Array.isArray(content) ? content : [];
  return (
    arr.find((x) => String(x?.locale || x?.lang || "").toLowerCase() === "ru") || arr[0] || null
  );
}

function toKey(row) {
  const r = row && typeof row === "object" ? row : {};
  // Prefer stable backend fields when present
  const key =
    r.slug ||
    r.newsId ||
    r.news_id ||
    r.parentId ||
    r.parent_id ||
    r.entityId ||
    r.entity_id ||
    "";
  if (String(key).trim()) return `news:${String(key).trim()}`;
  const ru = pickRu(r.content);
  const title = String(ru?.title || r.title || "").trim().toLowerCase();
  const date = String(r.publishedAt || r.published_at || r.createdAt || r.created_at || "").trim();
  return `news:${title}|${date}`;
}

/** Показ только текста без тегов и сущностей (<p>, &ndash; и т.д.) */
function plainText(html) {
  if (html == null || html === "") return "";
  const s = String(html).replace(/<[^>]+>/g, "");
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

export default function AdminNews({ items, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [editOpen, setEditOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [editFile, setEditFile] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [editForm] = Form.useForm();
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  // Отслеживание размера окна для адаптивности
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const grouped = React.useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const mp = new Map();
    for (const n of list) {
      const k = toKey(n);
      const prev = mp.get(k);
      if (!prev) {
        mp.set(k, { ...n, __ids: [n.id].filter(Boolean) });
      } else {
        const ids = Array.isArray(prev.__ids) ? prev.__ids : [];
        const nextIds = [...ids, n.id].filter(Boolean).map(String);
        // Keep the first item as representative, but remember all ids for delete
        mp.set(k, { ...prev, __ids: Array.from(new Set(nextIds)) });
      }
    }
    return Array.from(mp.values());
  }, [items]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return grouped;
    return (grouped || []).filter((n) => {
      const ru = pickRu(n.content);
      const t = String(ru?.title || n.title || "").toLowerCase();
      return t.includes(qq);
    });
  }, [grouped, q]);

  const handleDelete = React.useCallback(
    async (row) => {
      if (!canWrite) return;
      const ids = Array.isArray(row?.__ids) && row.__ids.length ? row.__ids : [row?.id].filter(Boolean);
      if (!ids.length) return;
      const key = `del-${Date.now()}`;
      message.loading({ content: `Удаляем (${ids.length})…`, key, duration: 0 });
      let ok = 0;
      let fail = 0;
      for (const id of ids) {
        try {
          await onDelete?.(id);
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      if (fail === 0) message.success({ content: `Удалено: ${ok}`, key });
      else message.warning({ content: `Удалено: ${ok}, ошибок: ${fail}`, key });
    },
    [onDelete, message, canWrite]
  );

  const deleteEmptyTitles = React.useCallback(async () => {
    if (!canWrite) return;
    const targets = (filtered || []).filter((n) => {
      const ru = pickRu(n.content);
      const title = String(ru?.title || n.title || "").trim();
      return !title;
    });
    if (!targets.length) {
      message.info("Записей без заголовка не найдено");
      return;
    }
    Modal.confirm({
      title: "Удалить записи без заголовка?",
      content: `Будет удалено ${targets.length} записей (включая дубли по языкам/связям).`,
      okText: "Удалить",
      cancelText: "Отмена",
      onOk: async () => {
        for (const row of targets) {
          await handleDelete(row);
        }
      },
    });
  }, [filtered, handleDelete, message, canWrite]);

  const formatDate = React.useCallback((row) => {
    const v = row?.publishedAt || row?.published_at || row?.createdAt || row?.created_at;
    const d = v ? new Date(v) : null;
    return d ? d.toLocaleDateString("ru-RU") : "—";
  }, []);

  const mediaTag = React.useCallback((row) => {
    const images = Array.isArray(row?.images) ? row.images : row?.image ? [row.image] : [];
    if (images.length) {
      return (
        <img
          src={normalizeFilesUrl(String(images[0] || ""))}
          alt=""
          style={{ width: 88, height: 50, objectFit: "cover", borderRadius: 6, display: "block" }}
          loading="lazy"
          decoding="async"
        />
      );
    }
    return <span style={{ display: "inline-flex", opacity: 0.3 }}><CameraIcon size={18} /></span>;
  }, []);

  const renderCell = React.useCallback((row) => {
    const ru = pickRu(row.content);
    const title = String(ru?.title || row.title || "").trim();
    const desc = String(ru?.description || "");
    const url = String(ru?.link || row?.url || "");
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
          {shortText(ru?.title || row.title, 6) || "(без заголовка)"}
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
            {shortText(desc, 3)}
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
  }, []);

  const columns = [
    {
      title: "№",
      width: 52,
      align: "center",
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
      title: "Изображение",
      dataIndex: "images",
      width: 116,
      render: (_, row) => mediaTag(row),
    },
    {
      title: "Заголовок",
      dataIndex: "content",
      width: 340,
      render: (_, row) => renderCell(row),
    },
    {
      title: "Дата",
      dataIndex: "createdAt",
      width: 170,
      render: (_, row) => formatDate(row),
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
              onClick={() => {
                navigate(`/admin/news/edit/${row.id}`);
              }}
            />
          </Tooltip>

          <Tooltip title="Удалить">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={!canWrite}
              onClick={() => handleDelete(row)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const toolbar = isMobile ? (
    <div
      className="admin-card admin-toolbar"
      style={{ padding: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <Input
        placeholder="Поиск по заголовку..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="admin-input"
        size="large"
        style={{ width: "100%" }}
      />
      <Button
        type="primary"
        onClick={() => navigate("/admin/news/create")}
        disabled={!canWrite}
        loading={busy}
        block
        size="large"
        style={{ fontWeight: 600 }}
      >
        + Добавить новость
      </Button>
    </div>
  ) : (
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
          onClick={() => navigate("/admin/news/create")}
          disabled={!canWrite}
          loading={busy}
        >
          + Добавить новость
        </Button>
      </Space>
    </div>
  );

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await onUpdate?.(editing?.id, {
        titleRu: values.titleRu,
        descRu: values.descRu,
        imageFile: editFile,
      });
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
      setEditFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось обновить новость");
    }
  };

  if (isMobile) {
    return (
      <div
        className="admin-grid admin-news-list"
        style={{ maxWidth: "100%", width: "100%", margin: 0, padding: 0, overflowX: "hidden", boxSizing: "border-box" }}
      >
        {toolbar}

        {filtered.length === 0 ? (
          <div className="admin-card" style={{ padding: "32px 16px", textAlign: "center", opacity: 0.6 }}>
            {q ? "Новости не найдены" : "Новости отсутствуют"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((row, index) => {
              const ru = pickRu(row.content);
              const title = String(ru?.title || row.title || "").trim() || "(без названия)";
              const desc = String(ru?.description || "");
              const images = Array.isArray(row?.images) ? row.images : row?.image ? [row.image] : [];
              const img = images.length ? normalizeFilesUrl(String(images[0] || "")) : "";
              return (
                <div
                  key={String(row.id)}
                  className="admin-card"
                  style={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        flexShrink: 0,
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {img ? (
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ display: "inline-flex", opacity: 0.3 }}><CameraIcon size={20} /></span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", justifyContent: "center" }}>
                        <span style={{ opacity: 0.6, fontSize: "12px", fontWeight: 600, textAlign: "center", flexShrink: 0 }}>№{index + 1}</span>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "16px",
                            lineHeight: 1.3,
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            textAlign: "center",
                            flex: 1,
                          }}
                        >
                          {title}
                        </div>
                      </div>
                      {desc ? (
                        <div
                          style={{
                            opacity: 0.65,
                            fontSize: "13px",
                            lineHeight: 1.4,
                            marginTop: "3px",
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {shortText(desc, 3)}
                        </div>
                      ) : null}
                      <div style={{ opacity: 0.65, fontSize: "12px", marginTop: "4px", textAlign: "center" }}>
                        {formatDate(row)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", flex: 1 }}>
                      <Button
                        size="small"
                        disabled={!canWrite}
                        onClick={() => navigate(`/admin/news/edit/${row.id}`)}
                        style={{ flex: isMobile ? "1 1 calc(50% - 4px)" : "0 1 auto" }}
                      >
                        Редактировать
                      </Button>
                      <Button
                        danger
                        size="small"
                        block={isMobile}
                        disabled={!canWrite}
                        onClick={() => handleDelete(row)}
                        style={{ flex: isMobile ? "1 1 100%" : "0 1 auto" }}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          title="Редактировать новость"
          open={editOpen}
          onCancel={() => {
            setEditOpen(false);
            setEditing(null);
            setEditFile(null);
          }}
          onOk={submitEdit}
          okText="Сохранить"
          confirmLoading={busy}
          okButtonProps={{ disabled: !canWrite }}
        >
          <Form layout="vertical" form={editForm}>
            <Form.Item label="Заголовок (RU)" name="titleRu" rules={[{ required: true, message: "Укажите заголовок" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Краткое описание (RU)" name="descRu" rules={[{ required: true, message: "Укажите описание" }]}>
              <Input.TextArea autoSize={{ minRows: 5, maxRows: 10 }} />
            </Form.Item>

            <Form.Item label="Добавить/обновить обложку (опционально)">
              <Upload
                accept="image/*"
                maxCount={1}
                beforeUpload={(f) => {
                  setEditFile(f);
                  return false;
                }}
                onRemove={() => setEditFile(null)}
              >
                <Button>Загрузить</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  return (
    <div
      className="admin-grid admin-news-list"
      style={{ maxWidth: "100%", width: "100%", margin: 0, padding: 0, overflowX: "hidden", boxSizing: "border-box" }}
    >
      {toolbar}

      <div className="admin-card admin-table admin-slider-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          tableLayout="fixed"
        />
      </div>

      <Modal
        title="Редактировать новость"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
          setEditFile(null);
        }}
        onOk={submitEdit}
        okText="Сохранить"
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite }}
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item
            label="Заголовок (RU)"
            name="titleRu"
            rules={[{ required: true, message: "Укажите заголовок" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Краткое описание (RU)"
            name="descRu"
            rules={[{ required: true, message: "Укажите описание" }]}
          >
            <Input.TextArea autoSize={{ minRows: 5, maxRows: 10 }} />
          </Form.Item>

          <Form.Item label="Добавить/обновить обложку (опционально)">
            <Upload
              accept="image/*"
              maxCount={1}
              beforeUpload={(f) => {
                setEditFile(f);
                return false;
              }}
              onRemove={() => setEditFile(null)}
            >
              <Button>Загрузить</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
