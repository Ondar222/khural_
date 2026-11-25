import React from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { MenuApi, SiteApi, UploadApi } from "../../api/client.js";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { notifySiteUpdated } from "../../utils/siteUpdates.js";

const SITE_DEFAULT_LOGO = "https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg";
const SITE_DEFAULT_NAME_RU = "Верховный Хурал (парламент) Республики Тыва";
const SITE_DEFAULT_NAME_TYV = "Тыва Республиканың Дээди Хуралы (парламентизи)";

const DEFAULT_FOOTER = {
  logoUrl: "",
  organizationNameRu: "",
  organizationNameTyv: "",
  copyrightTextRu: "",
  copyrightTextTyv: "",
  copyrightYear: new Date().getFullYear(),
  showCopyright: true,
  developerTextRu: "",
  developerTextTyv: "",
  developerUrl: "",
  showDeveloper: true,
  menuGroupIds: [],
  socials: [],
  showSocials: true,
  contacts: [],
  showContacts: true,
};

const LINK_RULE = {
  validator: (_, value) => {
    const link = String(value || "").trim();
    if (!link || /^(https?:\/\/|tel:|mailto:|\/)/i.test(link)) return Promise.resolve();
    return Promise.reject(new Error("Укажите https://..., tel:, mailto: или путь, начинающийся с /"));
  },
};

