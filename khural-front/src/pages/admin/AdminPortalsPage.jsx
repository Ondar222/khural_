import React from "react";
import { App, Button, Input, Form, Space, Table, Modal } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import {
  readPortalsOverrides,
  writePortalsOverrides,
  mergePortalsWithOverrides,
  PORTALS_OVERRIDES_EVENT_NAME,
} from "../../utils/portalsOverrides.js";

// Импортируем существующие порталы из Resources.jsx
const DEFAULT_PORTALS = [
  {
    id: "portal-1",
    label: "НОРМАТИВНО-ПРАВОВЫЕ АКТЫ В РОССИЙСКОЙ ФЕДЕРАЦИИ",
    href: "http://pravo.minjust.ru/",
  },
  {
    id: "portal-2",
    label: "ПАРЛАМЕНТ РЕСПУБЛИКИ ТЫВА",
    href: "http://gov.tuva.ru/",
  },
  {
    id: "portal-3",
    label: "ОФИЦИАЛЬНЫЙ ИНТЕРНЕТ-ПОРТАЛ ПРАВОВОЙ ИНФОРМАЦИИ",
    href: "http://pravo.gov.ru/",
  },
  {
    id: "portal-4",
    label: "ОБЩЕСТВЕННАЯ ПАЛАТА РЕСПУБЛИКИ ТЫВА",
    href: "http://palata.tuva.ru/",
  },
  {
    id: "portal-5",
    label: "ФЕДЕРАЛЬНЫЙ ПОРТАЛ ПРОЕКТОВ НОРМАТИВНЫХ ПРАВОВЫХ АКТОВ",
    href: "http://regulation.gov.ru/",
  },
  {
    id: "portal-6",
    label: "ГАС ЗАКОНОТВОРЧЕСТВО",
    href: "http://parliament.gov.ru/",
  },
  {
    id: "portal-7",
    label: "ПОРТАЛ ГОСУДАРСТВЕННЫХ УСЛУГ",
    href: "http://gosuslugi.ru/",
  },
  {
    id: "portal-8",
    label: "МИНИСТЕРСТВО ЮСТИЦИИ РОССИЙСКОЙ ФЕДЕРАЦИИ",
    href: "http://minjust.ru/",
  },
  {
    id: "portal-9",
    label: "ФЕДЕРАЛЬНЫЙ ПОРТАЛ УПРАВЛЕНЧЕСКИХ КАДРОВ",
    href: "http://gossluzhba.gov.ru/",
  },
  {
    id: "portal-10",
    label: "УПОЛНОМЕЧЕННЫЙ ПО ЗАЩИТЕ ПРАВ ПРЕДПРИНИМАТЕЛЕЙ В РЕСПУБЛИКЕ ТЫВА",
    href: "http://upp.rtyva.ru/",
  },
  {
    id: "portal-11",
    label: "ИЗБИРАТЕЛЬНАЯ КОММИССИЯ РЕСПУБЛИКИ ТЫВА",
    href: "http://www.tyva.izbirkom.ru/",
  },
];

