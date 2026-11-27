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
import { PhotoAlbumApi, UploadApi } from "../../api/client.js";

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
  const [modalLoading, setModalLoading] = React.useState(false);
  const [savingModal, setSavingModal] = React.useState(false);
  const [coverUpload, setCoverUpload] = React.useState(null);
  const [albumPhotos, setAlbumPhotos] = React.useState([]);
  const [existingPhotos, setExistingPhotos] = React.useState([]);
  const [existingCoverUrl, setExistingCoverUrl] = React.useState("");
  const watchedCoverFileId = Form.useWatch("coverFileId", form);
  const previewUrlsRef = React.useRef(new Set());

  const makePreviewUrl = React.useCallback((file) => {
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.add(url);
    return url;
  }, []);

  const releasePreviewUrl = React.useCallback((url) => {
    if (!url || !previewUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  }, []);

  React.useEffect(
    () => () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    },
    [],
  );

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

  const photoUrl = React.useCallback(
    (photo) =>
      normalizeFilesUrl(
        photo?.url || (photo?.fileId ? `/api/files/${photo.fileId}` : ""),
      ),
    [],
  );

  const fileIdFromUrl = React.useCallback((url) => {
    const match = String(url || "").match(/(?:\/api)?\/files\/([A-Za-z0-9._-]+)/);
    return match?.[1] || null;
  }, []);

  // Импортированные фото могут приходить с разными ключами — показываем
  // название и описание, какие есть, без привязки к одному формату.
  const photoText = React.useCallback((photo) => {
    const firstText = (...values) =>
      values.find((value) => typeof value === "string" && value.trim()) || "";
    const title = firstText(
      photo?.titleRu,
      photo?.title,
      photo?.nameRu,
      photo?.name,
      photo?.captionRu,
      photo?.caption,
      photo?.titleTyv,
      photo?.captionTyv,
    );
    const description = firstText(
      photo?.descriptionRu,
      photo?.description,
      photo?.textRu,
      photo?.text,
      photo?.descriptionTyv,
      photo?.captionDescription,
    );
    return {
      title: title || description,
      description: title && description && description !== title ? description : "",
    };
  }, []);

  const resetModalMedia = React.useCallback(() => {
    if (coverUpload?.previewUrl) releasePreviewUrl(coverUpload.previewUrl);
    albumPhotos.forEach((item) => releasePreviewUrl(item.previewUrl));
    setCoverUpload(null);
    setAlbumPhotos([]);
    setExistingPhotos([]);
    setExistingCoverUrl("");
  }, [albumPhotos, coverUpload, releasePreviewUrl]);

  const closeModal = () => {
    setModalOpen(false);
    setModalLoading(false);
    resetModalMedia();
  };

  const openAlbum = async (album) => {
    setEditing(album || null);
    form.resetFields();
    resetModalMedia();
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
    const initialCover = album?.coverUrl
      ? normalizeFilesUrl(album.coverUrl)
      : album?.coverFileId
        ? normalizeFilesUrl(`/api/files/${album.coverFileId}`)
        : "";
    setExistingCoverUrl(initialCover);
    setModalOpen(true);

    if (!album?.id) return;
    setModalLoading(true);
    try {
      // Импортированные альбомы приходят в списке без фотографий — подтягиваем
      // полный альбом, чтобы в модалке редактирования сразу были фото и обложка.
      const data = await PhotoAlbumApi.get(album.id);
      const photos = Array.isArray(data?.photos) ? data.photos : [];
      setExistingPhotos(photos);
      const coverFileId = data?.coverFileId || album.coverFileId || null;
      const coverUrl = data?.coverUrl || album.coverUrl || "";
      setExistingCoverUrl(
        coverUrl
          ? normalizeFilesUrl(coverUrl)
          : coverFileId
            ? normalizeFilesUrl(`/api/files/${coverFileId}`)
            : "",
      );
      if (coverFileId) form.setFieldValue("coverFileId", coverFileId);
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить фотографии альбома");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCoverSelect = (file) => {
    if (coverUpload?.previewUrl) releasePreviewUrl(coverUpload.previewUrl);
    setCoverUpload({ file, previewUrl: makePreviewUrl(file) });
    form.setFieldValue("coverFileId", null);
    return false;
  };

  const handlePhotosSelect = (file) => {
    setAlbumPhotos((prev) => [
      ...prev,
      { uid: file.uid || `${Date.now()}-${prev.length}`, file, previewUrl: makePreviewUrl(file) },
    ]);
    return false;
  };

  const removePendingPhoto = (uid) => {
    setAlbumPhotos((prev) => {
      const next = [];
      prev.forEach((item) => {
        if (item.uid === uid) releasePreviewUrl(item.previewUrl);
        else next.push(item);
      });
      return next;
    });
  };

  const removeExistingPhoto = async (photo) => {
    if (!editing?.id) return;
    try {
      await PhotoAlbumApi.removePhoto(editing.id, photo.id);
      setExistingPhotos((prev) => prev.filter((item) => item.id !== photo.id));
      await load();
      notifySite();
      message.success("Фотография удалена");
    } catch (error) {
      message.error(error?.message || "Не удалось удалить фотографию");
    }
  };

  const chooseExistingCover = (photo) => {
    const url = photoUrl(photo);
    const fileId = photo.fileId || fileIdFromUrl(url);
    setExistingCoverUrl(url);
    if (coverUpload?.previewUrl) {
      releasePreviewUrl(coverUpload.previewUrl);
      setCoverUpload(null);
    }
    if (!fileId) {
      message.warning(
        "У импортированного фото нет fileId — бэкенд не сможет назначить его обложкой",
      );
      return;
    }
    form.setFieldValue("coverFileId", fileId);
  };

  const saveAlbum = async () => {
    setSavingModal(true);
    try {
      const values = await form.validateFields();
      let uploadedCoverId = null;

      if (coverUpload?.file) {
        const uploaded = await UploadApi.upload(coverUpload.file);
        uploadedCoverId =
          uploaded?.id ||
          uploaded?.file?.id ||
          fileIdFromUrl(uploaded?.link || uploaded?.url);
        if (!uploadedCoverId) {
          throw new Error("Бэкенд не вернул ID загруженной обложки");
        }
      }

      const coverFileId = uploadedCoverId || values.coverFileId || null;
      const payload = {
        slug: values.slug,
        titleRu: values.titleRu,
        titleTyv: values.titleTyv || values.titleRu,
        descriptionRu: values.descriptionRu || null,
        descriptionTyv: values.descriptionTyv || null,
        eventDate: values.eventDate || null,
        isPublished: values.isPublished !== false,
        order: Number(values.order || 0),
      };
      // Для импортированных альбомов обложка может быть только coverUrl без
      // fileId. Не отправляем null, иначе сохранение других полей её сотрёт.
      if (coverFileId || !editing) payload.coverFileId = coverFileId;

      let savedAlbum = null;
      if (editing) {
        await PhotoAlbumApi.update(editing.id, payload);
        savedAlbum = { ...editing, ...payload };
      } else {
        savedAlbum = await PhotoAlbumApi.create(payload);
      }

      let albumId =
        savedAlbum?.id ||
        savedAlbum?.album?.id ||
        savedAlbum?.data?.id ||
        editing?.id ||
        null;
      if (!albumId) {
        const freshList = await PhotoAlbumApi.list({ publishedOnly: false });
        albumId = freshList.find((item) => item.slug === values.slug)?.id || null;
      }
      if (!albumId) throw new Error("Не удалось определить ID альбома");

      if (
        coverFileId &&
        (!editing || String(coverFileId) !== String(editing.coverFileId || ""))
      ) {
        await PhotoAlbumApi.setCover(albumId, coverFileId);
      }

      if (albumPhotos.length) {
        await PhotoAlbumApi.uploadPhotos(
          albumId,
          albumPhotos.map((item) => item.file),
          albumPhotos.map(() => ""),
        );
      }

      closeModal();
      message.success(editing ? "Альбом обновлён" : "Альбом создан");
      await load();
      notifySite();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить альбом");
    } finally {
      setSavingModal(false);
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

  const coverPreviewUrl =
    coverUpload?.previewUrl ||
    existingCoverUrl ||
    (watchedCoverFileId
      ? normalizeFilesUrl(`/api/files/${watchedCoverFileId}`)
      : "");

  const isCoverPhoto = (photo) => {
    const photoUrlValue = photoUrl(photo);
    const photoFileId = photo?.fileId || fileIdFromUrl(photoUrlValue);
    if (watchedCoverFileId && photoFileId) {
      return String(watchedCoverFileId) === String(photoFileId);
    }
    return (
      !!existingCoverUrl &&
      !!photoUrlValue &&
      normalizeFilesUrl(existingCoverUrl) === normalizeFilesUrl(photoUrlValue)
    );
  };

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
        description="Альбомы отображаются на сайте по адресу /photo. Фотографии и обложку можно загрузить прямо в модалке создания/редактирования. У импортированных альбомов уже существующие фото и обложка подгружаются автоматически."
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
        onCancel={closeModal}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={savingModal}
        okButtonProps={{ disabled: savingModal || modalLoading }}
        width={760}
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

        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
          <div className="admin-news-editor__section-title">Обложка альбома</div>
          <Space align="flex-start" wrap>
            <Upload
              accept="image/*"
              maxCount={1}
              showUploadList={false}
              beforeUpload={handleCoverSelect}
              disabled={savingModal}
            >
              <Button icon={<UploadOutlined />} loading={savingModal} disabled={savingModal}>
                Загрузить обложку
              </Button>
            </Upload>
            {coverPreviewUrl && (
              <Image
                src={coverPreviewUrl}
                alt="Обложка альбома"
                style={{
                  width: 160,
                  height: 100,
                  objectFit: "cover",
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  display: "block",
                }}
              />
            )}
          </Space>

          <div className="admin-news-editor__section-title" style={{ marginTop: 16 }}>
            Фотографии альбома
          </div>
          {modalLoading && <div style={{ opacity: 0.65 }}>Загрузка фотографий…</div>}
          <Upload
            accept="image/*"
            multiple
            showUploadList={false}
            beforeUpload={handlePhotosSelect}
            disabled={savingModal}
          >
            <Button icon={<UploadOutlined />} loading={savingModal} disabled={savingModal}>
              Добавить фотографии
            </Button>
          </Upload>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
              marginTop: 12,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {existingPhotos.map((photo) => {
              const url = photoUrl(photo);
              const cover = isCoverPhoto(photo);
              const text = photoText(photo);
              return (
                <div
                  key={photo.id || photo.fileId || url}
                  style={{ border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}
                >
                  <Image
                    src={url}
                    alt={text.title}
                    style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: 8, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, minHeight: 18 }}>{text.title || "—"}</div>
                    {text.description && (
                      <div style={{ opacity: 0.7, marginTop: 4 }}>{text.description}</div>
                    )}
                    <Space size={4} style={{ marginTop: 6 }}>
                      <Button
                        size="small"
                        icon={<StarOutlined />}
                        title="Сделать обложкой"
                        disabled={cover || savingModal}
                        onClick={() => chooseExistingCover(photo)}
                      />
                      {cover && <Tag color="gold">обложка</Tag>}
                      <Popconfirm
                        title="Удалить фотографию?"
                        onConfirm={() => removeExistingPhoto(photo)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} disabled={savingModal} />
                      </Popconfirm>
                    </Space>
                  </div>
                </div>
              );
            })}
            {albumPhotos.map((item) => (
              <div
                key={item.uid}
                style={{ border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}
              >
                <Image
                  src={item.previewUrl}
                  alt={item.file.name}
                  style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
                />
                <div style={{ padding: 8, fontSize: 12 }}>
                  <div style={{ minHeight: 18 }}>{item.file.name}</div>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ marginTop: 6 }}
                    disabled={savingModal}
                    onClick={() => removePendingPhoto(item.uid)}
                  />
                </div>
              </div>
            ))}
          </div>
          {!modalLoading && !existingPhotos.length && !albumPhotos.length && (
            <div style={{ marginTop: 12, textAlign: "center", opacity: 0.6 }}>
              В альбоме пока нет фотографий. Загрузите их здесь или нажмите «Фото» в списке.
            </div>
          )}
        </div>
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
          {(detail?.photos || []).map((photo) => {
            const text = photoText(photo);
            return (
              <div
                key={photo.id}
                style={{ border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}
              >
                <Image
                  src={normalizeFilesUrl(photo.url)}
                  alt={text.title}
                  style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}
                />
                <div style={{ padding: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, minHeight: 32 }}>{text.title || "—"}</div>
                  {text.description && (
                    <div style={{ opacity: 0.7, marginTop: 4 }}>{text.description}</div>
                  )}
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
            );
          })}
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
