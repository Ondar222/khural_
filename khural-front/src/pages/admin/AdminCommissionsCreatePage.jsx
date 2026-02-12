import React from "react";
import { Button, Input, Form } from "antd";
import { useHashRoute } from "../../Router.jsx";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-а-яё]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCommissionsCreatePage() {
  const adminData = useAdminData();
  const { navigate } = useHashRoute();
  const [form] = Form.useForm();

  const handleFinish = React.useCallback(
    async (values) => {
      const id = String(values.id || "").trim() || slugify(values.name) || `commission-${Date.now()}`;
      const name = String(values.name || "").trim();
      if (!name) return;
      await adminData.createCommission({ id, name });
      navigate("/admin/commissions");
    },
    [adminData, navigate]
  );

  return (
    <AdminShell
      activeKey="commissions"
      title="Добавить комиссию"
      subtitle="Комиссия появится на странице «Комиссии»"
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <div className="admin-card" style={{ maxWidth: 640 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <Form.Item
            name="name"
            label="Название комиссии"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input.TextArea rows={3} placeholder="Например: Наградная комиссия Верховного Хурала..." />
          </Form.Item>
          <Form.Item
            name="id"
            label="ID (латиница и дефисы, для ссылки)"
            extra="Необязательно. Если не указать, будет сгенерирован из названия."
          >
            <Input placeholder="nagradnaya" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={adminData.busy} disabled={!adminData.canWrite}>
              Создать
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate("/admin/commissions")}>
              Отмена
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AdminShell>
  );
}
