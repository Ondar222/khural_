import React from "react";
import { Card, Descriptions, Form, Input, Button, Slider, Select, Space, App, Switch } from "antd";
import { useAuth } from "../../context/AuthContext.jsx";
import { useA11y } from "../../context/A11yContext.jsx";
import CabinetShell from "./CabinetShell.jsx";
import { AccessibilityApi } from "../../api/client.js";

function roleLabel(role) {
  const r = String(role || "").trim().toLowerCase();
  if (!r) return "—";
  return (
    {
      citizen: "Гражданин",
      user: "Пользователь",
      admin: "Администратор",
      moderator: "Модератор",
      operator: "Оператор",
    }[r] || role
  );
}

export default function CabinetAccount() {
  const { user } = useAuth();
  const { mode, fontScale, cycleMode, setFontScale } = useA11y();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState(null);

  // Загружаем настройки доступности
  React.useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Генерируем sessionId из текущей сессии или используем пустую строку
        const sessionId = sessionStorage.getItem("sessionId") || "";
        const data = await AccessibilityApi.getSettings(sessionId);
        setSettings(data);
        
        // Заполняем форму
        if (data) {
          form.setFieldsValue({
            fontSize: data.fontSize || Math.round(16 * fontScale),
            colorScheme: data.colorScheme || (mode === "yb" ? "yb" : "default"),
            contrast: data.contrast || (mode === "bw" ? "high" : "normal"),
            disableAnimations: data.disableAnimations || false,
          });
        }
      } catch (error) {
        console.error("Failed to load accessibility settings:", error);
        // Устанавливаем текущие значения из контекста
        form.setFieldsValue({
          fontSize: Math.round(16 * fontScale),
          colorScheme: mode === "yb" ? "yb" : mode === "bw" ? "default" : "default",
          contrast: mode === "bw" ? "high" : "normal",
          disableAnimations: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, form, mode, fontScale]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        fontSize: Number(values.fontSize) || 16,
        colorScheme: values.colorScheme || "default",
        contrast: values.contrast || "normal",
        disableAnimations: Boolean(values.disableAnimations),
      };

      await AccessibilityApi.saveSettings(payload);
      message.success("Настройки доступности сохранены");
      
      // Обновляем контекст доступности
      const newFontScale = Math.max(0.85, Math.min(1.6, payload.fontSize / 16));
      setFontScale(newFontScale);
      
      // A11yContext автоматически обновит режим при следующей загрузке настроек
      // Перезагружаем настройки, чтобы A11yContext их подхватил
      const updated = await AccessibilityApi.getSettings(sessionStorage.getItem("sessionId") || "");
      setSettings(updated);
      
      // Триггерим событие для обновления A11yContext
      window.dispatchEvent(new CustomEvent("accessibility-settings-updated", { detail: updated }));
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  const handleFontSizeChange = (value) => {
    form.setFieldsValue({ fontSize: value });
    const newScale = Math.max(0.85, Math.min(1.6, value / 16));
    setFontScale(newScale);
  };

  return (
    <CabinetShell active="account" title="Личный кабинет — Личный аккаунт">
      <Card title="Информация об аккаунте" style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="Имя">{user?.name || "—"}</Descriptions.Item>
          <Descriptions.Item label="Email">{user?.email || "—"}</Descriptions.Item>
          <Descriptions.Item label="Телефон">{user?.phone || "—"}</Descriptions.Item>
          <Descriptions.Item label="Роль">{roleLabel(user?.role)}</Descriptions.Item>
        </Descriptions>
        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
          Если нужно изменить данные аккаунта — обратитесь к администратору.
        </div>
      </Card>

      <Card title="Настройки доступности" loading={loading}>
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Размер шрифта"
            name="fontSize"
            rules={[{ required: true, message: "Выберите размер шрифта" }]}
            help={`Текущий размер: ${form.getFieldValue('fontSize') || Math.round(16 * fontScale)}px`}
          >
            <Slider
              min={12}
              max={24}
              step={1}
              marks={{
                12: "12px",
                16: "16px",
                20: "20px",
                24: "24px",
              }}
              onChange={handleFontSizeChange}
              disabled={saving}
            />
          </Form.Item>

          <Form.Item
            label="Цветовая схема"
            name="colorScheme"
            rules={[{ required: true }]}
          >
            <Select disabled={saving}>
              <Select.Option value="default">По умолчанию</Select.Option>
              <Select.Option value="yb">Желто-синяя</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Контрастность"
            name="contrast"
            rules={[{ required: true }]}
          >
            <Select disabled={saving}>
              <Select.Option value="normal">Обычная</Select.Option>
              <Select.Option value="high">Высокая</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Отключить анимации"
            name="disableAnimations"
            valuePropName="checked"
          >
            <Switch disabled={saving} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSave} loading={saving}>
                Сохранить настройки
              </Button>
              <Button onClick={async () => {
                const resetPayload = {
                  fontSize: 16,
                  colorScheme: "default",
                  contrast: "normal",
                  disableAnimations: false,
                };
                form.setFieldsValue(resetPayload);
                setFontScale(1);
                
                // Сохраняем сброшенные настройки
                try {
                  await AccessibilityApi.saveSettings(resetPayload);
                  message.success("Настройки сброшены");
                  const updated = await AccessibilityApi.getSettings(sessionStorage.getItem("sessionId") || "");
                  setSettings(updated);
                  window.dispatchEvent(new CustomEvent("accessibility-settings-updated", { detail: updated }));
                } catch (error) {
                  message.error("Не удалось сбросить настройки");
                }
              }}>
                Сбросить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </CabinetShell>
  );
}

