import React from "react";
import {
  Alert,
  App,
  Button,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PictureOutlined,
  PlusOutlined,
  StarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import AdminShell from "./AdminShell.jsx";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { useAdminData } from "../../hooks/useAdminData.js";
import { PhotoAlbumApi } from "../../api/client.js";

export default function AdminAlbumsPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [albums, setAlbums] = React.useState([]);
  const [editing, setEditing] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!adminData.isAuthenticated) return;
    setLoading(true);
    try {
      const data = await PhotoAlbumApi.list({ publishedOnly: false });
      setAlbums(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить фотоальбомы");
    } finally {
      setLoading(false);
    }
  }, [adminData.isAuthenticated, message]);

  React.useEffect(() => {
    load();
  }, [load]);

  const notifySite = () => window.dispatchEvent(new CustomEvent("khural:albums-updated"));

  const openAlbum = (album) => {
    setEditing(album || null);
    form.resetFields();
    form.setFieldsValue({
      slug: album?.slug || "",
      titleRu: album?.titleRu || "",
      titleTyv: album?.titleTyv || "",
      descriptionRu: album?.descriptionRu || "",
      descriptionTyv: album?.descriptionTyv || "",
      eventDate: album?.eventDate || null,
      coverFileId: album?.coverFileId || null,
      isPublished: album?.isPublished ?? true,
      order: album?.order ?? 0,
    });
    setModalOpen(true);
  };

  const saveAlbum = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        slug: values.slug,
        titleRu: values.titleRu,
        titleTyv: values.titleTyv || values.titleRu,
        descriptionRu: values.descriptionRu || null,
        descriptionTyv: values.descriptionTyv || null,
        eventDate: values.eventDate || null,
        coverFileId: values.coverFileId || null,
        isPublished: values.isPublished !== false,
        order: Number(values.order || 0),
      };
      if (editing) await PhotoAlbumApi.update(editing.id, payload);
      else await PhotoAlbumApi.create(payload);
      setModalOpen(false);
      message.success(editing ? "Альбом обновлён" : "Альбом создан");
      await load();
      notifySite();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить альбом");
    }
  };

  const togglePublished = async (album) => {
    try {
      await PhotoAlbumApi.update(album.id, { isPublished: !album.isPublished });
      await load();
      notifySite();
    } catch (error) {
      message.error(error?.message || "Не удалось изменить статус");
    }
  };

  const removeAlbum = async (id) => {
    try {
      await PhotoAlbumApi.remove(id);
      message.success("Альбом удалён");
      await load();
      notifySite();
    } catch (error) {
      message.error(error?.message || "Не удалось удалить альбом");
    }
  };

  const openDetail = async (album) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await PhotoAlbumApi.get(album.id);
      setDetail(data);
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить фотографии");
    } finally {
      setDetailLoading(false);
    }
  };

  const uploadPhotos = async ({ file, onSuccess, onError }) => {
    if (!detail || !file) {
      onError?.(new Error("Альбом не выбран"));
      return;
    }
    try {
      setUploading(true);
      await PhotoAlbumApi.uploadPhotos(detail.id, [file], []);
      const updated = await PhotoAlbumApi.get(detail.id);
      setDetail(updated);
      await load();
      notifySite();
      message.success("Фотография загружена");
      onSuccess?.({});
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить фотографию");
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId) => {
    try {
      await PhotoAlbumApi.removePhoto(detail.id, photoId);
      const updated = await PhotoAlbumApi.get(detail.id);
      setDetail(updated);
      await load();
      notifySite();
    } catch (error) {
      message.error(error?.message || "Не удалось удалить фотографию");
    }
  };

  const setCover = async (photo) => {
    try {
      await PhotoAlbumApi.setCover(detail.id, photo.fileId);
      const updated = await PhotoAlbumApi.get(detail.id);
      setDetail(updated);
      await load();
      notifySite();
      message.success("Обложка обновлена");
    } catch (error) {
      message.error(error?.message || "Не удалось назначить обложку");
    }
  };

  const columns = [
    {
      title: "Альбом",
      dataIndex: "titleRu",
      render: (_, album) => (
        <Space wrap>
          <span style={{ fontWeight: 600 }}>{album.titleRu}</span>
          {album.titleTyv && album.titleTyv !== album.titleRu && (
            <Tag color="blue">{album.titleTyv}</Tag>
          )}
        </Space>
      ),
    },
    { title: "Адрес", dataIndex: "slug", render: (slug) => <code>{slug}</code> },
    { title: "Дата", dataIndex: "eventDate", width: 120 },
    { title: "Фото", dataIndex: "photosCount", width: 80 },
    {
      title: "Статус",
      dataIndex: "isPublished",
      width: 140,
      render: (value, album) => (
        <Switch
          size="small"
          checked={!!value}
          checkedChildren="Опубл."
          unCheckedChildren="Черновик"
          onChange={() => togglePublished(album)}
        />
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 290,
      render: (_, album) => (
        <Space size={4} wrap>
          <Button size="small" icon={<PictureOutlined />} onClick={() => openDetail(album)}>
            Фото
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openAlbum(album)} />
          {album.isPublished && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(`/photo/${album.slug}`, "_blank")}
            />
          )}
          <Popconfirm title="Удалить альбом и все фотографии?" onConfirm={() => removeAlbum(album.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminShell
      activeKey="photos"
      title="Фотоальбомы"
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Раздел «Фотографии»"
        description="Альбомы отображаются на сайте по адресу /photo. publications — только опубликованные альбомы. Фотографии загружаются прямо в альбом; первую можно назначить обложкой."
      />

      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openAlbum(null)}>
          Создать альбом
        </Button>
        <Button onClick={load}>Обновить</Button>
      </Space>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={albums}
        columns={columns}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editing ? "Редактировать альбом" : "Новый фотоальбом"}
        open={modalOpen}
        onOk={saveAlbum}
        onCancel={() => setModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="slug"
            label="Адрес (латиницей)"
            rules={[{ required: true, message: "Укажите адрес альбома" }]}
            extra="Например: naadym-2026"
          >
            <Input />
          </Form.Item>
          <div className="admin-form-grid">
            <Form.Item name="titleRu" label="Название (русский)" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="titleTyv" label="Название (тувинский)">
              <Input />
            </Form.Item>
          </div>
          <div className="admin-form-grid">
            <Form.Item name="descriptionRu" label="Описание (русский)">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="descriptionTyv" label="Описание (тувинский)">
              <Input.TextArea rows={3} />
            </Form.Item>
          </div>
          <div className="admin-form-grid">
            <Form.Item name="eventDate" label="Дата события">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="order" label="Порядок">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="isPublished" label="Опубликован" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detail ? `Фотографии: ${detail.titleRu}` : "Фотографии"}
        open={!!detail}
        onClose={() => setDetail(null)}
        width={720}
        loading={detailLoading}
      >
        <Upload
          accept="image/*"
          multiple
          showUploadList={false}
          customRequest={uploadPhotos}
          disabled={uploading}
        >
          <Button icon={<UploadOutlined />} loading={uploading} block>
            Загрузить фотографии
          </Button>
        </Upload>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            marginTop: 20,
          }}
        >
          {(detail?.photos || []).map((photo) => (
            <div key={photo.id} style={{ border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
              <Image
                src={normalizeFilesUrl(photo.url)}
                alt={photo.caption || ""}
                style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: 8, fontSize: 12 }}>
                <div style={{ minHeight: 32 }}>{photo.captionRu || photo.caption || "—"}</div>
                <Space size={4} style={{ marginTop: 6 }}>
                  <Button
                    size="small"
                    icon={<StarOutlined />}
                    title="Назначить обложкой"
                    onClick={() => setCover(photo)}
                  />
                  {detail.coverFileId === photo.fileId && <Tag color="gold">обложка</Tag>}
                  <Popconfirm title="Удалить фотографию?" onConfirm={() => removePhoto(photo.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            </div>
          ))}
        </div>
        {detail && !detail.photos?.length && (
          <div style={{ marginTop: 24, textAlign: "center", opacity: 0.6 }}>
            В альбоме пока нет фотографий
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}
