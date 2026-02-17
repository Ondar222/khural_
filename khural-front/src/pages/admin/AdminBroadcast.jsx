import React from "react";
import { App, Button, Form, Input, Select, Switch, Card, Space, Divider, Alert, List } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useAdminData } from "../../hooks/useAdminData.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import { BROADCAST_LINKS } from "../../content/broadcasts.js";

const BROADCAST_TYPE_OPTIONS = [
  { value: "vk", label: "VK (ВКонтакте)" },
  { value: "obs", label: "OBS (RTMP поток)" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Другое (embed URL)" },
];

export default function AdminBroadcast() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [broadcastLinks, setBroadcastLinks] = React.useState(() => [...BROADCAST_LINKS]);
  const [linksLoading, setLinksLoading] = React.useState(false);
  const [linksSaved, setLinksSaved] = React.useState(false);
  const [newLinkUrl, setNewLinkUrl] = React.useState("");

  const broadcastType = Form.useWatch("type", form);

  // Загружаем текущие настройки трансляции
  React.useEffect(() => {
    const loadBroadcastSettings = async () => {
      if (!adminData.isAuthenticated) return;
      
    let broadcast = null;
      
      // Сначала проверяем localStorage (fallback)
    try {
      const local = localStorage.getItem("admin_settings_broadcast");
      if (local) {
        broadcast = JSON.parse(local);
      }
    } catch (e) {
      // ignore
    }
    
      // Загружаем из API через SettingsApi
      try {
        const { SettingsApi } = await import("../../api/client.js");
        const broadcastValue = await SettingsApi.getByKey("broadcast").catch(() => null);
      
        if (broadcastValue) {
          // Может быть объект или строка JSON
          if (typeof broadcastValue === "string") {
            try {
              broadcast = JSON.parse(broadcastValue);
            } catch {
              broadcast = {};
            }
          } else if (broadcastValue.broadcast) {
            // Если API вернул объект с полем broadcast
            const value = broadcastValue.broadcast;
            if (typeof value === "string") {
          try {
                broadcast = JSON.parse(value);
              } catch {
            broadcast = {};
          }
            } else {
              broadcast = value;
        }
          } else {
            broadcast = broadcastValue;
          }
        }
      } catch (error) {
        console.warn("Failed to load broadcast settings from API:", error);
      }
      
      // Fallback: используем settings из adminData
      if (!broadcast && adminData.settings) {
        const settings = adminData.settings;
        if (typeof settings === "object" && settings.broadcast) {
          const settingsBroadcast = settings.broadcast;
        if (typeof settingsBroadcast === "string") {
          try {
            broadcast = JSON.parse(settingsBroadcast);
            } catch {
            broadcast = {};
          }
        } else {
          broadcast = settingsBroadcast;
        }
      }
    }
    
    if (!broadcast || typeof broadcast !== "object") {
      broadcast = {};
    }
    
    form.setFieldsValue({
      type: broadcast.type || broadcast.platform || "vk",
      title: broadcast.title || broadcast.name || "",
      description: broadcast.description || "",
      vkStreamKey: broadcast.vk_stream_key || broadcast.vkStreamKey || broadcast.stream_key || "",
      vkStreamUrl: broadcast.vk_stream_url || broadcast.vkStreamUrl || broadcast.stream_url || "",
      obsRtmpUrl: broadcast.obs_rtmp_url || broadcast.obsRtmpUrl || broadcast.rtmp_url || "",
      obsStreamKey: broadcast.obs_stream_key || broadcast.obsStreamKey || broadcast.obs_key || "",
      youtubeVideoId: broadcast.youtube_video_id || broadcast.youtubeVideoId || "",
      youtubeUrl: broadcast.youtube_url || broadcast.youtubeUrl || "",
      embedUrl: broadcast.embed_url || broadcast.embedUrl || "",
      isActive: broadcast.is_active !== false && broadcast.isActive !== false,
    });
    };
    
    loadBroadcastSettings();
  }, [adminData.isAuthenticated, adminData.settings, form]);

  // Загружаем список ссылок архива трансляций
  React.useEffect(() => {
    const loadLinks = async () => {
      if (!adminData.isAuthenticated) return;
      try {
        const { SettingsApi } = await import("../../api/client.js");
        const raw = await SettingsApi.getByKey("broadcast_links").catch(() => null);
        if (raw == null) return;
        let arr = [];
        if (typeof raw === "string") {
          try {
            arr = JSON.parse(raw);
          } catch {
            arr = [];
          }
        } else if (raw?.value != null) {
          const v = raw.value;
          if (Array.isArray(v)) arr = v.filter((x) => typeof x === "string");
          else if (typeof v === "string") {
            try {
              arr = JSON.parse(v);
            } catch {
              arr = [];
            }
          }
        }
        if (Array.isArray(arr) && arr.length > 0) {
          setBroadcastLinks(arr);
        }
      } catch (e) {
        // ignore, оставляем BROADCAST_LINKS
      }
    };
    loadLinks();
  }, [adminData.isAuthenticated]);

  const handleSave = async () => {
    if (!adminData.canWrite) {
      message.warning("Нет прав на запись");
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);
      setSaved(false);

      // Формируем объект настроек трансляции
      const broadcastData = {
        type: values.type || "vk",
        title: values.title || "",
        description: values.description || "",
        vk_stream_key: values.vkStreamKey || "",
        vk_stream_url: values.vkStreamUrl || "",
        obs_rtmp_url: values.obsRtmpUrl || "",
        obs_stream_key: values.obsStreamKey || "",
        youtube_video_id: values.youtubeVideoId || "",
        youtube_url: values.youtubeUrl || "",
        embed_url: values.embedUrl || "",
        is_active: values.isActive !== false,
      };

      // Сохраняем через SettingsApi
      try {
        const { SettingsApi } = await import("../../api/client.js");
        await SettingsApi.update({
            broadcast: JSON.stringify(broadcastData),
        });
        message.success("Настройки трансляции сохранены");
      } catch (apiError) {
        // Fallback: сохраняем в localStorage для немедленного отображения
        localStorage.setItem("admin_settings_broadcast", JSON.stringify(broadcastData));
        message.warning("Настройки сохранены локально (API недоступен)");
      }

      setSaved(true);
      message.success("Настройки трансляции сохранены");
      
      // Обновляем данные
      if (adminData.reload) {
        adminData.reload();
      }
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить настройки");
    } finally {
      setLoading(false);
    }
  };

  const addBroadcastLink = () => {
    const url = (newLinkUrl || "").trim();
    if (!url) {
      message.warning("Введите ссылку");
      return;
    }
    if (broadcastLinks.includes(url)) {
      message.info("Ссылка уже в списке");
      return;
    }
    setBroadcastLinks((prev) => [...prev, url]);
    setNewLinkUrl("");
  };

  const removeBroadcastLink = (url) => {
    setBroadcastLinks((prev) => prev.filter((u) => u !== url));
  };

  const saveBroadcastLinks = async () => {
    if (!adminData.canWrite) {
      message.warning("Нет прав на запись");
      return;
    }
    setLinksLoading(true);
    setLinksSaved(false);
    try {
      const { SettingsApi } = await import("../../api/client.js");
      await SettingsApi.update({
        broadcast_links: JSON.stringify(broadcastLinks),
      });
      setLinksSaved(true);
      message.success("Список трансляций сохранён");
    } catch (e) {
      message.error("Не удалось сохранить список");
    } finally {
      setLinksLoading(false);
    }
  };

  return (
    <div className="admin-grid">
      <div className="admin-card">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Управление трансляцией</h2>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Настройте трансляцию для отображения на главной странице сайта
          </p>
        </div>

        {saved && (
          <Alert
            message="Настройки сохранены"
            type="success"
            closable
            onClose={() => setSaved(false)}
            style={{ marginBottom: 24 }}
          />
        )}

        <Form layout="vertical" form={form}>
          <Form.Item
            label="Тип трансляции"
            name="type"
            rules={[{ required: true, message: "Выберите тип трансляции" }]}
          >
            <Select options={BROADCAST_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item label="Название" name="title">
            <Input placeholder="Например: Трансляция заседания Верховного Хурала" />
          </Form.Item>

          <Form.Item 
            label="Описание" 
            name="description"
            getValueFromEvent={(value) => value}
          >
            <TinyMCEEditor
              height={300}
              placeholder="Краткое описание трансляции"
            />
          </Form.Item>

          <Divider />

          {/* VK настройки */}
          {broadcastType === "vk" && (
            <>
              <Form.Item
                label="Ключ трансляции VK"
                name="vkStreamKey"
                help="Ключ трансляции из VK или ID видео (например: -123456789_123456789)"
              >
                <Input placeholder="Ключ трансляции VK" />
              </Form.Item>
              <Form.Item
                label="Ссылка на трансляцию VK"
                name="vkStreamUrl"
                help="Прямая ссылка на трансляцию в VK (например: https://vk.com/video-123456789_123456789)"
              >
                <Input placeholder="https://vk.com/video-..." />
              </Form.Item>
            </>
          )}

          {/* OBS настройки */}
          {broadcastType === "obs" && (
            <>
              <Form.Item
                label="RTMP URL"
                name="obsRtmpUrl"
                help="URL RTMP сервера (например: rtmp://example.com/live)"
              >
                <Input placeholder="rtmp://example.com/live" />
              </Form.Item>
              <Form.Item
                label="Ключ потока (Stream Key)"
                name="obsStreamKey"
                help="Ключ потока для OBS"
              >
                <Input.Password placeholder="Ключ потока" />
              </Form.Item>
              <Alert
                message="Для OBS трансляций"
                description="RTMP потоки требуют специального видеоплеера. Рекомендуется использовать сервисы, которые конвертируют RTMP в HLS для веб-воспроизведения."
                type="info"
                style={{ marginBottom: 16 }}
              />
            </>
          )}

          {/* YouTube настройки */}
          {broadcastType === "youtube" && (
            <>
              <Form.Item
                label="ID видео YouTube"
                name="youtubeVideoId"
                help="ID видео из URL YouTube (например: dQw4w9WgXcQ)"
              >
                <Input placeholder="dQw4w9WgXcQ" />
              </Form.Item>
              <Form.Item
                label="Ссылка на видео YouTube"
                name="youtubeUrl"
                help="Полная ссылка на видео (например: https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
              >
                <Input placeholder="https://www.youtube.com/watch?v=..." />
              </Form.Item>
            </>
          )}

          {/* Другое (embed URL) */}
          {broadcastType === "other" && (
            <Form.Item
              label="URL для встраивания (embed)"
              name="embedUrl"
              help="Прямой URL для iframe встраивания"
            >
              <Input placeholder="https://example.com/embed/..." />
            </Form.Item>
          )}

          <Divider />

          <Form.Item label="Активна" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={handleSave}
                loading={loading}
                disabled={!adminData.canWrite}
              >
                Сохранить настройки
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {!adminData.canWrite && (
          <Alert
            message="Нет прав на запись"
            description="Войдите в админку для сохранения настроек"
            type="warning"
            style={{ marginTop: 16 }}
          />
        )}
      </div>

      <div className="admin-card" style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Архив трансляций</h2>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Ссылки на архив трансляций (VK, YouTube). Они отображаются на главной и на странице «Все трансляции».
          </p>
        </div>
        {linksSaved && (
          <Alert
            message="Список сохранён"
            type="success"
            closable
            onClose={() => setLinksSaved(false)}
            style={{ marginBottom: 16 }}
          />
        )}
        <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
          <Input
            placeholder="https://vkvideo.ru/video-... или https://youtu.be/..."
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            onPressEnter={addBroadcastLink}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={addBroadcastLink}>
            Добавить по ссылке
          </Button>
        </Space.Compact>
        <List
          size="small"
          dataSource={broadcastLinks}
          renderItem={(url) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  danger
                  key="remove"
                  icon={<DeleteOutlined />}
                  onClick={() => removeBroadcastLink(url)}
                  disabled={!adminData.canWrite}
                />,
              ]}
            >
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all" }}>
                {url}
              </a>
            </List.Item>
          )}
          style={{ marginBottom: 16 }}
        />
        <Button
          type="primary"
          loading={linksLoading}
          onClick={saveBroadcastLinks}
          disabled={!adminData.canWrite}
        >
          Сохранить список трансляций
        </Button>
      </div>
    </div>
  );
}

