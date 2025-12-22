import React from "react";
import { App, Button, Input, Modal, Form, Upload, Space, Table, Tag } from "antd";

function pickRu(content) {
  const arr = Array.isArray(content) ? content : [];
  return arr.find((x) => x?.lang === "ru") || arr[0] || null;
}

export default function AdminNews({ items, onCreate, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [editFile, setEditFile] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((n) => {
      const ru = pickRu(n.content);
      const t = String(ru?.title || n.title || "").toLowerCase();
      return t.includes(qq);
    });
  }, [items, q]);

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
              const ru = pickRu(row.content);
              const tu = Array.isArray(row.content) && row.content.find((x) => x?.lang === "tu");
              setEditing(row);
              editForm.setFieldsValue({
                titleRu: ru?.title || "",
                descRu: ru?.description || "",
                titleTu: tu?.title || "",
                descTu: tu?.description || "",
              });
              setEditFile(null);
              setEditOpen(true);
            }}
            disabled={!canWrite}
          >
            Редактировать
          </Button>
          <Button danger onClick={() => onDelete(row.id)} disabled={!canWrite}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const submit = async () => {
    try {
      const values = await form.validateFields();
      await onCreate({
        titleRu: values.titleRu,
        descRu: values.descRu,
        titleTu: values.titleTu || "",
        descTu: values.descTu || "",
        imageFile: file,
      });
      setOpen(false);
      form.resetFields();
      setFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось создать новость");
    }
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await onUpdate?.(editing?.id, {
        titleRu: values.titleRu,
        descRu: values.descRu,
        titleTu: values.titleTu || "",
        descTu: values.descTu || "",
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
          <Button type="primary" onClick={() => setOpen(true)} disabled={!canWrite} loading={busy}>
            + Добавить новость
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
        title="Добавить новость"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Добавить"
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite }}
      >
        <Form layout="vertical" form={form}>
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

          <div className="admin-split">
            <Form.Item label="Заголовок (TU)" name="titleTu">
              <Input />
            </Form.Item>
            <Form.Item label="Описание (TU)" name="descTu">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
            </Form.Item>
          </div>

          <Form.Item label="Обложка (опционально)">
            <Upload
              accept="image/*"
              maxCount={1}
              beforeUpload={(f) => {
                setFile(f);
                return false;
              }}
              onRemove={() => setFile(null)}
            >
              <Button>Загрузить</Button>
            </Upload>
          </Form.Item>
        </Form>
        {!canWrite ? (
          <div className="admin-hint">Для записи в API войдите (или настройте API базу).</div>
        ) : null}
      </Modal>

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

          <div className="admin-split">
            <Form.Item label="Заголовок (TU)" name="titleTu">
              <Input />
            </Form.Item>
            <Form.Item label="Описание (TU)" name="descTu">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
            </Form.Item>
          </div>

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



