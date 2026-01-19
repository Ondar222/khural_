import React from "react";
import { App, Button, Input, Modal, Form, Upload, Space, Table, Tag } from "antd";
import { useHashRoute } from "../../Router.jsx";

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

export default function AdminNews({ items, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [editOpen, setEditOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [editFile, setEditFile] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [editForm] = Form.useForm();
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

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
    const v = row?.createdAt || row?.created_at || row?.publishedAt || row?.published_at;
    const d = v ? new Date(v) : null;
    return d ? d.toLocaleDateString("ru-RU") : "—";
  }, []);

  const mediaTag = React.useCallback((row) => {
    const v = row?.images;
    return Array.isArray(v) && v.length ? <Tag color="blue">есть</Tag> : "—";
  }, []);

  const renderTitleCell = React.useCallback((row) => {
    const ru = pickRu(row.content);
    const title = ru?.title || row.title || "(без названия)";
    const desc = String(ru?.description || "").replace(/<[^>]+>/g, "").slice(0, 140);
    return (
      <div className="admin-news-list__titlecell">
        <div className="admin-news-list__title">{title}</div>
        {desc ? <div className="admin-news-list__desc">{desc}</div> : null}
      </div>
    );
  }, []);

  const columns = [
    {
      title: "Заголовок",
      dataIndex: "content",
      render: (_, row) => renderTitleCell(row),
    },
    {
      title: "Дата",
      dataIndex: "createdAt",
      width: 160,
      render: (_, row) => formatDate(row),
    },
    {
      title: "Медиа",
      dataIndex: "images",
      width: 120,
      render: (_, row) => mediaTag(row),
    },
    {
      title: "Действия",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space wrap className="admin-news-list__actions">
          <Button
            onClick={() => {
              navigate(`/admin/news/edit/${row.id}`);
            }}
            disabled={!canWrite}
          >
            Редактировать
          </Button>
          <Button danger onClick={() => handleDelete(row)} disabled={!canWrite}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const toolbar = (
    <div className="admin-card admin-toolbar admin-news-list__toolbar">
      <div className="admin-news-list__toolbar-left">
        <Input
          placeholder="Поиск по заголовку..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isMobile ? "large" : "middle"}
        />
      </div>
      <div className="admin-news-list__toolbar-right">
        <Button type="primary" onClick={() => navigate("/admin/news/create")} disabled={!canWrite} size={isMobile ? "large" : "middle"}>
          + Добавить новость
        </Button>
   
      </div>
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
      <div className="admin-grid admin-news-list">
        {toolbar}

        {Array.isArray(filtered) && filtered.length ? (
          <div className="admin-cards admin-news-list__cards">
            {filtered.map((row) => (
              <div key={String(row.id)} className="admin-card admin-news-list__card">
                <div className="admin-news-list__card-head">
                  {renderTitleCell(row)}
                  <div className="admin-news-list__meta-row">
                    <div className="admin-news-list__meta">{formatDate(row)}</div>
                    <div className="admin-news-list__meta">{mediaTag(row)}</div>
                  </div>
                </div>

                <div className="admin-news-list__card-actions">
                  <Button onClick={() => navigate(`/admin/news/edit/${row.id}`)} disabled={!canWrite} block>
                    Редактировать
                  </Button>
                  <Button danger onClick={() => handleDelete(row)} disabled={!canWrite} block>
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card admin-news-list__empty">Нет данных</div>
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
    <div className="admin-grid admin-news-list">
      {toolbar}

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: 8,
            showSizeChanger: !isTablet,
            showQuickJumper: !isTablet,
            size: isTablet ? "small" : "default",
          }}
          scroll={isTablet ? { x: "max-content" } : undefined}
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