export default function AdminPortalsPage() {
  const adminData = useAdminData();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [portals, setPortals] = React.useState(() => {
    const overrides = readPortalsOverrides();
    return mergePortalsWithOverrides(DEFAULT_PORTALS, overrides);
  });
  const [editingPortal, setEditingPortal] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  // Загружаем порталы при монтировании и при обновлении
  React.useEffect(() => {
    const loadPortals = () => {
      const overrides = readPortalsOverrides();
      setPortals(mergePortalsWithOverrides(DEFAULT_PORTALS, overrides));
    };

    loadPortals();
    window.addEventListener(PORTALS_OVERRIDES_EVENT_NAME, loadPortals);
    window.addEventListener("storage", (e) => {
      if (e?.key === "khural_portals_overrides_v1") {
        loadPortals();
      }
    });

    return () => {
      window.removeEventListener(PORTALS_OVERRIDES_EVENT_NAME, loadPortals);
    };
  }, []);

  // Импортируем существующие порталы при первом открытии (если их еще нет в overrides)
  React.useEffect(() => {
    const overrides = readPortalsOverrides();
    const hasImported = window.localStorage?.getItem("khural_portals_imported");
    
    if (!hasImported && overrides.created.length === 0 && Object.keys(overrides.updatedById).length === 0) {
      // Импортируем дефолтные порталы
      const imported = DEFAULT_PORTALS.map((portal) => ({
        ...portal,
        id: portal.id,
      }));
      const newOverrides = {
        ...overrides,
        created: imported,
      };
      writePortalsOverrides(newOverrides);
      window.localStorage.setItem("khural_portals_imported", "true");
      setPortals(mergePortalsWithOverrides(DEFAULT_PORTALS, newOverrides));
      message.success(`Импортировано ${imported.length} порталов`);
    }
  }, [message]);

  const filteredPortals = React.useMemo(() => {
    if (!searchQuery.trim()) return portals;
    const q = searchQuery.trim().toLowerCase();
    return portals.filter(
      (p) =>
        String(p.label || "").toLowerCase().includes(q) ||
        String(p.href || "").toLowerCase().includes(q)
    );
  }, [portals, searchQuery]);

  const handleSave = async () => {
    if (!adminData.canWrite) return;

    try {
      const values = await form.validateFields();
      const overrides = readPortalsOverrides();

      if (editingPortal) {
        // Обновление существующего портала
        const updated = {
          ...overrides,
          updatedById: {
            ...overrides.updatedById,
            [editingPortal.id]: {
              label: values.label.trim(),
              href: values.href.trim(),
            },
          },
        };
        writePortalsOverrides(updated);
        message.success("Портал обновлен");
      } else {
        // Создание нового портала
        const newPortal = {
          id: `portal-${Date.now()}`,
          label: values.label.trim(),
          href: values.href.trim(),
        };
        const updated = {
          ...overrides,
          created: [...overrides.created, newPortal],
        };
        writePortalsOverrides(updated);
        message.success("Портал добавлен");
      }

      const newOverrides = readPortalsOverrides();
      setPortals(mergePortalsWithOverrides(DEFAULT_PORTALS, newOverrides));
      setModalOpen(false);
      setEditingPortal(null);
      form.resetFields();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить портал");
    }
  };

  const handleDelete = (portalId) => {
    modal.confirm({
      title: "Удалить портал?",
      content: "Вы уверены, что хотите удалить этот портал?",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      onOk: () => {
        if (!adminData.canWrite) return;
        const overrides = readPortalsOverrides();
        const updated = {
          ...overrides,
          deletedIds: [...overrides.deletedIds, String(portalId)],
        };
        writePortalsOverrides(updated);
        const newOverrides = readPortalsOverrides();
        setPortals(mergePortalsWithOverrides(DEFAULT_PORTALS, newOverrides));
        message.success("Портал удален");
      },
    });
  };

  const handleEdit = (portal) => {
    setEditingPortal(portal);
    form.setFieldsValue({
      label: portal.label || "",
      href: portal.href || "",
    });
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingPortal(null);
    form.resetFields();
    setModalOpen(true);
  };

  const columns = [
    {
      title: "Название",
      dataIndex: "label",
      sorter: (a, b) => (a.label || "").localeCompare(b.label || ""),
      render: (label) => (
        <div style={{ 
          fontWeight: 500, 
          wordBreak: "break-word",
          maxWidth: isTablet ? 300 : "none"
        }}>
          {label || "—"}
        </div>
      ),
    },
    {
      title: "Ссылка",
      dataIndex: "href",
      width: isTablet ? 250 : 300,
      render: (href) => (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            color: "#2563eb",
            wordBreak: "break-all",
            fontSize: isTablet ? 12 : 14
          }}
        >
          {href || "—"}
        </a>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: isTablet ? 160 : 180,
      render: (_, portal) => (
        <Space wrap>
          <Button
            size={isTablet ? "small" : "middle"}
            icon={<EditOutlined />}
            onClick={() => handleEdit(portal)}
            disabled={!adminData.canWrite}
          >
            {!isTablet && "Редактировать"}
          </Button>
          <Button
            size={isTablet ? "small" : "middle"}
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(portal.id)}
            disabled={!adminData.canWrite}
          >
            {!isTablet && "Удалить"}
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
      activeKey="portals"
      title="Порталы"
      subtitle={`${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: 12, 
          marginBottom: 16,
          flexDirection: isMobile ? "column" : "row"
        }}>
          <div style={{ fontWeight: 800, fontSize: isMobile ? 16 : 18 }}>
            Порталы ({portals.length})
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNew}
            disabled={!adminData.canWrite}
            size={isMobile ? "large" : "middle"}
            block={isMobile}
          >
            Добавить портал
          </Button>
        </div>

        <Input
          placeholder="Поиск по названию или ссылке..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 16 }}
          allowClear
          size={isMobile ? "large" : "middle"}
        />

        {filteredPortals.length > 0 ? (
          isMobile ? (
            // Мобильная версия - карточки
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredPortals.map((portal, index) => (
                <div
                  key={portal.id}
                  style={{
                    padding: "16px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 8,
                    background: "white",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                      e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
                      e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                    }
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: "rgba(0,0,0,0.85)",
                      wordBreak: "break-word"
                    }}>
                      {portal.label || "—"}
                    </div>
                    <a
                      href={portal.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2563eb",
                        fontSize: 13,
                        wordBreak: "break-all",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                      onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                    >
                      <span>{portal.href || "—"}</span>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>↗</span>
                    </a>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 8,
                    marginTop: 4,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(0,0,0,0.06)"
                  }}>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(portal)}
                      disabled={!adminData.canWrite}
                      block
                      size="middle"
                    >
                      Редактировать
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(portal.id)}
                      disabled={!adminData.canWrite}
                      block
                      size="middle"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredPortals}
              pagination={{
                pageSize: isTablet ? 15 : 20,
                showSizeChanger: !isTablet,
                showQuickJumper: !isTablet,
                size: isTablet ? "small" : "default",
              }}
              scroll={isTablet ? { x: "max-content" } : undefined}
            />
          )
        ) : (
          <div style={{ 
            padding: isMobile ? 32 : 40, 
            textAlign: "center", 
            opacity: 0.7,
            fontSize: isMobile ? 14 : 16
          }}>
            {searchQuery ? "По запросу ничего не найдено" : "Порталов пока нет. Добавьте первый портал."}
          </div>
        )}
      </div>

      <Modal
        title={editingPortal ? "Редактировать портал" : "Добавить портал"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingPortal(null);
          form.resetFields();
        }}
        width={isMobile ? "90%" : 600}
        okText="Сохранить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !adminData.canWrite }}
        styles={{
          body: { padding: isMobile ? "20px 16px" : "24px" }
        }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="Название портала"
            name="label"
            rules={[{ required: true, message: "Введите название портала" }]}
          >
            <Input placeholder="Например: НОРМАТИВНО-ПРАВОВЫЕ АКТЫ В РОССИЙСКОЙ ФЕДЕРАЦИИ" />
          </Form.Item>

          <Form.Item
            label="Ссылка"
            name="href"
            rules={[
              { required: true, message: "Введите ссылку" },
              { type: "url", message: "Введите корректный URL" },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminShell>
  );
}
