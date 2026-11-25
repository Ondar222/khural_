import React from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { SiteApi, UploadApi } from "../../api/client.js";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { normalizeBool } from "../../utils/bool.js";
import { notifySiteUpdated } from "../../utils/siteUpdates.js";

const SITE_DEFAULT_LOGO = "https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg";
const SITE_DEFAULT_NAME_RU = "Верховный Хурал (парламент) Республики Тыва";
const SITE_DEFAULT_NAME_TYV = "Тыва Республиканың Дээди Хуралы (парламентизи)";

const DEFAULT_HEADER = {
  logoUrl: "",
  organizationNameRu: "",
  organizationNameTyv: "",
  topLinks: [],
  showLanguageSwitcher: true,
  showAccessibility: true,
  showBurger: true,
};

export default function AdminHeaderPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [linkForm] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [header, setHeader] = React.useState(DEFAULT_HEADER);
  const [editingLink, setEditingLink] = React.useState(null);
  const [linkModalOpen, setLinkModalOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const logoUrl = header.logoUrl || "";
  const effectiveLogo = logoUrl || SITE_DEFAULT_LOGO;

  const normalizeTopLinks = (links) =>
    (Array.isArray(links) ? links : []).map((link, idx) => ({
      id: String(link?.id || link?._id || link?.key || `link-${idx + 1}`),
      titleRu: String(link?.titleRu ?? link?.title ?? link?.labelRu ?? link?.label ?? link?.name ?? ""),
      titleTyv: String(link?.titleTyv ?? link?.titleTy ?? link?.labelTyv ?? link?.labelTy ?? ""),
      url: String(link?.url ?? link?.href ?? link?.path ?? link?.link ?? ""),
      isVisible:
        link?.hidden !== true &&
        link?.hidden !== "true" &&
        link?.hidden !== 1 &&
        normalizeBool(link?.isVisible ?? link?.visible, true),
    }));

  const load = React.useCallback(async () => {
    if (!adminData.isAuthenticated) return;
    setLoading(true);
    try {
      const data = await SiteApi.getHeader();
      const next = { ...DEFAULT_HEADER, ...(data || {}), topLinks: normalizeTopLinks(data?.topLinks) };
      setHeader(next);
      form.setFieldsValue(next);
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить настройки шапки");
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
      const updated = await SiteApi.updateHeader(patch);
      const next = { ...DEFAULT_HEADER, ...(updated || {}), topLinks: normalizeTopLinks(updated?.topLinks ?? patch?.topLinks ?? header.topLinks) };
      setHeader(next);
      form.setFieldsValue(next);
      message.success("Настройки шапки сохранены");
      notifySite();
    } catch (error) {
      message.error(error?.message || "Не удалось сохранить настройки шапки");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await save({
        organizationNameRu: values.organizationNameRu || "",
        organizationNameTyv: values.organizationNameTyv || "",
      });
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить");
    }
  };

  const uploadLogo = async ({ file }) => {
    try {
      setUploading(true);
      const result = await UploadApi.upload(file);
      await save({ logoUrl: result.link || result.url || `/files/${result.id}` });
      message.success("Логотип загружен");
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить логотип");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const openLink = (link) => {
    setEditingLink(link || null);
    linkForm.resetFields();
    linkForm.setFieldsValue({
      titleRu: link?.titleRu || "",
      titleTyv: link?.titleTyv || "",
      url: link?.url || "",
      isVisible: link?.isVisible !== false,
    });
    setLinkModalOpen(true);
  };

  const saveLink = async () => {
    try {
      const values = await linkForm.validateFields();
      const links = normalizeTopLinks(header.topLinks);
      const record = {
        id: editingLink?.id || `link-${Date.now()}`,
        titleRu: String(values.titleRu || "").trim(),
        titleTyv: String(values.titleTyv || values.titleRu || "").trim(),
        url: String(values.url || "").trim(),
        isVisible: values.isVisible !== false,
      };
      if (editingLink) {
        const index = links.findIndex((item) => item.id === editingLink.id);
        if (index >= 0) links[index] = record;
      } else {
        links.push(record);
      }
      setLinkModalOpen(false);
      await save({ topLinks: links });
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить ссылку");
    }
  };

  const patchLink = async (id, patch) => {
    const links = normalizeTopLinks(header.topLinks).map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    );
    await save({ topLinks: links });
  };

  const removeLink = async (id) => {
    const links = normalizeTopLinks(header.topLinks).filter((item) => item.id !== id);
    await save({ topLinks: links });
  };

  const columns = [
    {
      title: "Название",
      dataIndex: "titleRu",
      render: (_, link) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: "#1f2937", whiteSpace: "normal", wordBreak: "break-word" }}>
            {link.titleRu || "—"}
          </span>
          {link.titleTyv && link.titleTyv !== link.titleRu && (
            <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "normal", wordBreak: "break-word" }}>
              {link.titleTyv}
            </span>
          )}
          {link.isVisible === false && <Tag style={{ width: "fit-content" }}>скрыта</Tag>}
        </div>
      ),
    },
    {
      title: "Ссылка",
      dataIndex: "url",
      render: (url) => (
        <span style={{ color: "#334155", whiteSpace: "normal", wordBreak: "break-all" }}>{url || "—"}</span>
      ),
    },
    {
      title: "Видимость",
      key: "visible",
      width: 110,
      render: (_, link) => (
        <Switch
          size="small"
          checked={link.isVisible !== false}
          onChange={(checked) => patchLink(link.id, { isVisible: checked })}
        />
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 130,
      render: (_, link) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openLink(link)} />
          <Popconfirm title="Удалить ссылку?" onConfirm={() => removeLink(link.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminShell
      activeKey="header"
      title="Редактор шапки сайта"
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Что редактируется в шапке"
        description="Логотип, название организации на двух языках и верхние ссылки. Переключатель языка, версия для слабовидящих и кнопка меню показываются на сайте в режиме чтения."
      />

      <Card title="Логотип и название" loading={loading} style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} preserve={false}>
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
              <img src={normalizeFilesUrl(effectiveLogo)} alt="Логотип" style={{ maxWidth: "100%", maxHeight: "100%" }} />
            </div>
            <Upload accept="image/*" showUploadList={false} customRequest={uploadLogo}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                {logoUrl ? "Заменить логотип" : "Загрузить логотип"}
              </Button>
            </Upload>
            {!logoUrl && (
              <Button onClick={() => save({ logoUrl: SITE_DEFAULT_LOGO, organizationNameRu: header.organizationNameRu || SITE_DEFAULT_NAME_RU, organizationNameTyv: header.organizationNameTyv || SITE_DEFAULT_NAME_TYV })}>
                Использовать логотип сайта
              </Button>
            )}
            {logoUrl && (
              <Button type="link" danger onClick={() => save({ logoUrl: "" })}>
                Сбросить к логотипу сайта
              </Button>
            )}
          </div>

          <Form.Item name="organizationNameRu" label="Название организации (русский)">
            <Input placeholder={SITE_DEFAULT_NAME_RU} />
          </Form.Item>
          <Form.Item name="organizationNameTyv" label="Название организации (тувинский)">
            <Input placeholder={SITE_DEFAULT_NAME_TYV} />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Сохранить
            </Button>
            <Button onClick={load}>Сбросить</Button>
          </Space>
        </Form>
      </Card>

      <Card
        title="Верхние ссылки"
        extra={
          <Space wrap>
            <Button onClick={() => save({ topLinks: [
              { id: "admin", titleRu: "Перейти в админку", titleTyv: "Админче", url: "/admin", isVisible: true },
              { id: "account", titleRu: "Личный кабинет", titleTyv: "Шенчге кабинет", url: "/cabinet/account", isVisible: true },
            ] })}>
              Восстановить по умолчанию
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openLink(null)}>
              Добавить ссылку
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Table
          rowKey={(row, idx) => row.id || `top-link-${idx}`}
          size="small"
          dataSource={header.topLinks || []}
          columns={columns}
          pagination={false}
          scroll={{ x: 720 }}
          locale={{ emptyText: "Верхние ссылки ещё не добавлены" }}
        />
      </Card>

      <Modal
        title={editingLink ? "Редактировать ссылку" : "Новая верхняя ссылка"}
        open={linkModalOpen}
        onOk={saveLink}
        onCancel={() => setLinkModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={linkForm} layout="vertical" preserve={false}>
          <Form.Item name="titleRu" label="Название (русский)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="titleTyv" label="Название (тувинский)">
            <Input />
          </Form.Item>
          <Form.Item
            name="url"
            label="Ссылка"
            rules={[{ required: true, message: "Укажите ссылку" }]}
          >
            <Input placeholder="/admin или https://example.ru" />
          </Form.Item>
          <Form.Item name="isVisible" label="Показывать на сайте" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </AdminShell>
  );
}
