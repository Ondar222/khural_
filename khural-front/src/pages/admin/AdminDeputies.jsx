import React from "react";
import {
  App,
  Button,
  Input,
  Modal,
  Form,
  Upload,
  Space,
  Table,
} from "antd";

export default function AdminDeputies({
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
    return (items || []).filter((p) =>
      String(p.fullName || p.name || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [items, q]);

  const columns = [
    {
      title: "ФИО",
      dataIndex: "fullName",
      render: (_, row) => row.fullName || row.name || "—",
    },
    {
      title: "Фракция",
      dataIndex: "faction",
      width: 180,
      render: (v) => v || "—",
    },
    {
      title: "Округ",
      dataIndex: "electoralDistrict",
      width: 200,
      render: (_, row) => row.electoralDistrict || row.district || "—",
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
                fullName: row.fullName || row.name || "",
                faction: row.faction || "",
                electoralDistrict: row.electoralDistrict || row.district || "",
                email: row.email || "",
                phoneNumber: row.phoneNumber || "",
                description: row.description || "",
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
      await onCreate({ ...values, imageFile: file });
      setOpen(false);
      form.resetFields();
      setFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось создать депутата");
    }
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await onUpdate?.(editing?.id, { ...values, imageFile: editFile });
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
      setEditFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось обновить депутата");
    }
  };

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по ФИО..."
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
            + Добавить депутата
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
        title="Добавить депутата"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Добавить"
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="ФИО"
            name="fullName"
            rules={[{ required: true, message: "Укажите ФИО" }]}
          >
            <Input />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="Фракция" name="faction">
              <Input />
            </Form.Item>
            <Form.Item label="Округ" name="electoralDistrict">
              <Input />
            </Form.Item>
          </div>

          <div className="admin-split">
            <Form.Item label="Email" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="Телефон" name="phoneNumber">
              <Input />
            </Form.Item>
          </div>

          <Form.Item label="Описание" name="description">
            <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} />
          </Form.Item>

          <Form.Item label="Фото (опционально)">
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
          <div className="admin-hint">
            Для записи в API войдите (или настройте API базу).
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Редактировать депутата"
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
            label="ФИО"
            name="fullName"
            rules={[{ required: true, message: "Укажите ФИО" }]}
          >
            <Input />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="Фракция" name="faction">
              <Input />
            </Form.Item>
            <Form.Item label="Округ" name="electoralDistrict">
              <Input />
            </Form.Item>
          </div>

          <div className="admin-split">
            <Form.Item label="Email" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="Телефон" name="phoneNumber">
              <Input />
            </Form.Item>
          </div>

          <Form.Item label="Описание" name="description">
            <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} />
          </Form.Item>

          <Form.Item label="Фото (опционально)">
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



