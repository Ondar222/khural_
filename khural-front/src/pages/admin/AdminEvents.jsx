import React from "react";
import { App, Button, Input, Modal, Form, Space, Table } from "antd";

export default function AdminEvents({ items, onCreate, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((e) =>
      String(e.title || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [items, q]);

  const columns = [
    {
      title: "Событие",
      dataIndex: "title",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>{row.title}</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            {row.date} {row.time ? `· ${row.time}` : ""} {row.place ? `· ${row.place}` : ""}
          </div>
          {row.desc ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>{String(row.desc).slice(0, 160)}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Дата",
      dataIndex: "date",
      width: 140,
    },
    {
      title: "Действия",
      key: "actions",
      width: 240,
      render: (_, row) => (
        <Space wrap>
          <Button
            disabled={!canWrite}
            onClick={() => {
              setEditing(row);
              editForm.setFieldsValue({
                date: row.date,
                time: row.time,
                place: row.place,
                title: row.title,
                desc: row.desc,
              });
              setEditOpen(true);
            }}
          >
            Редактировать
          </Button>
          <Button danger disabled={!canWrite} onClick={() => onDelete(row.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const submit = async () => {
    try {
      const values = await form.validateFields();
      await onCreate(values);
      setOpen(false);
      form.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось создать событие");
    }
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await onUpdate(editing?.id, values);
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось обновить событие");
    }
  };

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по названию..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button type="primary" onClick={() => setOpen(true)} disabled={!canWrite} loading={busy}>
            + Добавить событие
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="Добавить событие"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Добавить"
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite }}
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ date: new Date().toISOString().slice(0, 10) }}
        >
          <Form.Item label="Дата" name="date" rules={[{ required: true, message: "Укажите дату" }]}>
            <Input type="date" />
          </Form.Item>
          <div className="admin-split">
            <Form.Item label="Время" name="time">
              <Input placeholder="10:00" />
            </Form.Item>
            <Form.Item label="Место" name="place">
              <Input placeholder="Зал заседаний" />
            </Form.Item>
          </div>
          <Form.Item
            label="Название"
            name="title"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="desc">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать событие"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onOk={submitEdit}
        okText="Сохранить"
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite }}
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item label="Дата" name="date" rules={[{ required: true, message: "Укажите дату" }]}>
            <Input type="date" />
          </Form.Item>
          <div className="admin-split">
            <Form.Item label="Время" name="time">
              <Input />
            </Form.Item>
            <Form.Item label="Место" name="place">
              <Input />
            </Form.Item>
          </div>
          <Form.Item
            label="Название"
            name="title"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="desc">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
