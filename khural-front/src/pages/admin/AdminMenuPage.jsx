import React from "react";
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { AboutApi, MenuApi } from "../../api/client.js";

/** Строит дерево из плоского списка пунктов меню. */
function buildTree(items) {
  const byId = new Map(items.map((item) => [item.id, { ...item, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  });
  const sort = (nodes) => {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0) || a.id - b.id);
    nodes.forEach((node) => sort(node.children));
  };
  sort(roots);
  return roots;
}

function flattenTree(nodes, depth = 0, out = []) {
  nodes.forEach((node) => {
    out.push({ ...node, depth });
    flattenTree(node.children || [], depth + 1, out);
  });
  return out;
}

export default function AdminMenuPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [area, setArea] = React.useState("header");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [pages, setPages] = React.useState([]);
  const [editing, setEditing] = React.useState(null);
  const [editingGroup, setEditingGroup] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [groupModalOpen, setGroupModalOpen] = React.useState(false);
  const [groupFilter, setGroupFilter] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!adminData.isAuthenticated) return;
    setLoading(true);
    try {
      const [menu, groupList, pageList] = await Promise.all([
        MenuApi.list({ area, tree: false, includeHidden: true }),
        MenuApi.listGroups(area),
        AboutApi.listAdminPages().catch(() => []),
      ]);
      const list = Array.isArray(menu?.items) ? menu.items : Array.isArray(menu) ? menu : [];
      setItems(list);
      setGroups(Array.isArray(groupList) ? groupList : []);
      setPages(Array.isArray(pageList) ? pageList : []);
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить меню");
    } finally {
      setLoading(false);
    }
  }, [adminData.isAuthenticated, area, message]);

  React.useEffect(() => {
    load();
  }, [load]);

  const notifySite = () => {
    window.dispatchEvent(new CustomEvent("khural:menu-updated"));
  };

  const openCreate = (parentId = null, groupId = null) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      area,
      parentId,
      groupId,
      pageId: null,
      titleRu: "",
      titleTyv: "",
      url: "",
      order: items.length,
      isVisible: true,
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    form.setFieldsValue({
      area: item.area,
      parentId: item.parentId ?? null,
      groupId: item.groupId ?? null,
      pageId: item.pageId ?? null,
      titleRu: item.titleRu,
      titleTyv: item.titleTyv,
      url: item.url && !item.pageId ? item.url : "",
      order: item.order ?? 0,
      isVisible: item.isVisible !== false,
    });
    setModalOpen(true);
  };

  const saveItem = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        area,
        parentId: values.parentId || null,
        groupId: area === "footer" ? values.groupId || null : null,
        pageId: values.pageId || null,
        url: values.pageId ? null : values.url || null,
        titleRu: values.titleRu,
        titleTyv: values.titleTyv || values.titleRu,
        order: Number(values.order || 0),
        isVisible: values.isVisible !== false,
      };
      if (editing) await MenuApi.update(editing.id, payload);
      else await MenuApi.create(payload);
      setModalOpen(false);
      message.success(editing ? "Пункт меню обновлён" : "Пункт меню добавлен");
      await load();
      notifySite();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить пункт меню");
    }
  };

  const removeItem = async (id) => {
    try {
      await MenuApi.remove(id);
      message.success("Пункт меню удалён");
      await load();
      notifySite();
    } catch (error) {
      message.error(error?.message || "Не удалось удалить пункт");
    }
  };

  const updateMany = async (changes) => {
    try {
      await MenuApi.reorder(changes);
      await load();
      notifySite();
    } catch (error) {
      message.error(error?.message || "Не удалось изменить порядок");
    }
  };

  const move = (item, direction) => {
    const siblings = items
      .filter((x) => (x.parentId ?? null) === (item.parentId ?? null) && (x.groupId ?? null) === (item.groupId ?? null))
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.id - b.id);
    const index = siblings.findIndex((x) => x.id === item.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    const neighbour = siblings[targetIndex];
    updateMany([
      { id: item.id, order: neighbour.order },
      { id: neighbour.id, order: item.order },
    ]);
  };

  const changeLevel = (item, direction) => {
    if (direction === "in") {
      const siblings = items
        .filter((x) => (x.parentId ?? null) === (item.parentId ?? null))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const index = siblings.findIndex((x) => x.id === item.id);
      const previous = siblings[index - 1];
      if (!previous) return;
      updateMany([{ id: item.id, parentId: previous.id, order: 0 }]);
    } else {
      if (!item.parentId) return;
      const parent = items.find((x) => x.id === item.parentId);
      if (!parent) return;
      const maxOrder = items
        .filter((x) => (x.parentId ?? null) === (parent.parentId ?? null))
        .reduce((acc, x) => Math.max(acc, x.order || 0), 0);
      updateMany([{ id: item.id, parentId: parent.parentId ?? null, order: maxOrder + 1 }]);
    }
  };

  const toggleVisible = async (item) => {
    try {
      await MenuApi.update(item.id, { isVisible: !item.isVisible });
      await load();
      notifySite();
    } catch (error) {
      message.error(error?.message || "Не удалось изменить видимость");
    }
  };

  const openGroup = (group) => {
    setEditingGroup(group || null);
    groupForm.resetFields();
    groupForm.setFieldsValue({
      titleRu: group?.titleRu || "",
      titleTyv: group?.titleTyv || "",
      order: group?.order ?? groups.length,
      isVisible: group?.isVisible !== false,
    });
    setGroupModalOpen(true);
  };

  const saveGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      const payload = {
        area: "footer",
        titleRu: values.titleRu,
        titleTyv: values.titleTyv || values.titleRu,
        order: Number(values.order || 0),
        isVisible: values.isVisible !== false,
      };
      if (editingGroup) await MenuApi.updateGroup(editingGroup.id, payload);
      else await MenuApi.createGroup(payload);
      setGroupModalOpen(false);
      message.success("Группа меню сохранена");
      await load();
      notifySite();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить группу");
    }
  };

  const removeGroup = async (id) => {
    try {
      await MenuApi.removeGroup(id);
      message.success("Группа удалена");
      await load();
      notifySite();
    } catch (error) {
      message.error(error?.message || "Не удалось удалить группу");
    }
  };

  const treeData = buildTree(items.filter((item) => !groupFilter || item.groupId === groupFilter));
  const flat = flattenTree(treeData);
  const parentOptions = items
    .filter((item) => item.id !== editing?.id)
    .map((item) => ({
      value: item.id,
      label: `${item.titleRu}${item.titleTyv ? ` / ${item.titleTyv}` : ""}`,
    }));

  const columns = [
    {
      title: "Название",
      dataIndex: "titleRu",
      render: (_, item) => (
        <Space style={{ paddingLeft: item.depth * 20 }}>
          <span style={{ fontWeight: 600 }}>{item.titleRu}</span>
          {item.titleTyv && item.titleTyv !== item.titleRu && (
            <Tag color="blue">{item.titleTyv}</Tag>
          )}
          {item.isVisible === false && <Tag color="default">скрыт</Tag>}
        </Space>
      ),
    },
    {
      title: "Ссылка",
      dataIndex: "url",
      render: (_, item) => (
        <span style={{ fontSize: 12, opacity: 0.8 }}>
          {item.pageSlug ? `/p/${item.pageSlug}` : item.url || "—"}
        </span>
      ),
    },
    { title: "Порядок", dataIndex: "order", width: 90 },
    {
      title: "Действия",
      key: "actions",
      width: 280,
      render: (_, item) => (
        <Space size={2} wrap>
          <Button size="small" icon={<ArrowUpOutlined />} title="Выше" onClick={() => move(item, "up")} />
          <Button size="small" icon={<ArrowDownOutlined />} title="Ниже" onClick={() => move(item, "down")} />
          <Button size="small" icon={<ArrowRightOutlined />} title="Вложить" onClick={() => changeLevel(item, "in")} />
          <Button size="small" icon={<ArrowLeftOutlined />} title="Поднять на уровень" onClick={() => changeLevel(item, "out")} />
          <Switch size="small" checked={item.isVisible !== false} onChange={() => toggleVisible(item)} title="Показывать на сайте" />
          <Button size="small" icon={<EditOutlined />} title="Редактировать" onClick={() => openEdit(item)} />
          <Popconfirm title="Удалить пункт меню?" onConfirm={() => removeItem(item.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} title="Удалить" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const headerTab = (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Как работает меню"
        description="Меню из шапки автоматически отображается и в боковой панели. Все изменения в меню шапки автоматически обновляются и в боковом меню."
      />
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
          Добавить пункт
        </Button>
        <Button onClick={load}>Обновить</Button>
      </Space>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={flat}
        columns={columns}
        pagination={false}
        locale={{ emptyText: "Пункты меню ещё не добавлены" }}
      />
    </>
  );

  const footerTab = (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate(null, groupFilter)}>
          Добавить пункт
        </Button>
        <Button icon={<PlusOutlined />} onClick={() => openGroup(null)}>
          Новая колонка
        </Button>
        <Select
          allowClear
          placeholder="Все колонки"
          style={{ width: 260 }}
          value={groupFilter}
          onChange={setGroupFilter}
          options={groups.map((group) => ({ value: group.id, label: group.titleRu }))}
        />
      </div>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={groups}
        pagination={false}
        style={{ marginBottom: 20 }}
        columns={[
          { title: "Колонка", dataIndex: "titleRu" },
          { title: "Тувинский", dataIndex: "titleTyv" },
          { title: "Порядок", dataIndex: "order", width: 90 },
          {
            title: "Видимость",
            dataIndex: "isVisible",
            width: 100,
            render: (value, group) => (
              <Switch
                size="small"
                checked={value !== false}
                onChange={async () => {
                  await MenuApi.updateGroup(group.id, { isVisible: value === false });
                  await load();
                  notifySite();
                }}
              />
            ),
          },
          {
            title: "Действия",
            key: "actions",
            width: 150,
            render: (_, group) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openGroup(group)} />
                <Popconfirm title="Удалить колонку?" onConfirm={() => removeGroup(group.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        locale={{ emptyText: "Колонки подвала ещё не созданы" }}
      />
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={flat}
        columns={columns}
        pagination={false}
        locale={{ emptyText: "Пункты меню подвала ещё не добавлены" }}
      />
    </>
  );

  return (
    <AdminShell
      activeKey="menu"
      title="Управление меню"
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <Tabs
        activeKey={area}
        onChange={(key) => {
          setArea(key);
          setGroupFilter(null);
        }}
        items={[
          { key: "header", label: "Меню шапки", children: headerTab },
          { key: "footer", label: "Меню подвала", children: footerTab },
        ]}
      />

      <Modal
        title={editing ? "Редактировать пункт меню" : "Новый пункт меню"}
        open={modalOpen}
        onOk={saveItem}
        onCancel={() => setModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="titleRu" label="Название (русский)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="titleTyv" label="Название (тувинский)">
            <Input />
          </Form.Item>
          <Form.Item name="pageId" label="Страница сайта">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Выберите страницу или оставьте пустым"
              options={pages.map((page) => ({
                value: page.id,
                label: page.title || page.slug,
              }))}
            />
          </Form.Item>
          <Form.Item name="url" label="Внешняя ссылка / путь">
            <Input placeholder="/news или https://example.ru" />
          </Form.Item>
          <Form.Item name="parentId" label="Родительский пункт">
            <Select allowClear showSearch optionFilterProp="label" options={parentOptions} />
          </Form.Item>
          {area === "footer" && (
            <Form.Item name="groupId" label="Колонка подвала">
              <Select
                allowClear
                options={groups.map((group) => ({ value: group.id, label: group.titleRu }))}
              />
            </Form.Item>
          )}
          <Form.Item name="order" label="Порядок">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="isVisible" label="Показывать на сайте" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingGroup ? "Редактировать колонку" : "Новая колонка подвала"}
        open={groupModalOpen}
        onOk={saveGroup}
        onCancel={() => setGroupModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={groupForm} layout="vertical" preserve={false}>
          <Form.Item name="titleRu" label="Заголовок (русский)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="titleTyv" label="Заголовок (тувинский)">
            <Input />
          </Form.Item>
          <Form.Item name="order" label="Порядок колонки">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="isVisible" label="Показывать колонку" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </AdminShell>
  );
}
