import React from "react";
import { App, Button, Form, Input, Alert, Card, Space, Divider } from "antd";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { SettingsApi } from "../../api/client.js";

export default function AdminSettingsPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState(null);
  const [appealsEmailForm] = Form.useForm();

  // Загружаем настройки
  React.useEffect(() => {
    const loadSettings = async () => {
      if (!adminData.isAuthenticated) return;
      
      setLoading(true);
      try {
        const data = await SettingsApi.getAll();
        setSettings(data);
        
        // Заполняем форму, если есть данные
        if (data && typeof data === "object") {
          const formValues = {};
          Object.keys(data).forEach((key) => {
            // Пропускаем специальные ключи
            if (key === "appeals-recipient-email") return;
            
            const value = data[key];
            // Сохраняем значение как есть (может быть строка, число, объект)
            formValues[key] = value;
          });
          form.setFieldsValue(formValues);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        message.error("Не удалось загрузить настройки");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [adminData.isAuthenticated, form, message]);

  // Загружаем email для уведомлений о обращениях
  React.useEffect(() => {
    const loadAppealsEmail = async () => {
      if (!adminData.isAuthenticated) return;
      
      try {
        const data = await SettingsApi.getByKey("appeals-recipient-email").catch(() => null);
        if (data?.email) {
          appealsEmailForm.setFieldsValue({ email: data.email });
        }
      } catch (error) {
        // Игнорируем ошибку, если ключ не существует
      }
    };

    loadAppealsEmail();
  }, [adminData.isAuthenticated, appealsEmailForm]);

  const handleSave = async () => {
    if (!adminData.canWrite) {
      message.warning("Нет прав на запись");
      return;
    }

    try {
      const values = await form.validateFields();
      setSaving(true);

      // Преобразуем значения в формат для API
      const updateData = {};
      Object.keys(values).forEach((key) => {
        // Пропускаем пустые значения
        if (values[key] === undefined || values[key] === null || values[key] === "") return;
        
        const value = values[key];
        // Если значение - объект или массив, сериализуем в JSON
        if (value && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) {
          updateData[key] = JSON.stringify(value);
        } else if (Array.isArray(value)) {
          updateData[key] = JSON.stringify(value);
        } else {
          updateData[key] = value;
        }
      });

      await SettingsApi.update(updateData);
      message.success("Настройки сохранены");
      
      // Перезагружаем настройки
      const updated = await SettingsApi.getAll();
      setSettings(updated);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppealsEmail = async () => {
    if (!adminData.canWrite) {
      message.warning("Нет прав на запись");
      return;
    }

    try {
      const values = await appealsEmailForm.validateFields();
      setSaving(true);

      await SettingsApi.setAppealsRecipientEmail(values.email);
      message.success("Email для уведомлений сохранен");
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить email");
    } finally {
      setSaving(false);
    }
  };

  const loginCard = !adminData.isAuthenticated ? (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Вход в админку</div>
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
          Чтобы редактировать, добавлять и удалять записи, выполните вход.
        </div>
        <Input
          placeholder="Email"
          value={adminData.email}
          onChange={(e) => adminData.setEmail(e.target.value)}
        />
        <Input.Password
          placeholder="Пароль"
          value={adminData.password}
          onChange={(e) => adminData.setPassword(e.target.value)}
        />
        <Button type="primary" loading={adminData.loginBusy} onClick={adminData.handleLogin}>
          Войти
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <AdminShell
      activeKey="settings"
      title="Настройки"
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}

      {loading ? (
        <div className="admin-card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontWeight: 900 }}>Загрузка настроек…</div>
        </div>
      ) : (
        <div className="admin-grid">
          <Card title="Общие настройки" className="admin-card">
            <Form layout="vertical" form={form}>
              {settings && typeof settings === "object" && Object.keys(settings).length > 0 ? (
                Object.keys(settings)
                  .filter((key) => key !== "appeals-recipient-email") // Пропускаем специальные ключи
                  .map((key) => {
                    const value = settings[key];
                    const isJsonString = typeof value === "string" && 
                      (value.trim().startsWith("{") || value.trim().startsWith("["));
                    const displayValue = isJsonString ? value : String(value || "");
                    
                    return (
                      <Form.Item
                        key={key}
                        label={<span style={{ fontFamily: "monospace", fontSize: 13 }}>{key}</span>}
                        name={key}
                        rules={[{ required: false }]}
                        help={isJsonString ? "JSON значение" : undefined}
                      >
                        {isJsonString ? (
                          <Input.TextArea
                            rows={6}
                            placeholder="JSON значение"
                            disabled={!adminData.canWrite || saving}
                            style={{ fontFamily: "monospace", fontSize: 12 }}
                          />
                        ) : (
                          <Input
                            placeholder="Значение"
                            disabled={!adminData.canWrite || saving}
                          />
                        )}
                      </Form.Item>
                    );
                  })
              ) : (
                <div style={{ color: "#6b7280", padding: 20, textAlign: "center" }}>
                  Настройки не найдены или пусты
                </div>
              )}
              
              <Form.Item>
                <Button
                  type="primary"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!adminData.canWrite}
                >
                  Сохранить настройки
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="Email для уведомлений о обращениях" className="admin-card">
            <Form layout="vertical" form={appealsEmailForm}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: false },
                  { type: "email", message: "Введите корректный email" }
                ]}
                help="Email для получения уведомлений о новых обращениях"
              >
                <Input
                  type="email"
                  placeholder="admin@example.org"
                  disabled={!adminData.canWrite || saving}
                />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  onClick={handleSaveAppealsEmail}
                  loading={saving}
                  disabled={!adminData.canWrite}
                >
                  Сохранить email
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )}

      {!adminData.canWrite && adminData.isAuthenticated ? (
        <div className="admin-card admin-card--warning" style={{ marginTop: 16 }}>
          Для записи в API войдите (или настройте API базу).
        </div>
      ) : null}
    </AdminShell>
  );
}
