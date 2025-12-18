import React from "react";
import {
  App,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Upload,
  Space,
  Table,
  Tag,
} from "antd";

const TYPE_OPTIONS = [
  { value: "laws", label: "Законы" },
  { value: "resolutions", label: "Постановления" },
  { value: "initiatives", label: "Инициативы" },
  { value: "bills", label: "Законопроекты" },
  { value: "civic", label: "Обращения" },
  { value: "constitution", label: "Конституция" },
  { value: "other", label: "Другое" },
];

export default function AdminDocuments({
  items,
  onCreate,
  onUpdate,
  onDelete,
  busy,
  canWrite,
}) {
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
    return (items || []).filter((d) =>
      String(d.title || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [items, q]);

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      render: (v) => <div style={{ fontWeight: 800 }}>{v || "—"}</div>,
    },
    {
      title: "№ / Дата",
      key: "meta",
      width: 160,
      render: (_, row) => (
        <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.35 }}>
          <div>{row.number || "—"}</div>
          <div>{row.date || "—"}</div>
        </div>
      ),
    },
    {
      title: "Тип",
      dataIndex: "type",
      width: 180,
      render: (v) => {
        const opt = TYPE_OPTIONS.find((x) => x.value === v);
        return opt ? <Tag color="blue">{opt.label}</Tag> : v || "—";
      },
    },
    {
      title: "Файл/ссылка",
      key: "file_or_url",
      width: 120,
      render: (_, row) =>
        row?.file?.link || row?.file?.id || row?.url ? (
          <Tag color="green">есть</Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space wrap>
          <Button
            onClick={() => {
              setEditing(row);
              editForm.setFieldsValue({
                title: row.title || "",
                type: row.type || "laws",
                description: row.description || "",
                category: row.category || "",
                number: row.number || "",
                date: row.date || "",
                url: row.url || "",
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
      if (!file && !values?.url) {
        message.error("Укажите файл или ссылку");
        return;
      }
      await onCreate({ ...values, file });
      setOpen(false);
      form.resetFields();
      setFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось загрузить документ");
    }
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await onUpdate?.(editing?.id, { ...values, file: editFile });
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
      setEditFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось обновить документ");
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
          <Button
            type="primary"
            onClick={() => setOpen(true)}
            disabled={!canWrite}
            loading={busy}
          >
            + Загрузить документ
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
        title="Загрузить документ"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Загрузить"
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite }}
      >
        <Form layout="vertical" form={form} initialValues={{ type: "laws" }}>
          <Form.Item
            label="Название"
            name="title"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="№" name="number">
              <Input placeholder="№58-ЗРТ" />
            </Form.Item>
            <Form.Item label="Дата" name="date">
              <Input placeholder="22.10.2025" />
            </Form.Item>
          </div>

          <Form.Item label="Категория" name="category">
            <Input placeholder="Законы / Постановления / ..." />
          </Form.Item>

          <Form.Item label="Тип" name="type">
            <Select options={TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>

          <Form.Item label="Ссылка (если без файла)" name="url">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item label="Файл (опционально)">
            <Upload
              maxCount={1}
              beforeUpload={(f) => {
                setFile(f);
                return false;
              }}
              onRemove={() => setFile(null)}
            >
              <Button>Выбрать файл</Button>
            </Upload>
          </Form.Item>
        </Form>

        {!canWrite ? (
          <div className="admin-hint">
            Для записи в API войдите (или настройте API базу).
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Редактировать документ"
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
            label="Название"
            name="title"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="№" name="number">
              <Input />
            </Form.Item>
            <Form.Item label="Дата" name="date">
              <Input />
            </Form.Item>
          </div>

          <Form.Item label="Категория" name="category">
            <Input />
          </Form.Item>

          <Form.Item label="Тип" name="type">
            <Select options={TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>

          <Form.Item label="Ссылка (если без файла)" name="url">
            <Input />
          </Form.Item>

          <Form.Item label="Заменить файл (опционально)">
            <Upload
              maxCount={1}
              beforeUpload={(f) => {
                setEditFile(f);
                return false;
              }}
              onRemove={() => setEditFile(null)}
            >
              <Button>Выбрать файл</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}





