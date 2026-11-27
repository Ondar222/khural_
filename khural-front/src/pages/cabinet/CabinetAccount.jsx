import React from "react";
import { Card, Form, Button, Slider, Select, App, Switch } from "antd";
import { useAuth } from "../../context/AuthContext.jsx";
import { useA11y } from "../../context/A11yContext.jsx";
import { A11Y_DEFAULT_SETTINGS, normalizeSettings } from "../../utils/a11ySettings.js";
import CabinetShell from "./CabinetShell.jsx";
import { AccessibilityApi } from "../../api/client.js";

function roleLabel(role) {
  const r = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (!r) return "—";
  return (
    {
      citizen: "Гражданин",
      user: "Пользователь",
      admin: "Администратор",
      administrator: "Администратор",
      superadmin: "Суперадминистратор",
      moderator: "Модератор",
      operator: "Оператор",
    }[r] || role
  );
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "Т";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export default function CabinetAccount() {
  const { user } = useAuth();
  const { fontSize, colorScheme, contrast, disableAnimations, setAccessibility } = useA11y();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [settings, setSettings] = React.useState(() => ({ ...A11Y_DEFAULT_SETTINGS }));

  // Form.useWatch re-renders the label when the slider moves; getFieldValue() does not.
  const watchedFontSize = Form.useWatch("fontSize", form);
  const currentFontSize = Number(watchedFontSize) || settings.fontSize || fontSize;

  React.useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setReady(true);
        return;
      }
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
        // Форма уже смонтирована: setFieldsValue применится сразу,
        // а initialValues не перезапишут загруженные значения.
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
        setSettings(fallback);
        form.setFieldsValue(fallback);
        setAccessibility(fallback);
      } finally {
        setReady(true);
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
    setAccessibility(A11Y_DEFAULT_SETTINGS);
    persist(A11Y_DEFAULT_SETTINGS, "Настройки сброшены");
  };

  const fullName = user?.name || user?.email || "Пользователь";

  return (
    <CabinetShell active="account" title="Личный кабинет">
      <div className="account-page">
        <section className="account-hero">
          <div className="account-hero__avatar">{initials(fullName)}</div>
          <div className="account-hero__info">
            <span className="account-hero__eyebrow">Личный кабинет</span>
            <h1 className="account-hero__title">{fullName}</h1>
            <div className="account-hero__meta">{user?.email || "—"}</div>
          </div>
          <span className="account-hero__role">{roleLabel(user?.role)}</span>
        </section>

        <div className="account-grid">
          <Card className="account-card account-card--profile" title="Информация об аккаунте">
            <div className="account-facts">
              <div className="account-fact">
                <span>Имя</span>
                <strong>{user?.name || "—"}</strong>
              </div>
              <div className="account-fact">
                <span>Email</span>
                <strong>{user?.email || "—"}</strong>
              </div>
              <div className="account-fact">
                <span>Телефон</span>
                <strong>{user?.phone || "—"}</strong>
              </div>
              <div className="account-fact">
                <span>Роль</span>
                <strong>{roleLabel(user?.role)}</strong>
              </div>
            </div>
            <div className="account-hint">
              Если нужно изменить данные аккаунта — обратитесь к администратору.
            </div>
          </Card>

          <Card
            className="account-card account-card--a11y"
            title="Настройки доступности"
            extra={loading ? "Загрузка…" : null}
          >
            <Form
              form={form}
              layout="vertical"
              name="accessibilitySettings"
              className="account-form"
              initialValues={settings}
              disabled={!ready || saving}
              onValuesChange={(_, allValues) => {
                // Применяем сразу, без нажатия «Сохранить».
                setAccessibility(normalizeSettings(allValues, settings));
              }}
            >
              <Form.Item
                label="Размер шрифта"
                name="fontSize"
                rules={[{ required: true, message: "Выберите размер шрифта" }]}
                help={`Текущий размер: ${currentFontSize}px`}
                className="account-form__font"
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
                />
              </Form.Item>

              <Form.Item label="Цветовая схема" name="colorScheme" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="default">По умолчанию</Select.Option>
                  <Select.Option value="yb">Жёлто-синяя</Select.Option>
                  <Select.Option value="dark">Тёмная</Select.Option>
                  <Select.Option value="blue">Синяя</Select.Option>
                  <Select.Option value="brown">Коричневая</Select.Option>
                </Select>
              </Form.Item>

              <div className="account-form__row">
                <Form.Item label="Контрастность" name="contrast" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="normal">Обычная</Select.Option>
                    <Select.Option value="high">Высокая</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Отключить анимации"
                  name="disableAnimations"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>

              <div className="account-actions">
                <Button type="primary" onClick={handleSave} loading={saving}>
                  Сохранить настройки
                </Button>
                <Button onClick={handleReset} loading={saving}>
                  Сбросить
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </CabinetShell>
  );
}
