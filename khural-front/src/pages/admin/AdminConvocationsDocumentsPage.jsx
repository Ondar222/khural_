import React from "react";
import { App, Button, Input, Select, Space, Table, Tag, Modal } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useHashRoute } from "../../Router.jsx";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { ConvocationsApi, CommitteesApi } from "../../api/client.js";

export default function AdminConvocationsDocumentsPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const { navigate, route } = useHashRoute();
  
  // Восстанавливаем выбранный созыв из URL параметров
  const getInitialConvocation = React.useCallback(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const convId = params.get("convocation");
    return convId ? convId : null;
  }, []);
  
  const [selectedConvocation, setSelectedConvocation] = React.useState(getInitialConvocation);
  const [convocation, setConvocation] = React.useState(null);
  const [committees, setCommittees] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

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
  const loadConvocation = React.useCallback(async () => {
    if (!selectedConvocation) {
      setConvocation(null);
      setDocuments([]);
      return;
    }
    
    setLoading(true);
    try {
      const conv = await ConvocationsApi.getById(selectedConvocation).catch(() => null);
      
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
      setConvocation(null);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedConvocation]);

  React.useEffect(() => {
    loadConvocation();
  }, [loadConvocation]);

  // Обновляем URL при изменении выбранного созыва
  React.useEffect(() => {
    if (selectedConvocation && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("convocation", selectedConvocation);
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedConvocation]);

  // Перезагружаем данные при возврате на страницу (например, после редактирования)
  React.useEffect(() => {
    if (selectedConvocation && route === "/admin/convocations/documents") {
      // Небольшая задержка для гарантии, что навигация завершена
      const timer = setTimeout(() => {
        loadConvocation();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [route, selectedConvocation, loadConvocation]);
  
  // Восстанавливаем выбранный созыв из URL при монтировании и изменении route
  React.useEffect(() => {
    if (route === "/admin/convocations/documents" && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const convId = urlParams.get("convocation");
      if (convId && convId !== selectedConvocation) {
        setSelectedConvocation(convId);
      }
    }
  }, [route]);


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
          message.success("Документ удален");
          // Перезагружаем данные с сервера для актуальности
          await loadConvocation();
        } catch (error) {
          message.error(error?.message || "Не удалось удалить документ");
        }
      },
    });
  };

  // Обновляем URL при изменении выбранного созыва
  React.useEffect(() => {
    if (selectedConvocation) {
      const url = new URL(window.location.href);
      url.searchParams.set("convocation", selectedConvocation);
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedConvocation]);

  const handleEditDocument = (doc) => {
    navigate(`/admin/convocations/documents/${selectedConvocation}/edit/${encodeURIComponent(String(doc.id))}`);
  };

  const handleNewDocument = () => {
    navigate(`/admin/convocations/documents/${selectedConvocation}/create`);
  };
  
  // Перезагружаем данные при возврате на страницу (например, после редактирования)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedConvocation) {
        loadConvocation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [selectedConvocation, loadConvocation]);

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

              {/* Комитеты созыва */}
              {(() => {
                const convCommittees = committees.filter(c => {
                  const cConvId = c?.convocation?.id || c?.convocationId || c?.convocation;
                  return String(cConvId) === String(convocation.id);
                });
                
                if (convCommittees.length > 0) {
                  return (
                    <div className="admin-card" style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                        Комитеты созыва ({convCommittees.length})
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {convCommittees.map((c) => (
                          <Tag key={c.id} color="blue" style={{ fontSize: 13, padding: "4px 12px" }}>
                            {c.name || c.title || `Комитет ${c.id}`}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="admin-card" style={{ marginBottom: 16, padding: 16 }}>
                    <div style={{ opacity: 0.6, fontSize: 13 }}>
                      Комитеты для этого созыва пока не указаны
                    </div>
                  </div>
                );
              })()}

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

    </AdminShell>
  );
}
