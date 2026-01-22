import React from "react";
import { App, Button, Input, Modal, Popconfirm, Space, Table, Tag, Select, Form, Upload } from "antd";
import { FileOutlined, DownloadOutlined, UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { AppealsApi } from "../../api/client.js";

const STATUS_OPTIONS = [
  { value: "Принято", label: "Принято", color: "gold" },
  { value: "В работе", label: "В работе", color: "blue" },
  { value: "Ответ отправлен", label: "Ответ отправлен", color: "green" },
  { value: "Закрыто", label: "Закрыто", color: "default" },
];

function normalizeStatusText(status) {
  if (status == null) return "";
  let v = status;
  if (typeof v === "object") {
    v = v?.name ?? v?.title ?? v?.label ?? v?.code ?? v?.status ?? "";
  }
  const s = String(v || "").trim();
  if (!s) return "";
  const key = s.toLowerCase();
  return (
    {
      accepted: "Принято",
      new: "Принято",
      created: "Принято",
      in_progress: "В работе",
      processing: "В работе",
      answered: "Ответ отправлен",
      sent: "Ответ отправлен",
      done: "Ответ отправлен",
      closed: "Закрыто",
    }[key] || s
  );
}

function normalizeAppeal(a) {
  if (!a) return null;
  return {
    id: String(a?.id || ""),
    number: String(a?.number || "").trim(),
    subject: a?.subject || a?.title || "",
    message: a?.message || a?.text || a?.content || "",
    response: a?.response || a?.adminResponse || a?.adminMessage || "",
    files: Array.isArray(a?.files) ? a.files : Array.isArray(a?.fileList) ? a.fileList : [],
    status: normalizeStatusText(a?.status),
    createdAt: a?.createdAt || a?.created_at || "",
    userEmail: a?.userEmail || a?.user?.email || a?.email || "",
    userName: a?.userName || a?.user?.name || a?.name || "",
  };
}

export default function AdminAppeals({ items, onUpdateStatus, busy, canWrite }) {
  const { message } = App.useApp();
  const [q, setQ] = React.useState("");
  const [selectedAppeal, setSelectedAppeal] = React.useState(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = React.useState(false);
  const [statusChangeAppeal, setStatusChangeAppeal] = React.useState(null);
  const [statusChangeForm] = Form.useForm();
  const [uploadingFiles, setUploadingFiles] = React.useState(false);
  const [fileList, setFileList] = React.useState([]);
  const [statusChangeFileList, setStatusChangeFileList] = React.useState([]);
  const [uploadingStatusFiles, setUploadingStatusFiles] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  const normalizedItems = React.useMemo(() => {
    return (Array.isArray(items) ? items : []).map((a) => ({
      ...a,
      status: normalizeStatusText(a?.status) || "Принято",
    }));
  }, [items]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return normalizedItems;
    return (normalizedItems || []).filter((a) => {
      const subject = String(a.subject || "").toLowerCase();
      const appealMessage = String(a.message || "").toLowerCase();
      const number = String(a.number || "").toLowerCase();
      const email = String(a.userEmail || "").toLowerCase();
      return subject.includes(qq) || appealMessage.includes(qq) || number.includes(qq) || email.includes(qq);
    });
  }, [normalizedItems, q]);

  const openStatusChangeModal = (appeal, newStatus) => {
    setStatusChangeAppeal({ ...appeal, newStatus });
    setStatusChangeModalOpen(true);
    setStatusChangeFileList([]);
    statusChangeForm.setFieldsValue({
      status: newStatus,
      response: "",
    });
  };

  const closeStatusChangeModal = () => {
    setStatusChangeModalOpen(false);
    setStatusChangeAppeal(null);
    setStatusChangeFileList([]);
    statusChangeForm.resetFields();
  };

  const handleStatusChangeSubmit = async () => {
    if (!statusChangeAppeal) return;
    try {
      const values = await statusChangeForm.validateFields();
      await onUpdateStatus(statusChangeAppeal.id, values.status, values.response);
      
      // Загружаем файлы, если они были выбраны
      const filesToUpload = statusChangeFileList.filter((file) => file.originFileObj);
      if (filesToUpload.length > 0) {
        setUploadingStatusFiles(true);
        try {
          await AppealsApi.uploadFiles(statusChangeAppeal.id, filesToUpload.map((f) => f.originFileObj));
          message.success("Статус обновлен и файлы загружены");
        } catch (fileError) {
          message.warning("Статус обновлен, но не удалось загрузить файлы: " + (fileError?.message || "Ошибка"));
        } finally {
          setUploadingStatusFiles(false);
        }
      } else {
        message.success("Успешно отправлено");
      }
      
      // Обновляем список обращений
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("khural:admin:reload"));
      }
      
      closeStatusChangeModal();
      // Обновляем локальное состояние, если обращение открыто в детальном модальном окне
      if (selectedAppeal && String(selectedAppeal.id) === String(statusChangeAppeal.id)) {
        setSelectedAppeal({ ...selectedAppeal, status: values.status });
      }
    } catch (e) {
      if (e?.errorFields) return; // Валидация формы
      message.error(e?.message || "Не удалось обновить статус");
    }
  };

  const handleStatusChange = async (appealId, newStatus) => {
    const appeal = normalizedItems.find((a) => String(a.id) === String(appealId));
    if (appeal) {
      openStatusChangeModal(appeal, newStatus);
    }
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!canWrite) {
      message.warning("Нет прав на удаление");
      return;
    }
    try {
      await AppealsApi.remove(row.id);
      message.success("Обращение удалено");
      // Закрываем модальное окно, если удаляемое обращение открыто
      if (selectedAppeal && String(selectedAppeal.id) === String(row.id)) {
        closeDetailModal();
      }
      // Обновляем список обращений через событие
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("khural:admin:reload"));
      }
    } catch (e) {
      message.error(e?.message || "Не удалось удалить обращение");
    }
  };

  const openDetailModal = (appeal) => {
    setSelectedAppeal(appeal);
    setDetailModalOpen(true);
    // Инициализируем список файлов из обращения
    if (appeal?.files && Array.isArray(appeal.files)) {
      setFileList(
        appeal.files.map((file, index) => ({
          uid: file?.id || file?.fileId || `-${index}`,
          name: file?.name || file?.filename || file?.originalName || `Файл ${index + 1}`,
          status: "done",
          url: file?.url || file?.link || file?.path || "",
          response: file,
        }))
      );
    } else {
      setFileList([]);
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedAppeal(null);
    setFileList([]);
  };

  const handleFileUpload = async () => {
    if (!selectedAppeal?.id || !fileList.length) return;
    
    const filesToUpload = fileList.filter((file) => file.originFileObj);
    if (!filesToUpload.length) {
      message.warning("Выберите файлы для загрузки");
      return;
    }

    setUploadingFiles(true);
    try {
      await AppealsApi.uploadFiles(selectedAppeal.id, filesToUpload.map((f) => f.originFileObj));
      message.success("Файлы успешно загружены");
      
      // Обновляем список обращений
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("khural:admin:reload"));
      }
      
      // Загружаем обновленное обращение с сервера, чтобы получить актуальный список файлов
      try {
        const updatedAppeal = await AppealsApi.getById(selectedAppeal.id);
        if (updatedAppeal) {
          const normalized = normalizeAppeal(updatedAppeal);
          if (normalized) {
            setSelectedAppeal(normalized);
            // Обновляем список файлов из обновленного обращения
            if (normalized.files && Array.isArray(normalized.files)) {
              setFileList(
                normalized.files.map((file, index) => ({
                  uid: file?.id || file?.fileId || `-${index}`,
                  name: file?.name || file?.filename || file?.originalName || `Файл ${index + 1}`,
                  status: "done",
                  url: file?.url || file?.link || file?.path || "",
                  response: file,
                }))
              );
            } else {
              setFileList([]);
            }
          }
        }
      } catch (e) {
        console.warn("Не удалось загрузить обновленное обращение:", e);
        // Помечаем загруженные файлы как успешно загруженные
        setFileList(fileList.map((f) => 
          f.originFileObj 
            ? { ...f, status: "done", originFileObj: undefined } 
            : f
        ));
      }
    } catch (e) {
      message.error(e?.message || "Не удалось загрузить файлы");
      setFileList(fileList.map((f) => (f.originFileObj ? { ...f, status: "error" } : f)));
    } finally {
      setUploadingFiles(false);
    }
  };

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option?.color || "default";
  };

  const formatDateTime = React.useCallback((v) => {
    const d = v ? new Date(v) : null;
    if (!d || Number.isNaN(d.getTime())) return "—";
    return `${d.toLocaleDateString("ru-RU")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  }, []);

  const renderSubjectCell = React.useCallback((row) => {
    const title = `${row.number ? `№ ${row.number}` : "—"}${row.subject ? ` · ${row.subject}` : ""}`;
    const author = [row.userName || "", row.userEmail || ""].filter(Boolean).join(" · ");
    return (
      <div className="admin-appeals-list__subject">
        <div className="admin-appeals-list__subject-title">{title}</div>
        {author ? <div className="admin-appeals-list__subject-author">{author}</div> : null}
      </div>
    );
  }, []);

  const renderMessagePreview = React.useCallback((text) => {
    if (!text) return "—";
    const t = String(text);
    return t.slice(0, 220) + (t.length > 220 ? "…" : "");
  }, []);

  const statusOptions = React.useMemo(
    () =>
      STATUS_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    []
  );

  const columns = React.useMemo(() => {
    const base = [
      {
        title: "Номер / Тема",
        key: "subject",
        render: (_, row) => renderSubjectCell(row),
      },
      !isTablet
        ? {
            title: "Текст обращения",
            dataIndex: "message",
            width: 340,
            render: (text) => <div className="admin-appeals-list__message">{renderMessagePreview(text)}</div>,
          }
        : null,
      {
        title: "Дата",
        dataIndex: "createdAt",
        width: 170,
        render: (v) => <div className="admin-appeals-list__date">{formatDateTime(v)}</div>,
      },
      {
        title: "Статус",
        dataIndex: "status",
        width: 200,
        render: (status, row) => (
          <Select
            value={status}
            onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
            disabled={!canWrite || busy}
            style={{ width: "100%" }}
            options={statusOptions}
            size={isTablet ? "small" : "middle"}
          />
        ),
      },
      {
        title: "Действия",
        key: "actions",
        width: 140,
        render: (_, row) => (
          <Space wrap className="admin-appeals-list__actions">
            <Button size={isTablet ? "small" : "middle"} onClick={() => openDetailModal(row)}>
              Подробнее
            </Button>
            <Popconfirm
              title="Удалить обращение?"
              description="Действие необратимо."
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{ danger: true, disabled: !canWrite || busy }}
              onConfirm={() => handleDelete(row)}
              disabled={!canWrite || busy}
            >
              <Button danger size={isTablet ? "small" : "middle"} disabled={!canWrite || busy}>
                Удалить
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ].filter(Boolean);
    return base;
  }, [busy, canWrite, formatDateTime, isTablet, openDetailModal, renderMessagePreview, renderSubjectCell, statusOptions]);

  const toolbar = (
    <div className="admin-card admin-toolbar admin-appeals-list__toolbar">
      <div className="admin-appeals-list__toolbar-left">
        <Input
          placeholder="Поиск по теме, тексту, номеру, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isMobile ? "large" : "middle"}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="admin-grid admin-appeals-list">
        {toolbar}

        {Array.isArray(filtered) && filtered.length ? (
          <div className="admin-cards admin-appeals-list__cards">
            {filtered.map((row) => (
              <div key={String(row.id)} className="admin-card admin-appeals-list__card">
                {renderSubjectCell(row)}
                <div className="admin-appeals-list__message">{renderMessagePreview(row.message)}</div>

                <div className="admin-appeals-list__meta-row">
                  <div className="admin-appeals-list__date">{formatDateTime(row.createdAt)}</div>
                  <Tag color={getStatusColor(row.status)}>{row.status}</Tag>
                </div>

                <div className="admin-appeals-list__card-actions">
                  <Select
                    value={row.status}
                    onChange={(newStatus) => openStatusChangeModal(row, newStatus)}
                    disabled={!canWrite || busy}
                    options={statusOptions}
                    size="large"
                  />
                  <Button onClick={() => openDetailModal(row)} block>
                    Подробнее
                  </Button>
                  <Popconfirm
                    title="Удалить обращение?"
                    description="Действие необратимо."
                    okText="Удалить"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true, disabled: !canWrite || busy }}
                    onConfirm={() => handleDelete(row)}
                    disabled={!canWrite || busy}
                  >
                    <Button danger block disabled={!canWrite || busy}>
                      Удалить
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card admin-appeals-list__empty">Нет данных</div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid admin-appeals-list">
      {toolbar}

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: 10,
            showSizeChanger: !isTablet,
            showQuickJumper: !isTablet,
            size: isTablet ? "small" : "default",
          }}
          scroll={isTablet ? { x: "max-content" } : undefined}
        />
      </div>

      <Modal
        title={
          selectedAppeal
            ? `Обращение ${selectedAppeal.number ? `№ ${selectedAppeal.number}` : ""}`
            : "Подробности обращения"
        }
        open={detailModalOpen}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal}>
            Закрыть
          </Button>,
          <Popconfirm
            key="delete"
            title="Удалить обращение?"
            description="Действие необратимо."
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true, disabled: !canWrite || busy || !selectedAppeal }}
            onConfirm={() => handleDelete(selectedAppeal)}
            disabled={!canWrite || busy || !selectedAppeal}
          >
            <Button danger disabled={!canWrite || busy || !selectedAppeal}>
              Удалить
            </Button>
          </Popconfirm>,
        ]}
        width={700}
      >
        {selectedAppeal && (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Тема:</div>
              <div>{selectedAppeal.subject || "—"}</div>
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Статус:</div>
              <Tag color={getStatusColor(selectedAppeal.status)}>{selectedAppeal.status}</Tag>
            </div>

            {selectedAppeal.userName || selectedAppeal.userEmail ? (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Автор:</div>
                <div>
                  {selectedAppeal.userName || "—"}
                  {selectedAppeal.userName && selectedAppeal.userEmail ? " · " : ""}
                  {selectedAppeal.userEmail || ""}
                </div>
              </div>
            ) : null}

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Дата создания:</div>
              <div>
                {selectedAppeal.createdAt
                  ? new Date(selectedAppeal.createdAt).toLocaleString("ru-RU")
                  : "—"}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Текст обращения:</div>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: "1.6",
                  padding: "12px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {selectedAppeal.message || "—"}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Файлы:</div>
              <Upload
                fileList={fileList}
                onChange={({ fileList: newFileList }) => {
                  setFileList(newFileList);
                }}
                beforeUpload={(file) => {
                  // Не загружаем автоматически, загружаем по кнопке
                  const newFileList = [...fileList, { uid: file.uid, name: file.name, status: "uploading", originFileObj: file }];
                  setFileList(newFileList);
                  return false; // Предотвращаем автоматическую загрузку
                }}
                onRemove={(file) => {
                  const newFileList = fileList.filter((f) => f.uid !== file.uid);
                  setFileList(newFileList);
                }}
                multiple
                disabled={!canWrite || busy || uploadingFiles}
              >
                <Button icon={<UploadOutlined />} disabled={!canWrite || busy || uploadingFiles}>
                  Прикрепить файл
                </Button>
              </Upload>
              {fileList.some((f) => f.originFileObj || f.status === "uploading") && (
                <Button
                  type="primary"
                  onClick={handleFileUpload}
                  loading={uploadingFiles}
                  disabled={!canWrite || busy || uploadingFiles}
                  style={{ marginTop: 8 }}
                >
                  Загрузить файлы
                </Button>
              )}
              {selectedAppeal.files && Array.isArray(selectedAppeal.files) && selectedAppeal.files.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Загруженные файлы:</div>
                  {selectedAppeal.files.map((file, index) => {
                    const fileUrl = file?.url || file?.link || file?.path || "";
                    const fileName = file?.name || file?.filename || file?.originalName || `Файл ${index + 1}`;
                    const fileId = file?.id || file?.fileId || "";
                    
                    return (
                      <div
                        key={fileId || index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          backgroundColor: "#f5f5f5",
                          borderRadius: "4px",
                        }}
                      >
                        <FileOutlined style={{ color: "#1890ff" }} />
                        <span style={{ flex: 1, wordBreak: "break-word" }}>{fileName}</span>
                        {fileUrl && (
                          <Button
                            type="link"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => {
                              window.open(fileUrl, "_blank");
                            }}
                          >
                            Скачать
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedAppeal.response && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Ответ администратора:</div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: "1.6",
                    padding: "12px",
                    backgroundColor: "#e6f7ff",
                    border: "1px solid #91d5ff",
                    borderRadius: "4px",
                    color: "#0050b3",
                  }}
                >
                  {selectedAppeal.response}
                </div>
              </div>
            )}

            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Изменить статус:</div>
              <Select
                value={selectedAppeal.status}
                onChange={(newStatus) => {
                  openStatusChangeModal(selectedAppeal, newStatus);
                }}
                disabled={!canWrite || busy}
                style={{ width: "100%" }}
                options={STATUS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Изменить статус обращения"
        open={statusChangeModalOpen}
        onCancel={closeStatusChangeModal}
        onOk={handleStatusChangeSubmit}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={busy || uploadingStatusFiles}
        okButtonProps={{ disabled: !canWrite || busy || uploadingStatusFiles }}
        width={600}
      >
        {statusChangeAppeal && (
          <Form form={statusChangeForm} layout="vertical">
            <Form.Item label="Обращение" style={{ marginBottom: 16 }}>
              <div>
                {statusChangeAppeal.number ? `№ ${statusChangeAppeal.number}` : ""}
                {statusChangeAppeal.subject ? ` · ${statusChangeAppeal.subject}` : ""}
              </div>
            </Form.Item>

            {statusChangeAppeal.status && (
              <Form.Item label="Текущий статус" style={{ marginBottom: 16 }}>
                <Tag color={getStatusColor(statusChangeAppeal.status)}>{statusChangeAppeal.status}</Tag>
              </Form.Item>
            )}

            <Form.Item
              name="status"
              label="Новый статус"
              rules={[{ required: true, message: "Выберите статус" }]}
            >
              <Select
                disabled={!canWrite || busy}
                options={STATUS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="response"
              label="Сообщение (необязательно)"
              help="Сообщение будет отправлено пользователю вместе с изменением статуса"
            >
              <Input.TextArea
                rows={4}
                placeholder="Введите сообщение для пользователя..."
                disabled={!canWrite || busy}
              />
            </Form.Item>

            <Form.Item
              label="Файлы (необязательно)"
              help="Файлы будут прикреплены к обращению и отправлены пользователю"
            >
              <Upload
                fileList={statusChangeFileList}
                onChange={({ fileList: newFileList }) => {
                  setStatusChangeFileList(newFileList);
                }}
                beforeUpload={(file) => {
                  // Не загружаем автоматически, загружаем вместе со статусом
                  const newFileList = [...statusChangeFileList, { uid: file.uid, name: file.name, status: "uploading", originFileObj: file }];
                  setStatusChangeFileList(newFileList);
                  return false; // Предотвращаем автоматическую загрузку
                }}
                onRemove={(file) => {
                  const newFileList = statusChangeFileList.filter((f) => f.uid !== file.uid);
                  setStatusChangeFileList(newFileList);
                }}
                multiple
                disabled={!canWrite || busy || uploadingStatusFiles}
              >
                <Button icon={<UploadOutlined />} disabled={!canWrite || busy || uploadingStatusFiles}>
                  Прикрепить файл
                </Button>
              </Upload>
              {statusChangeFileList.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                  Выбрано файлов: {statusChangeFileList.length}
                </div>
              )}
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}


