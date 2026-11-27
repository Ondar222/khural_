import React from "react";
import { Card, Descriptions, Form, Button, Slider, Select, App, Switch } from "antd";
import { useAuth } from "../../context/AuthContext.jsx";
import { A11Y_DEFAULT_SETTINGS, normalizeSettings, useA11y } from "../../context/A11yContext.jsx";
import CabinetShell from "./CabinetShell.jsx";
import { AccessibilityApi } from "../../api/client.js";

function roleLabel(role) {
  const r = String(role || "")
    .trim()
    .toLowerCase();
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
  const { fontSize, colorScheme, contrast, disableAnimations, setAccessibility } = useA11y();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState(() => ({ ...A11Y_DEFAULT_SETTINGS }));

  // Form.useWatch re-renders the label when the slider moves; getFieldValue() does not.
  const watchedFontSize = Form.useWatch("fontSize", form);
  const currentFontSize = Number(watchedFontSize) || settings.fontSize || fontSize;

  React.useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await AccessibilityApi.getSettings();
        const data = response?.settings || response?.data || response;
        const next = normalizeSettings(data, {
          fontSize,
          colorScheme,
          contrast,
          disableAnimations,
        });
        setSettings(next);
        form.setFieldsValue(next);
        setAccessibility(next);
      } catch (error) {
        console.error("Failed to load accessibility settings:", error);
        const fallback = normalizeSettings({
          fontSize,
          colorScheme,
          contrast,
          disableAnimations,
        });
        form.setFieldsValue(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    // Context values are intentionally used as the initial fallback only:
    // re-running on every change would overwrite values typed into the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form, setAccessibility]);

  const persist = async (payload, successMessage) => {
    setSaving(true);
    try {
      const saved = await AccessibilityApi.saveSettings(payload);
      setAccessibility(payload);
      setSettings(normalizeSettings(saved || payload, payload));
      const data = saved?.settings || saved?.data || saved || payload;
      window.dispatchEvent(new CustomEvent("accessibility-settings-updated", { detail: data }));
      message.success(successMessage);
    } catch (error) {
      message.error(error?.message || "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = normalizeSettings({
        fontSize: values.fontSize,
        colorScheme: values.colorScheme,
        contrast: values.contrast,
        disableAnimations: values.disableAnimations,
      });
      await persist(payload, "Настройки доступности сохранены");
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить настройки");
    }
  };

  const handleReset = () => {
    form.setFieldsValue(A11Y_DEFAULT_SETTINGS);
    persist(A11Y_DEFAULT_SETTINGS, "Настройки сброшены");
  };

  return (
    <CabinetShell active="account" title="Личный кабинет">
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
        <Form
          form={form}
          layout="vertical"
          name="accessibilitySettings"
          initialValues={A11Y_DEFAULT_SETTINGS}
        >
          <Form.Item
            label="Размер шрифта"
            name="fontSize"
            rules={[{ required: true, message: "Выберите размер шрифта" }]}
            help={`Текущий размер: ${currentFontSize}px`}
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
              disabled={saving}
            />
          </Form.Item>

          <Form.Item label="Цветовая схема" name="colorScheme" rules={[{ required: true }]}>
            <Select disabled={saving}>
              <Select.Option value="default">По умолчанию</Select.Option>
              <Select.Option value="yb">Жёлто-синяя</Select.Option>
              <Select.Option value="dark">Тёмная</Select.Option>
              <Select.Option value="blue">Синяя</Select.Option>
              <Select.Option value="brown">Коричневая</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Контрастность" name="contrast" rules={[{ required: true }]}>
            <Select disabled={saving}>
              <Select.Option value="normal">Обычная</Select.Option>
              <Select.Option value="high">Высокая</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Отключить анимации" name="disableAnimations" valuePropName="checked">
            <Switch disabled={saving} />
          </Form.Item>

          <Form.Item className="cabinet-account__actions">
            <div className="cabinet-account__actions-btns">
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                className="cabinet-account__btn"
              >
                Сохранить настройки
              </Button>
              <Button onClick={handleReset} loading={saving} className="cabinet-account__btn">
                Сбросить
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </CabinetShell>
  );
}