export default function AdminFooterPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [footer, setFooter] = React.useState(DEFAULT_FOOTER);
  const [groups, setGroups] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [logoUrl, setLogoUrl] = React.useState("");

  const load = React.useCallback(async () => {
    if (!adminData.isAuthenticated) return;
    setLoading(true);
    try {
      const [data, footerGroups] = await Promise.all([
        SiteApi.getFooter(),
        MenuApi.listGroups("footer"),
      ]);
      const next = { ...DEFAULT_FOOTER, ...(data || {}) };
      setFooter(next);
      setLogoUrl(next.logoUrl || "");
      setGroups(Array.isArray(footerGroups) ? footerGroups : []);
      form.setFieldsValue(next);
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить настройки подвала");
    } finally {
      setLoading(false);
    }
  }, [adminData.isAuthenticated, form, message]);

  React.useEffect(() => {
    load();
  }, [load]);

  const notifySite = () => notifySiteUpdated("site");

  const save = async (patch) => {
    try {
      setSaving(true);
      const updated = await SiteApi.updateFooter(patch);
      const next = { ...DEFAULT_FOOTER, ...(updated || {}) };
      setFooter(next);
      setLogoUrl(next.logoUrl || "");
      form.setFieldsValue(next);
      message.success("Настройки подвала сохранены");
      notifySite();
      return next;
    } catch (error) {
      message.error(error?.message || "Не удалось сохранить настройки подвала");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await save(values);
    } catch (error) {
      if (error?.errorFields) return;
      // save() уже показал ошибку
    }
  };

  const uploadLogo = async ({ file }) => {
    try {
      setUploading(true);
      const result = await UploadApi.upload(file);
      const link = result.link || result.url || `/files/${result.id}`;
      await save({ logoUrl: link });
      message.success("Логотип загружен");
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить логотип");
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <AdminShell
      activeKey="footer"
      title="Редактор подвала сайта"
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Что редактируется в подвале"
        description="Логотип и название, копирайт, подпись разработчика, колонки меню, социальные сети и контакты. Все тексты доступны на русском и тувинском языках. Пункты меню редактируются в разделе «Меню»."
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit} preserve={false} loading={loading}>
        <Card title="Логотип и название" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div
              style={{
                width: 100,
                height: 60,
                border: "1px dashed #d9d9d9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                background: "#fafafa",
              }}
            >
              <img src={normalizeFilesUrl(logoUrl || SITE_DEFAULT_LOGO)} alt="Логотип" style={{ maxWidth: "100%", maxHeight: "100%" }} />
            </div>
            <Upload accept="image/*" showUploadList={false} customRequest={uploadLogo}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                {logoUrl ? "Заменить логотип" : "Загрузить логотип"}
              </Button>
            </Upload>
            {!logoUrl && (
              <Button onClick={() => save({ logoUrl: SITE_DEFAULT_LOGO, organizationNameRu: footer.organizationNameRu || SITE_DEFAULT_NAME_RU, organizationNameTyv: footer.organizationNameTyv || SITE_DEFAULT_NAME_TYV })}>
                Использовать логотип сайта
              </Button>
            )}
            {logoUrl && (
              <Button type="link" danger onClick={() => save({ logoUrl: "" })}>
                Сбросить к логотипу сайта
              </Button>
            )}
          </div>
          <div className="admin-form-grid">
            <Form.Item name="organizationNameRu" label="Название (русский)">
              <Input placeholder={SITE_DEFAULT_NAME_RU} />
            </Form.Item>
            <Form.Item name="organizationNameTyv" label="Название (тувинский)">
              <Input placeholder={SITE_DEFAULT_NAME_TYV} />
            </Form.Item>
          </div>
        </Card>

        <Card title="Копирайт и разработчик" style={{ marginBottom: 16 }}>
          <Form.Item name="showCopyright" label="Показывать копирайт" valuePropName="checked">
            <Switch />
          </Form.Item>
          <div className="admin-form-grid">
            <Form.Item name="copyrightTextRu" label="Текст копирайта (русский)">
              <Input />
            </Form.Item>
            <Form.Item name="copyrightTextTyv" label="Текст копирайта (тувинский)">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="copyrightYear" label="Год">
            <InputNumber min={1990} max={2100} />
          </Form.Item>
          <Divider orientation="left" plain>
            Разработчик
          </Divider>
          <Form.Item name="showDeveloper" label="Показывать подпись разработчика" valuePropName="checked">
            <Switch />
          </Form.Item>
          <div className="admin-form-grid">
            <Form.Item name="developerTextRu" label="Подпись (русский)">
              <Input />
            </Form.Item>
            <Form.Item name="developerTextTyv" label="Подпись (тувинский)">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="developerUrl" label="Ссылка разработчика" rules={[LINK_RULE]}>
            <Input placeholder="https://..." />
          </Form.Item>
        </Card>

        <Card title="Колонки меню подвала" style={{ marginBottom: 16 }}>
          <Form.Item
            name="menuGroupIds"
            label="Какие колонки показывать в подвале"
            extra="Порядок колонок задаётся в разделе «Меню»"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Выберите колонки"
              options={groups.map((group) => ({ value: group.id, label: group.titleRu }))}
            />
          </Form.Item>
        </Card>

        <Card title="Социальные сети" style={{ marginBottom: 16 }}>
          <Form.Item name="showSocials" label="Показывать блок социальных сетей" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.List name="socials">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <Form.Item
                        {...field}
                        name={[field.name, "titleRu"]}
                        label="Название (русский)"
                        style={{ flex: 1, minWidth: 180 }}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "titleTyv"]}
                        label="Название (тувинский)"
                        style={{ flex: 1, minWidth: 180 }}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <Form.Item
                        {...field}
                        name={[field.name, "url"]}
                        label="Ссылка"
                        rules={[LINK_RULE]}
                        style={{ flex: 2, minWidth: 220 }}
                      >
                        <Input placeholder="https://..." />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, "icon"]} label="Иконка" style={{ width: 180 }}>
                        <Select
                          allowClear
                          placeholder="Выберите"
                          options={[
                            { value: "vk", label: "ВКонтакте" },
                            { value: "max", label: "MAX" },
                            { value: "telegram", label: "Telegram" },
                            { value: "ok", label: "Одноклассники" },
                            { value: "youtube", label: "YouTube" },
                            { value: "rutube", label: "RuTube" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "isVisible"]}
                        label="Показывать"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ id: `social-${Date.now()}`, isVisible: true, icon: "vk" })}>
                  Добавить социальную сеть
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Card title="Контакты" style={{ marginBottom: 16 }}>
          <Form.Item name="showContacts" label="Показывать контакты" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.List name="contacts">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <Form.Item
                        {...field}
                        name={[field.name, "labelRu"]}
                        label="Подпись (русский)"
                        style={{ flex: 1, minWidth: 150 }}
                      >
                        <Input placeholder="Адрес:" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "labelTyv"]}
                        label="Подпись (тувинский)"
                        style={{ flex: 1, minWidth: 150 }}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <Form.Item
                        {...field}
                        name={[field.name, "valueRu"]}
                        label="Значение (русский)"
                        style={{ flex: 1, minWidth: 200 }}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "valueTyv"]}
                        label="Значение (тувинский)"
                        style={{ flex: 1, minWidth: 200 }}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <Form.Item
                        {...field}
                        name={[field.name, "href"]}
                        label="Ссылка (tel:, mailto: — необязательно)"
                        rules={[LINK_RULE]}
                        style={{ flex: 1, minWidth: 220 }}
                      >
                        <Input placeholder="tel:+73942221043" />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, "icon"]} label="Иконка" style={{ width: 180 }}>
                        <Select
                          allowClear
                          placeholder="Авто"
                          options={[
                            { value: "address", label: "Адрес" },
                            { value: "phone", label: "Телефон" },
                            { value: "printer", label: "Факс/приёмная" },
                            { value: "email", label: "Email" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "isVisible"]}
                        label="Показывать"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ id: `contact-${Date.now()}`, isVisible: true, icon: "phone" })}>
                  Добавить контакт
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            Сохранить все изменения
          </Button>
          <Button onClick={load}>Сбросить</Button>
        </Space>
      </Form>
    </AdminShell>
  );
}
