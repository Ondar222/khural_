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

export default function AdminNews({ items, onCreate, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [editOpen, setEditOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [editFile, setEditFile] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [editForm] = Form.useForm();

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
          // eslint-disable-next-line no-await-in-loop
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
          // eslint-disable-next-line no-await-in-loop
          await handleDelete(row);
        }
      },
    });
  }, [filtered, handleDelete, message, canWrite]);

  const columns = [
    {
      title: "Заголовок",
      dataIndex: "content",
      render: (_, row) => {
        const ru = pickRu(row.content);
        return (
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>{ru?.title || "(без названия)"}</div>
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              {String(ru?.description || "").slice(0, 140)}
            </div>
          </div>
        );
      },
    },
    {
      title: "Дата",
      dataIndex: "createdAt",
      width: 160,
      render: (v) => {
        const d = v ? new Date(v) : null;
        return d ? d.toLocaleDateString() : "—";
      },
    },
    {
      title: "Медиа",
      dataIndex: "images",
      width: 120,
      render: (v) => (Array.isArray(v) && v.length ? <Tag color="blue">есть</Tag> : "—"),
    },
    {
      title: "Действия",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space wrap>
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

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по заголовку..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button type="primary" onClick={() => navigate("/admin/news/create")} disabled={!canWrite}>
            + Добавить новость
          </Button>
          <Button onClick={deleteEmptyTitles} disabled={!canWrite}>
            Удалить без заголовка
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 8 }}
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



