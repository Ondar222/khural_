import React from "react";
import { App, Button, Input, Modal, Form, Space, Table } from "antd";

export default function AdminPages({ items, onCreate, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((p) => {
      const title = String(p.title || p.name || "").toLowerCase();
      const slug = String(p.slug || "").toLowerCase();
      return title.includes(qq) || slug.includes(qq);
    });
  }, [items, q]);

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontWeight: 800 }}>{row.title || row.name || "—"}</div>
          {row.content || row.body ? (
            <div style={{ opacity: 0.7, fontSize: 12 }}>
              {String(row.content || row.body || "").slice(0, 100)}...
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Slug",
      dataIndex: "slug",
      width: 200,
      render: (v) => v || "—",
    },
    {
      title: "Язык",
      dataIndex: "locale",
      width: 100,
      render: (v, row) => {
        const locale = v || row.lang || "ru";
        return locale === "tyv" ? "Тыва" : "Русский";
      },
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
                title: row.title || row.name || "",
                slug: row.slug || "",
                content: row.content || row.body || "",
                locale: row.locale || row.lang || "ru",
              });
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

  const submitCreate = async () => {
    try {
      const values = await form.validateFields();
      console.log("Создание страницы с данными:", values);
      console.log("onCreate функция:", onCreate);
      
      if (!onCreate) {
        message.error("Функция создания страницы не доступна");
        return;
      }
      
      await onCreate({
        title: values.title,
        slug: values.slug,
        content: values.content || "",
        locale: values.locale || "ru",
      });
      
      setOpen(false);
      form.resetFields();
    } catch (e) {
      if (e?.errorFields) {
        console.log("Ошибки валидации формы:", e.errorFields);
        return;
      }
      console.error("Ошибка при создании страницы в submitCreate:", e);
      const errorMsg = e?.data?.message || e?.message || "Не удалось создать страницу";
      message.error(errorMsg);
      // Пробрасываем ошибку дальше, чтобы модальное окно не закрывалось при ошибке
      throw e;
    }
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await onUpdate?.(editing?.id, {
        title: values.title,
        slug: values.slug,
        content: values.content || "",
        locale: values.locale || "ru",
      });
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось обновить страницу");
    }
  };

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по названию или slug..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button
            onClick={() => {
              const dataStr = JSON.stringify(items || [], null, 2);
              const dataBlob = new Blob([dataStr], { type: "application/json" });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `pages-export-${new Date().toISOString().split("T")[0]}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              message.success("Страницы экспортированы");
            }}
          >
            Экспорт страниц
          </Button>
          <Button type="primary" onClick={() => setOpen(true)} disabled={!canWrite}>
            + Добавить страницу
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        {filtered && filtered.length > 0 ? (
          <Table
            rowKey={(r) => String(r.id || r.slug || Math.random())}
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <div style={{ padding: 40, textAlign: "center", opacity: 0.6 }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>Нет страниц</div>
            <div style={{ fontSize: 13 }}>
              Страницы загружаются из API. Если API недоступен, страницы не будут отображаться.
              <br />
              Для создания новой страницы нажмите кнопку "Добавить страницу".
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Добавить страницу"
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            await submitCreate();
          } catch (e) {
            // Ошибка уже обработана в submitCreate
            console.error("Ошибка в onOk модального окна:", e);
          }
        }}
        okText="Создать"
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite || busy }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Название"
            name="title"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Slug (URL-адрес)"
            name="slug"
            rules={[{ required: true, message: "Укажите slug" }]}
          >
            <Input placeholder="например: about-us" />
          </Form.Item>
          <Form.Item label="Язык" name="locale" initialValue="ru">
            <Input placeholder="ru или tyv" />
          </Form.Item>
          <Form.Item
            label="Содержимое (HTML)"
            name="content"
            rules={[{ required: true, message: "Укажите содержимое" }]}
          >
            <Input.TextArea autoSize={{ minRows: 10, maxRows: 20 }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать страницу"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
          editForm.resetFields();
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
          <Form.Item
            label="Slug (URL-адрес)"
            name="slug"
            rules={[{ required: true, message: "Укажите slug" }]}
          >
            <Input placeholder="например: about-us" />
          </Form.Item>
          <Form.Item label="Язык" name="locale">
            <Input placeholder="ru или tyv" />
          </Form.Item>
          <Form.Item
            label="Содержимое (HTML)"
            name="content"
            rules={[{ required: true, message: "Укажите содержимое" }]}
          >
            <Input.TextArea autoSize={{ minRows: 10, maxRows: 20 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

