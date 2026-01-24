import React from "react";
import { Button, Upload, App, Form, Input, Space } from "antd";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { readAdminAvatar, writeAdminAvatar } from "./adminAvatar.js";
import { AuthApi } from "../../api/client.js";

export default function AdminProfilePage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [avatarUrl, setAvatarUrl] = React.useState(() => readAdminAvatar());
  const [form] = Form.useForm();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const onAvatar = () => setAvatarUrl(readAdminAvatar());
    window.addEventListener("khural:admin-avatar-updated", onAvatar);
    return () => window.removeEventListener("khural:admin-avatar-updated", onAvatar);
  }, []);

  const avatarLetter = React.useMemo(() => {
    const s = String(adminData.user?.name || adminData.user?.surname || adminData.user?.email || "A").trim();
    return s ? s[0].toUpperCase() : "A";
  }, [adminData.user]);

  // Initialize form with user data
  React.useEffect(() => {
    if (adminData.user) {
      form.setFieldsValue({
        surname: adminData.user.surname || "",
        name: adminData.user.name || "",
        phone: adminData.user.phone || "",
        email: adminData.user.email || "",
        role: adminData.user.role || "",
      });
    }
  }, [adminData.user, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      // Prepare update data (exclude password if empty)
      const updateData = {
        surname: values.surname,
        name: values.name,
        phone: values.phone,
        email: values.email,
        role: values.role,
      };
      
      // Only include password if it was changed
      if (values.password && values.password.trim()) {
        updateData.password = values.password;
      }
      
      await AuthApi.updateProfile(updateData);
      message.success("Профиль обновлен");
      setEditing(false);
      
      // Reload user data
      if (adminData.reload) {
        adminData.reload();
      }
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось обновить профиль");
    } finally {
      setSaving(false);
    }
  };

  const beforeUpload = React.useCallback(async (file) => {
    const isImage = file && typeof file.type === "string" && file.type.startsWith("image/");
    if (!isImage) {
      message.error("Пожалуйста, выберите изображение (png/jpg/webp)");
      return Upload.LIST_IGNORE;
    }
    const maxMb = 2;
    const sizeMb = (file.size || 0) / (1024 * 1024);
    if (sizeMb > maxMb) {
      message.error(`Файл слишком большой. Максимум ${maxMb}MB`);
      return Upload.LIST_IGNORE;
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    writeAdminAvatar(dataUrl);
    message.success("Аватарка обновлена");
    return false;
  }, [message]);

  return (
    <AdminShell
      activeKey={null}
      title="Администратор"
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <div className="admin-grid">
        <div className="admin-card admin-profile">
          <div className="admin-profile__layout">
            <div className="admin-profile__identity">
              <div className="admin-profile__head">
                <div className={"admin-profile__avatar" + (avatarUrl ? " admin-profile__avatar--img" : "")}>
                  {avatarUrl ? <img src={avatarUrl} alt="" className="admin-profile__avatarImg" /> : avatarLetter}
                </div>
                <div className="admin-profile__meta">
                  <div className="admin-profile__name">
                    {adminData.user?.surname && adminData.user?.name 
                      ? `${adminData.user.surname} ${adminData.user.name}`
                      : adminData.user?.name || adminData.user?.email || "Администратор"}
                  </div>
                  <div className="admin-profile__role">{adminData.user?.role || "admin"}</div>
                </div>
              </div>

              <div className="admin-profile__avatarActions">
                <Upload accept="image/*" maxCount={1} showUploadList={false} beforeUpload={beforeUpload}>
                  <Button>Загрузить фото</Button>
                </Upload>
                <Button
                  disabled={!avatarUrl}
                  onClick={() => {
                    writeAdminAvatar(null);
                    message.success("Аватарка удалена");
                  }}
                >
                  Удалить фото
                </Button>
              </div>
            </div>

            {editing ? (
              <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
                <Form.Item
                  label="Фамилия"
                  name="surname"
                  rules={[{ required: false }]}
                >
                  <Input placeholder="Фамилия" />
                </Form.Item>
                <Form.Item
                  label="Имя"
                  name="name"
                  rules={[{ required: false }]}
                >
                  <Input placeholder="Имя" />
                </Form.Item>
                <Form.Item
                  label="Телефон"
                  name="phone"
                  rules={[{ required: false }]}
                >
                  <Input placeholder="Телефон" />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Введите email" },
                    { type: "email", message: "Введите корректный email" },
                  ]}
                >
                  <Input placeholder="Email" />
                </Form.Item>
                <Form.Item
                  label="Пароль"
                  name="password"
                  rules={[{ required: false }]}
                  help="Оставьте пустым, если не хотите менять пароль"
                >
                  <Input.Password placeholder="Новый пароль" />
                </Form.Item>
                <Form.Item
                  label="Роль"
                  name="role"
                  rules={[{ required: false }]}
                >
                  <Input placeholder="Роль" disabled />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" onClick={handleSave} loading={saving}>
                      Сохранить
                    </Button>
                    <Button onClick={() => {
                      setEditing(false);
                      form.resetFields();
                    }}>
                      Отмена
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <div className="admin-profile__grid">
                <div className="admin-profile__item">
                  <div className="admin-profile__label">Фамилия</div>
                  <div className="admin-profile__value">{adminData.user?.surname || "—"}</div>
                </div>
                <div className="admin-profile__item">
                  <div className="admin-profile__label">Имя</div>
                  <div className="admin-profile__value">{adminData.user?.name || "—"}</div>
                </div>
                <div className="admin-profile__item">
                  <div className="admin-profile__label">Телефон</div>
                  <div className="admin-profile__value">{adminData.user?.phone || "—"}</div>
                </div>
                <div className="admin-profile__item">
                  <div className="admin-profile__label">Email</div>
                  <div className="admin-profile__value">{adminData.user?.email || "—"}</div>
                </div>
                <div className="admin-profile__item">
                  <div className="admin-profile__label">Роль</div>
                  <div className="admin-profile__value">{adminData.user?.role || "—"}</div>
                </div>
                <div className="admin-profile__item">
                  <div className="admin-profile__label">Тема</div>
                  <div className="admin-profile__value">
                    {adminData.themeMode === "light" ? "Светлая" : "Тёмная"}
                  </div>
                </div>
                <div className="admin-profile__item" style={{ gridColumn: "1 / -1" }}>
                  <Button type="primary" onClick={() => setEditing(true)}>
                    Редактировать профиль
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="admin-profile__actions">
            <Button href="/admin">Вернуться на Главную</Button>
            <Button danger onClick={adminData.handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}


