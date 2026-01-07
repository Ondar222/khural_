import React from "react";
import { App, Button, Input, Modal, Form, Space, Table, Switch, Upload } from "antd";

export default function AdminSlider({
  items,
  onCreate,
  onUpdate,
  onDelete,
  onUploadImage,
  onReorder,
  busy,
  canWrite,
}) {
  const { message } = App.useApp();
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const splitDateAndDescription = React.useCallback((desc) => {
    const s = String(desc || "");
    // Supports "Дата события: YYYY-MM-DD" or "Дата: YYYY-MM-DD" as the first line.
    const m = s.match(/^\s*(?:Дата события|Дата)\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*\n?/i);
    if (!m) return { date: "", description: s };
    const date = m[1] || "";
    const rest = s.slice(m[0].length);
    return { date, description: rest.trimStart() };
  }, []);

  const joinDateAndDescription = React.useCallback((date, description) => {
    const d = String(date || "").trim();
    const body = String(description || "").trim();
    if (!d) return body;
    return `Дата события: ${d}${body ? `\n${body}` : ""}`;
  }, []);

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

  const applyReorder = React.useCallback(async (nextRows) => {
    setRows(nextRows);
    const ids = nextRows.map((r) => String(r.id));
    try {
      await onReorder?.(ids);
    } catch (e) {
      message.error(e?.message || "Не удалось сохранить порядок");
    }
  }, [onReorder, message]);

  const moveRow = React.useCallback(async (id, dir) => {
    const idx = rows.findIndex((r) => String(r.id) === String(id));
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    await applyReorder(next);
  }, [rows, applyReorder]);

  const submit = async () => {
    try {
      if (maxReached) {
        message.error("Максимум 5 слайдов. Удалите или отключите существующий слайд, чтобы добавить новый.");
        return;
      }
      const values = await form.validateFields();
      await onCreate?.({
        title: values.title,
        description: joinDateAndDescription(values.date, values.description),
        url: values.url,
        isActive: values.isActive,
      });
      setOpen(false);
      form.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось создать слайд");
    }
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await onUpdate?.(editing?.id, {
        title: values.title,
        description: joinDateAndDescription(values.date, values.description),
        url: values.url,
        isActive: values.isActive,
      });
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось обновить слайд");
    }
  };

  const columns = [
    {
      title: "#",
      width: 64,
      render: (_, __, i) => <span style={{ opacity: 0.75 }}>{i + 1}</span>,
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
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>{row.title || "(без заголовка)"}</div>
          {row.description ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>{String(row.description).slice(0, 140)}</div>
          ) : null}
          {row.url ? (
            <div style={{ opacity: 0.65, fontSize: 12 }}>
              Ссылка: <code>{row.url}</code>
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
      width: 420,
      render: (_, row) => (
        <Space wrap>
          <Button
            disabled={!canWrite}
            onClick={() => {
              setEditing(row);
              const split = splitDateAndDescription(row.description);
              editForm.setFieldsValue({
                title: row.title,
                date: split.date,
                description: split.description,
                url: row.url,
                isActive: row.isActive !== false,
              });
              setEditOpen(true);
            }}
          >
            Редактировать
          </Button>

          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              if (!canWrite) return false;
              onUploadImage?.(row.id, file);
              return false;
            }}
          >
            <Button disabled={!canWrite}>
              Картинка
            </Button>
          </Upload>

          <Button disabled={!canWrite} onClick={() => moveRow(row.id, -1)}>
            ↑
          </Button>
          <Button disabled={!canWrite} onClick={() => moveRow(row.id, +1)}>
            ↓
          </Button>

          <Button danger disabled={!canWrite} onClick={() => onDelete?.(row.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

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
          <Button
            type="primary"
            onClick={() => {
              if (maxReached) {
                message.error("Максимум 5 слайдов. Удалите существующий слайд, чтобы добавить новый.");
                return;
              }
              setOpen(true);
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
        />
      </div>

      <Modal
        title="Добавить слайд"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Добавить"
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite || maxReached }}
      >
        <Form layout="vertical" form={form} initialValues={{ isActive: true }}>
          <Form.Item label="Заголовок" name="title" rules={[{ required: true, message: "Укажите заголовок" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Дата события"
            name="date"
            rules={[{ required: true, message: "Укажите дату события" }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
          <Form.Item label="Ссылка" name="url">
            <Input placeholder="/news?id=123 или https://..." />
          </Form.Item>
          <Form.Item label="Активен" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
          <div style={{ opacity: 0.7, fontSize: 12 }}>
            Картинка загружается отдельно: после создания нажмите «Картинка» в строке слайда.
          </div>
        </Form>
      </Modal>

      <Modal
        title="Редактировать слайд"
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
        <Form layout="vertical" form={editForm} initialValues={{ isActive: true }}>
          <Form.Item label="Заголовок" name="title" rules={[{ required: true, message: "Укажите заголовок" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Дата события"
            name="date"
            rules={[{ required: true, message: "Укажите дату события" }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
          <Form.Item label="Ссылка" name="url">
            <Input placeholder="/news?id=123 или https://..." />
          </Form.Item>
          <Form.Item label="Активен" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


