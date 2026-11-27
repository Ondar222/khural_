import React from "react";
import { Alert, App, Button, Card, Col, Divider, Form, Input, Row, Space, Switch } from "antd";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { SettingsApi } from "../../api/client.js";
import {
  ADMIN_TOPBAR_DEFAULTS,
  ADMIN_TOPBAR_SETTINGS_KEY,
  extractSettingValue,
  normalizeAdminTopbarConfig,
  notifyAdminTopbarUpdated,
} from "../../hooks/useAdminTopbarConfig.js";

export default function AdminTopbarPage() {
  const adminData = useAdminData();
  const { t } = useI18n();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const showLang = Form.useWatch("showLangToggle", form);
  const showSite = Form.useWatch("showGoToSite", form);
  const showTheme = Form.useWatch("showThemeSwitch", form);
  const showMenu = Form.useWatch("showMenuButton", form);
  const showBack = Form.useWatch("showBackToDashboard", form);

  const load = React.useCallback(async () => {
    if (!adminData.isAuthenticated) return;
    setLoading(true);
    try {
      const data = await SettingsApi.getAll();
      const next = normalizeAdminTopbarConfig(extractSettingValue(data, ADMIN_TOPBAR_SETTINGS_KEY));
      form.setFieldsValue(next);
    } catch (error) {
      console.error("Failed to load admin topbar settings:", error);
      form.setFieldsValue({ ...ADMIN_TOPBAR_DEFAULTS });
    } finally {
      setLoading(false);
    }
  }, [adminData.isAuthenticated, form]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (values) => {
    if (!adminData.canWrite) {
      message.warning("Нет прав на запись");
      return;
    }
    const next = normalizeAdminTopbarConfig(values);
    setSaving(true);
    try {
      await SettingsApi.update({ [ADMIN_TOPBAR_SETTINGS_KEY]: JSON.stringify(next) });
      notifyAdminTopbarUpdated(next);
      message.success(t("adminTopbarSaved"));
      form.setFieldsValue(next);
    } catch (error) {
      message.error(error?.message || "Не удалось сохранить настройки верхней панели");
    } finally {
      setSaving(false);
    }
  };

  const handleDefaults = () => {
    form.setFieldsValue({ ...ADMIN_TOPBAR_DEFAULTS });
  };

  const textFields = (nameRu, nameTy, labelRu, labelTy, disabled) => (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item name={nameRu} label={labelRu}>
          <Input disabled={disabled} allowClear />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name={nameTy} label={labelTy}>
          <Input disabled={disabled} allowClear />
        </Form.Item>
      </Col>
    </Row>
  );

  return (
    <AdminShell
      activeKey="topbar"
      title={t("adminTopbarTitle")}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t("adminTopbarTitle")}
        description={t("adminTopbarDescription")}
      />

      <Card title={t("adminTopbarTitle")} loading={loading} style={{ maxWidth: 860 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={ADMIN_TOPBAR_DEFAULTS}
          onFinish={handleSubmit}
          preserve={false}
        >
          <Divider orientation="left" plain>
            {t("adminTopbarSectionLang")}
          </Divider>
          <Form.Item
            name="showLangToggle"
            label={t("adminTopbarLangToggle")}
            valuePropName="checked"
            extra={t("adminTopbarLangToggleHint")}
          >
            <Switch />
          </Form.Item>
          {textFields(
            "langLabelRu",
            "langLabelTy",
            t("adminTopbarLabelRu"),
            t("adminTopbarLabelTy"),
            !showLang
          )}

          <Divider orientation="left" plain>
            {t("adminGoToSite")}
          </Divider>
          <Form.Item
            name="showGoToSite"
            label={t("adminTopbarShow")}
            valuePropName="checked"
            extra={t("adminTopbarGoToSiteHint")}
          >
            <Switch />
          </Form.Item>
          {textFields(
            "siteLabelRu",
            "siteLabelTy",
            t("adminTopbarLabelRu"),
            t("adminTopbarLabelTy"),
            !showSite
          )}
          <Form.Item
            name="siteUrl"
            label={t("adminTopbarSiteUrl")}
            extra={t("adminTopbarSiteUrlHint")}
          >
            <Input disabled={!showSite} allowClear placeholder="/" />
          </Form.Item>

          <Divider orientation="left" plain>
            {t("adminTopbarThemeSwitch")}
          </Divider>
          <Form.Item
            name="showThemeSwitch"
            label={t("adminTopbarShow")}
            valuePropName="checked"
            extra={t("adminTopbarThemeSwitchHint")}
          >
            <Switch />
          </Form.Item>
          {textFields(
            "themeLabelRu",
            "themeLabelTy",
            t("adminTopbarTooltipRu"),
            t("adminTopbarTooltipTy"),
            !showTheme
          )}

          <Divider orientation="left" plain>
            {t("adminTopbarMenuButton")}
          </Divider>
          <Form.Item
            name="showMenuButton"
            label={t("adminTopbarShow")}
            valuePropName="checked"
            extra={t("adminTopbarMenuButtonHint")}
          >
            <Switch />
          </Form.Item>
          {textFields(
            "menuLabelRu",
            "menuLabelTy",
            t("adminTopbarTooltipRu"),
            t("adminTopbarTooltipTy"),
            !showMenu
          )}

          <Divider orientation="left" plain>
            {t("adminBackToDashboard")}
          </Divider>
          <Form.Item
            name="showBackToDashboard"
            label={t("adminTopbarShow")}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          {textFields(
            "backLabelRu",
            "backLabelTy",
            t("adminTopbarLabelRu"),
            t("adminTopbarLabelTy"),
            !showBack
          )}

          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {t("adminSave")}
            </Button>
            <Button onClick={handleDefaults} disabled={saving}>
              {t("adminTopbarDefaults")}
            </Button>
            <Button onClick={load} disabled={saving}>
              {t("adminTopbarReload")}
            </Button>
          </Space>
        </Form>
      </Card>
    </AdminShell>
  );
}
