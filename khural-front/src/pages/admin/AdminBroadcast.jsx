import React from "react";
import { App, Button, Form, Input, Select, Switch, Card, Space, Divider, Alert } from "antd";
import { useAdminData } from "../../hooks/useAdminData.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";

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

  const broadcastType = Form.useWatch("type", form);

  // Загружаем текущие настройки трансляции
  React.useEffect(() => {
    // Сначала проверяем localStorage
    let broadcast = null;
    try {
      const local = localStorage.getItem("admin_settings_broadcast");
      if (local) {
        broadcast = JSON.parse(local);
      }
    } catch (e) {
      // ignore
    }
    
    // Если нет в localStorage, ищем в settings из API
    if (!broadcast && adminData.settings) {
      const settings = adminData.settings;
      
      if (Array.isArray(settings)) {
        const broadcastSetting = settings.find((s) => s?.key === "broadcast");
        if (broadcastSetting?.value) {
          try {
            broadcast = JSON.parse(broadcastSetting.value);
          } catch (e) {
            broadcast = {};
          }
        }
      } else if (typeof settings === "object") {
        const settingsBroadcast = settings.broadcast || settings.stream || settings.vk_stream || {};
        if (typeof settingsBroadcast === "string") {
          try {
            broadcast = JSON.parse(settingsBroadcast);
          } catch (e) {
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
  }, [adminData.settings, form]);

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

      // Сохраняем через API settings
      try {
        const { apiFetch } = await import("../../api/client.js");
        await apiFetch("/settings", {
          method: "PATCH",
          body: {
            broadcast: JSON.stringify(broadcastData),
          },
          auth: true,
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
    </div>
  );
}

