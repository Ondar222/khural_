import React from "react";
import { App, Button, Space, Upload } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { cmsFileUrl } from "../utils/cmsImages.js";

const MAX_SIZE_MB = 200;

/**
 * Поле выбора видеофайла для CMS-блоков.
 * Значение — { fileId?: string, file?: File }.
 * Файл загружается на сервер при сохранении страницы (batch-загрузка блоков),
 * поэтому сразу после выбора показываем локальный предпросмотр.
 */
export default function VideoUploadField({ value, onChange, disabled = false }) {
  const { message } = App.useApp();

  const file =
    value?.file && typeof File !== "undefined" && value.file instanceof File
      ? value.file
      : null;
  const fileId = String(value?.fileId || "").trim();

  const [objectUrl, setObjectUrl] = React.useState("");

  React.useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSelect = React.useCallback(
    (nextFile) => {
      if (!nextFile) return Upload.LIST_IGNORE;

      const mime = typeof nextFile.type === "string" ? nextFile.type : "";
      if (mime && !mime.startsWith("video/")) {
        message.error("Выберите видеофайл (MP4, WEBM или MOV)");
        return Upload.LIST_IGNORE;
      }

      const sizeMb = (nextFile.size || 0) / (1024 * 1024);
      if (sizeMb > MAX_SIZE_MB) {
        message.error(`Файл слишком большой. Максимум ${MAX_SIZE_MB} МБ`);
        return Upload.LIST_IGNORE;
      }

      onChange?.({ fileId: "", file: nextFile });
      return Upload.LIST_IGNORE;
    },
    [message, onChange]
  );

  const previewSrc = objectUrl || cmsFileUrl(fileId);

  return (
    <div className="cms-video-upload">
      {previewSrc ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <video
            src={previewSrc}
            controls
            preload="metadata"
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: 240,
              borderRadius: 8,
              background: "#000",
            }}
          />
          <Space wrap>
            <Upload
              accept="video/*,.mp4,.webm,.mov,.m4v"
              maxCount={1}
              showUploadList={false}
              disabled={disabled}
              beforeUpload={handleSelect}
            >
              <Button icon={<UploadOutlined />} disabled={disabled}>
                Заменить
              </Button>
            </Upload>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={disabled}
              onClick={() => onChange?.(undefined)}
            >
              Удалить
            </Button>
          </Space>
          {file ? (
            <div style={{ fontSize: 12, color: "#1677ff" }}>
              Файл загрузится при сохранении страницы
            </div>
          ) : null}
        </div>
      ) : (
        <Upload
          accept="video/*,.mp4,.webm,.mov,.m4v"
          maxCount={1}
          showUploadList={false}
          disabled={disabled}
          beforeUpload={handleSelect}
        >
          <Button icon={<UploadOutlined />} disabled={disabled}>
            Загрузить видео
          </Button>
        </Upload>
      )}
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
        MP4, WEBM или MOV, до {MAX_SIZE_MB} МБ
      </div>
    </div>
  );
}
