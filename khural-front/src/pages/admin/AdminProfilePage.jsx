import React from "react";
import { Button, Upload, App } from "antd";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { readAdminAvatar, writeAdminAvatar } from "./adminAvatar.js";

export default function AdminProfilePage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [avatarUrl, setAvatarUrl] = React.useState(() => readAdminAvatar());

  React.useEffect(() => {
    const onAvatar = () => setAvatarUrl(readAdminAvatar());
    window.addEventListener("khural:admin-avatar-updated", onAvatar);
    return () => window.removeEventListener("khural:admin-avatar-updated", onAvatar);
  }, []);

  const avatarLetter = React.useMemo(() => {
    const s = String(adminData.user?.name || adminData.user?.email || "A").trim();
    return s ? s[0].toUpperCase() : "A";
  }, [adminData.user]);

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
      subtitle=""
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <div className="admin-grid">
        <div className="admin-card admin-profile">
          <div className="admin-profile__head">
            <div className={"admin-profile__avatar" + (avatarUrl ? " admin-profile__avatar--img" : "")}>
              {avatarUrl ? <img src={avatarUrl} alt="" className="admin-profile__avatarImg" /> : avatarLetter}
            </div>
            <div className="admin-profile__meta">
              <div className="admin-profile__name">{adminData.user?.name || adminData.user?.email || "Администратор"}</div>
              <div className="admin-profile__role">{adminData.user?.role || "admin"}</div>
            </div>
          </div>

          <div className="admin-profile__avatarActions">
            <Upload
              accept="image/*"
              maxCount={1}
              showUploadList={false}
              beforeUpload={beforeUpload}
            >
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

          <div className="admin-profile__grid">
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
              <div className="admin-profile__value">{adminData.themeMode === "light" ? "Светлая" : "Тёмная"}</div>
            </div>
          </div>

          <div className="admin-profile__actions">
            <Button href="/admin">На главную админки</Button>
            <Button danger onClick={adminData.handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}


