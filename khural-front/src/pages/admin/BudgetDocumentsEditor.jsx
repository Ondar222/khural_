import React, { useState, useEffect } from "react";
import { Card, Button, Input, Select, Space, Table, Modal, Form, message, Upload } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { DocumentsApi, apiFetch } from "../../api/client.js";

const { Dragger } = Upload;

export default function BudgetDocumentsEditor({ pageSlug, canWrite }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [pageSlug]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await DocumentsApi.listAll();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      if (editingDoc) {
        await DocumentsApi.update(editingDoc.id, {
          title: values.title,
          description: values.description,
        });
        message.success("Документ обновлен");
      } else {
        const newDoc = {
          title: values.title,
          description: values.description,
          file_url: values.fileUrl,
          page_slug: pageSlug,
        };
        await DocumentsApi.create(newDoc);
        message.success("Документ добавлен");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingDoc(null);
      loadDocuments();
    } catch (e) {
      message.error("Ошибка при сохранении: " + (e.message || ""));
    }
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    form.setFieldsValue({
      title: doc.title,
      description: doc.description,
      fileUrl: doc.file_url || doc.url,
    });
    setModalVisible(true);
  };

  const handleDelete = async (doc) => {
    Modal.confirm({
      title: "Удалить документ?",
      content: doc.title,
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      onOk: async () => {
        try {
          await DocumentsApi.delete(doc.id);
          message.success("Документ удален");
          loadDocuments();
        } catch (e) {
          message.error("Ошибка при удалении: " + (e.message || ""));
        }
      },
    });
  };

  const handleOpenModal = () => {
    setEditingDoc(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    try {
      const response = await apiFetch("/documents/upload", {
        method: "POST",
        body: formData,
        auth: true,
      });
      
      if (response && response.url) {
        form.setFieldValue("fileUrl", response.url);
        message.success("Файл загружен");
      }
    } catch (e) {
      message.error("Ошибка загрузки файла: " + (e.message || ""));
    } finally {
      setUploading(false);
    }
    
    return false;
  };

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text || "Без названия"}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: "#999" }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: "Файл",
      dataIndex: "file_url",
      key: "file_url",
      render: (url) => (
        url ? (
          <a href={url} target="_blank" rel="noreferrer" style={{ color: "#003366" }}>
            {url.split("/").pop() || "Скачать"}
          </a>
        ) : (
          "—"
        )
      ),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!canWrite}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={!canWrite}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <Card
        title="Документы бюджета"
        extra={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
              Добавить документ
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={documents.filter(d => d.page_slug === pageSlug)}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingDoc ? "Редактировать документ" : "Добавить документ"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingDoc(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="Название документа"
            name="title"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input placeholder="Например: Отчет об исполнении бюджета за 2015 год" />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <Input.TextArea
              rows={2}
              placeholder="Краткое описание документа"
            />
          </Form.Item>

          <Form.Item
            label="Ссылка на файл"
            name="fileUrl"
            rules={[{ required: true, message: "Загрузите файл или введите URL" }]}
          >
            <Input
              placeholder="https://..."
              suffix={
                <Upload.Dragger
                  name="file"
                  multiple={false}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                  style={{ width: 100 }}
                >
                  <UploadOutlined />
                </Upload.Dragger>
              }
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={uploading}>
                Сохранить
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
