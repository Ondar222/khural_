import React from "react";
import { App, Button, Input, Select, Form, Space, Table, Tag, Modal } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { ConvocationsApi, CommitteesApi } from "../../api/client.js";

export default function AdminConvocationsDocumentsPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [docForm] = Form.useForm();
  
  const [selectedConvocation, setSelectedConvocation] = React.useState(null);
  const [convocation, setConvocation] = React.useState(null);
  const [committees, setCommittees] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState(null);
  const [docModalOpen, setDocModalOpen] = React.useState(false);

  // Load convocations and committees
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [convs, comms] = await Promise.all([
          ConvocationsApi.list({ activeOnly: false }).catch(() => []),
          CommitteesApi.list({ all: true }).catch(() => [])
        ]);
        if (!alive) return;
        setCommittees(Array.isArray(comms) ? comms : []);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load selected convocation with documents
  React.useEffect(() => {
    if (!selectedConvocation) {
      setConvocation(null);
      setDocuments([]);
      return;
    }
    
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const conv = await ConvocationsApi.getById(selectedConvocation).catch(() => null);
        if (!alive) return;
        
        if (conv) {
          setConvocation(conv);
          setDocuments(Array.isArray(conv.documents) ? conv.documents : []);
        } else {
          // Try to find in list
          const list = await ConvocationsApi.list({ activeOnly: false }).catch(() => []);
          const found = Array.isArray(list) ? list.find(c => String(c.id) === String(selectedConvocation)) : null;
          if (found) {
            setConvocation(found);
            setDocuments(Array.isArray(found.documents) ? found.documents : []);
          } else {
            setConvocation(null);
            setDocuments([]);
          }
        }
      } catch (error) {
        console.error("Failed to load convocation:", error);
        if (alive) {
          setConvocation(null);
          setDocuments([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedConvocation]);

  const handleSaveDocument = async () => {
    if (!adminData.canWrite || !convocation) return;
    
    try {
      const values = await docForm.validateFields();
      const docData = {
        id: editingDoc?.id || `doc-${Date.now()}`,
        category: values.category,
        date: values.date,
        title: values.title,
        fileLink: values.fileLink?.trim() || undefined,
        fileId: values.fileId?.trim() || undefined,
        size: values.size?.trim() || undefined,
        committeeId: values.committeeId || undefined,
      };

      const updatedDocs = editingDoc
        ? documents.map(d => d.id === editingDoc.id ? docData : d)
        : [...documents, docData];

      // Update convocation with new documents array
      const updatedConvocation = {
        ...convocation,
        documents: updatedDocs,
      };

      await ConvocationsApi.patch(convocation.id, updatedConvocation);
      setConvocation(updatedConvocation);
      setDocuments(updatedDocs);
      setDocModalOpen(false);
      setEditingDoc(null);
      docForm.resetFields();
      message.success(editingDoc ? "Документ обновлен" : "Документ добавлен");
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить документ");
    }
  };

  const handleDeleteDocument = (docId) => {
    Modal.confirm({
      title: "Удалить документ?",
      content: "Вы уверены, что хотите удалить этот документ?",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      onOk: async () => {
        if (!adminData.canWrite || !convocation) return;
        try {
          const updatedDocs = documents.filter(d => d.id !== docId);
          const updatedConvocation = {
            ...convocation,
            documents: updatedDocs,
          };
          await ConvocationsApi.patch(convocation.id, updatedConvocation);
          setConvocation(updatedConvocation);
          setDocuments(updatedDocs);
          message.success("Документ удален");
        } catch (error) {
          message.error(error?.message || "Не удалось удалить документ");
        }
      },
    });
  };

  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    docForm.setFieldsValue({
      category: doc.category || "report",
      date: doc.date || "",
      title: doc.title || "",
      fileLink: doc.fileLink || "",
      fileId: doc.fileId || "",
      size: doc.size || "",
      committeeId: doc.committeeId || undefined,
    });
    setDocModalOpen(true);
  };

  const handleNewDocument = () => {
    setEditingDoc(null);
    docForm.resetFields();
    docForm.setFieldsValue({
      category: "report",
      date: new Date().toISOString().split("T")[0],
    });
    setDocModalOpen(true);
  };

  const convocationOptions = React.useMemo(() => {
    const convs = Array.isArray(adminData.convocations) ? adminData.convocations : [];
    return convs.map(c => ({
      value: String(c.id),
      label: c.name || c.number || `Созыв ${c.id}`,
    }));
  }, [adminData.convocations]);

  const committeeOptions = React.useMemo(() => {
    return committees.map(c => ({
      value: String(c.id),
      label: c.title || c.name || String(c.id),
    }));
  }, [committees]);

  const columns = [
    {
      title: "Категория",
      dataIndex: "category",
      width: 120,
      sorter: (a, b) => (a.category || "").localeCompare(b.category || ""),
      render: (cat) => (
        <Tag color={cat === "agenda" ? "blue" : "green"}>
          {cat === "agenda" ? "Повестка" : "Отчет"}
        </Tag>
      ),
    },
    {
      title: "Название",
      dataIndex: "title",
      sorter: (a, b) => (a.title || "").localeCompare(b.title || ""),
      render: (title) => title || "—",
    },
    {
      title: "Дата",
      dataIndex: "date",
      width: 120,
      sorter: (a, b) => {
        const dateA = a.date ? new Date(a.date.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1")) : new Date(0);
        const dateB = b.date ? new Date(b.date.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1")) : new Date(0);
        return dateA - dateB;
      },
      render: (date) => date || "—",
    },
    {
      title: "Комитет",
      dataIndex: "committeeId",
      width: 200,
      sorter: (a, b) => {
        const aName = committees.find(c => String(c.id) === String(a.committeeId))?.title || "";
        const bName = committees.find(c => String(c.id) === String(b.committeeId))?.title || "";
        return aName.localeCompare(bName);
      },
      render: (committeeId) => {
        if (!committeeId) return "—";
        const committee = committees.find(c => String(c.id) === String(committeeId));
        return committee ? (committee.title || committee.name) : committeeId;
      },
    },
    {
      title: "Размер",
      dataIndex: "size",
      width: 100,
      render: (size) => size || "—",
    },
    {
      title: "Действия",
      key: "actions",
      width: 180,
      render: (_, doc) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditDocument(doc)}
            disabled={!adminData.canWrite}
          >
            Редактировать
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteDocument(doc.id)}
            disabled={!adminData.canWrite}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const loginCard = !adminData.isAuthenticated ? (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Вход в админку</div>
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
          Чтобы редактировать, добавлять и удалять записи, выполните вход.
        </div>
        <Input
          placeholder="Email"
          value={adminData.email}
          onChange={(e) => adminData.setEmail(e.target.value)}
        />
        <Input.Password
          placeholder="Пароль"
          value={adminData.password}
          onChange={(e) => adminData.setPassword(e.target.value)}
        />
        <Button type="primary" loading={adminData.loginBusy} onClick={adminData.handleLogin}>
          Войти
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <AdminShell
      activeKey="convocations-documents"
      title="Документы созывов"
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Выберите созыв</div>
          <Select
            placeholder="Выберите созыв для управления документами"
            value={selectedConvocation}
            onChange={setSelectedConvocation}
            options={convocationOptions}
            style={{ width: "100%", maxWidth: 400 }}
            showSearch
            optionFilterProp="label"
          />
        </div>
      </div>

      {selectedConvocation && (
        <>
          {loading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: "center" }}>
              Загрузка...
            </div>
          ) : convocation ? (
            <>
              <div className="admin-card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
                      {convocation.name || convocation.number || `Созыв ${convocation.id}`}
                    </div>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>
                      Документов: {documents.length}
                    </div>
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleNewDocument}
                    disabled={!adminData.canWrite}
                  >
                    Добавить документ
                  </Button>
                </div>
              </div>

              {documents.length > 0 ? (
                <div className="admin-card">
                  <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={documents}
                    pagination={{ pageSize: 20 }}
                  />
                </div>
              ) : (
                <div className="admin-card" style={{ padding: 40, textAlign: "center", opacity: 0.7 }}>
                  Документов пока нет. Добавьте первый документ.
                </div>
              )}
            </>
          ) : (
            <div className="admin-card" style={{ padding: 24 }}>
              <div style={{ color: "#ff4d4f" }}>Созыв не найден</div>
            </div>
          )}
        </>
      )}

      <Modal
        title={editingDoc ? "Редактировать документ" : "Добавить документ"}
        open={docModalOpen}
        onOk={handleSaveDocument}
        onCancel={() => {
          setDocModalOpen(false);
          setEditingDoc(null);
          docForm.resetFields();
        }}
        width={600}
        okText="Сохранить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !adminData.canWrite }}
      >
        <Form
          form={docForm}
          layout="vertical"
          initialValues={{ category: "report" }}
        >
          <Form.Item
            label="Категория"
            name="category"
            rules={[{ required: true, message: "Выберите категорию" }]}
          >
            <Select>
              <Select.Option value="agenda">Повестка</Select.Option>
              <Select.Option value="report">Отчет</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Название документа"
            name="title"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input placeholder="Например: Повестка заседания комитета от 09.02.2023 г." />
          </Form.Item>

          <Form.Item
            label="Дата"
            name="date"
            rules={[{ required: true, message: "Введите дату" }]}
          >
            <Input placeholder="2023-02-09 или 09.02.2023" />
          </Form.Item>

          <Form.Item
            label="Комитет"
            name="committeeId"
          >
            <Select
              placeholder="Выберите комитет (опционально)"
              allowClear
              showSearch
              optionFilterProp="label"
              options={committeeOptions}
            />
          </Form.Item>

          <Form.Item
            label="Ссылка на файл"
            name="fileLink"
            tooltip="Прямая ссылка на файл. Обязательно, если не указан ID файла"
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (!value && !getFieldValue("fileId")) {
                    return Promise.reject(new Error("Укажите ссылку на файл или ID файла"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input placeholder="https://example.com/file.doc или /files/doc.doc" />
          </Form.Item>

          <Form.Item
            label="ID файла"
            name="fileId"
            tooltip="ID файла для генерации ссылки /files/{fileId}. Обязательно, если не указана ссылка"
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (!value && !getFieldValue("fileLink")) {
                    return Promise.reject(new Error("Укажите ID файла или ссылку на файл"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input placeholder="doc-123" />
          </Form.Item>

          <Form.Item
            label="Размер файла"
            name="size"
          >
            <Input placeholder="33.6 КБ" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminShell>
  );
}
